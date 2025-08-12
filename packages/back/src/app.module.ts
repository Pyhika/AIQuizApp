import { webcrypto } from 'crypto';

if (!global.crypto) {
  global.crypto = webcrypto as any;
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuizModule } from './quiz/quiz.module';
import { AuthModule } from './auth/auth.module';
import { ExportModule } from './export/export.module';
import { UsersModule } from './users/users.module';
import { Quiz } from './entities/quiz.entity';
import { User } from './entities/user.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import configuration from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configuration,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [Quiz, User, QuizAttempt],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
        ssl: configService.get('database.ssl'),
        autoLoadEntities: true,
      }),
    }),
    QuizModule,
    AuthModule,
    ExportModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
