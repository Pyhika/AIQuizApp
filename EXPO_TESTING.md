# ExpoGoでの実機テスト手順

## 自動起動（推奨）
```bash
./start-dev.sh
```
このスクリプトがすべてを自動で設定・起動します。

## 手動起動手順

### 1. 事前準備
- スマートフォンに**Expo Go**アプリをインストール
  - iOS: [App Store](https://apps.apple.com/jp/app/expo-go/id982107779)
  - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
- PCとスマートフォンを**同じWiFiネットワーク**に接続

### 2. ローカルIPアドレスの確認
```bash
# MacOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# 表示されたIPアドレス（例: 192.168.1.100）をメモ
```

### 3. 環境変数の設定
```bash
# packages/mobile/.env を編集
EXPO_PUBLIC_API_URL=http://[あなたのIPアドレス]:3000
```

### 4. Dockerサービスの起動
```bash
# プロジェクトルートで実行
docker-compose up -d
```

### 5. バックエンドサーバーの起動
```bash
cd packages/back

# 初回のみ
pnpm install

# サーバー起動
pnpm run start:dev
```
ブラウザで http://localhost:3000 にアクセスして確認

### 6. Expoサーバーの起動
**新しいターミナルを開いて：**
```bash
cd packages/mobile

# 初回のみ
npm install

# Expo起動
npx expo start
```

### 7. 実機での接続
1. ターミナルに表示される**QRコード**を確認
2. スマートフォンで**Expo Go**アプリを開く
3. QRコードをスキャン
   - iOS: カメラアプリでスキャン
   - Android: Expo Goアプリ内のスキャナーを使用
4. アプリが自動的に読み込まれる

## トラブルシューティング

### 接続できない場合
1. **ファイアウォール**を一時的に無効化
2. **同じWiFiネットワーク**に接続されているか確認
3. IPアドレスが正しく設定されているか確認
4. バックエンドサーバーが起動しているか確認

### エラーが表示される場合
1. **Metro bundler**を再起動
   - ターミナルで `r` キーを押す
2. **キャッシュをクリア**
   ```bash
   npx expo start -c
   ```
3. **アプリを再読み込み**
   - Expo Goアプリを完全に終了して再起動

### データベースエラーの場合
```bash
# Dockerコンテナを再起動
docker-compose down
docker-compose up -d

# データベースを初期化（必要な場合）
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE aiapp_dev;"
```

## 開発のヒント

### ホットリロード
- コードを変更すると自動的にアプリが更新されます
- 手動でリロード: Expo Goアプリを振る

### デバッグ
- ターミナルで `j` キーを押してデバッガーを開く
- React Developer Toolsが使用可能

### ログの確認
- バックエンド: `packages/back`のターミナル
- フロントエンド: `packages/mobile`のターミナル
- Expo Goアプリ内のログも確認可能

## 停止方法
1. Expoサーバー: `Ctrl + C`
2. バックエンドサーバー: `Ctrl + C`
3. Dockerサービス: `docker-compose down`

## サンプルアカウント
テスト用のアカウントを作成するか、新規登録機能を使用してください。

---

## 注意事項
- 本番環境では適切なセキュリティ設定を行ってください
- JWT_SECRETは必ず変更してください
- APIキーは環境変数で管理してください