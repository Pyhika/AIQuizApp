import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  Res,
  Header,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('learning-history')
  @UseGuards(JwtAuthGuard)
  async exportLearningHistory(
    @Request() req: any,
    @Query('format') format: 'csv' | 'json' = 'csv',
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const data = await this.exportService.exportUserLearningHistory(
        userId,
        format,
      );

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="learning-history.json"',
        );
        res.send(JSON.stringify(data, null, 2));
      } else {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="learning-history.csv"',
        );
        // BOMを追加してExcelで文字化けを防ぐ
        res.send('\uFEFF' + data);
      }
    } catch (error) {
      throw new BadRequestException(
        `エクスポートに失敗しました: ${error.message}`,
      );
    }
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  async exportStatistics(
    @Request() req: any,
    @Query('format') format: 'csv' | 'json' = 'csv',
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const data = await this.exportService.exportQuizStatistics(
        userId,
        format,
      );

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="quiz-statistics.json"',
        );
        res.send(JSON.stringify(data, null, 2));
      } else {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="quiz-statistics.csv"',
        );
        // BOMを追加してExcelで文字化けを防ぐ
        res.send('\uFEFF' + data);
      }
    } catch (error) {
      throw new BadRequestException(
        `エクスポートに失敗しました: ${error.message}`,
      );
    }
  }

  @Get('quizzes-by-category')
  async exportQuizzesByCategory(
    @Query('category') category: string,
    @Query('format') format: 'csv' | 'json' = 'csv',
    @Res() res: Response,
  ) {
    try {
      if (!category) {
        throw new BadRequestException('カテゴリを指定してください');
      }

      const data = await this.exportService.exportQuizzesByCategory(
        category,
        format,
      );

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${category}-quizzes.json"`,
        );
        res.send(JSON.stringify(data, null, 2));
      } else {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${category}-quizzes.csv"`,
        );
        // BOMを追加してExcelで文字化けを防ぐ
        res.send('\uFEFF' + data);
      }
    } catch (error) {
      throw new BadRequestException(
        `エクスポートに失敗しました: ${error.message}`,
      );
    }
  }
}
