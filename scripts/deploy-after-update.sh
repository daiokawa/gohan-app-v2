#!/bin/bash

# 自動デプロイスクリプト
# 店舗データ更新後に自動的にVercelにデプロイ

cd ~/gohan-app-v2

echo "📦 データ更新を検出..."

# Gitにコミット
git add data/restaurants.json
git commit -m "店舗データ更新: $(date '+%Y-%m-%d %H:%M')" || echo "変更なし"

# GitHubにプッシュ
git push origin main

echo "🚀 Vercelに自動デプロイ中..."

# Vercelが自動的にGitHubの変更を検出してデプロイ
echo "✅ 更新がVercelに反映されます（約1分）"

# ブラウザで確認
sleep 5
open https://gohan.ahillchan.com

echo "完了！"