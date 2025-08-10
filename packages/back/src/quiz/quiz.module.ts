import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { QuizAttemptController } from './quiz-attempt.controller';
import { QuizAttemptService } from './quiz-attempt.service';
import { QuizDifficultyService } from '../quiz-attempts/quiz-difficulty.service';
import { Quiz } from '../entities/quiz.entity';
import { QuizAttempt } from '../entities/quiz-attempt.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Quiz, QuizAttempt, User])],
  controllers: [QuizController, QuizAttemptController],
  providers: [QuizService, QuizAttemptService, QuizDifficultyService],
  exports: [QuizService, QuizAttemptService, QuizDifficultyService],
})
export class QuizModule {}
