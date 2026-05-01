package utils

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// GenerateToken 为登录成功的用户生成 JWT
func GenerateToken(userID uint, username string) (string, error) {
	// 从环境变量读取我们在 .env 里写的密钥
	secret := os.Getenv("JWT_SECRET")

	// 设置 Token 里面携带的信息（Payload）和过期时间（24小时）
	claims := jwt.MapClaims{
		"user_id":  userID,
		"username": username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	}

	// 使用 HS256 算法生成 Token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
