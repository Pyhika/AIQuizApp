# Port Conflict Resolution Guide

## 問題: ポート3000の競合

エラーメッセージ: `Error: listen EADDRINUSE: address already in use :::3000`

## 原因

1. **Dockerコンテナ** - `docker-compose`でバックエンドがポート3000で実行中
2. **ローカルプロセス** - VSCode/Cursorやターミナルから`pnpm run start:dev`が実行される

## 解決方法

### 方法1: Dockerのみを使用（推奨）

```bash
# プロジェクトルートで実行
docker-compose up

# または start-dev.sh を使用
./start-dev.sh
```

### 方法2: ローカル開発（Docker停止時）

```bash
# Dockerを停止
docker-compose down

# ローカルで実行
cd packages/back
pnpm run start:dev
```

### 方法3: 異なるポートでローカル実行

```bash
# Docker（ポート3000）と並行してローカル（ポート3001）で実行
cd packages/back
pnpm run start:dev:local  # PORT=3001で起動
```

## VSCode/Cursor設定

`.vscode/settings.json`に以下の設定を追加済み：

- 自動npm実行を無効化
- 自動タスク検出を無効化
- TypeScript自動ビルドを無効化

## 環境変数

- `PORT`: アプリケーションのポート番号（デフォルト: 3000）
- Docker使用時: 3000
- ローカル並行実行時: 3001

## トラブルシューティング

1. **すべてのNode.jsプロセスを確認**
   ```bash
   ps aux | grep node
   lsof -i :3000
   ```

2. **Dockerコンテナを確認**
   ```bash
   docker ps
   docker-compose ps
   ```

3. **強制停止が必要な場合**
   ```bash
   # すべてのDockerコンテナを停止
   docker-compose down
   
   # ポート3000を使用しているプロセスを終了
   kill $(lsof -t -i:3000)
   ```

## 開発フロー

1. **通常の開発**: `./start-dev.sh`を使用（Docker環境）
2. **デバッグ時**: Dockerを停止してローカルで実行
3. **並行開発**: Dockerはポート3000、ローカルはポート3001

## 注意事項

- VSCodeの「Run and Debug」機能を使用する場合は、Dockerを停止するか、デバッグ設定でポート3001を指定
- ターミナルでCtrl+Cを押した際は、すべてのプロセスが停止することを確認
- 複数のターミナルタブで同じコマンドを実行しないよう注意