import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizAttempt } from '../entities/quiz-attempt.entity';
import { Quiz } from '../entities/quiz.entity';
import { User } from '../entities/user.entity';
import { Parser } from 'json2csv';

export interface ExportData {
  attemptDate: string;
  quizTitle: string;
  quizCategory: string;
  quizDifficulty: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  score: number;
  timeSpent: number;
  attemptNumber: number;
  confidence: number;
}

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(QuizAttempt)
    private quizAttemptRepository: Repository<QuizAttempt>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async exportUserLearningHistory(userId: string, format: 'csv' | 'json' = 'csv'): Promise<string | object[]> {
    const attempts = await this.quizAttemptRepository.find({
      where: { user: { id: userId } },
      relations: ['quiz', 'user'],
      order: { createdAt: 'DESC' },
    });

    const exportData: ExportData[] = attempts.map(attempt => ({
      attemptDate: attempt.createdAt.toISOString(),
      quizTitle: attempt.quiz?.title || 'Unknown Quiz',
      quizCategory: attempt.quiz?.category || 'Uncategorized',
      quizDifficulty: attempt.quiz?.difficulty || 'Unknown',
      userAnswer: attempt.userAnswer,
      correctAnswer: attempt.quiz?.correctAnswer || '',
      isCorrect: attempt.isCorrect,
      score: attempt.score,
      timeSpent: attempt.timeSpent,
      attemptNumber: attempt.attemptNumber,
      confidence: attempt.confidence,
    }));

    if (format === 'json') {
      return exportData;
    }

    // CSV形式に変換
    const fields = [
      { label: '回答日時', value: 'attemptDate' },
      { label: 'クイズタイトル', value: 'quizTitle' },
      { label: 'カテゴリ', value: 'quizCategory' },
      { label: '難易度', value: 'quizDifficulty' },
      { label: 'ユーザー回答', value: 'userAnswer' },
      { label: '正解', value: 'correctAnswer' },
      { label: '正誤', value: 'isCorrect' },
      { label: 'スコア', value: 'score' },
      { label: '回答時間（秒）', value: 'timeSpent' },
      { label: '挑戦回数', value: 'attemptNumber' },
      { label: '自信度', value: 'confidence' },
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(exportData);

    return csv;
  }

  async exportQuizStatistics(userId: string, format: 'csv' | 'json' = 'csv'): Promise<string | object> {
    const attempts = await this.quizAttemptRepository.find({
      where: { user: { id: userId } },
      relations: ['quiz'],
    });

    // カテゴリ別統計
    const categoryStats: Record<string, { total: number; correct: number; avgScore: number }> = {};
    
    // 難易度別統計
    const difficultyStats: Record<string, { total: number; correct: number; avgScore: number }> = {};
    
    // 全体統計
    let totalAttempts = 0;
    let totalCorrect = 0;
    let totalScore = 0;

    for (const attempt of attempts) {
      totalAttempts++;
      if (attempt.isCorrect) totalCorrect++;
      totalScore += attempt.score;

      // カテゴリ別集計
      const category = attempt.quiz?.category || 'Uncategorized';
      if (!categoryStats[category]) {
        categoryStats[category] = { total: 0, correct: 0, avgScore: 0 };
      }
      categoryStats[category].total++;
      if (attempt.isCorrect) categoryStats[category].correct++;
      categoryStats[category].avgScore += attempt.score;

      // 難易度別集計
      const difficulty = attempt.quiz?.difficulty || 'Unknown';
      if (!difficultyStats[difficulty]) {
        difficultyStats[difficulty] = { total: 0, correct: 0, avgScore: 0 };
      }
      difficultyStats[difficulty].total++;
      if (attempt.isCorrect) difficultyStats[difficulty].correct++;
      difficultyStats[difficulty].avgScore += attempt.score;
    }

    // 平均スコアの計算
    for (const category in categoryStats) {
      categoryStats[category].avgScore = categoryStats[category].avgScore / categoryStats[category].total;
    }
    for (const difficulty in difficultyStats) {
      difficultyStats[difficulty].avgScore = difficultyStats[difficulty].avgScore / difficultyStats[difficulty].total;
    }

    const statistics = {
      overall: {
        totalAttempts,
        totalCorrect,
        correctRate: totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0,
        averageScore: totalAttempts > 0 ? totalScore / totalAttempts : 0,
      },
      byCategory: categoryStats,
      byDifficulty: difficultyStats,
    };

    if (format === 'json') {
      return statistics;
    }

    // CSV形式に変換（統計サマリー）
    const summaryData = [
      {
        metric: '総回答数',
        value: statistics.overall.totalAttempts,
      },
      {
        metric: '正解数',
        value: statistics.overall.totalCorrect,
      },
      {
        metric: '正答率（%）',
        value: statistics.overall.correctRate.toFixed(2),
      },
      {
        metric: '平均スコア',
        value: statistics.overall.averageScore.toFixed(2),
      },
    ];

    // カテゴリ別データ
    for (const [category, stats] of Object.entries(categoryStats)) {
      summaryData.push({
        metric: `カテゴリ: ${category} - 回答数`,
        value: stats.total,
      });
      summaryData.push({
        metric: `カテゴリ: ${category} - 正答率（%）`,
        value: ((stats.correct / stats.total) * 100).toFixed(2),
      });
      summaryData.push({
        metric: `カテゴリ: ${category} - 平均スコア`,
        value: stats.avgScore.toFixed(2),
      });
    }

    // 難易度別データ
    for (const [difficulty, stats] of Object.entries(difficultyStats)) {
      summaryData.push({
        metric: `難易度: ${difficulty} - 回答数`,
        value: stats.total,
      });
      summaryData.push({
        metric: `難易度: ${difficulty} - 正答率（%）`,
        value: ((stats.correct / stats.total) * 100).toFixed(2),
      });
      summaryData.push({
        metric: `難易度: ${difficulty} - 平均スコア`,
        value: stats.avgScore.toFixed(2),
      });
    }

    const fields = [
      { label: '項目', value: 'metric' },
      { label: '値', value: 'value' },
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(summaryData);

    return csv;
  }

  async exportQuizzesByCategory(category: string, format: 'csv' | 'json' = 'csv'): Promise<string | object[]> {
    const quizzes = await this.quizRepository.find({
      where: { category, isActive: true },
      order: { createdAt: 'DESC' },
    });

    const quizData = quizzes.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      question: quiz.question,
      type: quiz.type,
      difficulty: quiz.difficulty,
      category: quiz.category,
      tags: quiz.tags?.join(', ') || '',
      correctAnswer: quiz.correctAnswer,
      explanation: quiz.explanation || '',
      createdAt: quiz.createdAt.toISOString(),
    }));

    if (format === 'json') {
      return quizData;
    }

    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'タイトル', value: 'title' },
      { label: '問題', value: 'question' },
      { label: 'タイプ', value: 'type' },
      { label: '難易度', value: 'difficulty' },
      { label: 'カテゴリ', value: 'category' },
      { label: 'タグ', value: 'tags' },
      { label: '正解', value: 'correctAnswer' },
      { label: '解説', value: 'explanation' },
      { label: '作成日時', value: 'createdAt' },
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(quizData);

    return csv;
  }
}