# Supabase セットアップガイド

## 🚀 クイックスタート

### 1. Supabaseプロジェクトの作成
1. [Supabase](https://supabase.com)にアクセスしてアカウント作成/ログイン
2. 「New Project」をクリック
3. プロジェクト名を入力（例: `gohan-app`）
4. データベースパスワードを設定（安全な場所に保存）
5. リージョンを選択（Tokyo推奨）

### 2. テーブルの作成
1. Supabaseダッシュボードの「SQL Editor」を開く
2. `supabase-setup.sql`の内容をコピー＆ペースト
3. 「Run」をクリックして実行

### 3. 環境変数の設定

#### ローカル環境
1. `.env.local`ファイルを作成（`.env.local.example`をコピー）
2. Supabaseダッシュボード > Settings > API から以下をコピー：
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

#### Vercel環境
1. Vercelダッシュボード > Settings > Environment Variables
2. 同じ環境変数を追加（Production, Preview, Development全てにチェック）
3. **重要**: 値をコピーする際、改行を含めないよう注意

### 4. 既存データの移行
```bash
# npmでdotenvをインストール（まだの場合）
npm install dotenv

# 移行スクリプトを実行
node scripts/migrate-to-supabase.js

# 既存データをクリアしてから移行する場合
node scripts/migrate-to-supabase.js --clear
```

### 5. 動作確認
1. ローカルで確認:
   ```bash
   npm run dev
   ```
   http://localhost:3000 にアクセス

2. 本番環境にデプロイ:
   ```bash
   npx vercel --prod
   ```

## 📊 データベース構造

```sql
restaurants
├── id (UUID, Primary Key)
├── name (Text, Required)
├── google_maps_url (Text)
├── address (Text)
├── category (Text)
├── business_hours (JSONB)
├── coordinates (JSONB)
├── created_at (Timestamp)
└── updated_at (Timestamp)
```

## 🔒 セキュリティ設定
- Row Level Security (RLS) 有効
- 読み取り: 全員可能
- 書き込み: 認証ユーザーのみ（現在は anon key で全員可能）

## 🔧 トラブルシューティング

### データが表示されない
- 環境変数が正しく設定されているか確認
- Supabaseダッシュボードでテーブルにデータがあるか確認
- ブラウザのコンソールでエラーを確認

### 編集・削除ができない
- Supabase環境変数が設定されているか確認
- RLSポリシーが正しく設定されているか確認

### ローカルでは動くが本番で動かない
- Vercelの環境変数が設定されているか確認
- Vercelダッシュボードでビルドログを確認

## 📝 メモ
- Supabaseが設定されていない場合、自動的にローカルJSONファイルにフォールバック
- 本番環境では必ずSupabaseを使用（Vercelのファイルシステムは読み取り専用）