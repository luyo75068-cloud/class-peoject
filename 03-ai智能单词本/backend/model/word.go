package model

import (
	"time"

	"gorm.io/gorm"
)

// Word 对应数据库中的 words 表
type Word struct {
	ID         uint           `gorm:"primaryKey"`
	UserID     uint           `gorm:"column:user_id"`
	Word       string         `gorm:"column:word"`
	Meaning    string         `gorm:"column:meaning"`
	Examples   string         `gorm:"column:examples"` // 虽然库里是 JSON，但在 Go 里作为普通字符串存取最稳妥
	AIProvider string         `gorm:"column:ai_provider"`
	CreatedAt  time.Time      `gorm:"column:created_at"`
	UpdatedAt  time.Time      `gorm:"column:updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"column:deleted_at"`
}
