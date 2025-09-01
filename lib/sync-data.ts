import { Restaurant } from '@/types/restaurant';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function syncToMultipleDestinations(restaurants: Restaurant[]): Promise<void> {
  const jsonData = JSON.stringify(restaurants, null, 2);
  
  // 1. ローカルファイルに保存
  const localPath = path.join(process.cwd(), 'data', 'restaurants.json');
  fs.writeFileSync(localPath, jsonData);
  
  // 2. バックアップディレクトリに保存
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups', new Date().toISOString().split('T')[0]);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupPath = path.join(backupDir, `restaurants_${timestamp}.json`);
  fs.writeFileSync(backupPath, jsonData);
  
  // 3. 自動的にGitHubにプッシュ（バックグラウンド）
  try {
    await execAsync(`cd ${process.cwd()} && git add data/restaurants.json && git commit -m "自動更新: ${restaurants.length}件のレストランデータ" && git push`, { timeout: 10000 });
    console.log('GitHubへの自動プッシュ成功');
  } catch (error) {
    console.log('GitHubプッシュをスキップ（変更なしまたはオフライン）');
  }
  
  // 4. 複数のバックアップ場所にもコピー（シンボリックリンクは作らない）
  const backupLocations = [
    path.join(process.env.HOME || '', 'Documents', 'gohan-backups'),
    path.join(process.env.HOME || '', 'Desktop', 'gohan-backups'),
  ];
  
  for (const location of backupLocations) {
    try {
      if (!fs.existsSync(location)) {
        fs.mkdirSync(location, { recursive: true });
      }
      const destPath = path.join(location, 'restaurants_latest.json');
      // 通常のファイルとして書き込み（シンボリックリンクは使わない）
      fs.writeFileSync(destPath, jsonData);
    } catch (error) {
      console.log(`バックアップ先 ${location} への保存をスキップ`);
    }
  }
  
  console.log(`✅ ${restaurants.length}件のデータを複数箇所に同期完了`);
}