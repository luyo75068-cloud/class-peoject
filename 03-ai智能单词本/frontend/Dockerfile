# ====================
# 第一阶段：编译打包 React/Vite 代码
# ====================
FROM node:20-alpine AS builder

WORKDIR /app
# 利用缓存机制，先装依赖
COPY package*.json ./
# 如果国内装 npm 慢，可以加上 --registry=https://registry.npmmirror.com
RUN npm install

# 把前端代码全搬进来，执行 Vite 的 build 指令
COPY . .
RUN npm run build

# ====================
# 第二阶段：Nginx 部署
# ====================
FROM nginx:alpine

# 1. 替换掉 Nginx 默认的配置文件，用我们刚才自己写的反向代理配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 2. 从 builder 阶段把 Vite 打包生成的 dist 目录（纯静态文件）拷贝给 Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露 80 端口（给宿主机访问用）
EXPOSE 80

# 启动 Nginx，并保持在前台运行
CMD ["nginx", "-g", "daemon off;"]