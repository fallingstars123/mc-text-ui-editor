# Minecraft Text UI Editor

一个面向 Minecraft `title / actionbar / titleraw` 文本菜单预览的静态网页工具。

## 在线体验

- GitHub Pages：[在线打开编辑器](https://fallingstars123.github.io/mc-text-ui-editor/)
- 本地打开：[index.html](./index.html)

它现在更偏向“可视化预览器”而不是完整导出器，适合快速试做：
- 多行 `actionbar` / 菜单样式预览
- `§` 颜色码预览
- 特殊字符面板插入
- `glyph_E0.png` / `glyph_E1.png` 图标裁切渲染
- 帧滑块与播放预览

## 快速使用

### 方式 1：本地直接打开
1. 下载或克隆仓库
2. 直接打开 [index.html](./index.html)

如果你是在本地文件夹里看这个 README，点上面的 `index.html` 就能直接进页面。

### 方式 2：发布到 GitHub Pages
如果你希望“README 点一下就能用”，最稳妥的方式是启用 GitHub Pages。

步骤：
1. 把仓库推到 GitHub
2. 进入 `Settings -> Pages`
3. `Build and deployment` 选择 `Deploy from a branch`
4. Branch 选择 `main`，文件夹选择 `/ (root)`
5. 保存并等待 Pages 地址生成

## 当前仓库结构

```text
mc-text-ui-editor/
├─ assets/
│  ├─ font/
│  │  ├─ glyph_E0.png
│  │  └─ glyph_E1.png
│  └─ fonts/
│     └─ unifont.ttf
├─ index.html
├─ script.js
├─ README.md
└─ LICENSE
```

## 当前功能

- 文本输入区
- 帧滑块
- 播放 / 暂停 / 循环
- 类 Minecraft 菜单式预览
- 特殊字符插入面板
- 本地 `glyph_E0.png` / `glyph_E1.png` 图标渲染
- 中文与特殊图标混排预览

## 注意事项

- GitHub 仓库页面里直接点 `index.html`，通常只会打开源码页，不会像网页那样运行。
- 要想“README 点一下直接用”，请启用 GitHub Pages。
- 当前项目是纯静态网页，不需要安装依赖，也不需要构建。
- 如果你替换了 `assets/font/glyph_E0.png` 或 `assets/font/glyph_E1.png`，刷新页面后就会使用新的图标资源。

## 后续可扩展方向

- `titleraw rawtext` JSON 解析
- 菜单布局模板
- 命令导出
- 更精细的 Minecraft 字距模拟
- 更多 glyph 图集支持

## License

本仓库使用 [LICENSE](./LICENSE) 中声明的许可证。
