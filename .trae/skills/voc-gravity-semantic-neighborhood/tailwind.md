name: tailwind layout abstraction rules
description: 当你在写/改 React + Tailwind 的 UI（尤其是顶栏、导航、表单控件、卡片等）时，如果出现以下任意情况，就必须调用本 skill 来决定“直接写 Tailwind 还是封装抽象”，并按规则重构代码：
* 发现 Tailwind class 变得很长（utility ≥ 12 或明显影响可读性），或同一串 class 在多个地方复制粘贴
* 组件存在多种变体（size / intent / tone）或多种交互状态（hover / focus / disabled / selected / loading）需要统一
* 布局对齐要求严格（例如：左右贴边、搜索框必须以屏幕中心对齐、宽屏不留空、小屏不挤爆）
* 需要避免 DOM 节点频繁挂载/卸载（显示隐藏优先切 class/hidden，而不是条件渲染）
* UI 需要长期维护或准备沉淀为组件库/规范（希望把样式收敛到 ui/ 组件、@apply、或 cva 变体体系）
调用后应输出：推荐的抽象层级（直写/L0/L1/@apply/cva）、具体重构方案（含可用代码），并说明为何这样选（聚焦复用、可维护、布局稳定性）。

---

# Tailwind 使用 vs 封装：场景选择与抽象规则

## 目标

* **效率**：写得快、改得快
* **一致性**：同类控件长得一致
* **可维护**：避免 class 复制粘贴爆炸
* **可扩展**：支持主题/尺寸/状态/变体

---

## 决策总则

* **一次性 UI / 只出现 1 次**：直接 Tailwind class 写在 JSX 里。
* **重复出现（≥2 次）或会扩展**：必须抽象（组件/样式 token）。
* **有变体（size/intent/state）**：用“变体体系”（cva / tailwind-variants）管理。
* **跨团队/跨项目复用**：做成独立 UI 组件层（语义化 API + token）。

---

## 直接使用 Tailwind 的适用场景

适合：

1. **一次性页面模块**：只在某个页面出现，未来不会复用。
2. **探索/原型阶段**：快速试布局、颜色、间距。
3. **非常轻量的结构**：≤ 8~10 个 utility，且不涉及复杂状态。
4. **纯容器类布局**：`flex/grid/gap/padding/margin` 这种“非控件样式”。

不适合（出现就该考虑抽象）：

* 你发现自己在复制同一串 class
* 涉及交互状态：hover/focus/disabled/invalid/loading
* 出现“可配置”的需求：尺寸、主题、密度、圆角、边框风格
* 需要无障碍一致性：aria、focus ring、tabIndex 规则等

---

## 必须封装的触发条件（硬阈值）

满足任意一条就封装：

1. **重复≥2**：同样的 class 在不同文件出现两次以上。
2. **class 长度≥120 字符** 或 **utility≥12 个**：可读性开始恶化。
3. **存在变体**：至少出现一种变体维度（size/intent/tone）。
4. **存在状态复杂度**：focus/hover/active/disabled/error/selected ≥ 2 种。
5. **可访问性要求**：需要统一 focus ring、键盘可达、aria 语义。
6. **设计规范要求一致**：按钮/输入框/卡片/弹窗等基础控件。

---

## 抽象层级（从轻到重）

### L0：局部常量（最轻）

同文件内复用一串 class：

* `const selectCls = "..."`

使用条件：仅在一个组件文件内复用，且无变体。

### L1：小组件封装（推荐默认）

把结构 + 样式封装进组件：

* `BookSelect`, `IconButton`, `Card`, `Field`

使用条件：复用≥2 或需要统一交互/语义。

### L2：语义化 class（@apply）

在 CSS 层定义语义 class：

* `.select-base { @apply ... }`

使用条件：

* 想要减少 JSX 噪音
* 需要统一全局风格（比如 focus ring、边框、暗色主题）
* 不想引入 cva 但又要统一样式

注意：`@apply` 适合“稳定的基础样式”，不适合复杂变体组合。

### L3：变体体系（cva / tailwind-variants）

统一管理 `size/intent/state`：

* `button({ intent: "primary", size: "sm" })`

使用条件：有明确变体需求、设计体系逐步成型。

---

## 抽象规则（避免过度工程）

### 1) 只抽“稳定部分”

* **布局容器**（grid/flex/gap）通常不抽象，保持灵活。
* **基础控件**（Button/Input/Select/Modal）优先抽象。

### 2) 控件抽象必须“语义化 API”

坏：`<Button className="px-4 py-2 ..." />`（回到复制地狱）
好：`<Button intent="primary" size="md" />`

允许 `className` 作为逃生口，但要走合并：

* `className={cn(base, className)}`

### 3) 变体维度要少而明确

推荐维度：

* `intent`: primary / secondary / ghost / danger
* `size`: sm / md / lg
* `state`: disabled / loading / selected（通常通过 props 控制）

禁止把“颜色”当 API：`color="blue"` 这种会破坏规范。

### 4) 状态与可访问性统一下沉

Button/Input 这种控件必须统一处理：

* focus ring（键盘可见）
* disabled 样式与 `disabled` 属性一致
* aria 属性（如 `aria-invalid`）

### 5) 输出 DOM 稳定性规则（配合你之前那条）

显示隐藏优先：

* 保持节点稳定（切换 `hidden`/class），除非“资源释放必须卸载”
* 需要卸载时必须注释说明原因

---

## 推荐的项目结构（小到中型）

```
src/
  components/
    button.tsx
    input.tsx
    select.tsx
    card.tsx
  styles/
    tokens.css        // @apply 语义类（可选）
    globals.css
```

---

## 快速决策表（照着选就行）

* 只用一次 + 简单：**直接 Tailwind**
* 用两次以上：**组件封装**
* 要统一基础风格：**@apply**
* 有多尺寸/多意图/多状态：**cva/tailwind-variants**
* 跨项目复用：**组件库 + token**

---

## 反模式（看到就改）

1. 复制粘贴同一串 class 到 3 个地方
2. 组件 API 变成 `className` 驱动（等于没封装）
3. 变体无限增长（`size=1..7`、`color=任意`）
4. 样式分散导致 focus/disabled/aria 规则不一致

---
