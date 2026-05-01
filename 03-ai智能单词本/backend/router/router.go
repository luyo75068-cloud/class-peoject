package router

import (
	"english-learning-backend/api"
	"english-learning-backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	apiGroup := r.Group("/api")
	{
		// 注册和登录（无需 Token）
		auth := apiGroup.Group("/auth")
		{
			auth.POST("/register", api.Register)
			auth.POST("/login", api.Login)
		}

		// 单词相关（需要 Token 鉴权）
		words := apiGroup.Group("/words", middleware.AuthRequired())
		{
			words.POST("/query", api.QueryWord)
			words.POST("/save", api.SaveWord)
			words.GET("/list", api.GetUserWords)
			words.DELETE("/:id", api.DeleteWord)
		}
	}

	return r
}
