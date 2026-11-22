# Redesign audit — 22 November 2026

## Baseline
Hugo Extended 0.167.0 with the pinned Blowfish submodule; static GitHub Pages deployment through `.github/workflows/pages.yml`. Working tree was clean. The live homepage was fetched and compared with local templates. Local source contains 13 project pages in each language, six standalone local demos, and four externally hosted demo destinations. The README's seven-series/eight-case count describes an older migration; `content/cases/` now contains section indexes and project aliases, not eight independent case articles.

## Preserve
All 26 project translations, original technical diagrams and media, project and case aliases, search, translation controls, code copying, RSS, and the six complete demo directories. External demos remain separate deployments. No framework migration, backend, or new package dependency is needed.

## Findings
The homepage leads with tools and numerous demo cards rather than business decisions. Green personal-blog styling and casual copy obscure professional positioning. Expertise and Insights sections are absent. About includes internal implementation detail better omitted from a public narrative. Several manufacturing cases contain benefit and deployment statements without supporting evidence in this repository; retain their model details, but hold those statements for confirmation. There are no pre-existing insight articles to migrate.

## Content map and migration
- Home: positioning, four expertise areas, four selected projects, editorial notes, professional journey, contact.
- Expertise `/expertise/`: business problem, significance, approach, links to existing projects.
- Case Studies `/cases/`: four structured reading guides linking to unchanged `/projects/<slug>/` routes. `/projects/` remains the complete archive.
- Insights `/insights/`: three new, dated technical notes derived from existing model descriptions. These are editorial explanations, not claims of prior publication or customer results.
- About `/about/`: academic foundation → optimization engineering → digital operations → manufacturing systems → independent exploration. Preserve the accurate Nanjing English degree and mathematics minor.
- Contact `/contact/`: existing email, GitHub, LinkedIn, consulting site; WeChat account identified by name only.

Both languages receive corresponding pages. No release or remote push is part of this local redesign.
