// 首页相关元素
const welcomeSection = document.querySelector('.welcome-section');
// 对话区相关元素
const chatSection = document.querySelector('.chat-section');
const chatContainer = document.getElementById('chatContainer');
// 输入区相关元素
const userInput = document.getElementById('userInput');
const uploadBtn = document.getElementById('uploadBtn');
const themeToggle = document.getElementById('themeToggle');
const clearChat = document.getElementById('clearChat');
const sendBtn = document.getElementById('sendBtn');
const pauseBtn = document.getElementById('pauseBtn');
// 快捷卡片元素
const cards = document.querySelectorAll('.card');

// 全局状态
let isStreaming = false; // 是否正在流式响应
let abortController = null; // 用于中断响应
let pendingImage = null;//保存图片信息

// marked + highlight.js 配置
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
  mangle: false
});

const renderer = {
  code(token) {
    const text = typeof token === 'string' ? token : (token.text || token.raw || '');
    const lang = typeof token === 'object' ? (token.lang || '') : '';

    // 统一走 hljs.highlightAuto，不管有没有 lang 都高亮
    let highlighted = text;
    try {
      highlighted = hljs.highlightAuto(text).value;
    } catch (e) {}

    const langLabel = lang ? `<span class="code-lang">${lang}</span>` : '';
    const copyBtn = `<button class="copy-btn" onclick="const codeEl = this.closest('pre').querySelector('code'); navigator.clipboard.writeText(codeEl.textContent).then(()=>{this.textContent='✓ 已复制';setTimeout(()=>this.textContent='复制',1500);})">复制</button>`;

    return `<pre><div class="code-header"><span class="code-lang">${lang}</span>${copyBtn}</div><code    class="hljs">${highlighted}</code></pre>`;
  },
  heading(token) {
    const depth = token.depth ?? 1;
    const text = typeof token.text === 'string'
      ? token.text
      : (token.raw ?? '').replace(/^#+\s*/, '').trim();
    return `<h${depth} class="ai-heading">${text}</h${depth}>`;
  }
};

marked.use({ renderer });

// 从本地存储获取 KEY，如果没有则提示输入
let LINGXI_API_KEY = localStorage.getItem("LINGXI_API_KEY");

if (!LINGXI_API_KEY) {
  LINGXI_API_KEY = prompt("请输入你的阿里云百炼 API-KEY：");
  if (LINGXI_API_KEY) {
    localStorage.setItem("LINGXI_API_KEY", LINGXI_API_KEY);
  }
}

// API请求核心函数
async function callAliYunAPI(prompt,imageBase64 = null,aiElement){
    if (abortController) abortController.abort();
    abortController = new AbortController();
    const signal = abortController.signal;

    const requestData = {
        model: "qwen-vl-plus", 
        messages: [
            { 
                role: "user", 
                content: [
                    { type: "text", text: prompt },
                    ...(imageBase64 ? [{ 
                        type: "image_url", 
                        image_url: { url: imageBase64 } 
                    }] : [])
                ]
            }
        ],
        stream: true
    };

    let fullResponse = "";
    try {
        const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization":"Bearer " + LINGXI_API_KEY
            },
            body: JSON.stringify(requestData),
            signal: signal
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error("API返回错误：" + response.status + " " + errorText);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done || signal.aborted) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter(line => line.trim() !== "");
            
            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    try {
                        const data = JSON.parse(line.slice(5)); 
                        const content = data.choices?.[0]?.delta?.content || "";
                        if (content) {
                            fullResponse += content;
                            aiElement.innerHTML = marked.parse(fullResponse);
                            chatContainer.scrollTop = chatContainer.scrollHeight;
                        }
                    } catch(e) {}
                }
            }
        }
        aiElement.innerHTML = marked.parse(fullResponse);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    } catch (error) {
        if (error.name === 'AbortError') {
            if (fullResponse) {
                aiElement.innerHTML = marked.parse(fullResponse);
            } else {
                const bubble = aiElement.closest('.ai-message');
                if (bubble) bubble.remove();
            }
        } else {
            console.error("请求错误：", error);
            aiElement.textContent = "请求失败：" + error.message;
        }
    } finally {
        isStreaming = false;
        stopGenerating();
    }
}

function initTheme(){
    const savedTheme=localStorage.getItem('theme') || 'dark-theme';
    document.body.className=savedTheme;
}
themeToggle.addEventListener('click',()=>{
    const newTheme=document.body.className==='dark-theme'?'light-theme':'dark-theme'
    document.body.className=newTheme;
    localStorage.setItem('theme',newTheme);
});

initTheme();

cards.forEach(card=>{
    card.addEventListener('click',()=>{
        const text=card.dataset.text;
        userInput.value=text;
        updateButtonState();
        sendMessage();
    })
});

userInput.addEventListener('keydown',e=>{
    if(e.key==='Enter' && !e.shiftKey){
        e.preventDefault();
        sendMessage();
    }
});

function addMessage(content, isUser = false, isThinking = false) {
    const messageDiv = document.createElement('div');
    if (isUser) {
        messageDiv.className = 'user-message';
        messageDiv.textContent = content;
    } else {
        messageDiv.className = 'ai-message';
        const aiContent = isThinking
            ? '<span class="thinking">思考中...</span>'
            : content;
        messageDiv.innerHTML = `
            <div class="ai-avatar"></div>
            <div class="ai-content">${aiContent}</div>`;
    }
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function sendMessage(){
    const text=userInput.value.trim();
    if (!text && !pendingImage) return;
    if (isStreaming) return;

    welcomeSection.classList.add('hidden');
    chatSection.classList.remove('hidden');

    if(text){
        const userMsg = document.createElement('div');
        userMsg.className = 'user-message';
        userMsg.textContent = text;
        chatContainer.appendChild(userMsg);
    }

    if(pendingImage){
        const img = document.createElement('img');
        img.src = pendingImage;
        img.className = 'user-image';
        chatContainer.appendChild(img);
    }

    userInput.value = '';
    userInput.style.height = 'auto';

    const preview = document.querySelector('.image-preview-wrapper');
    if (preview) preview.remove();

    addMessage('思考中...',false,true);
    startGenerating()
    isStreaming = true;

    const allAi = document.querySelectorAll('.ai-content');
    const currentAi = allAi[allAi.length - 1];

    callAliYunAPI(text, pendingImage,currentAi);
    pendingImage = null;
    uploadBtn.closest('.action-wrapper').style.display = 'block';
    updateButtonState();
}

clearChat.addEventListener('click', () => {
    if (isStreaming && abortController) abortController.abort();
    isStreaming = false;
    chatContainer.innerHTML = '';
    welcomeSection.classList.remove('hidden');
    chatSection.classList.add('hidden');
    updateButtonState();
});

uploadBtn.addEventListener('click', () => {
    const input=document.createElement('input')
    input.type='file';
    input.accept='image/*';
    input.onchange=(e)=>{
        const file=e.target.files[0];
        if(!file) return;
        const reader=new FileReader();
        reader.onload=(event)=>{
            pendingImage=event.target.result;
            
            const old = document.querySelector('.image-preview-wrapper');
            if (old) old.remove();

            const wrapper = document.createElement('div');
            wrapper.className = 'image-preview-wrapper';

            const img = document.createElement('img');
            img.className = 'image-preview';
            img.src = pendingImage;
            
            const close = document.createElement('div');
            close.className = 'image-preview-close';
            close.textContent = '×';
            close.onclick = () => {
                pendingImage = null;
                wrapper.remove();
                uploadBtn.style.display = 'flex'; 
                updateButtonState();
                uploadBtn.closest('.action-wrapper').style.display = 'block';
            };
            
            wrapper.appendChild(img);
            wrapper.appendChild(close);

            document.querySelector('.input-box').insertBefore(wrapper, document.querySelector('.btn-group'));
            updateButtonState();
            uploadBtn.closest('.action-wrapper').style.display = 'none';
            
        }
        reader.readAsDataURL(file);
    }
    input.click();
});

function updateButtonState() {
  const hasContent = userInput.value.trim() !== '' || pendingImage;
  const btnGroup = document.querySelector('.btn-group');

  if (hasContent) {
    btnGroup.classList.add('has-content');
  } else {
    btnGroup.classList.remove('has-content');
  }
}

userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height=userInput.scrollHeight+'px';
    updateButtonState();
});

function startGenerating() {
  document.querySelector('.btn-group').classList.add('generating');
}

function stopGenerating() {
  document.querySelector('.btn-group').classList.remove('generating');
}

document.getElementById('pauseBtn').addEventListener('click', () => {
  if (abortController) {
    abortController.abort();
    isStreaming = false; 
  }
  stopGenerating();
});

sendBtn.addEventListener('click', sendMessage);