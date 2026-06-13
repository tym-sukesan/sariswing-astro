Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

1. Immediate priority
現在の最優先は、開発ワークフローを整理したうえで、Schedule non-dry-run PoC の明示的 retry を安全に実行すること。
まずこの AI workflow files をリポジトリに追加し、Git上の文脈ファイルを source of truth にする。

2. Next development phase
次に行う開発フェーズ: AI workflow foundation setup
- docs/ai ディレクトリ作成と各ファイル・ルールの追加
- commit / push

3. After AI workflow foundation setup
AI workflow files を追加した後、次のフェーズへ進む。
G-6-e5-schedule-non-dry-run-poc-explicit-retry（手動で Run button を1回だけクリック）

4. Explicit retry preconditions
4.1 Supabase project: static-to-astro-cms-staging であること
4.2 Final beforeSnapshot SQL を直前に実行して確認すること
4.3 Dev server はインライン環境変数で起動すること（.envに保存しない）
4.4 Browser route: /__admin-staging-shell/musician-basic/
4.5 Danger Zone, 4.6 Manual confirm, 4.7 Click rule（1回だけクリック）を厳守。

5. After retry verification SQL
クリック後に SQL Editor で description が「出演： [G-6-e5 non-dry-run PoC]」になっているか確認。

6. Rollback SQL
update public.schedules set description = '出演：' where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';

7. Retry result reporting template
（省略形：結果確認用の項目。詳細はリポジトリで管理）

8. If retry succeeds -> 次フェーズ: G-6-e5-schedule-non-dry-run-poc-explicit-retry-result
9. If retry fails -> 再クリックせず、ログを保存して診断フェーズへ。

10. AI workflow maintenance rule
今後、Cursor作業後は必ず 00-current-state.md, 03-next-actions.md, handoff-to-chatgpt.md を更新する。

11. Immediate next action for Cursor
AI workflow foundation setup を完了させ、commit/push すること。
