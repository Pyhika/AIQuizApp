# AIQuizApp

AI-powered quiz application with spaced repetition learning system.

## Architecture

- **Backend**: NestJS with TypeORM, PostgreSQL, Redis
- **Mobile**: React Native with Expo
- **Web**: Next.js (backup version)
- **Infrastructure**: Docker Compose for local development

## Git Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Individual feature development
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Development Flow

1. Create feature branch from `develop`
```bash
git checkout develop
git pull origin develop
git checkout -b feature/feature-name
```

2. Develop and commit changes
```bash
git add .
git commit -m "feat: description of changes"
```

3. Push feature branch
```bash
git push -u origin feature/feature-name
```

4. Create Pull Request to `develop`
5. After review, merge to `develop`
6. When ready for release, merge `develop` to `main`

## Commit Convention

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build process or auxiliary tool changes

## Feature Development Plan

### Phase 1 - Core Features
- [ ] Quiz Taking Screen (`feature/quiz-taking`)
- [ ] Learning Analytics Dashboard (`feature/analytics-dashboard`)
- [ ] Review System UI (`feature/review-system`)
- [ ] Environment Configuration (`feature/env-config`)

### Phase 2 - Enhanced Features
- [ ] Chat/AI Assistant (`feature/ai-assistant`)
- [ ] User Profile Management (`feature/user-profile`)
- [ ] Database Migrations (`feature/db-migrations`)
- [ ] API Documentation (`feature/api-docs`)

### Phase 3 - Optimization
- [ ] Error Handling (`feature/error-handling`)
- [ ] Caching Strategy (`feature/caching`)
- [ ] Performance Optimization (`feature/performance`)

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- pnpm (for backend)
- npm (for mobile/web)

### Setup

1. Clone repository
```bash
git clone https://github.com/Pyhika/AIQuizApp.git
cd AIQuizApp
```

2. Install dependencies
```bash
# Backend
cd packages/back
pnpm install

# Mobile
cd ../mobile
npm install
```

3. Start development environment
```bash
# From root directory
docker-compose up -d

# Backend
cd packages/back
pnpm run start:dev

# Mobile
cd packages/mobile
npx expo start
```

## Contributing

1. Follow the Git workflow described above
2. Ensure all tests pass before creating PR
3. Update documentation as needed
4. Request review from team members

## License

Private repository - All rights reserved