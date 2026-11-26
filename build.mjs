#!/usr/bin/env node
// Build the single-file Tampermonkey userscript from src/*.js
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = __dirname;

const ORDER = ['styles.js', 'qualifiers.js', 'query-builder.js', 'ui.js', 'main.js'];

let body = '';
for (const file of ORDER) {
  let code = readFileSync(resolve(root, 'src', file), 'utf8');
  // strip ES module lines – everything runs in one shared IIFE scope
  code = code.replace(/^\s*import[\s\S]*?;\s*$/gm, '');
  code = code.replace(/^export\s+/gm, '');
  // drop leftover module-only comments markers are fine
  body += `\n// ================= src/${file} =================\n` + code.trim() + '\n';
}

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const version = pkg.version || '1.0.0';

const banner = `// ==UserScript==
// @name         GitHub 搜索助手 · 可视化高级搜索
// @name:en      GitHub Search Assistant
// @namespace    https://github.com/Jandaes/GitHub-Search-Assistant
// @version      ${version}
// @description  点击 GitHub 官方搜索框弹出可视化面板，按规则(仓库/代码/Issues/PR/用户/提交/话题等)组合 GitHub 搜索语法，只需输入搜索内容即可。
// @description:en  Visual advanced search builder for GitHub: click the search box to compose GitHub search qualifiers visually.
// @author       janda
// @license      MIT
// @match        https://github.com/*
// @match        https://gist.github.com/*
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDk2OWRhIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTEiIGN5PSIxMSIgcj0iNyIvPjxwYXRoIGQ9Im0yMSAyMS00LjMtNC4zIi8+PC9zdmc+
// @grant        none
// @run-at       document-idle
// @supportURL   https://docs.github.com/zh/search-github
// ==/UserScript==

/*
 * GitHub 搜索助手 · 可视化高级搜索
 * 语法参考: https://docs.github.com/zh/search-github/github-code-search/understanding-github-code-search-syntax
 * 本文件由 build.mjs 自动生成，请勿直接编辑；源码见 src/。
 */

(function () {
  'use strict';
${body}
})();
`;

const outFiles = [
  resolve(root, 'dist', 'github-search-assistant.user.js'),
  resolve(root, 'github-search-assistant.user.js'),
];
mkdirSync(resolve(root, 'dist'), { recursive: true });
for (const out of outFiles) {
  writeFileSync(out, banner, 'utf8');
  console.log('wrote', out, `(${banner.length} bytes)`);
}
