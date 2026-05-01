# RESTful API 接口规范

## 1. 全局说明
* **基础路径**: `/api`
* **数据交互格式**: `application/json`
* **鉴权方式**: Bearer JWT
  * 除 `/api/auth/register`、`/api/auth/login` 外，所有接口均必须在 HTTP Header 中携带 `Authorization: Bearer <token>`

## 2. 统一响应规则
* 成功响应：一般返回 HTTP 200，并且 JSON 数据直接放在响应体中
* 失败响应：返回相应的 HTTP 状态码，并包含 `error` 字段描述错误原因

## 3. API 接口列表

### 3.1 注册用户
* 接口路径: `/api/auth/register`
* 请求方法: `POST`
* 鉴权说明: 无需鉴权
* 请求参数 (Body JSON):
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
  * `username`: 必填，3-50 字符
  * `password`: 必填，最少 6 字符
* 成功返回示例:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR...",
    "user": {
      "id": 1,
      "username": "testuser"
    }
  }
  ```
* 失败错误码及含义:
  * `400 Bad Request` - 参数格式错误或密码长度不够
  * `400 Bad Request` - 用户名已存在
  * `500 Internal Server Error` - 密码加密失败
  * `500 Internal Server Error` - 注册失败

### 3.2 登录用户
* 接口路径: `/api/auth/login`
* 请求方法: `POST`
* 鉴权说明: 无需鉴权
* 请求参数 (Body JSON):
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
  * `username`: 必填
  * `password`: 必填
* 成功返回示例:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR...",
    "user": {
      "id": 1,
      "username": "testuser"
    }
  }
  ```
* 失败错误码及含义:
  * `400 Bad Request` - 参数错误
  * `401 Unauthorized` - 用户名或密码错误

### 3.3 智能查询单词
* 接口路径: `/api/words/query`
* 请求方法: `POST`
* 鉴权说明: 需要 JWT 鉴权
* 请求头:
  * `Authorization: Bearer <token>`
* 请求参数 (Body JSON):
  ```json
  {
    "word": "string",
    "ai_provider": "string"
  }
  ```
  * `word`: 必填，要查询的单词
  * `ai_provider`: 可选，指定 AI 提供商名称，当前系统会将该值沿用并默认使用后端配置的 AI 服务
* 成功返回示例 (单词已保存，来自数据库):
  ```json
  {
    "word": {
      "id": 10,
      "word": "example",
      "meaning": "示例，用法",
      "examples": [
        {"sentence": "This is an example."}
      ],
      "ai_provider": "default"
    },
    "source": "database",
    "saved": true
  }
  ```
* 成功返回示例 (单词未保存，来自 AI 服务):
  ```json
  {
    "word": {
      "word": "example",
      "meaning": "示例，用法",
      "examples": [
        {"sentence": "This is an example."}
      ],
      "ai_provider": "default"
    },
    "source": "ai",
    "saved": false
  }
  ```
* 失败错误码及含义:
  * `400 Bad Request` - 参数错误
  * `500 Internal Server Error` - AI 服务调用失败

### 3.4 手动保存单词
* 接口路径: `/api/words/save`
* 请求方法: `POST`
* 鉴权说明: 需要 JWT 鉴权
* 请求头:
  * `Authorization: Bearer <token>`
* 请求参数 (Body JSON):
  ```json
  {
    "word": "string",
    "meaning": "string",
    "examples": "string",
    "ai_provider": "string"
  }
  ```
  > 说明: `examples` 在模型中定义为字符串类型，实际存储为 JSON 字符串
* 成功返回示例:
  ```json
  {
    "message": "已成功加入单词本",
    "id": 10
  }
  ```
* 失败错误码及含义:
  * `400 Bad Request` - 数据格式错误
  * `500 Internal Server Error` - 保存失败

### 3.5 获取单词列表
* 接口路径: `/api/words/list`
* 请求方法: `GET`
* 鉴权说明: 需要 JWT 鉴权
* 请求头:
  * `Authorization: Bearer <token>`
* 请求参数 (Query):
  * `page` (可选，默认 `1`)
  * `page_size` (可选，默认 `10`)
* 成功返回示例:
  ```json
  {
    "data": [
      {
        "id": 10,
        "user_id": 1,
        "word": "example",
        "meaning": "示例，用法",
        "examples": "[{\"sentence\": \"This is an example.\"}]",
        "ai_provider": "default",
        "created_at": "2026-04-28T12:00:00Z",
        "updated_at": "2026-04-28T12:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 10
  }
  ```
* 失败错误码及含义:
  * `500 Internal Server Error` - 获取列表失败

### 3.6 删除单词
* 接口路径: `/api/words/:id`
* 请求方法: `DELETE`
* 鉴权说明: 需要 JWT 鉴权
* 请求头:
  * `Authorization: Bearer <token>`
* 路径参数:
  * `id`: 要删除的单词记录 ID
* 成功返回示例:
  ```json
  {
    "message": "删除成功"
  }
  ```
* 失败错误码及含义:
  * `500 Internal Server Error` - 删除失败

## 4. 常见错误说明
* `400 Bad Request` - 请求参数缺失或格式不正确
* `401 Unauthorized` - 未提供 Token 或 Token 无效，或登录凭证错误
* `500 Internal Server Error` - 后端执行失败，如数据库写入、AI 服务调用、保存或删除失败
