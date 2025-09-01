#!/bin/bash

# Gohan Restaurant Auto Backup Script
# 毎時間実行されて、データを複数箇所にバックアップ

echo "========================================="
echo "🍚 Gohan Auto Backup Starting..."
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="

# Vercel KVからデータ取得
response=$(curl -s "https://electric-alpaca-36984.upstash.io/get/restaurants" \
  -H "Authorization: Bearer AZB4AAIjcDEyNDRlN2VkYmU5YTE0MzViYWQ3NzQzZGNhOTMxMWNmMnAxMA")

# JSONからrestaurantsデータを抽出
restaurants=$(echo "$response" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('result', '[]'))")

# タイムスタンプ生成
timestamp=$(date '+%Y%m%d_%H%M%S')
date_only=$(date '+%Y-%m-%d')

# レストラン数をカウント
count=$(echo "$restaurants" | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data))")

echo "📊 Found $count restaurants to backup"

# バックアップディレクトリリスト
backup_dirs=(
    "$HOME/Documents/gohan-backups"
    "$HOME/Desktop/gohan-backups"
    "$HOME/ahillchan.com/gohan-backups"
    "$HOME/gohan-app-v2/backups"
    "$HOME/Library/Mobile Documents/com~apple~CloudDocs/gohan-backups"  # iCloud
)

# 各ディレクトリにバックアップ
for dir in "${backup_dirs[@]}"; do
    # ディレクトリ作成
    mkdir -p "$dir"
    
    # 日付別サブディレクトリ
    date_dir="$dir/$date_only"
    mkdir -p "$date_dir"
    
    # ファイル保存
    filename="restaurants_${timestamp}.json"
    filepath="$date_dir/$filename"
    
    echo "$restaurants" | python3 -m json.tool > "$filepath"
    
    if [ $? -eq 0 ]; then
        echo "✅ Backed up to: $filepath"
    else
        echo "❌ Failed to backup to: $filepath"
    fi
    
    # 最新版のシンボリックリンクも作成
    latest_link="$dir/restaurants_latest.json"
    ln -sf "$filepath" "$latest_link"
done

# 古いバックアップの削除（7日以上前のものを削除）
echo ""
echo "🧹 Cleaning old backups (keeping last 7 days)..."
for dir in "${backup_dirs[@]}"; do
    if [ -d "$dir" ]; then
        find "$dir" -type f -name "restaurants_*.json" -mtime +7 -delete 2>/dev/null
        deleted_count=$(find "$dir" -type f -name "restaurants_*.json" -mtime +7 2>/dev/null | wc -l)
        if [ "$deleted_count" -gt 0 ]; then
            echo "  Cleaned $deleted_count old files from $dir"
        fi
    fi
done

echo ""
echo "========================================="
echo "✨ Backup completed successfully!"
echo "========================================="

# 成功音（オプション）
afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || true