このファイルは、新しいChatGPTスレッドの冒頭に貼るための引き継ぎテンプレートです。
Cursorは各作業後にこのファイルを更新してください。

1. Project
Project name: Static-to-Astro CMS / Musician CMS Kit
Repository: sariswing-astro
Main working area: tools/static-to-astro, src/pages/__admin-staging-shell

2. Current phase
Current phase: [ここに現在フェーズを書く]
Latest completed phase: [ここに直近完了フェーズを書く]
Latest commit: [ここに最新commit hashとmessageを書く]
Current recommended next phase: [ここに次フェーズを書く]

3. Current state summary
[ここに現在の状態を10〜20行で要約する]

4. Safety invariants
- Do not touch production / Sariswing production.
- Do not touch production Supabase project.
- Do not use service_role.
- Do not commit .env / .env.local.
- Use /__admin-staging-shell/musician-basic/ only.
- Treat schedule_months as read-only.
- Any write retry must be user manual click exactly once.

5. Target row for Schedule PoC
id: aa440e29-5be8-402e-9190-0d81c48434c0
Payload: { "description": "出演： [G-6-e5 non-dry-run PoC]" }

6. Gate state
[ここに最新gate状態を書く] (readyForExplicitRetry: true)

7. What was done recently / 8. What must not be done next
[直近の作業と次回禁止事項]

9. Next requested help from ChatGPT
Please review the current state and provide the next Cursor prompt for G-6-e5-schedule-non-dry-run-poc-explicit-retry.

10. Files to read first
tools/static-to-astro/docs/ai/00-current-state.md
tools/static-to-astro/docs/ai/03-next-actions.md
tools/static-to-astro/docs/ai/handoff-to-chatgpt.md
