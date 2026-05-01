package model

import (
	"time"

	"gorm.io/gorm"
)

// User 对应数据库中的 users 表
type User struct {
	ID        uint           `gorm:"primaryKey"`
	Username  string         `gorm:"column:username"`
	Password  string         `gorm:"column:password"`
	CreatedAt time.Time      `gorm:"column:created_at"`
	UpdatedAt time.Time      `gorm:"column:updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at"` // 专门用于软删除
}
