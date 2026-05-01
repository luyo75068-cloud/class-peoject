import { useState } from 'react';
import { Input, Button, Card, Tag, Divider, message } from 'antd';
import {  PlusOutlined, BulbOutlined } from '@ant-design/icons';
import axios from 'axios';

const SearchPage = () => {
  const [word, setWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [savedStatus, setSavedStatus] = useState(false);

  const handleSearch = async () => {
    if (!word) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/words/query', 
        { word, ai_provider: "通义千问" }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data.word);
      setSavedStatus(res.data.saved);
      if (res.data.source === "database") message.info('已从本地单词本加载');
    } catch (err) { message.error('查词失败'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/words/save', {
        ...result, examples: JSON.stringify(result.examples)
      }, { headers: { Authorization: `Bearer ${token}` } });
      message.success('已存入单词本');
      setSavedStatus(true);
    } catch (err) { message.error('保存失败'); }
  };

  return (
    <div style={{ maxWidth: 800, margin: '40px auto' }}>
      <div style={{ display: 'flex', gap: 15, marginBottom: 40 }}>
        <Input 
          placeholder="输入查询单词，开启 AI 深度解析..." 
          size="large"
          value={word}
          onChange={e => setWord(e.target.value)}
          onPressEnter={handleSearch}
          style={{ border: '4px solid #000', borderRadius: 12, height: 65, fontSize: 20, fontWeight: 700 }}
        />
        <Button 
          type="primary" 
          onClick={handleSearch} 
          loading={loading}
          style={{ height: 65, width: 120, border: '4px solid #000', background: '#b7eb8f', color: '#000', fontWeight: 900, fontSize: 18 }}
        >
          查询
        </Button>
      </div>

      {result && (
        <Card style={{ border: '4px solid #000', borderRadius: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h1 style={{ fontSize: 56, fontWeight: 900, margin: 0 }}>{result.word}</h1>
            {!savedStatus && <Button type="primary" icon={<PlusOutlined />} onClick={handleSave} style={{ background: '#ffd666', color: '#000', border: '2px solid #000', fontWeight: 700 }}>收藏</Button>}
          </div>
          <Tag color="blue" style={{ border: '1px solid #000', fontWeight: 700, marginTop: 10, color:'#000' }}>{savedStatus ? '已在库' : 'AI 实时生成'}</Tag>
          <div style={{ marginTop: 30, padding: '20px', background: '#f5f5f5', border: '2px solid #000', borderRadius: 12, fontSize: 22, fontWeight: 800 }}>
            {result.meaning}
          </div>
          <Divider style={{ borderTop: '3px solid #000' }} />
          <h3 style={{ fontWeight: 800 }}><BulbOutlined /> 例句解析</h3>
          {result.examples.map((ex: any, i: number) => (
            <div key={i} style={{ marginBottom: 20, paddingLeft: 15, borderLeft: '6px solid #d0e8ff' }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{ex.english}</div>
              <div style={{ color: '#666', fontWeight: 500 }}>{ex.chinese}</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

export default SearchPage;