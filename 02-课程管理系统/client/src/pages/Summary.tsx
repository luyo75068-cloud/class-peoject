import { useEffect, useState,  } from 'react'
import { Card, Spin, message, Button } from 'antd'
import { CopyOutlined, UpOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import request from '../api/request'

const Summary = () => {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
 
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    request.get('/summary')
      .then(res => res.code === 0 && setContent(res.data.content))
      .finally(() => setLoading(false))
  }, [])

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      message.success('代码已复制');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spin description="加载中..." />
      </div>
    )
  }

  const COLLAPSED_HEIGHT = '700px';

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '0 20px' }}>
      <h2 style={{ margin: '18px 0', fontSize: 28, fontWeight: 700, textAlign: 'left' }}>
        📝 学习总结
      </h2>

      <Card
        style={{
          border: '3px solid #000',
          borderRadius: 10,
          boxSizing: 'border-box',
          width: '100%'
        }}
        styles={{
          body: {
            padding: '20px',
            textAlign: 'left'
          }
        }}
      >
        <div style={{ position: 'relative' }}>
          {/* 内容容器：根据状态切换高度和溢出隐藏 */}
          <div 
            style={{ 
              maxHeight: isExpanded ? 'none' : COLLAPSED_HEIGHT, 
              overflow: 'hidden',
              transition: 'max-height 0.3s ease-in-out',
              position: 'relative'
            }}
          >
            <div className="custom-markdown-container">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const codeString = String(children).replace(/\n$/, '')
                    const { ref, ...rest } = props as any;
                    
                    return match ? (
                      <div style={{ position: 'relative', margin: '1em 0', width: '100%', overflow: 'hidden' }}>
                        <Button 
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => handleCopy(codeString)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '10px',
                            zIndex: 10,
                            background: 'rgba(255, 255, 255, 0.15)',
                            color: '#fff',
                            border: 'none',
                            backdropFilter: 'blur(4px)'
                          }}
                        />
                        <SyntaxHighlighter
                          style={oneDark as any} 
                          language={match[1]}
                          PreTag="div"
                          wrapLines={true}
                          wrapLongLines={true}
                          customStyle={{
                            borderRadius: '6px',
                            fontSize: '14px',
                            padding: '20px 15px',
                            backgroundColor: '#282c34',
                            margin: 0,
                            display: 'grid', 
                            whiteSpace: 'pre-wrap', 
                            wordBreak: 'break-all',
                            overflowX: 'hidden'
                          }}
                          codeTagProps={{
                            style: {
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all',
                              display: 'inline-block', 
                              width: '100%'
                            }
                          }}
                          {...rest}
                        >
                          {codeString}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code 
                        ref={ref}
                        style={{ 
                          background: '#f0f0f0', 
                          padding: '2px 4px', 
                          borderRadius: '4px', 
                          color: '#c41d7f',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap'
                        }} {...rest}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {content || '暂无学习总结内容'}
              </ReactMarkdown>
            </div>
          </div>

          {/* 未展开时的渐变遮罩层和展开按钮 */}
          {!isExpanded && (
            <div 
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50px', 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center', 
                marginTop: '20px',
                zIndex: 1
              }}
            >
              <Button 
                type="text" 
                onClick={() => setIsExpanded(true)}
                style={{
                  color: '#6b6375', 
                  fontSize: '16px', 
                  marginTop: '30px' 
                }}
              >
                ...更多Markdown内容... 
              </Button>
            </div>
          )}
        </div>

        {/* 展开后的收起按钮（放在最底部） */}
        {isExpanded && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
             <Button 
               type="default" 
               shape="round" 
               icon={<UpOutlined />} 
               onClick={() => setIsExpanded(false)}
             >
               收起内容
             </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default Summary