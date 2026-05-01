# 英语学习助手 (English Learning Assistant)

## 项目信息
- **开发者**: 田倩
- **学校**: 中国地质大学（武汉）
- **学号**: 1202411182
- **项目类型**: 前后端分离 Web 应用
- **技术栈**: Go + Gin + React + MySQL + Docker

## 开发任务索引

 **已完成的功能模块**:

1. ✅ 后端 Go + Gin 微服务架构搭建与 RESTful 路由设计
2. ✅ 前端 React + TypeScript + Vite 项目搭建
3. ✅ 关系型数据库设计与 GORM 模型映射 (MySQL)
4. ✅ 用户认证系统 (JWT + 密码加密)
5. ✅ AI 集成 ( 通义千问 API)
6. ✅ 单词查询与保存功能
7. ✅ 前端 Vite Proxy 与生产环境 Nginx 反向代理配置
8. ✅ 生产环境部署配置 (Docker + Nginx)
9. ✅ 容器编排 (Docker Compose)
10. ✅ 项目文档编写

## 项目简介

本项目是一个基于全栈技术构建的智能专业词汇学习与管理平台。系统结合了最新的大语言模型（LLM）能力，在提供基础词汇本管理功能的同时，实现了针对专业词汇的智能释义与例句生成。

项目采用标准的**前后端分离架构**，并通过 **Docker Compose** 实现了完整的云原生容器化部署，确保了开发、测试与生产环境的绝对一致性。

### 核心架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (React)   │    │   Nginx 代理    │    │   后端 (Go)     │
│                 │◄──►│                 │◄──►│                 │
│  - Vite 构建     │    │  - 静态资源服务  │    │  - Gin 路由转发 │
│  - 状态管理      │    │  - API 路由转发  │    │  - LLM 接口调度 │
│  - 响应式 UI     │    │  - CORS 处理    │    │  - GORM 数据持久 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                         │
                              └─────────────────────────┘
                              │
                    ┌─────────────────┐
                    │   MySQL 数据库  │
                    │                 │
                    │  - 用户数据     │
                    │  - 单词记录     │
                    └─────────────────┘
```

* **前端 (Frontend)**: React 18 + TypeScript + Vite + Ant Design
* **后端 (Backend)**: Go (1.25) + Gin (Web 框架) + GORM (ORM 框架)
* **数据库 (Database)**: MySQL 8.0
* **AI 接入**: 阿里云通义千问大模型 API (DashScope)


## 运行指南

### 前置依赖

确保您的系统已安装以下软件：

1. **Docker** (>= 20.10) 和 **Docker Compose** (>= 2.0)
2. **Git** (用于克隆项目)

### 环境配置

# 1. 克隆项目
git clone [项目地址]
cd docker-gin

# 2. 注入 AI 大模型密钥
# 请打开项目根目录的 docker-compose.yml 文件
# 找到 backend 服务的 environment 配置，填入真实的 API Key：
# - AI_API_KEY=sk-xxxxxxxxxxxxxxxxxxx

# 3. 拉起服务
# 在项目根目录下打开终端，执行以下无缓存构建命令：
# docker compose up -d --build

# 4. 访问应用
# 前端页面 (Nginx 代理): http://localhost
# 后端 API: http://localhost:8080
# 数据库: 暴露于宿主机 3306 端口 (账号 root / 密码 123456)


## 项目结构

```
docker-gin - s/
├── backend/                 # Go 后端微服务
│   ├── api/                 # 控制器层 (Handlers/Controllers)
│   ├── config/              # 系统及数据库配置文件
│   ├── middleware/          # 中间件 (JWT 鉴权拦截等)
│   ├── model/               # GORM 数据库数据模型
│   ├── router/              # API 路由注册与分发
│   ├── service/             # 核心业务逻辑 (含 AI 接口调用)
│   ├── utils/               # 工具函数 
│   ├── .env                 # 后端本地环境变量配置
│   ├── Dockerfile           # 后端多阶段构建镜像脚本
│   ├── go.mod / go.sum      # Go 模块依赖管理
│   └── main.go              # 后端服务启动入口
├── docs/                    # 项目文档与初始化资源
│   ├── init.sql             # MySQL 容器初始化建表脚本
│   ├── api.md               # RESTful API 接口规范 (待写)
│   └── db.md                # 数据库表结构设计说明 (待写)
├── frontend/                # React 前端工程
│   ├── public/              # 静态公共资源
│   ├── src/                 # 前端核心源码 (页面、组件、接口请求)
│   ├── Dockerfile           # 前端 Nginx Alpine 镜像构建脚本
│   ├── nginx.conf           # Nginx 生产环境路由及代理配置
│   ├── package.json         # 前端项目依赖声明
│   ├── tsconfig.* # TypeScript 编译配置
│   └── eslint.config.js     # 代码检查规范配置
├── docker-compose.yml       # 核心：全局容器编排配置文件 (根目录)
└── README.md                # 项目主说明文档
```

## 功能演示

1. **用户注册/登录**: 创建账户或登录现有账户
2. **单词查询**: 输入英文单词，选择 AI 模型进行查询
3. **结果展示**: 查看单词释义和例句
4. **单词保存**: 将查询结果保存到个人单词本
5. **单词管理**: 查看、删除已保存的单词

## 故障排除

### 常见问题

1. **端口冲突**: 确保 80、8080、3306 端口未被占用
2. **API Key 错误**: 检查 AI 服务的 API Key 配置
3. **数据库连接失败**: 确认 MySQL 容器正常启动

# 核心技术

本项目不仅实现了完整的业务闭环，更在架构设计、网络安全以及跨端数据流转等方面采用了严谨的工业级解决方案。以下为核心技术难点与突破的详细梳理：

### 1. Nginx 边缘代理与双轨路由机制 
本项目将 Nginx 作为全栈唯一的对外网关，通过 `nginx.conf` 实现了动静分离与环境解耦。

* **SPA 路由接管 (`try_files` 机制)**：
    前端基于 React 构建的单页应用（SPA）在物理磁盘上仅存在唯一的 `index.html`。通过在 Nginx 配置 `try_files $uri $uri/ /index.html;`，成功拦截了浏览器的 404 异常。当用户在特定前端路由（如 `/vocabulary`）刷新页面时，Nginx 会将处理权平滑移交给 React Router，保障了前端路由的生命周期完整性。
* **跨域终结与请求透传 (`proxy_pass`)**：
    摒弃了在 Go 后端滥用 `Access-Control-Allow-Origin: *` 的粗暴做法。利用 Nginx 的反向代理机制，拦截所有 `/api/` 前缀的请求，并在 Docker 内部网络将其隐式转发至 `backend:8080`。此方案在物理层面绕过了浏览器的同源策略（Same-Origin Policy），并在 Header 中注入了 `X-Real-IP` 等字段，实现了对真实访客环境的无损透传。

### 2. 跨语言数据流转与序列化防腐层 (Data Flow & Serialization)
在处理 AI 实时生成的“深度例句（Examples）”等复杂层级结构时，为保障跨语言交互的稳定性，系统设计了一套严格的数据类型映射规范。

* **痛点**：通义千问大模型返回的数据为 JSON Array，若直接映射到 Go 结构体并存入 MySQL，极易引发反序列化恐慌（Panic）或存储乱码。
* **闭环方案**：
    1.  **前端提交层**：利用 Axios 发起请求前，强制调用 `JSON.stringify()` 将多维 Array 扁平化为纯文本 String。
    2.  **后端传输层**：在 Go 语言的 GORM Model 中，将对应字段显式声明为 `string`，规避复杂的自定义 Marshal 逻辑。
    3.  **持久化层**：MySQL 底层采用 `TEXT` 类型进行存储，保障海量文本的吞吐能力。
    4.  **前端消费层**：在渲染单词详情时，加入**防御性解析机制**，利用 `try...catch` 包裹 `JSON.parse()`，安全地将文本还原为可供 React `map()` 遍历的虚拟 DOM 节点。

### 3. 精细化 DOM 事件流拦截与交互控制 (DOM Event Control)
在“我的单词本”复杂卡片列表中，重点优化了 React 合成事件（SyntheticEvent）的冒泡传递机制。

* **事件冒泡控制**：UI 架构采用了嵌套结构（父节点为触发详情弹窗的 Card 组件，子节点为 Delete 按钮）。为防止用户点击“删除”时误触详情弹窗，在 `handleDelete` 业务逻辑中精准注入了 `e.stopPropagation()`。
* **工程意义**：该指令在捕获/冒泡模型的关键节点强制阻断了事件流向外层 DOM 树的传递，确保了增删改查等重负载交互的绝对独立性，极大提升了产品的体验稳健性。

### 4. 容器化编排与零信任网络隔离 (Zero-Trust Network Orchestration)
基于 Docker Compose 构建了具备高可用潜力与极强安全属性的部署拓扑。

* **隐式网络隔离**：摒弃了危险的宿主机端口直接映射。在 `docker-compose.yml` 中构建了私有 Bridge 网络（`geolex-net`），仅对外暴露 Nginx 所在的 80 端口。Go 核心业务与 MySQL 数据库均深藏于虚拟局域网内，依托 Docker 内置 DNS 进行服务发现，从根源上阻断了外部恶意端口扫描。
* **符合 DBA 审计的初始化规范**：考虑到企业级数据安全，严禁在生产环境使用 GORM 的 `AutoMigrate` 隐式建表。改为采用声明式的 `volumes` 挂载策略，将预编译的 `docs/init.sql` 注入 MySQL 容器的 `/docker-entrypoint-initdb.d/` 目录。实现了“一键开箱即用”的同时，保证了数据库结构的每一次变更都可被 Git 严格追溯。