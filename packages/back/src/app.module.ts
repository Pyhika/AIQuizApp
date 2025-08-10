import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuizModule } from './quiz/quiz.module';
import { AuthModule } from './auth/auth.module';
import { ExportModule } from './export/export.module';
import { Quiz } from './entities/quiz.entity';
import { User } from './entities/user.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'postgres',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USERNAME || 'appuser',
      password: process.env.DATABASE_PASSWORD || 'apppass',
      database: process.env.DATABASE_NAME || 'appdb',
      entities: [Quiz, User, QuizAttempt],
      synchronize: process.env.NODE_ENV === 'development', // 本番環境では false にする
      logging: process.env.NODE_ENV === 'development',
    }),
    QuizModule,
    AuthModule,
    ExportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
