package service

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
)

// AIWordResponse 对应我们希望大模型返回的 JSON 格式
type AIWordResponse struct {
	Meaning  string `json:"meaning"`
	Examples []struct {
		English string `json:"english"`
		Chinese string `json:"chinese"`
	} `json:"examples"`
}

// DashScopeRequest 通义千问 API 的请求结构
type DashScopeRequest struct {
	Model    string `json:"model"`
	Messages []struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	} `json:"messages"`
	ResponseFormat *struct {
		Type string `json:"type"`
	} `json:"response_format,omitempty"` // 强制要求返回 JSON
}

// FetchWordFromAI 调用通义千问大模型查询单词
func FetchWordFromAI(word string) (*AIWordResponse, error) {
	apiKey := os.Getenv("AI_API_KEY")
	if apiKey == "" || apiKey == "sk-xxxxx填入你申请的真实API_KEYxxxxx" {
		return nil, errors.New("无效的 AI_API_KEY，请在 .env 中配置")
	}

	// 构造给大模型的提示词 (Prompt)
	prompt := fmt.Sprintf(`你是一个专业的英语老师。请查单词 "%s"。
严格按照以下 JSON 格式返回，不要包含任何额外的 markdown 标记或解释说明：
{
  "meaning": "单词的中文释义（包含词性）",
  "examples": [
    {"english": "例句1英文", "chinese": "例句1中文"},
    {"english": "例句2英文", "chinese": "例句2中文"},
    {"english": "例句3英文", "chinese": "例句3中文"}
  ]
}`, word)

	// 组装请求数据
	reqBody := DashScopeRequest{
		Model: "qwen-turbo", // 使用通义千问基础模型
		Messages: []struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		}{
			{Role: "user", Content: prompt},
		},
		ResponseFormat: &struct {
			Type string `json:"type"`
		}{Type: "json_object"},
	}
	jsonData, _ := json.Marshal(reqBody)

	// 发送 HTTP POST 请求到阿里云接口
	req, _ := http.NewRequest("POST", "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	//  解析大模型的返回结果
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("AI 接口调用失败: %s", string(body))
	}

	var aiResult struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(body, &aiResult); err != nil || len(aiResult.Choices) == 0 {
		return nil, errors.New("解析大模型返回格式失败")
	}

	//  将大模型生成的纯文本 JSON 再次解析为我们的结构体
	var wordResp AIWordResponse
	if err := json.Unmarshal([]byte(aiResult.Choices[0].Message.Content), &wordResp); err != nil {
		return nil, errors.New("大模型返回的内容不是合法的预期 JSON 格式")
	}

	return &wordResp, nil
}
