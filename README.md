# Voc Gravity

**将词汇的语义空间可视化为引力气泡场**

*Visualize the semantic space around any word as an interactive bubble graph*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live_Demo-→_Try_it-blue)](http://43.156.159.38/)

**在线体验 →** http://43.156.159.38/ &nbsp;*(域名申请中)*

---

<!-- 截图 1：快速探索模式，展示气泡场全貌 -->
![快速探索模式](docs/screenshot-fast.png)

<!-- 截图 2：AI 深度解析模式，展示关系着色与底部抽屉 -->
![AI 深度解析模式](docs/screenshot-ai.png)

---

## 为什么做这个 / The story behind this

我有 ADHD，思维习惯在关联之间跳跃，不太擅长按线性路径学东西。

用传统软件背单词时，总觉得很多词似曾相识——有些形近，有些义近，有些有某种说不清的关联——但不知道它们之间的关系到底是什么，差异在哪里，什么语境用哪个。背了忘，忘了背，却始终没有真正搞清楚那片语义空间。

于是我想，能不能用 AI 来模拟我理解语言的方式：把一个词放在中心，把与它语义相邻的词围绕它展开，用力导向布局让关系变得可见。不是一个个单词，而是一张语义网络。

这个项目内置的是雅思词库，但架构支持任意语言的任意词汇集——**只需要一份词表和自己的 API Key，你可以为任何语言构建同样的语义探索工具**。

---

*I have ADHD. My mind tends to move between associations rather than down a linear list.*

*When studying vocabulary with traditional apps, I kept running into words that felt somehow familiar — some looked alike, some meant nearly the same thing, some were connected in ways I couldn't quite articulate. I'd studied them before, but I never really understood how they related to each other, what distinguished them, or which one belonged in which context.*

*So I built this: put a word at the center, let word embeddings surface its semantic neighbors, and visualize the whole neighborhood as a force-directed bubble graph. Not a list. A space.*

*It's built around IELTS vocabulary, but the architecture supports any language and any word list — **bring your own vocabulary file and API key, and you can build the same semantic explorer for any language**.*

---

## 功能 / Features

| | |
|--|--|
| **语义气泡场** | FAISS 向量检索（text-embedding-3-large, 3072维），D3 力导向布局，同心圆四层展示 |
| **快速探索模式** | 纯向量检索，按词性着色，无 LLM 调用，毫秒响应 |
| **AI 深度解析** | DeepSeek 将邻域词归类为 9 种语义关系并附解释，SSE 流式推送 |
| **回忆模式** | 一键隐藏中文，只看英文气泡，用于词汇记忆练习 |
| **探索路径** | 面包屑记录跳跃路径，支持任意节点回撤 |
| **收藏 & 历史** | 本地持久化，随时回顾感兴趣的词 |
| **词库外词汇** | 搜索未收录词时，LLM 实时生成并缓存到本地 |
| **Token 计费** | 内置用量追踪，精确到每次调用的费用明细 |

**9 种语义关系**：synonym · antonym · hypernym · hyponym · cohyponym · collocation · register · frame · noise

---

## 快速部署 / Quick Start

### 前置条件

- Python 3.10+，Node.js 18+
- **Embedding API Key**（用于 FAISS 向量检索）：推荐 `text-embedding-3-large`（3072 维，召回精度高），OpenAI 或兼容接口均可；换其他 embedding 模型同样支持，但需删除旧索引重建
- **LLM API Key**（用于语义关系分析 + 词汇生成）：任意 OpenAI 兼容接口均可

  | 提供商 | 模型推荐 | API 兼容 |
  |--------|----------|----------|
  | [OpenAI](https://platform.openai.com/) | gpt-4o-mini | ✅ 原生 |
  | [DeepSeek](https://platform.deepseek.com/) | deepseek-chat | ✅ 兼容 |
  | [阿里云百炼 / Qwen](https://bailian.console.aliyun.com/) | qwen-plus | ✅ 兼容 |
  | [智谱 GLM](https://open.bigmodel.cn/) | glm-4-flash | ✅ 兼容 |
  | [月之暗面 Kimi](https://platform.moonshot.cn/) | moonshot-v1-8k | ✅ 兼容 |

  修改 `backend/core/semantic.py` 和 `backend/core/generate_vocabulary.py` 中的 `base_url`、`model`、`api_key` 即可切换。

### 启动

```bash
git clone https://github.com/WenXiaoWendy/voc-gravity.git
cd voc-gravity

# 配置 API Key（填入你选择的提供商的 Key）
echo "OPENAI_API_KEY=sk-..."        >> .env   # Embedding 用
echo "DEEPSEEK_API_KEY=sk-..."      >> .env   # LLM 用（或改名为对应提供商的变量）

# 一键启动（自动创建 venv、安装依赖、启动前后端）
./start.sh
```

访问 http://localhost:3000

<details>
<summary>手动启动</summary>

```bash
# 后端（终端 1）
python3 -m venv venv && source venv/bin/activate
pip install -r backend/requirements.txt
cd backend/api && python app.py

# 前端（终端 2）
cd frontend && npm install && npm run dev
```

</details>

---

## 扩展到其他语言 / Extend to Any Language

这是本项目最核心的能力。只需三步，即可为任意语言构建同款语义探索工具。

**Step 1 — 准备词表**

在 `backend/data/` 创建词库 JSON，格式如下：

```json
[
  { "id": "001", "word": "abandon", "pos": "v", "chinese_gloss": "放弃" }
]
```

`chinese_gloss` 字段可替换为任意目标语言的释义。

**Step 2 — 批量生成完整词汇信息**（推荐）

内置脚本会为每个词调用 LLM，批量生成发音、例句、搭配、派生词等，进度自动保存，中断可续跑：

```bash
source venv/bin/activate
cd backend
python -m core.batch_generate_all --book your_book_key
```

完成后同步到前端：

```bash
cp backend/data/your_book_complete.json frontend/src/data/
```

**Step 3 — 重建 FAISS 索引**

修改 `backend/core/retrieval.py` 中的 `book_key`，删除旧索引目录 `backend/faiss_index/`，重启后端，索引自动重建。

---

## API 参考 / API Reference

| Method | Endpoint | 说明 |
|--------|----------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/retrieve` | 向量检索 + 可选 LLM 分析（非流式） |
| POST | `/api/retrieve-stream` | 向量检索 + LLM 分析（SSE 流式推送） |
| POST | `/api/validate-word` | 验证词汇合法性（Free Dictionary API） |
| POST | `/api/generate-word` | 触发单词词汇信息生成 |
| GET | `/api/token-stats` | 用量与费用统计 |
| GET | `/api/token-stats?date=2026-03-09` | 按日期查询 |

`/api/retrieve-stream` 响应格式（SSE）：

```
data: {"type": "words", "words": [...]}      # 气泡数据，立即推送
data: {"type": "analysis", "analysis": {...}} # LLM 分析，流式追加
data: {"type": "done"}
```

---

## 架构简述 / Architecture

```
voc-gravity/
├── backend/
│   ├── api/app.py                  # Flask 入口
│   └── core/
│       ├── retrieval.py            # FAISS 向量检索
│       ├── semantic.py             # DeepSeek 语义关系分析
│       ├── token_stats.py          # Token 用量追踪
│       ├── validate.py             # 新词验证
│       └── batch_generate_all.py   # 批量词汇生成脚本 ← 核心工具
└── frontend/src/
    ├── components/                 # React 组件
    └── utils/
        ├── layout.ts               # D3 力导向布局（四层同心圆）
        └── theme.ts                # 莫兰迪配色
```

**核心设计**：
- 气泡分四层：center(1) · inner(7) · middle(16) · outer(32)，相似度决定大小
- 快速模式与 AI 模式分离，通过 `include_analysis` 参数控制 LLM 调用
- FAISS 索引首次启动时自动构建；切换 embedding 模型需删除并重建索引

---

## 生产部署 / Production

```bash
# 构建前端
cd frontend && npm run build

# 启动后端
source venv/bin/activate
gunicorn -w 2 -b 0.0.0.0:8000 "backend.api.app:app"
```

Nginx 关键配置：

```nginx
location / { try_files $uri $uri/ /index.html; }
location /api/ { proxy_pass http://127.0.0.1:8000; }
# ielts_complete.json ≈ 4.6MB，建议开启 gzip
gzip on; gzip_types application/json;
```

---

## License

MIT © [WenXiaoWendy](https://github.com/WenXiaoWendy)

---

*如果这个工具对你有帮助，欢迎 Star ⭐ 或通过页面右上角 ☕ 请我喝杯咖啡。*
