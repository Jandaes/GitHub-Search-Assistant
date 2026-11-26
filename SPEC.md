# GitHub 搜索助手 — 内部实现规范 (SPEC)

本文件定义数据模型与查询构建语义，供 `src/qualifiers.js`（数据）与
`src/query-builder.js`（逻辑）共同遵守。所有源文件为 ESM，`build.mjs` 会把它们
按顺序拼接进单个油猴脚本（剥离 `import`/`export` 关键字）。

## 1. 搜索类型 (SEARCH_TYPES)

`src/qualifiers.js` 导出 `SEARCH_TYPES`，是一个数组，每项：

```js
{
  id: 'repositories',        // 用于 URL 的 ?type=repositories
  label: '仓库',             // Tab 显示名
  icon: 'repo',              // 图标 key（见 ui 的 ICONS）
  docs: 'https://...',       // 官方文档链接
  baseUrl: 'https://github.com/search', // 可选，gists 用 gist.github.com/search
  keywordLabel: '关键词',     // 可选，关键词输入框占位说明
  hint: '字符串提示',         // 可选，底部说明
  sort: {                    // 可选，排序（走 URL 参数，不进 q）
    param: 's',              // 参数名
    orderParam: 'o',         // 排序方向参数名
    options: [
      { value: '', label: '最佳匹配' },                       // value 为空表示不加参数
      { value: 'stars', label: 'Star 最多', order: 'desc' },
      { value: 'updated', label: '最近更新', order: 'desc' },
    ],
  },
  groups: [ Group, ... ],
}
```

## 2. 分组 (Group)

```js
{
  id: 'scope',            // 组唯一 id
  title: '搜索范围',
  desc: '可选说明',        // 可选
  open: true,             // 默认是否展开（默认 false）
  items: [ Item, ... ],
}
```

## 3. 字段 (Item)

`item.key` 在整个搜索类型内必须唯一（用作 state 键）。

```js
{
  key: 'stars',
  label: 'Star 数',
  kind: 'text' | 'select' | 'combo' | 'multiCsv' | 'multiRepeat'
      | 'number' | 'date' | 'toggle',
  qualifier: 'stars',     // 生成的限定符名，如 stars -> "stars:>100"
  options: [{ value, label }], // select / multiCsv / multiRepeat / combo(datalist) 用
  placeholder: '...',
  help: '...',            // 可选说明
  allowNegate: false,     // 是否显示“排除”开关（true 时前缀 - 或 NOT）
  // number / date:
  opDefault: '>',         // '>','>=','<','<=','=','range'
  unit: '',               // 仅展示用，如 'KB'
  // toggle:
  value: 'true',          // 打开时输出 `${qualifier}:${value}`；如 is:public => qualifier:'is', value:'public'
}
```

### kind 渲染规则（由 buildQuery 实现）

- `text`：值 v → `qualifier:quote(v)`（含空格自动加引号）。若 `qualifier` 为空则输出裸词 `quote(v)`。
- `select`：选中 option.value → `qualifier:value`（value 原样，不加引号）。
- `combo`：同 text，但 UI 提供 datalist 建议；仍输出 `qualifier:quote(v)`。
- `multiCsv`：选中多个值 → `qualifier:v1,v2`（逗号合并成一个限定符）。
- `multiRepeat`：多个值 → 每个各输出一个 `qualifier:quote(v)`，空格连接。
- `number`：`op` + 一个或两个数字 → `qualifier:opN` / `qualifier:a..b`（range）。`=` 不输出操作符，例如 `stars:500`。
- `date`：同 number，值为 `YYYY-MM-DD`。
- `toggle`：开启时输出 `qualifier:value`；关闭不输出。

### 引号规则 quote(v)

- 去首尾空白；空串返回空。
- 已是 `"..."`（完全匹配）或 `/.../`（正则）→ 原样返回。
- 含空格或双引号 → `"..."`，内部 `"` 转义为 `\"`。
- 否则原样。

### 排除 (negate)

- `state.negated[key] === true` 时：非代码搜索前缀 `-`（如 `-language:go`）；代码搜索（id==='code'）用 `NOT ` 前缀。
- multiRepeat 被排除时对每个 term 分别加前缀。

## 4. State

```js
{
  keywords: {
    rows: [ { connector: 'AND'|'OR'|'NOT'|'', value: string,
              mode: 'normal'|'exact'|'regex' } , ... ],
  },
  quals: { [itemKey]: value },   // value 形状随 kind：字符串 / 数组 / {op,v1,v2}
  negated: { [itemKey]: true },
  sort: '',                      // 选中 sort option.value
  extra: '',                     // 追加到查询末尾的原始文本
}
```

- 第一个**实际输出**的 keyword token 的 connector 被忽略（空行会被跳过，不计入“第一行”）；后续输出 token 的连接符默认 `'AND'`。
- keyword 每行按 mode 输出：normal→quote(v)；exact→`"..."`（内部 `"`→`\"`，`\`→`\\`）；regex→`/v/`（内部 `/`→`\/`）。

## 5. buildQuery(typeDef, state) -> string

按顺序拼接：keyword 表达式 → 各 group 内 item 的 term（按数据顺序）→ extra。
用空格连接，压缩连续空白，去首尾。空结果返回 ''。

## 6. buildSearchUrl(typeDef, query, sortValue) -> string

- base = typeDef.baseUrl || 'https://github.com/search'
- gists（baseUrl 含 gist.github.com）只加 `?q=`。
- 否则 `?q=<enc>&type=<id>`；若 sort 命中且 option.value 非空，追加
  `&<param>=<value>` 与（若有 order）`&<orderParam>=<order>`。

## 7. 测试要求

`test/query-builder.test.mjs` 用 `node:test` 独立验证 buildQuery / buildSearchUrl：
引号、正则、精确匹配、各类 kind、range、否定、布尔关键词、排序 URL、空值忽略。
