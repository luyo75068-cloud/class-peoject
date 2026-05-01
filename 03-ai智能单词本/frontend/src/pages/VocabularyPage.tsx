import React, { useState, useEffect } from 'react';
import { Card, Empty, Pagination, Popconfirm, Button, message, Tag, Modal, List ,Space} from 'antd';
import { HistoryOutlined, DeleteOutlined, EyeOutlined, BulbOutlined, DatabaseOutlined } from '@ant-design/icons';
import axios from 'axios';

const VocabularyPage = () => {
  const [savedWords, setSavedWords] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // 控制详情弹窗的状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState<any>(null);

  useEffect(() => { fetchSavedWords(1); }, []);

  const fetchSavedWords = async (page: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/words/list?page=${page}&page_size=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedWords(res.data.data || []);
      setTotal(res.data.total || 0);
      setCurrentPage(page);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发卡片点击弹窗
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/words/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      message.success('已删除');
      fetchSavedWords(currentPage);
    } catch (err) { message.error('删除失败'); }
  };

  // 处理“查看详情”逻辑
  const showDetail = (item: any) => {
    // 数据库存的是字符串，需要解析回数组
    let parsedExamples = [];
    try {
      const rawExamples = item.Examples || item.examples;
      parsedExamples = typeof rawExamples === 'string' ? JSON.parse(rawExamples) : rawExamples;
    } catch (e) {
      console.error("解析例句失败", e);
    }

    setSelectedWord({
      ...item,
      word: item.Word || item.word,
      meaning: item.Meaning || item.meaning,
      ai_provider: item.AIProvider || item.ai_provider,
      examples: parsedExamples || []
    });
    setDetailModalVisible(true);
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Card 
        title={<div style={{ fontSize: 24, fontWeight: 900 }}><HistoryOutlined /> 我的单词本 ({total})</div>}
        style={{ border: '4px solid #000', borderRadius: 20 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {savedWords.map((item: any) => (
            <Card 
              key={item.ID} 
              size="small" 
              hoverable
              onClick={() => showDetail(item)}
              style={{ border: '3px solid #000', borderRadius: 12, transition: 'transform 0.2s' }}
              className="vocal-card"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 15 }}>
                  <div style={{ fontSize: 20, fontWeight: 900 }}>{item.Word || item.word}</div>
                  <div style={{ color: '#666', fontWeight: 600 }}>{item.Meaning || item.meaning}</div>
                </div>
                <Space>
                  <Button type="text" icon={<EyeOutlined />} style={{ color: '#1677ff' }} />
                  <Popconfirm title="确定删除？" onConfirm={(e) => handleDelete(item.ID, e as any)}>
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={e => e.stopPropagation()} />
                  </Popconfirm>
                </Space>
              </div>
            </Card>
          ))}
        </div>

        {savedWords.length === 0 && <Empty style={{ margin: '60px 0' }} />}

        <div style={{ marginTop: 40, textAlign: 'center', borderTop: '2px solid #000', paddingTop: 20 }}>
          <Pagination 
            current={currentPage} 
            total={total} 
            pageSize={pageSize} 
            onChange={fetchSavedWords} 
            showSizeChanger={false}
          />
        </div>
      </Card>


      <Modal
        title={null}
        footer={null}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={600}
        centered
        styles={{ 
          body: { 
            border: '4px solid #000', 
            borderRadius: '20px', 
            padding: '30px'
          } 
        }}
      >
        {selectedWord && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h1 style={{ fontSize: 42, fontWeight: 900, margin: 0 }}>{selectedWord.word}</h1>
              <Tag color="cyan" icon={<DatabaseOutlined />} style={{ border: '1px solid #000', color: '#000', fontWeight: 700 }}>
                {selectedWord.ai_provider} 提供解析
              </Tag>
            </div>
            
            <div style={{ padding: '15px 20px', background: '#f0f2f5', border: '2px solid #000', borderRadius: 12, marginBottom: 25 }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{selectedWord.meaning}</div>
            </div>

            <h3 style={{ fontWeight: 900, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BulbOutlined /> 深度例句回顾
            </h3>
            
            <List
              dataSource={selectedWord.examples}
              renderItem={(ex: any, i: number) => (
                <div key={i} style={{ marginBottom: 18, paddingLeft: 15, borderLeft: '5px solid #d0e8ff' }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#111' }}>{ex.english}</div>
                  <div style={{ color: '#666', marginTop: 4, fontWeight: 500 }}>{ex.chinese}</div>
                </div>
              )}
            />
            
            <div style={{ textAlign: 'right', marginTop: 20 }}>
              <Button 
                onClick={() => setDetailModalVisible(false)}
                style={{ border: '2px solid #000', fontWeight: 700, borderRadius: 8 }}
              >
                关闭
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VocabularyPage;