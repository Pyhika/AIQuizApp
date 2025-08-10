import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizAttempt } from '../entities/quiz-attempt.entity';
import { Quiz } from '../entities/quiz.entity';
import { User } from '../entities/user.entity';

export interface CreateQuizAttemptDto {
  quizId: string;
  userId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent?: number;
  confidence?: number;
}

export interface QuizStatistics {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  averageTime: number;
  lastAttemptDate: Date;
  nextReviewDate?: Date;
}

@Injectable()
export class QuizAttemptService {
  constructor(
    @InjectRepository(QuizAttempt)
    private attemptRepository: Repository<QuizAttempt>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  // クイズ解答を記録
  async createAttempt(createAttemptDto: CreateQuizAttemptDto): Promise<QuizAttempt> {
    const quiz = await this.quizRepository.findOne({
      where: { id: createAttemptDto.quizId },
    });
    const user = await this.userRepository.findOne({
      where: { id: createAttemptDto.userId },
    });

    if (!quiz || !user) {
      throw new Error('クイズまたはユーザーが見つかりません');
    }

    // 過去の解答回数を取得
    const previousAttempts = await this.attemptRepository.count({
      where: { quiz: { id: createAttemptDto.quizId }, user: { id: createAttemptDto.userId } },
    });

    // 次回復習日を計算（間隔反復学習アルゴリズム）
    const nextReviewDate = this.calculateNextReviewDate(
      createAttemptDto.isCorrect,
      previousAttempts,
      createAttemptDto.confidence || 0.5,
    );

    const attempt = this.attemptRepository.create({
      quiz,
      user,
      userAnswer: createAttemptDto.userAnswer,
      isCorrect: createAttemptDto.isCorrect,
      timeSpent: createAttemptDto.timeSpent || 0,
      attemptNumber: previousAttempts + 1,
      nextReviewDate,
      intervalDays: this.calculateIntervalDays(createAttemptDto.isCorrect, previousAttempts),
      confidence: createAttemptDto.confidence || 0.5,
    });

    return this.attemptRepository.save(attempt);
  }

  // ユーザーのクイズ統計情報を取得
  async getQuizStatistics(userId: string, quizId: string): Promise<QuizStatistics> {
    const attempts = await this.attemptRepository.find({
      where: { user: { id: userId }, quiz: { id: quizId } },
      order: { createdAt: 'DESC' },
    });

    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter(attempt => attempt.isCorrect).length;
    const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;
    const averageTime = totalAttempts > 0
      ? attempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0) / totalAttempts
      : 0;

    const lastAttempt = attempts[0];

    return {
      totalAttempts,
      correctAttempts,
      accuracy,
      averageTime,
      lastAttemptDate: lastAttempt?.createdAt,
      nextReviewDate: lastAttempt?.nextReviewDate,
    };
  }

  // 復習が必要なクイズを取得
  async getQuizzesForReview(userId: string): Promise<Quiz[]> {
    const now = new Date();
    const attempts = await this.attemptRepository
      .createQueryBuilder('attempt')
      .leftJoinAndSelect('attempt.quiz', 'quiz')
      .where('attempt.userId = :userId', { userId })
      .andWhere('attempt.nextReviewDate <= :now', { now })
      .andWhere('quiz.isActive = :isActive', { isActive: true })
      .orderBy('attempt.nextReviewDate', 'ASC')
      .getMany();

    return attempts.map(attempt => attempt.quiz);
  }

  // タグ別のクイズ統計
  async getStatisticsByTag(userId: string, tag: string): Promise<any> {
    const result = await this.attemptRepository
      .createQueryBuilder('attempt')
      .leftJoin('attempt.quiz', 'quiz')
      .where('attempt.userId = :userId', { userId })
      .andWhere('JSON_CONTAINS(quiz.tags, :tag)', { tag: JSON.stringify(tag) })
      .select([
        'COUNT(*) as totalAttempts',
        'SUM(CASE WHEN attempt.isCorrect = 1 THEN 1 ELSE 0 END) as correctAttempts',
        'AVG(attempt.timeSpent) as averageTime',
        'AVG(attempt.confidence) as averageConfidence',
      ])
      .getRawOne();

    return {
      tag,
      totalAttempts: parseInt(result.totalAttempts) || 0,
      correctAttempts: parseInt(result.correctAttempts) || 0,
      accuracy: result.totalAttempts > 0 ? result.correctAttempts / result.totalAttempts : 0,
      averageTime: parseFloat(result.averageTime) || 0,
      averageConfidence: parseFloat(result.averageConfidence) || 0,
    };
  }

  // カテゴリ別のクイズ統計
  async getStatisticsByCategory(userId: string, category: string): Promise<any> {
    const result = await this.attemptRepository
      .createQueryBuilder('attempt')
      .leftJoin('attempt.quiz', 'quiz')
      .where('attempt.userId = :userId', { userId })
      .andWhere('quiz.category = :category', { category })
      .select([
        'COUNT(*) as totalAttempts',
        'SUM(CASE WHEN attempt.isCorrect = 1 THEN 1 ELSE 0 END) as correctAttempts',
        'AVG(attempt.timeSpent) as averageTime',
        'AVG(attempt.confidence) as averageConfidence',
      ])
      .getRawOne();

    return {
      category,
      totalAttempts: parseInt(result.totalAttempts) || 0,
      correctAttempts: parseInt(result.correctAttempts) || 0,
      accuracy: result.totalAttempts > 0 ? result.correctAttempts / result.totalAttempts : 0,
      averageTime: parseFloat(result.averageTime) || 0,
      averageConfidence: parseFloat(result.averageConfidence) || 0,
    };
  }

  // 間隔反復学習アルゴリズム：次回復習日を計算
  private calculateNextReviewDate(isCorrect: boolean, attemptCount: number, confidence: number): Date {
    const now = new Date();
    const intervalDays = this.calculateIntervalDays(isCorrect, attemptCount, confidence);

    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + intervalDays);

    return nextDate;
  }

  // 復習間隔を計算（間隔反復学習）
  private calculateIntervalDays(isCorrect: boolean, attemptCount: number, confidence: number = 0.5): number {
    if (!isCorrect) {
      // 間違えた場合は短い間隔で復習
      return Math.max(1, Math.floor(confidence * 3));
    }

    // 正解の場合、間隔を伸ばす
    const baseInterval = Math.pow(2, attemptCount); // 指数的に増加
    const confidenceMultiplier = 0.5 + confidence; // 自信度によって調整

    return Math.min(30, Math.floor(baseInterval * confidenceMultiplier)); // 最大30日
  }

  // ユーザーの全クイズ解答履歴を取得
  async getUserAttempts(userId: string, limit: number = 50): Promise<QuizAttempt[]> {
    return this.attemptRepository.find({
      where: { user: { id: userId } },
      relations: ['quiz'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // 特定のクイズの解答履歴を取得
  async getQuizAttempts(quizId: string, userId?: string): Promise<QuizAttempt[]> {
    const where: any = { quiz: { id: quizId } };
    if (userId) {
      where.user = { id: userId };
    }

    return this.attemptRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}
