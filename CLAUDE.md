# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered quiz application with a microservices architecture - **AllAI Project**.

### Project Structure
- `packages/back/` - NestJS backend API with TypeScript
- `packages/mobile/` - React Native/Expo mobile application
- `packages/front-web-backup/` - Next.js web frontend (backup version)
- `docker-compose.yml` - Docker configuration for PostgreSQL, Redis, and backend services

## 開発ルール

### 基本原則
- **既存ファイルの編集を優先** - 新規ファイル作成は最小限に
- **ドキュメント作成は明示的な要求時のみ** - *.mdファイルやREADMEは要求されない限り作成しない
- **コード変更前に必ず関連ファイルを読み込む** - コンテキストを理解してから編集
- **テスト実行を忘れない** - 変更後は必ず関連テストを実行

### コード変更のワークフロー
1. 変更対象ファイルをReadツールで確認
2. 関連するテストファイルの存在確認
3. 変更実施
4. lintとテストの実行
5. TypeScriptコンパイルチェック

## Git/GitHubブランチ管理

### ブランチ戦略
- **mainブランチ**: 本番環境相当。直接の変更は禁止
- **developブランチ**: 開発の統合ブランチ。全ての機能開発はここから分岐
- **feature/**: 新機能開発用ブランチ（例: feature/user-authentication）
- **bugfix/**: バグ修正用ブランチ（例: bugfix/login-error）
- **hotfix/**: 緊急修正用ブランチ（mainから分岐）

### 開発フロー
1. **ブランチの作成**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/機能名  # または bugfix/バグ名
   ```

2. **開発作業**
   - コードの変更を実施
   - 定期的にコミット（小さな単位で）
   - コミットメッセージは明確に

3. **テスト実施（必須）**
   - 単体テストの実行と確認
   - 結合テストの実行と確認
   - テストが全て通ることを確認

4. **developブランチへのマージ**
   ```bash
   # テストが全て通った後のみ実行
   git checkout develop
   git merge feature/機能名
   ```

5. **システムテスト**
   - developブランチでシステム全体のテストを実施
   - エンドツーエンドテストの実行
   - 手動での動作確認

6. **mainブランチへのマージ**
   ```bash
   # システムテストが問題ない場合のみ
   git checkout main
   git merge develop
   ```

### マージ前のチェックリスト
- [ ] 単体テストが全て通る
- [ ] 結合テストが全て通る
- [ ] lintエラーがない
- [ ] TypeScriptコンパイルエラーがない
- [ ] コードレビュー（可能な場合）

### 問題発生時の対応
1. マージ後に問題が発見された場合は、新しいbugfixブランチを作成
2. 修正を実施し、同じフローでテスト→マージを実行
3. hotfixが必要な場合は、mainブランチから直接分岐し、修正後mainとdevelopの両方にマージ

### コミットメッセージ規約
- feat: 新機能の追加
- fix: バグ修正
- docs: ドキュメントのみの変更
- style: コードの意味に影響しない変更（空白、フォーマット等）
- refactor: バグ修正や機能追加を伴わないコード変更
- test: テストの追加や修正
- chore: ビルドプロセスやツールの変更

例: `feat: ユーザー認証機能を追加`

## コーディング規約

### TypeScript/JavaScript
- 型定義は厳密に（any型の使用は避ける）
- インターフェースと型エイリアスを適切に使い分け
- nullish coalescing (`??`) と optional chaining (`?.`) を活用
- async/awaitパターンを優先

### React Native/Expo (Mobile)
- 関数コンポーネントで統一
- カスタムフックでロジックを分離
- React Native Paperのコンポーネントを優先使用
- スタイルはStyleSheet.createを使用

### NestJS (Backend)
- DIパターンを厳守
- DTOでリクエスト/レスポンスの型を定義
- Guardで認証・認可を実装
- サービス層でビジネスロジックを実装

### エラーハンドリング
- 各層で適切なエラー処理を実装
- カスタム例外クラスを活用
- ユーザーに適切なエラーメッセージを返す

## Development Commands

### Backend (packages/back)
```bash
cd packages/back
pnpm install              # Install dependencies
pnpm run start:dev        # Development server with hot reload
pnpm run start:prod       # Production server
pnpm run test            # Run unit tests
pnpm run test:e2e        # Run end-to-end tests
pnpm run test:cov        # Generate test coverage
pnpm run lint            # Run ESLint with auto-fix
pnpm run format          # Format code with Prettier
```

### Mobile App (packages/mobile)
```bash
cd packages/mobile
npm install              # Install dependencies
npx expo start          # Start development server
npx expo start --android # Run on Android emulator
npx expo start --ios    # Run on iOS simulator
npx expo start --web    # Run in web browser
eas build               # Create production builds
eas submit              # Submit to app stores
```

### Web Frontend (packages/front-web-backup)
```bash
cd packages/front-web-backup
npm install              # Install dependencies
npm run dev             # Start Next.js development server
npm run build           # Create production build
npm run start           # Run production server
npm run lint            # Run ESLint
```

### Infrastructure
```bash
# From project root
docker-compose up       # Start all services (PostgreSQL, Redis, Backend)
docker-compose down     # Stop all services
npm run dev            # Start development environment with script
```

## Architecture Overview

### Backend Architecture
- **Framework**: NestJS with modular architecture
- **Database**: PostgreSQL with TypeORM
- **Caching/Queue**: Redis for session management and job queues
- **Authentication**: JWT tokens with Passport.js
- **AI Integration**: Services for OpenAI and Anthropic Claude APIs
- **Key Modules**:
  - `auth/` - Authentication and authorization
  - `users/` - User management
  - `quizzes/` - Quiz creation and management
  - `quiz-attempts/` - User quiz performance tracking
  - `ai/` - AI service integration for quiz generation

### Mobile App Architecture
- **Navigation**: Expo Router with file-based routing in `app/` directory
- **State Management**: Zustand stores in `contexts/`
- **UI Components**: React Native Paper with custom components in `components/`
- **Services**: API client and utilities in `services/`
- **Screens**: Feature screens in `screens/`
- **Assets**: Images and fonts in `assets/`

### Data Model
Key entities and their relationships:
- **User**: Authentication, profile, and quiz history
- **Quiz**: Questions with various types (multiple choice, true/false, short answer)
- **QuizAttempt**: Tracks user performance and answers
- **Question**: Individual quiz questions with difficulty levels

## セキュリティ規約

### 認証・認可
- JWT tokenの適切な有効期限設定
- Refresh tokenの実装
- Guardによるルート保護
- CSRF対策の実装

### データ保護
- 環境変数は.envファイルで管理（絶対にコミットしない）
- APIキーや認証情報のハードコーディング禁止
- パスワードはbcryptでハッシュ化
- SQLインジェクション対策：TypeORMのクエリビルダー使用
- XSS対策：入力値のサニタイゼーション

### API セキュリティ
- Rate limitingの実装
- CORS設定の適切な管理
- HTTPSの使用（本番環境）

## AI Integration Guidelines

### API使用の注意事項
- OpenAI/Anthropic APIのレート制限を考慮
- エラーレスポンスの適切なハンドリング
- タイムアウト設定の実装
- リトライロジックの実装

### コスト最適化
- 適切なモデル選択（gpt-3.5-turbo vs gpt-4）
- レスポンスのキャッシュ実装
- プロンプトの最適化
- トークン使用量のモニタリング

### データ処理
- 構造化されたJSON形式でのレスポンス処理
- バリデーションの実装
- エラー時のフォールバック処理

## Environment Configuration

### Backend (.env)
Required environment variables:
```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=user
DB_PASSWORD=password
DB_NAME=dbname

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# AI APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Mobile App
Configuration in `app.json` and `eas.json` for:
- API endpoints
- Build configurations
- App store metadata

## Testing Strategy

### Backend Testing
- Unit tests for services and controllers
- E2E tests for API endpoints
- Use `pnpm run test:watch` for TDD development
- Run specific test: `pnpm run test -- --testNamePattern="pattern"`

### Mobile Testing
- Component testing with React Native Testing Library
- Integration tests for navigation flows
- Manual testing on iOS/Android simulators

### 実機テスト

#### テスト環境
- **iOS端末**:
  - iPhone 16
  - iPad Pro 11インチ
- **テストアプリ**: Expo Go
- **ネットワーク環境**:
  - WiFi環境でのテスト
  - モバイルネットワーク（4G/5G）でのテスト
  - 異なるネットワーク環境からの接続テスト

#### 実機テスト手順
1. **Expo開発サーバーの起動**
   ```bash
   cd packages/mobile
   npx expo start
   ```

2. **接続設定**
   - QRコードをExpo Goアプリでスキャン
   - または同一ネットワーク内で自動検出
   - トンネル接続の使用（異なるネットワークの場合）:
     ```bash
     npx expo start --tunnel
     ```

3. **テスト項目**
   - **iPhone 16でのテスト**:
     - 画面サイズの適応確認
     - タッチレスポンスの確認
     - カメラ機能の動作確認
     - Face ID連携の確認（該当する場合）
   
   - **iPad Pro 11インチでのテスト**:
     - タブレットレイアウトの確認
     - 画面回転時の表示確認
     - Split View対応の確認
     - Apple Pencil対応の確認（該当する場合）

4. **ネットワーク環境別テスト**
   - **WiFi環境**:
     - 通常の動作確認
     - 大容量データの送受信テスト
   
   - **モバイルネットワーク**:
     - 低速環境での動作確認
     - データ使用量の確認
     - オフライン時の動作確認

#### 実機テストチェックリスト
- [ ] iPhone 16での全画面・全機能の動作確認
- [ ] iPad Pro 11インチでのレイアウト確認
- [ ] WiFi環境での接続テスト
- [ ] モバイルネットワークでの接続テスト
- [ ] 異なるネットワーク環境からの接続テスト（トンネル使用）
- [ ] プッシュ通知の動作確認（該当する場合）
- [ ] バックグラウンド動作の確認
- [ ] メモリ使用量の確認
- [ ] バッテリー消費の確認

#### トラブルシューティング
- **Expo Goで接続できない場合**:
  - 開発マシンとデバイスが同一ネットワークにあることを確認
  - ファイアウォール設定を確認
  - `npx expo start --tunnel`でトンネル接続を試す
  - Expo Goアプリを最新版に更新

- **パフォーマンス問題**:
  - React Native Debuggerを無効化して確認
  - プロダクションビルドでテスト: `npx expo start --no-dev --minify`

### テスト実行ルール
1. **バックエンド変更後**:
   ```bash
   pnpm run lint
   pnpm run test
   tsc --noEmit
   ```

2. **モバイルアプリ変更後**:
   ```bash
   npm run lint  # if configured
   # 該当するスクリーンの手動テスト
   ```

3. **コミット前チェックリスト**:
   - [ ] lintエラーがない
   - [ ] テストが全て通る
   - [ ] TypeScriptコンパイルエラーがない
   - [ ] 環境変数のハードコーディングがない

## Code Quality

### Before committing:
1. Backend: Run `pnpm run lint` and `pnpm run format`
2. Mobile: Run `npm run lint` if configured
3. Ensure all tests pass
4. Check TypeScript compilation: `tsc --noEmit`

### コードレビューチェックポイント
- 命名規則の一貫性
- 適切なエラーハンドリング
- パフォーマンスの考慮
- セキュリティベストプラクティスの遵守
- テストカバレッジ

## Docker Development

The project uses Docker Compose for local development:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 3000

Start with: `docker-compose up -d`
View logs: `docker-compose logs -f [service-name]`

## トラブルシューティング

### よくある問題と解決方法
1. **ポート競合**: 既存のサービスを停止するか、docker-compose.ymlでポート変更
2. **依存関係エラー**: `pnpm install`または`npm install`を再実行
3. **TypeScriptエラー**: `tsc --noEmit`でエラー詳細を確認
4. **Docker関連**: `docker-compose down -v`で完全リセット

## データベース操作の注意事項

### マイグレーション
- **本番データベースへの直接変更は禁止**
- マイグレーションファイルは必ずTypeORMで生成
- マイグレーション実行前にバックアップを取得
- ロールバック計画を事前に準備

### クエリ最適化
- N+1問題を避けるため、適切にrelationsを使用
- 大量データ取得時はページネーションを実装
- インデックスの適切な設定

## CI/CDパイプライン

### 自動化されるべきタスク
- コードのlint/format
- 単体テストの実行
- ビルドの成功確認
- セキュリティスキャン

### デプロイ前チェック
- [ ] 環境変数の確認
- [ ] データベースマイグレーションの準備
- [ ] ロールバック手順の確認
- [ ] 監視アラートの設定

## パフォーマンス最適化

### フロントエンド
- 画像の最適化（WebP形式の使用）
- 遅延ローディングの実装
- バンドルサイズの監視
- React.memoとuseMemoの適切な使用

### バックエンド
- APIレスポンスのキャッシュ戦略
- データベースクエリの最適化
- 非同期処理の活用
- Rate limitingの実装

## ログとモニタリング

### ログ規約
- エラーログは詳細なスタックトレースを含める
- 個人情報はログに記録しない
- 適切なログレベルの使用（error, warn, info, debug）
- 構造化ログの実装（JSON形式）

### モニタリング項目
- APIレスポンスタイム
- エラー率
- データベース接続数
- メモリ使用率

## ドキュメント管理

### 更新が必要なドキュメント
- API仕様書（Swagger/OpenAPI）
- データベーススキーマ図
- アーキテクチャ図
- 環境構築手順書

### コード内ドキュメント
- 複雑なビジネスロジックには必ずコメントを追加
- JSDocまたはTypeDocを使用した関数の説明
- TODOコメントには担当者と期限を記載

## 障害対応

### インシデント発生時の対応
1. 影響範囲の特定
2. 一時対応の実施
3. 根本原因の調査
4. 恒久対応の実施
5. 再発防止策の検討

### ロールバック手順
- デプロイバージョンの記録
- データベースバックアップの確認
- 前バージョンへの切り戻し手順
- 動作確認項目

## 重要な注意事項

- **このファイルはプロジェクトのルートに配置し、新しいClaudeCodeセッションで自動的に読み込まれます**
- **プロジェクト固有のルールやベストプラクティスを随時追加してください**
- **チーム全体で共有すべき知識はこのファイルに記載してください**