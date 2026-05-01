package config

import (
	"log"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// 全局的 DB 对象，后续增删改查都用它
var DB *gorm.DB

func InitDB() {
	// 从 .env 文件中读取数据库连接地址
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		log.Fatal("未找到数据库连接配置 DB_DSN")
	}

	// 使用 GORM 连接 MySQL
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ 连接数据库失败: ", err)
	}

	DB = db
	log.Println("✅ 数据库连接成功！")
}
