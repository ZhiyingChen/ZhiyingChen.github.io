# Nicole’s Wonderland

Nicole Chen 的个人网站，基于 [Hugo](https://gohugo.io/) + [Blowfish](https://github.com/nunocoracao/blowfish)，通过 GitHub Pages 发布。

第一版从公开 Notion 网站迁移，包含主页原文、7 个项目系列、8 篇案例及 19 个媒体文件。正文、图片和站内跳转独立保存在本仓库，日常构建不依赖 Notion 或 Super.so。既有项目的外部演示、GitHub 等链接仍指向各自的服务。

## 本地预览

在当前电脑双击 `preview.cmd`，然后打开 <http://localhost:1313/>。关闭命令窗口即可停止服务。

也可在 PowerShell 执行：

```powershell
cd D:\CZY\NeedCopy\Project\nicole-wonderland
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\preview.ps1
```

本机已安装项目专用 Hugo Extended 0.167.0 到 `.tools/hugo/`（不提交到 Git，也没有更改系统 Hugo）。在其他电脑安装相同版本后，执行 `hugo server`；初次克隆请使用 `git clone --recurse-submodules <仓库地址>`。

## 内容和样式

| 位置 | 用途 |
| --- | --- |
| `content/projects/` | 7 个项目系列，Markdown 可直接编辑 |
| `content/cases/` | 8 篇项目案例 |
| `content/about.md` | 原主页的个人介绍、工作经历、教育背景和技能 |
| `content/contact.md` | 联系方式 |
| `layouts/partials/home/custom.html` | 首页介绍、精选项目、经历概览 |
| `layouts/partials/project-card.html` | 项目卡片 |
| `assets/css/custom.css` | 配色、排版、手机布局 |
| `assets/js/search.js` | 基于主题的搜索补丁，确保首次输入在索引加载后立即显示结果 |
| `static/media/` | 本地保存的原图及优化后的首页照片 |
| `hugo.toml` | 网站配置、导航与主题开关 |
| `data/migration.json` | 迁移页面清单及媒体数量 |

首页前三个精选项目由项目文件的 `weight` 决定；项目列表只展示系列，系列正文中的链接可进入案例。支持中英文切换、分语言全文搜索、浅色/深色切换、文章目录和代码复制。

## 中英文内容维护

中文入口为 <https://zhiyingchen.github.io/>，英文入口为 <https://zhiyingchen.github.io/en/>。导航中的「中 / EN」会切换到当前页面的对应译文；首页、项目列表、关于页、联系页、7 个项目系列和 8 篇案例均提供英文版本。

- 中文正文使用 `name.md`，英文正文使用同目录下的 `name.en.md`；栏目首页对应 `_index.md` 和 `_index.en.md`。
- 新增页面时同时创建两种语言文件，保持文件名和相对路径一致，Hugo 会自动建立翻译关系。
- 标题、简介和标签分别写在各语言 Markdown 的 front matter 中；共用界面文案位于 `i18n/zh-cn.json` 与 `i18n/en.json`。
- 模板中的站内页面链接使用 `relLangURL`；Markdown 正文中的 `/projects/.../` 和 `/cases/.../` 链接由渲染模板自动添加当前语言前缀。图片使用共用的 `/media/...` 路径。
- 中文与英文分别生成搜索索引。原始项目图表保留，英文正文提供说明；外部咨询网站目前以中文展示。

构建检查会核对两种语言的页面、语言切换目标、HTML 语言标记、canonical/hreflang、搜索索引，以及站内页面是否保持当前语言。重新运行 Notion 导出会覆盖迁移的中文原文，日常编辑不需要运行导出脚本。

## GitHub Pages 部署

- 网站地址：<https://zhiyingchen.github.io/>
- 源码仓库：<https://github.com/ZhiyingChen/ZhiyingChen.github.io>
- 发布记录：<https://github.com/ZhiyingChen/ZhiyingChen.github.io/actions>

顶部导航中的“咨询网站”关联 <https://wisdawn-consult.cn/>；首页“联系 Nicole”进入站内联系页。

推送 `main` 分支会自动构建、检查站内链接和媒体，然后发布到 GitHub Pages：

```powershell
git add .
git commit -m "Update personal website"
git push
```

GitHub Pages 的发布来源设置为 **GitHub Actions**，工作流位于 `.github/workflows/pages.yml`，也可以从 Actions 页面手动运行。`hugo.toml` 已配置正式站点地址，工作流会使用 Pages 返回的地址进行构建。不要把 `public/`、`.tools/` 或 `.migration/` 上传到仓库。

## 重新迁移与检查

迁移脚本只使用 Python 标准库，无需 Notion 登录。Notion 公共接口并非稳定的官方集成 API，未来如有变化需要调整脚本；这不会影响已经迁移的网站。

```powershell
python -X utf8 scripts/import_notion.py
python -X utf8 scripts/export_content.py
.tools/hugo/hugo.exe --gc --minify --panicOnWarning
python scripts/verify_site.py --public public
```

`import_notion.py` 会缓存原始公开页面到 `.migration/`，重复运行会复用缓存；刷新特定页面前先移除对应缓存文件。`export_content.py` 会覆盖迁移生成的正文，日常编辑后请勿随意重跑。正常更新内容只需编辑 Markdown 并重新构建。

主题以 Git 子模块固定在已验证的提交上，更新主题请单独验证后再提交子模块版本。
