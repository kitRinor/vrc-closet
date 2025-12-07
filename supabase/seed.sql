
-- 初期設定用のSQLスクリプト
-- -----------------------------------------------------
-- 1. Storage Bucket の自動作成
-- storage バケットを public (公開) 設定で作成する
INSERT INTO storage.buckets (id, name, public)
VALUES ('storage', 'storage', true)
ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------
-- 2. Storage RLS Policyの追加
-- 誰でも (anon) storage バケットのファイルを読めるように
create policy "Allow public read access"
on storage.objects for select using (bucket_id = 'storage');