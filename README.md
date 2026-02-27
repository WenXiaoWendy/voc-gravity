# 🌌 VOC Gravity - AI问答系统

> 基于向量数据库的智能问答系统，融合现代Web技术栈

---

## � 项目简介

**VOC Gravity** 是一个现代化的AI问答系统，采用前后端分离架构，结合了：

- 🧠 **本地向量数据库** (FAISS) - 高效的知识检索
- 🤖 **大语言模型集成** (OpenAI/本地模型) - 智能问答
- ⚛️ **React + TypeScript** - 现代化前端
- � **Flask API** - 轻量级Python后端
- 🎨 **Tailwind CSS** - 美观的响应式界面
- 🔄 **Vite构建工具** - 快速开发体验

---

## 📁 项目结构

```
voc-gravity/
├── backend/                 # Python后端
│   ├── api/app.py          # Flask API服务器
│   ├── core/               # 核心业务逻辑模块
│   └── requirements.txt    # Python依赖
├── frontend/               # React前端
│   ├── src/                # 源码目录
│   │   ├── App.tsx         # 主应用组件
│   │   ├── main.tsx        # 应用入口
│   │   └── index.css       # 全局样式
│   ├── package.json        # 前端依赖配置
│   └── vite.config.ts      # Vite配置
├── faiss_index/            # 向量数据库文件
├── start.sh                # 一键启动脚本
└── README.md               # 项目说明
```

---

## �️ 技术栈

### 前端技术
- **React 18** - 现代化UI框架
- **TypeScript** - 类型安全的JavaScript
- **Tailwind CSS** - 实用优先的CSS框架
- **Vite** - 快速构建工具
- **Lucide React** - 精美图标库

### 后端技术
- **Flask** - 轻量级Python Web框架
- **FAISS** - Facebook AI相似性搜索
- **LangChain** - LLM应用开发框架
- **HuggingFace** - 开源AI模型

---

## ⚡ 快速开始

### 方式一：一键启动（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd voc-gravity

# 一键启动（自动安装依赖并启动应用）
./start.sh
```

### 方式二：手动启动

```bash
# 1. 安装后端依赖
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# 2. 安装前端依赖
cd frontend
npm install

# 3. 启动后端API（终端1）
npm run api

# 4. 启动前端开发服务器（终端2）
npm run dev
```

### 方式三：同时启动前后端

```bash
cd frontend
npm run start:dev
```

---

## 🌐 访问地址

启动成功后，可以通过以下地址访问：

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:8000
- **API健康检查**: http://localhost:8000/api/health

---

## � 核心功能

### 🤖 智能问答
- 基于向量数据库的语义搜索
- 上下文感知的对话能力
- 实时响应，流畅交互

### 🔍 知识检索
- FAISS向量相似性搜索
- 多文档支持与索引
- 高效的知识库管理

### 🎨 现代化界面
- 类似ChatGPT的对话体验
- 响应式设计，支持移动端
- 实时消息显示与状态反馈

---

## � 开发指南

### 前端开发

```bash
cd frontend

# 开发模式（热重载）
npm run dev

# 代码检查
npm run lint

# 构建生产版本
npm run build
```

### 后端开发

```bash
# 激活虚拟环境
source venv/bin/activate

# 启动开发服务器
cd backend/api
python app.py
```

### API接口

#### 问答接口
```http
POST /api/ask
Content-Type: application/json

{
  "question": "什么是人工智能？"
}
```

#### 健康检查
```http
GET /api/health
```

---

## 📦 部署说明

### 生产环境部署

1. **构建前端**
   ```bash
   cd frontend
   npm run build
   ```

2. **配置生产环境**
   - 设置环境变量
   - 配置反向代理（Nginx）
   - 使用生产级WSGI服务器（Gunicorn）

3. **启动服务**
   ```bash
   # 使用Gunicorn启动后端
   gunicorn -w 4 -b 0.0.0.0:8000 backend.api.app:app
   ```

---

## � 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

## 🙏 致谢

- [FAISS](https://github.com/facebookresearch/faiss) - 高效的相似性搜索库
- [LangChain](https://github.com/langchain-ai/langchain) - LLM应用开发框架
- [React](https://reactjs.org/) - 用户界面库
- [Flask](https://flask.palletsprojects.com/) - Python Web框架

---

## 📞 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 项目 Issues: [GitHub Issues]
- 邮箱: [your-email@example.com]

---

> **注意**: 本项目仍在积极开发中，API和功能可能会有变动。
