package api

import (
	"net/http"

	"english-learning-backend/config"
	"english-learning-backend/model"
	"english-learning-backend/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// AuthRequest 定义前端传过来的 JSON 格式
type AuthRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6"`
}

// Register 用户注册接口
func Register(c *gin.Context) {
	var req AuthRequest
	// 1. 校验前端传来的参数
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数格式错误或密码长度不够"})
		return
	}

	// 2. 检查用户名是否已被占用
	var count int64
	config.DB.Model(&model.User{}).Where("username = ?", req.Username).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户名已存在"})
		return
	}

	// 3. 将密码进行 bcrypt 哈希加密 (核心考点)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "密码加密失败"})
		return
	}

	// 4. 将新用户存入数据库
	user := model.User{
		Username: req.Username,
		Password: string(hashedPassword),
	}
	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "注册失败"})
		return
	}

	// 5. 注册成功，按规范自动签发 Token 并返回
	token, _ := utils.GenerateToken(user.ID, user.Username)
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
		},
	})
}

// Login 用户登录接口
func Login(c *gin.Context) {
	var req AuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	// 1. 去数据库里找这个用户名
	var user model.User
	if err := config.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	// 2. 核心考点：比对前端传来的明文密码和数据库里的哈希密文
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	// 3. 密码正确，签发 Token 并返回
	token, _ := utils.GenerateToken(user.ID, user.Username)
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
		},
	})
}
