// ===== qualifiers.js =====
// Declarative dataset describing every search type and its qualifiers.
// Schema is defined in SPEC.md. Values are rendered by query-builder.js.

export const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C', 'C++', 'C#',
  'PHP', 'Ruby', 'Swift', 'Kotlin', 'Scala', 'Shell', 'PowerShell', 'HTML', 'CSS',
  'SCSS', 'Vue', 'Dart', 'Lua', 'Perl', 'Haskell', 'Elixir', 'Erlang', 'Clojure',
  'Objective-C', 'R', 'Julia', 'Matlab', 'Groovy', 'Zig', 'Nim', 'OCaml', 'Lisp',
  'Assembly', 'Dockerfile', 'Makefile', 'Vim script', 'Jupyter Notebook', 'TeX',
];

const LICENSES = [
  { value: 'mit', label: 'MIT' },
  { value: 'apache-2.0', label: 'Apache-2.0' },
  { value: 'gpl-3.0', label: 'GPL-3.0' },
  { value: 'gpl-2.0', label: 'GPL-2.0' },
  { value: 'lgpl-3.0', label: 'LGPL-3.0' },
  { value: 'agpl-3.0', label: 'AGPL-3.0' },
  { value: 'mpl-2.0', label: 'MPL-2.0' },
  { value: 'bsd-3-clause', label: 'BSD-3-Clause' },
  { value: 'bsd-2-clause', label: 'BSD-2-Clause' },
  { value: 'isc', label: 'ISC' },
  { value: 'unlicense', label: 'Unlicense' },
  { value: 'cc0-1.0', label: 'CC0-1.0' },
  { value: 'epl-2.0', label: 'EPL-2.0' },
];

const langOptions = LANGUAGES.map((l) => ({ value: l, label: l }));

const OP_OPTIONS = [
  { value: '>', label: '大于 >' },
  { value: '>=', label: '大于等于 >=' },
  { value: '<', label: '小于 <' },
  { value: '<=', label: '小于等于 <=' },
  { value: '=', label: '精确 =' },
  { value: 'range', label: '区间 a..b' },
];

// ---------- shared block builders ----------

function ownerBlock() {
  return {
    id: 'owner',
    title: '归属范围',
    desc: '限定在某个用户 / 组织 / 仓库内搜索',
    items: [
      { key: 'user', label: '用户 user:', kind: 'text', qualifier: 'user', placeholder: '用户名，或用 @me', allowNegate: true },
      { key: 'org', label: '组织 org:', kind: 'text', qualifier: 'org', placeholder: '组织名', allowNegate: true },
      { key: 'repo', label: '仓库 repo:', kind: 'text', qualifier: 'repo', placeholder: 'owner/name', allowNegate: true },
    ],
  };
}

function languageBlock() {
  return {
    id: 'language',
    title: '语言',
    items: [
      { key: 'language', label: '语言 language:', kind: 'combo', qualifier: 'language', options: langOptions, placeholder: '如 JavaScript', allowNegate: true },
    ],
  };
}

function issueGroups() {
  return [
    {
      id: 'status',
      title: '状态与类型',
      open: true,
      items: [
        {
          key: 'state', label: '状态', kind: 'select', qualifier: 'is',
          options: [
            { value: 'open', label: '打开 open' },
            { value: 'closed', label: '关闭 closed' },
          ],
        },
        {
          key: 'kindIs', label: '类型', kind: 'select', qualifier: 'is',
          options: [
            { value: 'issue', label: '仅 Issue' },
            { value: 'pr', label: '仅 Pull Request' },
          ],
        },
        { key: 'isMerged', label: '已合并 (is:merged)', kind: 'toggle', qualifier: 'is', value: 'merged' },
        { key: 'isUnmerged', label: '未合并 (is:unmerged)', kind: 'toggle', qualifier: 'is', value: 'unmerged' },
        { key: 'isQueued', label: '合并队列 (is:queued)', kind: 'toggle', qualifier: 'is', value: 'queued' },
        { key: 'isDraft', label: '草稿 (is:draft)', kind: 'toggle', qualifier: 'is', value: 'draft' },
        { key: 'isArchived', label: '已归档 (is:archived)', kind: 'toggle', qualifier: 'is', value: 'archived' },
      ],
    },
    {
      id: 'in',
      title: '搜索位置',
      items: [
        {
          key: 'in', label: '匹配于 in:', kind: 'multiCsv', qualifier: 'in',
          options: [
            { value: 'title', label: '标题' },
            { value: 'body', label: '正文' },
            { value: 'comments', label: '评论' },
          ],
        },
      ],
    },
    ownerBlock(),
    {
      id: 'people',
      title: '相关人员',
      items: [
        { key: 'author', label: '作者 author:', kind: 'text', qualifier: 'author', placeholder: '用户名或 @me', allowNegate: true },
        { key: 'assignee', label: '受理人 assignee:', kind: 'text', qualifier: 'assignee', placeholder: '用户名或 @me', allowNegate: true },
        { key: 'mentions', label: '提及 mentions:', kind: 'text', qualifier: 'mentions', placeholder: '用户名', allowNegate: true },
        { key: 'commenter', label: '评论者 commenter:', kind: 'text', qualifier: 'commenter', placeholder: '用户名', allowNegate: true },
        { key: 'involves', label: '涉及 involves:', kind: 'text', qualifier: 'involves', placeholder: '用户名', allowNegate: true },
        { key: 'team', label: '团队 team:', kind: 'text', qualifier: 'team', placeholder: 'org/team' },
      ],
    },
    {
      id: 'meta',
      title: '标签与元数据',
      items: [
        { key: 'label', label: '标签 label:', kind: 'multiRepeat', qualifier: 'label', placeholder: '输入标签后回车', help: '回车添加下一个；多个标签为 AND 关系', allowNegate: true },
        { key: 'milestone', label: '里程碑 milestone:', kind: 'text', qualifier: 'milestone', placeholder: '里程碑名', allowNegate: true },
        { key: 'project', label: '项目 project:', kind: 'text', qualifier: 'project', placeholder: 'org/编号' },
        { key: 'linked', label: '关联 linked:', kind: 'select', qualifier: 'linked', options: [{ value: 'pr', label: 'PR' }, { value: 'issue', label: 'Issue' }] },
        {
          key: 'no', label: '缺失元数据 no:', kind: 'select', qualifier: 'no',
          options: [
            { value: 'label', label: '无标签' },
            { value: 'assignee', label: '无受理人' },
            { value: 'milestone', label: '无里程碑' },
            { value: 'project', label: '无项目' },
          ],
        },
      ],
    },
    {
      id: 'counts',
      title: '数量指标',
      items: [
        { key: 'comments', label: '评论数 comments:', kind: 'number', qualifier: 'comments', opDefault: '>' },
        { key: 'interactions', label: '交互数 interactions:', kind: 'number', qualifier: 'interactions', opDefault: '>' },
        { key: 'reactions', label: '反应数 reactions:', kind: 'number', qualifier: 'reactions', opDefault: '>' },
        { key: 'reactionsPlus1', label: '👍 reactions-+1:', kind: 'number', qualifier: 'reactions-+1', opDefault: '>' },
        { key: 'reactionsHeart', label: '❤️ reactions-heart:', kind: 'number', qualifier: 'reactions-heart', opDefault: '>' },
      ],
    },
    {
      id: 'time',
      title: '时间范围',
      desc: '日期格式 YYYY-MM-DD，支持 >、>=、<、<=、区间',
      items: [
        { key: 'created', label: '创建 created:', kind: 'date', qualifier: 'created', opDefault: '>=' },
        { key: 'updated', label: '更新 updated:', kind: 'date', qualifier: 'updated', opDefault: '>=' },
        { key: 'closedAt', label: '关闭 closed:', kind: 'date', qualifier: 'closed', opDefault: '>=' },
        { key: 'mergedAt', label: '合并 merged:', kind: 'date', qualifier: 'merged', opDefault: '>=' },
      ],
    },
    {
      id: 'review',
      title: '审查与提交状态',
      items: [
        {
          key: 'review', label: '审查结论 review:', kind: 'select', qualifier: 'review',
          options: [
            { value: 'approved', label: '通过 approved' },
            { value: 'changes_requested', label: '请求修改' },
            { value: 'required', label: '需要审查' },
          ],
        },
        { key: 'reviewedBy', label: '审查人 reviewed-by:', kind: 'text', qualifier: 'reviewed-by', placeholder: '用户名或 @me' },
        { key: 'reviewRequested', label: '待审 review-requested:', kind: 'text', qualifier: 'review-requested', placeholder: '用户名或 @me' },
        {
          key: 'status', label: '提交状态 status:', kind: 'select', qualifier: 'status',
          options: [
            { value: 'pending', label: '等待中 pending' },
            { value: 'success', label: '成功 success' },
            { value: 'failure', label: '失败 failure' },
          ],
        },
        { key: 'head', label: '源分支 head:', kind: 'text', qualifier: 'head', placeholder: '分支名' },
        { key: 'base', label: '目标分支 base:', kind: 'text', qualifier: 'base', placeholder: '分支名' },
      ],
    },
  ];
}

// ---------- SEARCH_TYPES ----------

export const SEARCH_TYPES = [
  {
    id: 'repositories',
    label: '仓库',
    icon: 'repo',
    docs: 'https://docs.github.com/zh/search-github/searching-on-github/searching-for-repositories',
    keywordLabel: '搜索仓库名称 / 描述 / README…',
    hint: '默认搜索仓库名称、描述与主题；使用 in: 可扩展到 README。',
    sort: {
      param: 's',
      orderParam: 'o',
      options: [
        { value: '', label: '最佳匹配' },
        { value: 'stars', label: 'Star 最多', order: 'desc' },
        { value: 'forks', label: 'Fork 最多', order: 'desc' },
        { value: 'updated', label: '最近更新', order: 'desc' },
      ],
    },
    groups: [
      {
        id: 'in',
        title: '搜索位置',
        open: true,
        items: [
          {
            key: 'in', label: '匹配于 in:', kind: 'multiCsv', qualifier: 'in',
            options: [
              { value: 'name', label: '名称' },
              { value: 'description', label: '描述' },
              { value: 'readme', label: 'README' },
              { value: 'topics', label: '主题' },
            ],
          },
        ],
      },
      ownerBlock(),
      {
        id: 'metrics',
        title: '数据指标',
        items: [
          { key: 'stars', label: 'Star 数 stars:', kind: 'number', qualifier: 'stars', opDefault: '>' },
          { key: 'forks', label: 'Fork 数 forks:', kind: 'number', qualifier: 'forks', opDefault: '>' },
          { key: 'followers', label: '关注数 followers:', kind: 'number', qualifier: 'followers', opDefault: '>' },
          { key: 'size', label: '大小 size:', kind: 'number', qualifier: 'size', opDefault: '<', unit: 'KB' },
          { key: 'topicsCount', label: '主题数 topics:', kind: 'number', qualifier: 'topics', opDefault: '>' },
          { key: 'goodFirstIssues', label: '好上手 issue 数:', kind: 'number', qualifier: 'good-first-issues', opDefault: '>' },
          { key: 'helpWantedIssues', label: '求助 issue 数:', kind: 'number', qualifier: 'help-wanted-issues', opDefault: '>' },
        ],
      },
      languageBlock(),
      {
        id: 'topic',
        title: '主题与许可',
        items: [
          { key: 'topic', label: '主题 topic:', kind: 'text', qualifier: 'topic', placeholder: '如 react', allowNegate: true },
          { key: 'license', label: '许可 license:', kind: 'select', qualifier: 'license', options: LICENSES, allowNegate: true },
        ],
      },
      {
        id: 'attrs',
        title: '属性与可见性',
        items: [
          {
            key: 'fork', label: 'Fork', kind: 'select', qualifier: 'fork',
            options: [
              { value: 'true', label: '包含 fork (fork:true)' },
              { value: 'only', label: '仅 fork (fork:only)' },
            ],
          },
          {
            key: 'visibility', label: '可见性 is:', kind: 'select', qualifier: 'is',
            options: [
              { value: 'public', label: '公开' },
              { value: 'private', label: '私有' },
            ],
          },
          { key: 'archived', label: '已归档 (archived:true)', kind: 'toggle', qualifier: 'archived', value: 'true' },
          { key: 'mirror', label: '镜像 (mirror:true)', kind: 'toggle', qualifier: 'mirror', value: 'true' },
          { key: 'template', label: '模板 (template:true)', kind: 'toggle', qualifier: 'template', value: 'true' },
          { key: 'sponsorable', label: '可赞助 (is:sponsorable)', kind: 'toggle', qualifier: 'is', value: 'sponsorable' },
          { key: 'fundingFile', label: '含赞助文件 (has:funding-file)', kind: 'toggle', qualifier: 'has', value: 'funding-file' },
        ],
      },
      {
        id: 'time',
        title: '时间范围',
        desc: '日期格式 YYYY-MM-DD',
        items: [
          { key: 'created', label: '创建 created:', kind: 'date', qualifier: 'created', opDefault: '>=' },
          { key: 'pushed', label: '推送 pushed:', kind: 'date', qualifier: 'pushed', opDefault: '>=' },
        ],
      },
    ],
  },

  {
    id: 'code',
    label: '代码',
    icon: 'code',
    docs: 'https://docs.github.com/zh/search-github/github-code-search/understanding-github-code-search-syntax',
    keywordLabel: '要搜索的代码内容…',
    hint: '代码搜索：支持正则 /表达式/、精确 "短语"、布尔 AND/OR/NOT；排除用 NOT。',
    groups: [
      ownerBlock(),
      {
        id: 'enterprise',
        title: '企业',
        items: [{ key: 'enterprise', label: '企业 enterprise:', kind: 'text', qualifier: 'enterprise', placeholder: '企业名' }],
      },
      languageBlock(),
      {
        id: 'path',
        title: '路径与符号',
        items: [
          { key: 'pathText', label: '路径 path:', kind: 'text', qualifier: 'path', placeholder: '如 src/**/*.js 或 /README\\.md$/', help: '支持 glob 与正则' },
          { key: 'symbol', label: '符号 symbol:', kind: 'text', qualifier: 'symbol', placeholder: '函数 / 类名，支持正则' },
        ],
      },
      {
        id: 'codeAttrs',
        title: '文件属性 (is:)',
        desc: '排除请开启右侧“排除”，生成 NOT is:xxx',
        items: [
          { key: 'isArchived', label: '已归档', kind: 'toggle', qualifier: 'is', value: 'archived', allowNegate: true },
          { key: 'isFork', label: 'Fork', kind: 'toggle', qualifier: 'is', value: 'fork', allowNegate: true },
          { key: 'isVendored', label: '第三方依赖', kind: 'toggle', qualifier: 'is', value: 'vendored', allowNegate: true },
          { key: 'isGenerated', label: '生成代码', kind: 'toggle', qualifier: 'is', value: 'generated', allowNegate: true },
        ],
      },
    ],
  },

  {
    id: 'issues',
    label: 'Issues',
    icon: 'issue',
    docs: 'https://docs.github.com/zh/search-github/searching-on-github/searching-issues-and-pull-requests',
    keywordLabel: '搜索 Issue 标题 / 正文 / 评论…',
    hint: '默认同时搜索 Issue 与 PR，可用“类型”限定。',
    sort: {
      param: 's', orderParam: 'o',
      options: [
        { value: '', label: '最佳匹配' },
        { value: 'created', label: '最新创建', order: 'desc' },
        { value: 'updated', label: '最近更新', order: 'desc' },
        { value: 'comments', label: '评论最多', order: 'desc' },
        { value: 'reactions', label: '反应最多', order: 'desc' },
      ],
    },
    groups: issueGroups(),
  },

  {
    id: 'pullrequests',
    label: 'Pull requests',
    icon: 'pr',
    docs: 'https://docs.github.com/zh/search-github/searching-on-github/searching-issues-and-pull-requests',
    keywordLabel: '搜索 Pull Request…',
    hint: '已默认限定为 Pull Request；可叠加审查状态、分支等。',
    sort: {
      param: 's', orderParam: 'o',
      options: [
        { value: '', label: '最佳匹配' },
        { value: 'created', label: '最新创建', order: 'desc' },
        { value: 'updated', label: '最近更新', order: 'desc' },
        { value: 'comments', label: '评论最多', order: 'desc' },
      ],
    },
    groups: [
      { id: 'prDefault', title: '类型', open: true, items: [{ key: 'isPr', label: '仅 PR (is:pr)', kind: 'toggle', qualifier: 'is', value: 'pr' }] },
      ...issueGroups(),
    ],
  },

  {
    id: 'discussions',
    label: '讨论',
    icon: 'discuss',
    docs: 'https://docs.github.com/zh/search-github/searching-on-github/searching-discussions',
    keywordLabel: '搜索 Discussion…',
    groups: [
      {
        id: 'status',
        title: '状态',
        open: true,
        items: [
          {
            key: 'state', label: '状态', kind: 'select', qualifier: 'is',
            options: [{ value: 'open', label: '打开 open' }, { value: 'closed', label: '关闭 closed' }],
          },
          { key: 'answered', label: '已回答 (is:answered)', kind: 'toggle', qualifier: 'is', value: 'answered' },
        ],
      },
      {
        id: 'in',
        title: '搜索位置',
        items: [
          {
            key: 'in', label: '匹配于 in:', kind: 'multiCsv', qualifier: 'in',
            options: [{ value: 'title', label: '标题' }, { value: 'body', label: '正文' }, { value: 'comments', label: '评论' }],
          },
        ],
      },
      ownerBlock(),
      {
        id: 'meta',
        title: '标签与分类',
        items: [
          { key: 'label', label: '标签 label:', kind: 'multiRepeat', qualifier: 'label', placeholder: '输入标签后回车' },
          { key: 'category', label: '分类 category:', kind: 'text', qualifier: 'category', placeholder: '分类名' },
          { key: 'author', label: '作者 author:', kind: 'text', qualifier: 'author', placeholder: '用户名或 @me', allowNegate: true },
          { key: 'team', label: '团队 team:', kind: 'text', qualifier: 'team', placeholder: 'org/team' },
          { key: 'comments', label: '评论数 comments:', kind: 'number', qualifier: 'comments', opDefault: '>' },
        ],
      },
      {
        id: 'time',
        title: '时间范围',
        items: [
          { key: 'created', label: '创建 created:', kind: 'date', qualifier: 'created', opDefault: '>=' },
          { key: 'updated', label: '更新 updated:', kind: 'date', qualifier: 'updated', opDefault: '>=' },
        ],
      },
    ],
  },

  {
    id: 'users',
    label: '用户',
    icon: 'user',
    docs: 'https://docs.github.com/zh/search-github/searching-on-github/searching-users',
    keywordLabel: '搜索用户名 / 名称 / 邮箱…',
    sort: {
      param: 's', orderParam: 'o',
      options: [
        { value: '', label: '最佳匹配' },
        { value: 'followers', label: '粉丝最多', order: 'desc' },
        { value: 'repositories', label: '仓库最多', order: 'desc' },
        { value: 'joined', label: '最新加入', order: 'desc' },
      ],
    },
    groups: [
      {
        id: 'in',
        title: '搜索位置',
        open: true,
        items: [
          {
            key: 'in', label: '匹配于 in:', kind: 'multiCsv', qualifier: 'in',
            options: [
              { value: 'login', label: '登录名' },
              { value: 'name', label: '昵称' },
              { value: 'email', label: '邮箱' },
              { value: 'fullname', label: '全名' },
            ],
          },
        ],
      },
      {
        id: 'type',
        title: '账号类型',
        items: [
          {
            key: 'type', label: '类型 type:', kind: 'select', qualifier: 'type',
            options: [{ value: 'user', label: '个人用户' }, { value: 'org', label: '组织' }],
          },
        ],
      },
      {
        id: 'metrics',
        title: '数据指标',
        items: [
          { key: 'repos', label: '仓库数 repos:', kind: 'number', qualifier: 'repos', opDefault: '>' },
          { key: 'followers', label: '粉丝数 followers:', kind: 'number', qualifier: 'followers', opDefault: '>' },
          { key: 'followings', label: '关注数 followings:', kind: 'number', qualifier: 'followings', opDefault: '>' },
        ],
      },
      {
        id: 'profile',
        title: '资料',
        items: [
          languageBlock().items[0],
          { key: 'location', label: '位置 location:', kind: 'text', qualifier: 'location', placeholder: '城市 / 地区' },
        ],
      },
      {
        id: 'time',
        title: '时间',
        items: [{ key: 'created', label: '注册 created:', kind: 'date', qualifier: 'created', opDefault: '>=' }],
      },
    ],
  },

  {
    id: 'commits',
    label: '提交',
    icon: 'commit',
    docs: 'https://docs.github.com/zh/search-github/searching-on-github/searching-commits',
    keywordLabel: '搜索提交信息…',
    groups: [
      ownerBlock(),
      {
        id: 'people',
        title: '作者与提交者',
        items: [
          { key: 'author', label: '作者 author:', kind: 'text', qualifier: 'author', placeholder: '用户名', allowNegate: true },
          { key: 'committer', label: '提交者 committer:', kind: 'text', qualifier: 'committer', placeholder: '用户名', allowNegate: true },
          { key: 'authorName', label: '作者名 author-name:', kind: 'text', qualifier: 'author-name', placeholder: '姓名' },
          { key: 'authorEmail', label: '作者邮箱 author-email:', kind: 'text', qualifier: 'author-email', placeholder: 'name@example.com' },
          { key: 'committerName', label: '提交者名 committer-name:', kind: 'text', qualifier: 'committer-name', placeholder: '姓名' },
        ],
      },
      {
        id: 'hash',
        title: '哈希与合并',
        items: [
          { key: 'hash', label: '提交哈希 hash:', kind: 'text', qualifier: 'hash', placeholder: '完整 SHA' },
          { key: 'parent', label: '父提交 parent:', kind: 'text', qualifier: 'parent', placeholder: '父 SHA' },
          { key: 'tree', label: '树 tree:', kind: 'text', qualifier: 'tree', placeholder: '树 SHA' },
          { key: 'isMerge', label: '合并提交 (is:merge)', kind: 'toggle', qualifier: 'is', value: 'merge' },
        ],
      },
      {
        id: 'time',
        title: '时间',
        items: [
          { key: 'authorDate', label: '作者时间 author-date:', kind: 'date', qualifier: 'author-date', opDefault: '>=' },
          { key: 'committerDate', label: '提交时间 committer-date:', kind: 'date', qualifier: 'committer-date', opDefault: '>=' },
        ],
      },
    ],
  },

  {
    id: 'topics',
    label: '话题',
    icon: 'topic',
    docs: 'https://docs.github.com/zh/search-github/searching-on-github/searching-topics',
    keywordLabel: '搜索话题名称…',
    groups: [
      {
        id: 'attrs',
        title: '话题属性',
        open: true,
        items: [
          { key: 'isCurated', label: '精选 (is:curated)', kind: 'toggle', qualifier: 'is', value: 'curated' },
          { key: 'isFeatured', label: '推荐 (is:featured)', kind: 'toggle', qualifier: 'is', value: 'featured' },
          { key: 'repositories', label: '关联仓库数 repositories:', kind: 'number', qualifier: 'repositories', opDefault: '>' },
        ],
      },
      {
        id: 'time',
        title: '时间',
        items: [{ key: 'created', label: '创建 created:', kind: 'date', qualifier: 'created', opDefault: '>=' }],
      },
    ],
  },

  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: 'market',
    docs: 'https://docs.github.com/zh/search-github/searching-on-github/searching-github-marketplace',
    keywordLabel: '搜索 Marketplace 应用…',
    groups: [],
  },

  {
    id: 'wikis',
    label: 'Wiki',
    icon: 'wiki',
    docs: 'https://docs.github.com/zh/search-github/searching-on-github/searching-wikis',
    keywordLabel: '搜索 Wiki 内容…',
    groups: [ownerBlock()],
  },

  {
    id: 'gists',
    label: 'Gist',
    icon: 'gist',
    baseUrl: 'https://gist.github.com/search',
    docs: 'https://docs.github.com/zh/search-github/searching-on-github/searching-gists',
    keywordLabel: '搜索 Gist 内容…',
    groups: [
      {
        id: 'owner',
        title: '归属',
        open: true,
        items: [{ key: 'user', label: '用户 user:', kind: 'text', qualifier: 'user', placeholder: '用户名' }],
      },
    ],
  },
];

export const SEARCH_TYPE_MAP = SEARCH_TYPES.reduce((acc, t) => {
  acc[t.id] = t;
  return acc;
}, {});
