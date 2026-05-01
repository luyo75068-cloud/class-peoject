# ====================
# 第一阶段：编译阶段 (Builder)
# ====================
FROM golang:1.25-alpine AS builder

# 设置国内代理，防止国内网络拉取依赖失败卡死
ENV GOPROXY=https://goproxy.cn,direct

WORKDIR /app

# 优先缓存依赖包（利用 Docker 层缓存机制）
COPY go.mod go.sum ./
RUN go mod download

# 拷贝全部源码并编译
COPY . .
# 禁用 CGO，编译出极简的纯静态二进制文件
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o main .

# ====================
# 第二阶段：运行阶段 (Runner)
# ====================
FROM alpine:latest

# 添加时区支持（消除时间相差 8 小时的 Bug）
RUN apk --no-cache add tzdata
WORKDIR /app

# 核心黑科技：只把上一阶段编译好的 main 文件拿过来，不带任何 Go 源码！
COPY --from=builder /app/main .

EXPOSE 8080
CMD ["./main"]