package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthRequired JWT 鉴权中间件
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. 从请求头 Authorization 中获取 Token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "请先登录"})
			c.Abort() // 拦截，不准往后走
			return
		}

		// 2. 提取真正的 Token 字符串
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// 3. 解析并验证 Token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		// 4. 校验 Token 是否有效
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "登录已过期或凭证无效"})
			c.Abort()
			return
		}

		// 5. 校验通过！把 Token 里的 userID 拿出来，存入上下文，方便后续接口使用
		claims := token.Claims.(jwt.MapClaims)
		userID := uint(claims["user_id"].(float64))
		c.Set("userID", userID)

		c.Next() // 准予通过，前往下一个处理函数
	}
}
