# GitHub 搜索助手 · 可视化高级搜索（油猴脚本）

点击 GitHub 官方搜索框，弹出可视化面板：先选「搜索类型」（仓库 / 代码 / Issues / PR / 用户 / 提交 / 讨论 / 话题 …），再勾选想要的规则（语言、Star 数、创建时间、标签、作者…），**你只需要输入要搜的内容**，脚本自动拼出符合 GitHub 官方语法的查询并跳转到结果页。

> 语法依据：[GitHub 代码搜索语法](https://docs.github.com/zh/search-github/github-code-search/understanding-github-code-search-syntax) · [了解搜索语法](https://docs.github.com/zh/search-github/getting-started-with-searching-on-github/understanding-the-search-syntax) · 各类型搜索（仓库/Issues/用户/提交…）官方文档。

---

## ✨ 功能特性

- **可视化规则面板**：无需记忆 `stars:>1000`、`language:python`、`in:readme` 等语法，点选即可。
- **覆盖 11 种搜索类型**：仓库、代码、Issues、Pull requests、讨论、用户、提交、话题、Marketplace、Wiki、Gist。
- **实时查询预览**：底部实时显示最终 GitHub 查询语句，支持一键复制、手改微调。
- **智能引号 / 正则 / 精确匹配**：含空格的词自动加引号；关键词可切换「普通 / 精确 `"…"` / 正则 `/…/`」。
- **布尔组合**：「添加关键词」可组合 `AND / OR / NOT`。
- **规则排除**：多数限定符可一键「排除」（`-qualifier`，代码搜索为 `NOT`）。
- **深色 / 浅色自适应**：跟随 GitHub 主题。
- **不侵入页面**：全部 UI 在 Shadow DOM 内，样式与 GitHub 隔离；仅在站点头部搜索框生效。
- **快捷入口**：点击头部搜索框、按 `/` 键，或右下角悬浮按钮均可打开。

## 📦 安装

1. 浏览器安装 **Tampermonkey**（油猴）扩展（Chrome / Edge / Firefox / Safari 均可）。
2. 打开 Tampermonkey 管理面板 →「实用工具 / Utilities」→ 导入，或直接把 `github-search-assistant.user.js` 拖入浏览器。
   - 也可点击「添加新脚本」，把 `github-search-assistant.user.js` 的全部内容粘贴进去保存。
3. 打开任意 `https://github.com/` 页面，右下角会出现蓝色搜索悬浮按钮即安装成功。

## 🚀 使用

1. 在 GitHub 页面**点击顶部搜索框**（或按 `/`、点右下角悬浮按钮）。
2. 顶部选择搜索类型，例如「仓库」。
3. 在「关键词 / 搜索内容」输入你要搜的词，例如 `machine learning`。
4. 按需展开下方分组勾选规则，例如：
   - 仓库：`语言=Python`、`Star 数 > 1000`、`创建时间 >= 2020-01-01`。
5. 底部会实时显示查询，例如：
   ```
   "machine learning" stars:>1000 language:Python created:>=2020-01-01
   ```
6. 点「搜索」跳转到 GitHub 结果页；或点「手改」直接编辑语句、点复制按钮复制查询。

### 各类型示例

| 场景 | 选择类型 | 面板操作 | 生成的查询 |
| --- | --- | --- | --- |
| 找 Star 多的 Python ML 仓库 | 仓库 | 关键词 `machine learning`，语言 Python，Star > 1000 | `"machine learning" stars:>1000 language:Python` |
| 在 React 仓库里搜 hook 代码 | 代码 | 关键词 `useEffect`，repo `facebook/react`，语言 JavaScript | `useEffect repo:facebook/react language:JavaScript` |
| 找某开源项目里带 good first issue 的未关闭 issue | Issues | 关键词，状态 open，标签 `good first issue` | `state:open label:"good first issue"` |
| 找我参与过的、涉及某人的 PR | Pull requests | 类型 is:pr，involves `@me` | `is:pr involves:@me` |
| 找关注者超过 500 的开发者 | 用户 | 关键词，粉丝 > 500 | `... followers:>500` |
| 搜某个仓库的提交记录 | 提交 | 关键词，repo `owner/name`，作者 `octocat` | `fix bug repo:owner/name author:octocat` |
| 搜 Gist | Gist | 关键词 | 跳转 `gist.github.com/search?q=...` |

### 快捷操作

| 操作 | 说明 |
| --- | --- |
| 点击顶部搜索框 / 按 `/` | 打开面板 |
| `Esc` | 关闭面板 |
| `Enter`（在关键词框内） | 直接搜索 |
| 「添加关键词」 | 增加一行关键词，并用 `AND/OR/NOT` 连接 |
| 关键词右侧 `普通/精确/正则` | 切换该行关键词的匹配方式 |
| 每条规则右侧「排除」 | 生成 `-规则`（代码搜索为 `NOT 规则`） |
| 底部「手改」 | 直接编辑最终查询语句 |
| 底部复制图标 | 复制查询语句 |

## 🖼️ 本地预览（无需安装）

直接用浏览器打开 `demo/index.html`（内含一个仿 GitHub 头部），点击其中的搜索框即可体验面板效果。

## 🛠️ 开发

源码是模块化的 ESM，`build.mjs` 会把它们拼接成单个油猴脚本（剥离 `import`/`export`）：

```
src/
  styles.js         # Shadow DOM 内的 CSS（浅色/深色变量）
  qualifiers.js     # 各搜索类型 / 规则的数据定义（schema 见 SPEC.md）
  query-builder.js  # 纯函数：state -> GitHub 查询语句 / URL（可单测）
  ui.js             # Shadow DOM 界面、交互、实时预览
  main.js           # 启动：拦截搜索框、/ 快捷键、悬浮按钮
SPEC.md             # 数据 schema + 查询构建语义
build.mjs           # 构建脚本
test/               # node:test 单元测试 + jsdom DOM 冒烟测试
```

常用命令：

```bash
npm install          # 安装开发依赖（jsdom，用于 DOM 冒烟测试）
npm run build        # 生成 github-search-assistant.user.js 与 dist/ 版本
npm run test:core    # 查询引擎单元测试
npm test             # 单元测试 + 对抗测试 + DOM 冒烟测试（当前 62 项全绿）
node --check github-search-assistant.user.js  # 语法检查
```

## 📂 目录

```
github-search-assistant.user.js   # ★ 最终油猴脚本（安装这个）
dist/github-search-assistant.user.js
src/ …                            # 源码
demo/index.html                   # 本地预览
docs/                             # 说明与评审记录
```

## ⚠️ 说明与限制

- 部分搜索（尤其**代码搜索**）需要登录 GitHub 才能返回结果，这是 GitHub 的权限限制。
- 限定符取值（如用户名、组织名、语言、许可证）是按官方语法拼接的字符串，是否命中取决于 GitHub 的实际索引。
- 脚本只拦截**站点头部**的搜索框，`/search` 结果页里的输入框仍保持原生行为，方便继续编辑。
- 若 GitHub 改版导致头部搜索框选择器失效，可改 `src/main.js` 的 `SEARCH_SELECTORS` 后重新 `npm run build`；此时右下角悬浮按钮始终可用。

## 📄 License

MIT

作者：janda
