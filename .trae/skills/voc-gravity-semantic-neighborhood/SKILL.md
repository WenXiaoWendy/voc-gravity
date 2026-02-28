---
name: voc-gravity-semantic-neighborhood
description: "当用户提出任何与 Voc Gravity 项目相关的开发/改动请求时触发，包括但不限于：
词库导入/词库接口设计、雅思词库初始化与离线 embedding 管线
FAISS 本地向量索引构建、TopK 召回与可配置“引力半径”
LLM 结构化生成（关系类型/易混辨析/知识点/例句）与 schema 约束
中心词切换、重叠邻域缓存复用、成本分层策略
React/TS/Vite/Tailwind 前端三层气泡视图与交互闭环
触发原则：只要需求涉及“语义邻域检索 + 结构化关系生成 + 连续探索体验”的任何一环，就应调用本技能。"
---

## 1. Project Identity

**Project Name**: Voc Gravity (Vocabulary Gravity)  
**Type**: Vocabulary learning tool powered by *semantic neighborhood exploration* (not a generic chatbot).  
**Core Idea**: Model vocabulary as an explorable semantic neighborhood. A query word becomes the **center node**; the system retrieves TopK semantic neighbors and uses an LLM to generate **structured relationships, distinctions, knowledge points, and examples**, supporting continuous exploration via center switching.

---

## 2. Primary Goals (What “Done” Looks Like)

### G1 — Reliable semantic neighbor retrieval
- User searches a word → system returns **TopK neighbors** (configurable K).
- Retrieval is **fast, repeatable**, and behaves consistently across sessions.

### G2 — Structured explanation generation (controlled, not freeform)
- For the center word and TopK candidates, LLM produces **structured** output:
  - relation types (near-synonym / contrast / confusable / topic cluster / usage…)
  - key differences / usage notes
  - example(s) and contrast example(s) when applicable
- Output must be **schema-driven** and **cacheable**.

### G3 — Continuous exploration experience
- UI displays center + 3 layers of neighbors (functional first).
- Clicking a neighbor makes it the new center:
  - triggers retrieval + generation
  - **reuses cached overlapping results** when possible

### G4 — Cost-aware architecture
- **Offline**: expensive once (embedding/index build)
- **Online**: cheap and repeatable (low-cost LLM + caching)

---

## 3. Non-Goals (Important Boundaries)

- Not building a general-purpose RAG QA chatbot.
- Not implementing graph edges/lines or physics-based packing layout in v1.
- Not building multi-tenant auth, payments, or complex user accounts in v1.
- Not solving full polysemy disambiguation via user selection in v1.
- Not aiming for perfect linguistic truth; aim for **useful, stable learning affordances**.

---

## 4. Architecture Overview

### 4.1 Offline layer (Index Build)
- Input: official/authorized wordlist(s). v1 uses **IELTS wordlist**.
- Process: batch embedding → FAISS index build → persist locally.
- Output: `faiss.index` + metadata store (word entries, ids, optional fields).

### 4.2 Online layer (Query + Generate)
1) **Query embedding**
2) **FAISS TopK retrieval** (K configurable)
3) **Prompt assembly** with retrieved candidates
4) **LLM structured generation** (relationship + knowledge + examples)
5) **Cache** results (word-level + overlap reuse)
6) Return to UI

---

## 5. Tech Stack

### Frontend
- React + TypeScript + Vite + Tailwind
- UI v1: stable aligned 3-layer bubble view (no force layout)
- State: simple, predictable; optimize for snappy interactions

### Backend / Pipeline
- Python
- FAISS (local vector index)
- LangChain (optional; used for retrieval/QA-style orchestration where helpful)
- HuggingFace / SentenceTransformer (dev embedding to reduce cost)

### Model Strategy
- **Dev**: SentenceTransformer for embeddings (cheaper, local)
- **Prod**: OpenAI embedding model (high quality, **3072 dims**)
- Online generation: low-cost LLM (schema-driven), plus caching for repeated overlap

---

## 6. Data Model & Contracts

### 6.1 Word entry (minimum)
Each word record MUST have:
- `id`: stable unique id (string/int)
- `word`: surface form
- `source`: e.g., `ielts_v1`
- optional fields (future): `pos`, `brief_gloss`, `sense_id`, `tags`

### 6.2 Embedding input policy
- **MVP**: embed `word` only (simple, stable).
- **Upgrade planned**: use a fixed template for stability + interpretability:
  - `word + POS + brief_gloss`
  - default uses **primary POS + primary gloss**
  - goal: reduce polysemy drift and improve neighbor quality

### 6.3 Retrieval result contract
- Input: `center_word_id`, `topK`
- Output:
  - `center`: word entry
  - `neighbors`: list of `{id, word, score}` sorted by score desc

### 6.4 LLM output schema (must be structured)
LLM MUST output JSON matching a stable schema, e.g.:

```json
{
  "center": { "word": "abandon", "pos": "v" },
  "neighbors": [
    {
      "word": "desert",
      "relation_type": "confusable",
      "why": "Both mean 'leave', but 'desert' implies leaving a duty/person.",
      "usage_notes": ["desert + person/place", "abandon + plan/idea"],
      "example": "He abandoned the project after two weeks.",
      "contrast_example": "The soldier deserted his unit.",
      "tags": ["ielts", "usage"]
    }
  ]
}
````md
# skill.md — Voc Gravity (Vocabulary Gravity) Project Skill

> 목적: Coding AI(예: Claude Code/各类 coding agent)가 **Voc Gravity** 프로젝트의 목표/범위/约束/技术方案/接口契约을 빠르게 이해하고, 일관된 구현 결정을 내리도록 하는 작업용 Skill 문서.

---

## 1. Project Identity

**Project Name**: Voc Gravity (Vocabulary Gravity)  
**Type**: Vocabulary learning tool powered by *semantic neighborhood exploration* (not a generic chatbot).  
**Core Idea**: Model vocabulary as an explorable semantic neighborhood. A query word becomes the **center node**; the system retrieves TopK semantic neighbors and uses an LLM to generate **structured relationships, distinctions, knowledge points, and examples**, supporting continuous exploration via center switching.

---

## 2. Primary Goals (What “Done” Looks Like)

### G1 — Reliable semantic neighbor retrieval
- User searches a word → system returns **TopK neighbors** (configurable K).
- Retrieval is **fast, repeatable**, and behaves consistently across sessions.

### G2 — Structured explanation generation (controlled, not freeform)
- For the center word and TopK candidates, LLM produces **structured** output:
  - relation types (near-synonym / contrast / confusable / topic cluster / usage…)
  - key differences / usage notes
  - example(s) and contrast example(s) when applicable
- Output must be **schema-driven** and **cacheable**.

### G3 — Continuous exploration experience
- UI displays center + 3 layers of neighbors (functional first).
- Clicking a neighbor makes it the new center:
  - triggers retrieval + generation
  - **reuses cached overlapping results** when possible

### G4 — Cost-aware architecture
- **Offline**: expensive once (embedding/index build)
- **Online**: cheap and repeatable (low-cost LLM + caching)

---

## 3. Non-Goals (Important Boundaries)

- Not building a general-purpose RAG QA chatbot.
- Not implementing graph edges/lines or physics-based packing layout in v1.
- Not building multi-tenant auth, payments, or complex user accounts in v1.
- Not solving full polysemy disambiguation via user selection in v1.
- Not aiming for perfect linguistic truth; aim for **useful, stable learning affordances**.

---

## 4. Architecture Overview

### 4.1 Offline layer (Index Build)
- Input: official/authorized wordlist(s). v1 uses **IELTS wordlist**.
- Process: batch embedding → FAISS index build → persist locally.
- Output: `faiss.index` + metadata store (word entries, ids, optional fields).

### 4.2 Online layer (Query + Generate)
1) **Query embedding**
2) **FAISS TopK retrieval** (K configurable)
3) **Prompt assembly** with retrieved candidates
4) **LLM structured generation** (relationship + knowledge + examples)
5) **Cache** results (word-level + overlap reuse)
6) Return to UI

---

## 5. Tech Stack

### Frontend
- React + TypeScript + Vite + Tailwind
- UI v1: stable aligned 3-layer bubble view (no force layout)
- State: simple, predictable; optimize for snappy interactions

### Backend / Pipeline
- Python
- FAISS (local vector index)
- LangChain (optional; used for retrieval/QA-style orchestration where helpful)
- HuggingFace / SentenceTransformer (dev embedding to reduce cost)

### Model Strategy
- **Dev**: SentenceTransformer for embeddings (cheaper, local)
- **Prod**: OpenAI embedding model (high quality, **3072 dims**)
- Online generation: low-cost LLM (schema-driven), plus caching for repeated overlap

---

## 6. Data Model & Contracts

### 6.1 Word entry (minimum)
Each word record MUST have:
- `id`: stable unique id (string/int)
- `word`: surface form
- `source`: e.g., `ielts_v1`
- optional fields (future): `pos`, `brief_gloss`, `sense_id`, `tags`

### 6.2 Embedding input policy
- **MVP**: embed `word` only (simple, stable).
- **Upgrade planned**: use a fixed template for stability + interpretability:
  - `word + POS + brief_gloss`
  - default uses **primary POS + primary gloss**
  - goal: reduce polysemy drift and improve neighbor quality

### 6.3 Retrieval result contract
- Input: `center_word_id`, `topK`
- Output:
  - `center`: word entry
  - `neighbors`: list of `{id, word, score}` sorted by score desc

### 6.4 LLM output schema (must be structured)
LLM MUST output JSON matching a stable schema, e.g.:

```json
{
  "center": { "word": "abandon", "pos": "v" },
  "neighbors": [
    {
      "word": "desert",
      "relation_type": "confusable",
      "why": "Both mean 'leave', but 'desert' implies leaving a duty/person.",
      "usage_notes": ["desert + person/place", "abandon + plan/idea"],
      "example": "He abandoned the project after two weeks.",
      "contrast_example": "The soldier deserted his unit.",
      "tags": ["ielts", "usage"]
    }
  ]
}
````

**Rules**:

* Always valid JSON
* Short, high-signal text; avoid long essays
* Deterministic-ish: prefer templates, bullet-like arrays
* Must be cacheable: same (center, neighbors) should yield similar structure

---

## 7. Caching & Reuse Strategy (Key Product Advantage)

### 7.1 What to cache

* Word-level generated knowledge:

  * `word -> {knowledge_points, examples, usage_notes}`
* Pair-level relationship:

  * `(center, neighbor) -> {relation_type, why, contrast}`

### 7.2 When to reuse

* On center switching:

  * compute overlap between old and new neighbor set
  * reuse cached content for overlapping nodes/edges
  * only generate missing parts

### 7.3 Cache invalidation

* Cache keys must incorporate:

  * model version (embedding/gen)
  * wordlist version
  * schema version
* If any version changes → invalidate relevant caches

---

## 8. UI Specification (v1)

### Layout

* No edges/lines.
* Three layers max (inner/middle/outer).
* **Stable aligned layout** (grid-like or concentric placement) to maximize usability and implementation speed.

### Interaction

* Search input → set center
* Click bubble → switch center
* Loading states must be clear but non-blocking
* Preserve previously generated content if overlap exists (per caching strategy)

### Display contents

* Each bubble: word + optionally small tag (e.g., relation type)
* Detail panel for selected neighbor:

  * relation, key differences, examples

---

## 9. Implementation Priorities (Order Matters)

1. Wordlist ingestion + metadata schema
2. Offline embedding + FAISS index persistence
3. Online query path: embed query → retrieve TopK
4. LLM structured generation (schema + prompt templates)
5. Caching (word-level + pair-level) + overlap reuse
6. Frontend UI v1 (3-layer aligned bubbles + detail panel)
7. Performance & cost tuning (batch, warmup, caching hit rates)

---

## 10. Quality Bar & Acceptance Criteria

### Retrieval

* TopK returns within reasonable time locally
* Deterministic ordering given same model/index

### Generation

* Always produces valid JSON in schema
* Outputs are short, useful, and consistent

### UX

* Center switching feels responsive
* Overlap reuse demonstrably reduces repeated generation calls

### Cost

* Offline embedding cost is one-time
* Online generation cost reduced via caching

---

## 11. Notes for Coding AI (How to Work on This Repo)

* Treat this as a **product system**, not a demo.
* Do not add new “fancy” features (graph edges, physics packing) unless explicitly requested.
* Prefer simplicity + determinism:

  * schema-first outputs
  * explicit versioning
  * explicit config for TopK and model selection
* Always keep “dev vs prod” model strategy separable via config:

  * dev: SentenceTransformer embeddings
  * prod: OpenAI embeddings (3072-d)
* Prioritize correctness, reproducibility, and controllable outputs over aesthetic perfection.