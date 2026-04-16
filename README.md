# 🧠 Minecraft 字符动画编辑器（Title / Actionbar）

## 1. 项目概述（Overview）

本项目旨在开发一个**专用于 Minecraft 文本动画的编辑工具**，支持对 Title / Actionbar 字符进行逐帧控制，实现类似打字机、乱码收束、扫描波动等动态效果，并可导出为游戏内可执行的命令序列。

> 将“复杂的字符动画效果”从手写命令 → 转化为“可视化编辑 + 自动生成”。

---

## 2. 核心功能（Core Features）

### 2.1 实时预览系统
- 输入文本动画描述（代码 / JSON）
- 实时显示当前帧效果
- 支持播放 / 暂停 / 拖动时间轴

---

### 2.2 字符级动画控制
每个字符可独立控制：

- 显现（逐字出现 / 淡入）
- 消散（逐字消失 / 淡出）
- 状态过渡（乱码 → 正确字符）
- 延迟（per-character delay）

---

### 2.3 动画模板系统
内置常用动画模板：

- Typewriter（打字机）
- Scramble In（乱码收束）
- Fade In / Out
- Wave（波浪）
- Pulse（呼吸）

支持参数调整（速度 / 强度 / 延迟等）

---

### 2.4 背景动效系统（轻量）
用于增强视觉效果：

- 扫描线（scanline）
- 字符流（matrix-like）
- 波动条（wave lines）
- 粒子/闪烁背景（简化版）

---

### 2.5 导出系统（核心价值）
将动画转化为 Minecraft 可用格式：

- `/title`
- `/actionbar`
- `tellraw JSON`
- datapack function（逐帧输出）

---

## 3. 技术架构（Architecture）

### 技术选型
- 前端：JavaScript / TypeScript
- 渲染：Canvas 2D
- 数据：JSON 配置驱动

---

### 系统结构
Code Input → Parser → Frame Evaluator → Glyph State → Renderer

---

### 核心模块

#### 1. Parser（解析器）
将用户输入转换为配置对象

#### 2. Evaluator（核心逻辑）
根据当前 frame 计算每个字符状态：
- 是否显示
- 当前字符（正常 / 乱码）
- 颜色 / 样式

#### 3. Renderer（渲染层）
- 将字符绘制到 Canvas
- 处理布局与视觉效果

---

## 4. 数据结构设计（Data Structure）

### 动画输入示例

```json
{
  "text": "WARNING",
  "effect": "scramble",
  "frame": 12,
  "charDelay": 2,
  "seed": 42
}
```
### 字符状态（核心中间层）
```json
{
  "glyphs": [
    {
      "index": 0,
      "targetChar": "W",
      "displayChar": "W",
      "visible": true
    },
    {
      "index": 1,
      "targetChar": "A",
      "displayChar": "8",
      "visible": true
    }
  ]
}
```
## 5. 开发阶段规划（Milestones）
🔹 Phase 1：核心引擎（MVP）

目标：实现 代码 ↔ 显示层

Canvas 字符渲染
单行文本显示
frame 控制
typewriter 动画
scramble 动画
实时预览

👉 输出：最小可运行原型

🔹 Phase 2：工具化

目标：初步编辑器功能

JSON 输入面板
播放 / 时间轴
多动画支持
参数调整
基础背景效果

👉 输出：可实际制作动画

🔹 Phase 3：系统完善

目标：提升效率与表现力

模板系统
多图层支持
洋葱皮（前后帧辅助）
随机种子控制
UI 优化
🔹 Phase 4：导出与整合

目标：对接 Minecraft

导出帧序列
自动生成命令
datapack 支持
性能优化（帧压缩）