#!/bin/bash

echo "⚙️ Setting up cron job for automatic Gohan backups..."

# 現在のcrontabを取得
crontab -l > /tmp/current_cron 2>/dev/null || touch /tmp/current_cron

# すでに設定済みかチェック
if grep -q "auto-backup.sh" /tmp/current_cron; then
    echo "⚠️ Cron job already exists. Updating..."
    # 既存のエントリを削除
    grep -v "auto-backup.sh" /tmp/current_cron > /tmp/new_cron
else
    cp /tmp/current_cron /tmp/new_cron
fi

# 新しいcronジョブを追加
# 毎時0分に実行（1時間ごと）
echo "0 * * * * /Users/KoichiOkawa/gohan-app-v2/scripts/auto-backup.sh > /Users/KoichiOkawa/gohan-app-v2/logs/backup.log 2>&1" >> /tmp/new_cron

# ログディレクトリ作成
mkdir -p /Users/KoichiOkawa/gohan-app-v2/logs

# crontabを更新
crontab /tmp/new_cron

# 確認
echo ""
echo "✅ Cron job has been set up!"
echo ""
echo "📅 Backup Schedule:"
echo "  - Every hour at :00 (e.g., 13:00, 14:00, 15:00...)"
echo ""
echo "📁 Backup Locations:"
echo "  1. ~/Documents/gohan-backups/"
echo "  2. ~/Desktop/gohan-backups/"
echo "  3. ~/ahillchan.com/gohan-backups/"
echo "  4. ~/gohan-app-v2/backups/"
echo "  5. iCloud Drive/gohan-backups/"
echo ""
echo "📝 Log file: ~/gohan-app-v2/logs/backup.log"
echo ""
echo "To check cron status:"
echo "  crontab -l"
echo ""
echo "To disable automatic backups:"
echo "  crontab -e  (then remove the auto-backup.sh line)"

# クリーンアップ
rm /tmp/current_cron /tmp/new_cron 2>/dev/null