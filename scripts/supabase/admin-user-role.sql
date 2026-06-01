-- =============================================================================
-- 管理者ユーザーに app_metadata.role = "admin" を付与（SQL Editor / 手動実行）
-- =============================================================================
-- 1. Dashboard → Authentication → Users でユーザーを作成（Sign ups は無効推奨）
-- 2. 下記の email を実際の管理者メールに置き換えて実行
--
-- 管理用 Edge Function は次のいずれかで許可します:
--   - user.app_metadata.role === "admin"
--   - Edge Secrets の ADMIN_EMAILS に含まれるメール（カンマ区切り・複数可）
-- =============================================================================

-- 単一ユーザー
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
-- where email = 'admin@example.com';

-- 複数ユーザー（メールを列挙）
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
-- where email in ('admin@example.com', 'sari@example.com');
