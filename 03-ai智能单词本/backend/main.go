package main

import (
	"log"
	"os"

	"english-learning-backend/config"
	"english-learning-backend/router" // 引入 router 包

	"github.com/joho/godotenv"
)

func main() {
	// 1. 加载配置
	if err := godotenv.Load(); err != nil {
		log.Println("警告: 未找到 .env 文件")
	}

	// 2. 初始化数据库
	config.InitDB()

	// 3. 初始化并获取总路由
	r := router.SetupRouter()

	// 4. 获取端口并启动
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 服务已启动，监听端口: %s\n", port)
	r.Run(":" + port)
}
