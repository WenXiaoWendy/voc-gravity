# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VOC Gravity** is an AI-powered IELTS vocabulary exploration system that visualizes word relationships as force-directed bubble graphs. Users search for a word and see semantically related words arranged in layers by similarity, colored by relationship type or part-of-speech.

## Commands

### One-command startup
```bash
./start.sh   # Sets up venv, installs deps, starts both backend (8000) and frontend (3000)
```

### Frontend (from `frontend/`)
```bash
npm run dev          # Dev server on localhost:3000 (hot reload)
npm run build        # TypeScript compile + Vite bundle
npm run lint         # ESLint (0 warnings tolerance)
npm run start:dev    # Start both backend API + frontend dev server concurrently
npm run api          # Start only the backend Python server
```

### Backend
```bash
source venv/bin/activate
cd backend/api && python app.py   # Flask on localhost:8000
```

### Checking token costs
```bash
curl http://localhost:8000/api/token-stats
curl "http://localhost:8000/api/token-stats?date=2026-03-02"
```

## Architecture

### Frontend (React + TypeScript + Vite)

**State and rendering:** `VocabularyGravityScreen.tsx` is the central state container. It manages word search, API calls, bubble cache, and coordinates child components.

**Bubble layout:** `utils/layout.ts` runs a D3 force simulation (`d3-force`) to arrange bubbles in concentric layers: center (1) → inner (7) → middle (16) → outer (32). Bubble size scales with similarity score.

**Two modes:**
- **Fast Mode**: Bubbles colored by POS (part-of-speech), no LLM call
- **AI Deep Analysis Mode**: Sends `include_analysis: true` to backend, which calls DeepSeek LLM to categorize relationships into 9 semantic types (synonym, antonym, hypernym, hyponym, cohyponym, collocation, frame, register, noise)

**Caching:** `bubbleCache` (useRef) stores API results keyed by word, preventing redundant calls.

**Theme:** Morandi palette (muted/low-saturation). Color mapping lives in `utils/theme.ts` (relationship types) and inline in components (POS types).

**Vite proxy:** All `/api/*` requests proxy to `http://localhost:8000`.

### Backend (Flask + FAISS + LangChain)

**Vector search** (`core/mem.py`): FAISS index built from `backend/data/ielts.json` using OpenAI `text-embedding-3-large`. Indices stored in `backend/faiss_index/ielts/`. Rebuilt automatically on first run if missing. **Important:** Changing the embedding model requires deleting and rebuilding the index.

**Semantic analysis** (`core/open.py`): DeepSeek Chat API categorizes FAISS neighbors into the 9 relationship types with explanations. Results returned as structured JSON.

**Token tracking** (`core/token_stats.py`): Wraps all LLM calls, persists usage to `backend/data/token_stats.json`. Billing rates: cached input 0.2元/M, uncached input 2.0元/M, output 3.0元/M.

**Vocabulary generation** (`core/generate_vocabulary.py`, `batch_generate_all.py`): Enriches the basic `ielts.json` with LLM-generated data (pronunciations, examples, collocations, derivatives). Progress tracked in `batch_progress.json`. Output goes to `backend/data/ielts_complete.json` and is copied to `frontend/src/data/ielts_complete.json`.

### API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health check |
| POST | `/api/retrieve` | FAISS search + optional LLM analysis |
| POST | `/api/analyze_neighborhood` | Detailed semantic analysis only |
| GET | `/api/token-stats` | Token usage and cost statistics |
| POST | `/api/generate-vocabulary` | Trigger batch vocabulary enrichment |

### Key Data Files

| File | Purpose |
|------|---------|
| `backend/data/ielts.json` | Source vocabulary (seeds FAISS index) |
| `backend/data/ielts_complete.json` | LLM-enriched vocabulary data |
| `frontend/src/data/ielts_complete.json` | Frontend copy of enriched data |
| `backend/data/token_stats.json` | Auto-persisted token/cost stats |
| `backend/data/batch_progress.json` | Vocabulary generation progress |
| `backend/faiss_index/ielts/` | Binary FAISS vector index |

### Environment Variables

```
OPENAI_API_KEY     # Required for FAISS embeddings (text-embedding-3-large)
DEEPSEEK_API_KEY   # Required for semantic analysis and vocabulary generation
```

## TypeScript Key Types

Core interfaces in `frontend/src/types/bubble.ts`:
- `BubbleItem` — extends `WordEntry` with `layer`, `score`, `relation_type`, `reason`
- `CompleteWordData` — full enriched vocabulary entry shown in hover cards and bottom sheet

## 项目追踪

功能路线图记录在 `ROADMAP.md`（已加入 .gitignore，仅本地可见，不随开源代码发布）。
**注意：CLAUDE.md 本身不在 .gitignore，会随开源代码一起发布。**

### 何时读取 ROADMAP.md

以下场景**必须先读取 ROADMAP.md**：
- 用户说"干活"/"做下一个"/"继续"/"下一项"等，读 ROADMAP.md 确认当前最高优先级未完成项
- 用户问"现在做到哪了"/"还有什么没做"/"进度怎样"，读 ROADMAP.md 给出状态汇报
- 用户提到某个功能名称但没说具体要求，读 ROADMAP.md 获取该功能的实现方向和关键文件
- 用户想详细讨论某个已规划功能，讨论结束后若有补充或调整，更新 ROADMAP.md 对应条目

### 处理开发中途插入的新需求

用户随时可能在开发进行中提出新需求。收到新需求时，**不要直接开始执行**，先完成以下评估：

1. **评估优先级**：参照 P0-P4 体系判断新需求的紧迫程度
2. **评估复杂度**：小（<1小时）/ 中（半天）/ 大（多天）
3. **决策**：
   - **立即切换**：新需求是 P0 级（上线阻断）；或当前任务可在 5 分钟内收尾，切换成本低
   - **加入排期**：新需求是 P1-P4，加入 ROADMAP.md 合适优先级位置，告知用户已排期
4. 无论哪种决策，**明确告知用户判断依据**，例如："这个需求评估为 P1 / 中等复杂度，建议当前任务完成后进行，已加入 ROADMAP P1 区域"

### 完成功能后

将 ROADMAP.md 对应条目从 `- [ ]` 改为 `- [x]`，并更新末尾的"最后更新"日期。

### 语言

**思考链（reasoning）和所有回复统一使用中文。**
