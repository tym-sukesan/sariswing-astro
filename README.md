# SARI WEBSITE (Astro)

## AI development workflow

This repository uses AI-assisted development. The repository files are the source of truth for project context, not chat history.

Before starting any AI-assisted task, read:

- `AGENTS.md`
- `.cursor/rules`
- `tools/static-to-astro/docs/ai/00-current-state.md`
- `tools/static-to-astro/docs/ai/03-next-actions.md`
- `tools/static-to-astro/docs/ai/handoff-to-chatgpt.md`

After every meaningful task, update the AI context files:

- `tools/static-to-astro/docs/ai/00-current-state.md`
- `tools/static-to-astro/docs/ai/03-next-actions.md`
- `tools/static-to-astro/docs/ai/handoff-to-chatgpt.md`

Do not rely on chat history alone. Keep safety gates, latest commits, current phase, and next actions in the repository.

## セットアップ

```sh
npm install
cp .env.example .env
# .env に PUBLIC_SUPABASE_URL と PUBLIC_SUPABASE_ANON_KEY を設定
npm run dev
```

## 本番公開

本番デプロイ前に [docs/production.md](docs/production.md) を必ず読んでください。

- `/admin/` は Basic 認証必須
- RLS は未適用（案: `scripts/supabase/rls-policies.sql`）
- anon key は公開前提。service_role key はフロントに置かない

## プロジェクト構成

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
