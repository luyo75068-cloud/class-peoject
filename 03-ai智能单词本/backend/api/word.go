package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"english-learning-backend/config"
	"english-learning-backend/model"
	"english-learning-backend/service"

	"github.com/gin-gonic/gin"
)

type QueryRequest struct {
	Word       string `json:"word" binding:"required"`
	AIProvider string `json:"ai_provider"` // 前端传入的大模型选择
}

// 智能查询单词
func QueryWord(c *gin.Context) {
	var req QueryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	userID, _ := c.Get("userID")

	// 鉴权通过后，先在数据库中检查当前用户是否已保存过该单词
	var existingWord model.Word
	err := config.DB.Where("user_id = ? AND word = ?", userID, req.Word).First(&existingWord).Error
	if err == nil {
		// 如果已保存，直接从数据库读取并返回给前端 (不需要重新调 AI)
		// 将数据库里存的字符串格式 examples 转回 JSON 数组给前端
		var examples []map[string]string
		json.Unmarshal([]byte(existingWord.Examples), &examples)

		c.JSON(http.StatusOK, gin.H{
			"word": gin.H{
				"id":          existingWord.ID,
				"word":        existingWord.Word,
				"meaning":     existingWord.Meaning,
				"examples":    examples,
				"ai_provider": existingWord.AIProvider,
			},
			"source": "database", // 告诉前端这是从数据库拿的
			"saved":  true,
		})
		return
	}

	// 如果未保存，根据 ai_provider 调用对应 AI 接口 (默认通义千问)
	aiResult, err := service.FetchWordFromAI(req.Word)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI 服务调用失败: " + err.Error()})
		return
	}

	//  直接将 AI 结果返回给前端展示，不在后端进行保存
	c.JSON(http.StatusOK, gin.H{
		"word": gin.H{
			"word":        req.Word,
			"meaning":     aiResult.Meaning,
			"examples":    aiResult.Examples,
			"ai_provider": req.AIProvider, // 沿用前端传来的模型名称
		},
		"source": "ai",
		"saved":  false,
	})
}

// 手动保存单词 (接收完整数据写入数据库)
func SaveWord(c *gin.Context) {
	userID, _ := c.Get("userID")

	var word model.Word
	if err := c.ShouldBindJSON(&word); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "数据格式错误"})
		return
	}

	word.UserID = userID.(uint)

	if err := config.DB.Create(&word).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "已成功加入单词本", "id": word.ID})
}

// GetUserWords  获取单词列表 (支持分页)
func GetUserWords(c *gin.Context) {
	userID, _ := c.Get("userID")

	// 接收前端分页参数，默认第一页，每页10条
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	var words []model.Word
	var total int64

	// 计算总数
	config.DB.Model(&model.Word{}).Where("user_id = ?", userID).Count(&total)

	// 分页查询：计算偏移量
	offset := (page - 1) * pageSize
	if err := config.DB.Where("user_id = ?", userID).Order("created_at desc").Offset(offset).Limit(pageSize).Find(&words).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取列表失败"})
		return
	}

	// 返回标准的分页格式
	c.JSON(http.StatusOK, gin.H{
		"data":      words,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// DeleteWord  删除单词 (软删除)
func DeleteWord(c *gin.Context) {
	userID, _ := c.Get("userID")
	wordID := c.Param("id") // 从 URL 获取要删除的单词 ID

	// GORM 默认带有 DeletedAt 字段，这里的 Delete 操作会自动变成软删除 (UPDATE deleted_at = now)
	if err := config.DB.Where("id = ? AND user_id = ?", wordID, userID).Delete(&model.Word{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}
