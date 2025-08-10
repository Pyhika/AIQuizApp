import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { QuizAttemptService, CreateQuizAttemptDto, QuizStatistics } from './quiz-attempt.service';
import { QuizAttempt } from '../entities/quiz-attempt.entity';
import { Quiz } from '../entities/quiz.entity';

@Controller('quiz-attempt')
export class QuizAttemptController {
  constructor(private readonly quizAttemptService: QuizAttemptService) { }

  // クイズ解答を記録
  @Post('submit')
  async submitAnswer(@Body() createAttemptDto: CreateQuizAttemptDto): Promise<QuizAttempt> {
    try {
      return await this.quizAttemptService.createAttempt(createAttemptDto);
    } catch (error) {
      throw new BadRequestException(`解答の記録に失敗しました: ${error.message}`);
    }
  }

  // ユーザーのクイズ統計情報を取得
  @Get('statistics/:userId/:quizId')
  async getQuizStatistics(
    @Param('userId') userId: string,
    @Param('quizId') quizId: string,
  ): Promise<QuizStatistics> {
    return this.quizAttemptService.getQuizStatistics(userId, quizId);
  }

  // 復習が必要なクイズを取得
  @Get('review/:userId')
  async getQuizzesForReview(@Param('userId') userId: string): Promise<Quiz[]> {
    return this.quizAttemptService.getQuizzesForReview(userId);
  }

  // ユーザーの解答履歴を取得
  @Get('history/:userId')
  async getUserAttempts(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ): Promise<QuizAttempt[]> {
    const parsedLimit = limit ? parseInt(limit) : 50;
    return this.quizAttemptService.getUserAttempts(userId, parsedLimit);
  }

  // 特定のクイズの解答履歴を取得
  @Get('quiz-history/:quizId')
  async getQuizAttempts(
    @Param('quizId') quizId: string,
    @Query('userId') userId?: string,
  ): Promise<QuizAttempt[]> {
    return this.quizAttemptService.getQuizAttempts(quizId, userId);
  }

  // タグ別の統計情報を取得
  @Get('statistics/tag/:userId/:tag')
  async getStatisticsByTag(
    @Param('userId') userId: string,
    @Param('tag') tag: string,
  ): Promise<any> {
    return this.quizAttemptService.getStatisticsByTag(userId, tag);
  }

  // カテゴリ別の統計情報を取得
  @Get('statistics/category/:userId/:category')
  async getStatisticsByCategory(
    @Param('userId') userId: string,
    @Param('category') category: string,
  ): Promise<any> {
    return this.quizAttemptService.getStatisticsByCategory(userId, category);
  }

  // ユーザーの学習ダッシュボード情報を取得
  @Get('dashboard/:userId')
  async getLearningDashboard(@Param('userId') userId: string): Promise<any> {
    const attempts = await this.quizAttemptService.getUserAttempts(userId, 100);
    const reviewQuizzes = await this.quizAttemptService.getQuizzesForReview(userId);

    // 全体的な統計情報を計算
    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter(attempt => attempt.isCorrect).length;
    const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;
    const averageTime = totalAttempts > 0
      ? attempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0) / totalAttempts
      : 0;

    // 最近の学習活動（過去7日）
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);
    const recentAttempts = attempts.filter(attempt =>
      new Date(attempt.createdAt) >= recentDate
    );

    // 学習ストリーク計算
    const learningStreak = this.calculateLearningStreak(attempts);

    return {
      totalAttempts,
      correctAttempts,
      accuracy: Math.round(accuracy * 100),
      averageTime: Math.round(averageTime),
      recentAttempts: recentAttempts.length,
      reviewCount: reviewQuizzes.length,
      learningStreak,
      lastStudyDate: attempts.length > 0 ? attempts[0].createdAt : null,
    };
  }

  // 学習の進捗レポートを取得
  @Get('progress/:userId')
  async getLearningProgress(
    @Param('userId') userId: string,
    @Query('days') days?: string,
  ): Promise<any> {
    const daysParsed = days ? parseInt(days) : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysParsed);

    const attempts = await this.quizAttemptService.getUserAttempts(userId, 1000);
    const filteredAttempts = attempts.filter(attempt =>
      new Date(attempt.createdAt) >= startDate
    );

    // 日別の学習活動を集計
    const dailyStats = this.aggregateDailyStats(filteredAttempts, daysParsed);

    return {
      period: `${daysParsed}日間`,
      dailyStats,
      totalQuizzes: filteredAttempts.length,
      averageAccuracy: this.calculateAverageAccuracy(filteredAttempts),
      improvementTrend: this.calculateImprovementTrend(filteredAttempts),
    };
  }

  // 学習ストリークを計算
  private calculateLearningStreak(attempts: QuizAttempt[]): number {
    if (attempts.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 日付順にソート
    const sortedAttempts = attempts.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // 連続学習日数を計算
    let currentDate = new Date(today);
    const studyDates = new Set<number>();

    sortedAttempts.forEach(attempt => {
      const attemptDate = new Date(attempt.createdAt);
      attemptDate.setHours(0, 0, 0, 0);
      studyDates.add(attemptDate.getTime());
    });

    const studyDatesArray = Array.from(studyDates).sort((a, b) => b - a);

    for (let i = 0; i < studyDatesArray.length; i++) {
      const studyDate = new Date(studyDatesArray[i]);
      if (studyDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (i === 0 && studyDate.getTime() === currentDate.getTime() - 86400000) {
        // 昨日の学習から始まる場合
        streak++;
        currentDate = new Date(studyDate);
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  // 日別統計を集計
  private aggregateDailyStats(attempts: QuizAttempt[], days: number): any[] {
    const dailyMap = new Map();

    // 指定期間の日付を初期化
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyMap.set(dateKey, {
        date: dateKey,
        attempts: 0,
        correct: 0,
        accuracy: 0,
      });
    }

    // 解答データを日別に集計
    attempts.forEach(attempt => {
      const dateKey = new Date(attempt.createdAt).toISOString().split('T')[0];
      if (dailyMap.has(dateKey)) {
        const dayStats = dailyMap.get(dateKey);
        dayStats.attempts++;
        if (attempt.isCorrect) {
          dayStats.correct++;
        }
        dayStats.accuracy = dayStats.attempts > 0 ? dayStats.correct / dayStats.attempts : 0;
      }
    });

    return Array.from(dailyMap.values()).reverse();
  }

  // 平均正解率を計算
  private calculateAverageAccuracy(attempts: QuizAttempt[]): number {
    if (attempts.length === 0) return 0;
    const correct = attempts.filter(attempt => attempt.isCorrect).length;
    return Math.round((correct / attempts.length) * 100);
  }

  // 改善傾向を計算
  private calculateImprovementTrend(attempts: QuizAttempt[]): string {
    if (attempts.length < 10) return 'データ不足';

    const sortedAttempts = attempts.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const firstHalf = sortedAttempts.slice(0, Math.floor(sortedAttempts.length / 2));
    const secondHalf = sortedAttempts.slice(Math.floor(sortedAttempts.length / 2));

    const firstHalfAccuracy = firstHalf.filter(a => a.isCorrect).length / firstHalf.length;
    const secondHalfAccuracy = secondHalf.filter(a => a.isCorrect).length / secondHalf.length;

    const improvement = secondHalfAccuracy - firstHalfAccuracy;

    if (improvement > 0.1) return '大幅改善';
    if (improvement > 0.05) return '改善中';
    if (improvement > -0.05) return '安定';
    return '要復習';
  }
}
