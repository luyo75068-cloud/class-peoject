# 数据库设计文档 (Database Design)

## 1. 概述
本项目采用 MySQL 8.0 作为核心关系型数据库。使用 GORM 作为数据对象映射框架，所有表均包含标准的时间戳字段（`created_at`, `updated_at`）以及用于软删除的 `deleted_at` 字段，以保证数据的可追溯性与安全性。

## 2. 数据库基础信息
- **数据库名称**: `english_learning`
- **字符集**: `utf8mb4` (全面支持多语言、特殊符号及 Emoji)
- **排序规则**: `utf8mb4_unicode_ci` (提升多语言搜索的准确性)
- **存储引擎**: `InnoDB` (支持事务安全、行级锁及外键)

## 3. 实体关系模型 (ER Model)
系统采用 **1:N (一对多)** 实体关系：
- **1 个 User (用户)** : 可以保存 **N 个 Words (单词记录)**。
- **1 个 Word (单词)** : 严格归属于 **1 个 User (用户)**。

## 4. 数据表结构设计

### 4.1 用户表 (`users`)
存储用户的核心账号信息，密码采用加盐哈希存储。

| 字段名 | 数据类型 | 约束 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | - | 用户唯一 ID |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | - | 登录名 (唯一) |
| `password` | VARCHAR(255) | NOT NULL | - | Bcrypt 加密后的密文 |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 账号注册时间 |
| `updated_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 最后修改时间 |
| `deleted_at` | DATETIME | INDEX | NULL | 软删除时间标记 |

**核心业务规则**:
- **密码安全**: 绝对禁止明文存储。使用 `golang.org/x/crypto/bcrypt` 算法进行加盐哈希。
- **软删除**: 采用 GORM 默认逻辑。`DELETE` 操作仅更新 `deleted_at` 字段，不在物理层面删除数据，以备审计。

### 4.2 单词记录表 (`words`)
存储用户保存的词汇解析内容。

| 字段名 | 数据类型 | 约束 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | - | 记录唯一 ID |
| `user_id` | INT UNSIGNED | NOT NULL, INDEX | - | 关联 `users.id` |
| `word` | VARCHAR(100) | NOT NULL | - | 英文单词 |
| `meaning` | TEXT | NOT NULL | - | 中文释义及词性 |
| `examples` | JSON | NOT NULL | - | AI 生成的例句 (JSON 数组) |
| `ai_provider`| VARCHAR(50) | NOT NULL | 'dashscope' | AI 模型来源 |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 入库时间 |
| `updated_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |
| `deleted_at` | DATETIME | INDEX | NULL | 软删除标记 |

**索引设计**:
- **联合索引 `idx_user_word (user_id, word)`**: 极大地加速了“检查当前用户是否已存该词”的查询操作（由 $O(N)$ 降至 $O(\log N)$）。

---

## 5. 性能与优化策略

### 5.1 JSON 数据存储
针对 AI 返回的动态长度例句，放弃传统的“例句子表”设计，采用 MySQL 8.0 的 **JSON 类型**。
- **优点**: 避免了频繁的 `JOIN` 联表查询，单表即可拉取单词全貌，提升 API 响应速度。

### 5.2 索引设计原则
- **前缀压缩**: 单词字段限制在 `VARCHAR(100)` 以内，保证索引树的紧凑。
- **覆盖查询**: 高频的 `SELECT * FROM words WHERE user_id = ?` 路径完全命中 B+ 树索引。

---

## 6. 安全与完整性

###  6.1参照完整性 (Foreign Key)
```sql
ALTER TABLE words ADD CONSTRAINT fk_user_words 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```
- **级联删除**: 当一个用户账号被注销（物理删除）时，系统自动清理其关联的所有单词本记录，防止产生由于孤立记录导致的数据库“碎片”。

### 6.2访问安全
- **生产环境隔离**: 数据库仅允许通过 Docker 内部网络 (geolex-net) 访问。
- **防 SQL 注入**: Go 后端全面采用 GORM 的参数化查询，杜绝拼接 SQL 的风险。