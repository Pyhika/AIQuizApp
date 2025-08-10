import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizAttempt } from '../entities/quiz-attempt.entity';
import { Quiz, QuizDifficulty } from '../entities/quiz.entity';

export enum UserLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

@Injectable()
export class QuizDifficultyService {
  constructor(
    @InjectRepository(QuizAttempt)
    private quizAttemptRepository: Repository<QuizAttempt>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
  ) {}

  async calculateUserLevel(userId: string): Promise<UserLevel> {
    const recentAttempts = await this.quizAttemptRepository.find({
      where: { user: { id: userId } },
      order: { startedAt: 'DESC' },
      take: 10,
    });

    if (recentAttempts.length === 0) {
      return UserLevel.BEGINNER;
    }

    const averageScore =
      recentAttempts.reduce((sum, attempt) => sum + attempt.score, 0) /
      recentAttempts.length;

    if (averageScore >= 80) {
      return UserLevel.ADVANCED;
    } else if (averageScore >= 60) {
      return UserLevel.INTERMEDIATE;
    } else {
      return UserLevel.BEGINNER;
    }
  }

  async getAdaptiveQuizzes(
    userId: string,
    category?: string,
    limit: number = 10,
  ): Promise<Quiz[]> {
    const userLevel = await this.calculateUserLevel(userId);

    const difficultyDistribution = this.getDifficultyDistribution(userLevel);

    const quizzes: Quiz[] = [];

    for (const [difficulty, count] of Object.entries(difficultyDistribution)) {
      const query = this.quizRepository
        .createQueryBuilder('quiz')
        .where('quiz.difficulty = :difficulty', { difficulty })
        .andWhere('quiz.isActive = :isActive', { isActive: true });

      if (category) {
        query.andWhere('quiz.category = :category', { category });
      }

      const difficultyQuizzes = await query
        .orderBy('RANDOM()')
        .take(count)
        .getMany();

      quizzes.push(...difficultyQuizzes);
    }

    if (quizzes.length < limit) {
      const query = this.quizRepository
        .createQueryBuilder('quiz')
        .where('quiz.isActive = :isActive', { isActive: true });

      if (category) {
        query.andWhere('quiz.category = :category', { category });
      }

      if (quizzes.length > 0) {
        query.andWhere('quiz.id NOT IN (:...excludeIds)', {
          excludeIds: quizzes.map((q) => q.id),
        });
      }

      const remainingQuizzes = await query
        .orderBy('RANDOM()')
        .take(limit - quizzes.length)
        .getMany();

      quizzes.push(...remainingQuizzes);
    }

    return quizzes.sort(() => Math.random() - 0.5).slice(0, limit);
  }

  private getDifficultyDistribution(
    userLevel: UserLevel,
  ): Record<QuizDifficulty, number> {
    switch (userLevel) {
      case UserLevel.BEGINNER:
        return {
          [QuizDifficulty.EASY]: 6,
          [QuizDifficulty.MEDIUM]: 3,
          [QuizDifficulty.HARD]: 1,
        };
      case UserLevel.INTERMEDIATE:
        return {
          [QuizDifficulty.EASY]: 2,
          [QuizDifficulty.MEDIUM]: 5,
          [QuizDifficulty.HARD]: 3,
        };
      case UserLevel.ADVANCED:
        return {
          [QuizDifficulty.EASY]: 1,
          [QuizDifficulty.MEDIUM]: 3,
          [QuizDifficulty.HARD]: 6,
        };
    }
  }

  async getUserStatistics(userId: string) {
    const attempts = await this.quizAttemptRepository.find({
      where: { user: { id: userId } },
      relations: ['quiz'],
      order: { startedAt: 'DESC' },
    });

    const totalAttempts = attempts.length;
    const averageScore =
      totalAttempts > 0
        ? attempts.reduce((sum, attempt) => sum + attempt.score, 0) /
          totalAttempts
        : 0;

    const difficultyScores: Record<string, { total: number; correct: number }> =
      {
        easy: { total: 0, correct: 0 },
        medium: { total: 0, correct: 0 },
        hard: { total: 0, correct: 0 },
      };

    for (const attempt of attempts) {
      if (attempt.quiz && attempt.quiz.difficulty) {
        const diff = attempt.quiz.difficulty.toLowerCase();
        if (diff in difficultyScores) {
          difficultyScores[diff].total++;
          if (attempt.score >= 70) {
            difficultyScores[diff].correct++;
          }
        }
      }
    }

    const userLevel = await this.calculateUserLevel(userId);

    return {
      totalAttempts,
      averageScore,
      userLevel,
      difficultyPerformance: difficultyScores,
      recentProgress: attempts.slice(0, 5).map((attempt) => ({
        date: attempt.startedAt,
        score: attempt.score,
        quizTitle: attempt.quiz?.title || 'Unknown Quiz',
      })),
    };
  }
}
