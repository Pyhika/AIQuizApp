import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { QuizService, CreateQuizDto, GenerateQuizDto } from './quiz.service';
import { Quiz, QuizDifficulty } from '../entities/quiz.entity';
import { QuizDifficultyService } from '../quiz-attempts/quiz-difficulty.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('quiz')
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly difficultyService: QuizDifficultyService,
  ) { }

  // 全クイズ取得
  @Get()
  async getAllQuizzes(): Promise<Quiz[]> {
    return this.quizService.findAll();
  }

  // 高度な検索（タグ、カテゴリ、難易度、テキスト検索）
  @Get('search')
  async searchQuizzes(
    @Query('tags') tags?: string,
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: QuizDifficulty,
    @Query('searchText') searchText?: string,
  ): Promise<Quiz[]> {
    const filters: any = {};

    if (tags) {
      filters.tags = tags.split(',').map(tag => tag.trim());
    }
    if (category) {
      filters.category = category;
    }
    if (difficulty) {
      filters.difficulty = difficulty;
    }
    if (searchText) {
      filters.searchText = searchText;
    }

    return this.quizService.searchQuizzes(filters);
  }

  // 利用可能な全タグを取得
  @Get('metadata/tags')
  async getAllTags(): Promise<{ tags: string[] }> {
    const tags = await this.quizService.getAllTags();
    return { tags };
  }

  // 利用可能な全カテゴリを取得
  @Get('metadata/categories')
  async getAllCategories(): Promise<{ categories: string[] }> {
    const categories = await this.quizService.getAllCategories();
    return { categories };
  }

  // タグでクイズ検索
  @Get('tags/:tags')
  async getQuizzesByTags(@Param('tags') tagsParam: string): Promise<Quiz[]> {
    const tags = tagsParam.split(',').map(tag => tag.trim());
    return this.quizService.findByTags(tags);
  }

  // IDでクイズ取得
  @Get(':id')
  async getQuiz(@Param('id') id: string): Promise<Quiz> {
    const quiz = await this.quizService.findOne(id);
    if (!quiz) {
      throw new BadRequestException('指定されたクイズが見つかりません');
    }
    return quiz;
  }

  // カテゴリ別クイズ取得
  @Get('category/:category')
  async getQuizzesByCategory(@Param('category') category: string): Promise<Quiz[]> {
    return this.quizService.findByCategory(category);
  }

  // 難易度別クイズ取得
  @Get('difficulty/:difficulty')
  async getQuizzesByDifficulty(@Param('difficulty') difficulty: QuizDifficulty): Promise<Quiz[]> {
    return this.quizService.findByDifficulty(difficulty);
  }

  // ユーザーレベルに応じたアダプティブクイズ取得
  @Get('adaptive')
  @UseGuards(JwtAuthGuard)
  async getAdaptiveQuizzes(
    @Request() req,
    @Query('category') category?: string,
    @Query('limit') limit?: string,
  ): Promise<Quiz[]> {
    const userId = req.user.userId;
    const quizLimit = limit ? parseInt(limit) : 10;
    return this.difficultyService.getAdaptiveQuizzes(userId, category, quizLimit);
  }

  // ユーザーの学習統計を取得
  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  async getUserStatistics(@Request() req) {
    const userId = req.user.userId;
    return this.difficultyService.getUserStatistics(userId);
  }

  // 手動でクイズ作成
  @Post('create')
  async createQuiz(@Body() createQuizDto: CreateQuizDto): Promise<Quiz> {
    return this.quizService.createQuiz(createQuizDto);
  }

  // テキストからAIクイズ生成
  @Post('generate/text')
  async generateQuizFromText(@Body() generateQuizDto: GenerateQuizDto): Promise<Quiz[]> {
    return this.quizService.generateQuizFromText(generateQuizDto);
  }

  // PDFからAIクイズ生成
  @Post('generate/pdf')
  @UseInterceptors(FileInterceptor('file'))
  async generateQuizFromPDF(
    @UploadedFile() file: Express.Multer.File,
    @Body() options?: {
      questionCount?: string;
      difficulty?: QuizDifficulty;
      category?: string;
      tags?: string;
    },
  ): Promise<Quiz[]> {
    if (!file) {
      throw new BadRequestException('PDFファイルが選択されていません');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('PDFファイルを選択してください');
    }

    try {
      // PDFからテキストを抽出
      const extractedText = await this.quizService.extractTextFromPDF(file.buffer);

      // 抽出したテキストからクイズ生成
      return this.quizService.generateQuizFromText({
        content: extractedText,
        questionCount: options?.questionCount ? parseInt(options.questionCount) : 5,
        difficulty: options?.difficulty,
        category: options?.category,
        tags: options?.tags ? options.tags.split(',').map(tag => tag.trim()) : [],
      });
    } catch (error) {
      throw new BadRequestException(`PDFからのクイズ生成に失敗しました: ${error.message}`);
    }
  }

  // 画像からAIクイズ生成
  @Post('generate/image')
  @UseInterceptors(FileInterceptor('file'))
  async generateQuizFromImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() options?: {
      questionCount?: string;
      difficulty?: QuizDifficulty;
      category?: string;
      tags?: string;
    },
  ): Promise<Quiz[]> {
    if (!file) {
      throw new BadRequestException('画像ファイルが選択されていません');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('画像ファイルを選択してください');
    }

    try {
      return this.quizService.generateQuizFromImage(file.buffer, {
        questionCount: options?.questionCount ? parseInt(options.questionCount) : 3,
        difficulty: options?.difficulty,
        category: options?.category,
        tags: options?.tags ? options.tags.split(',').map(tag => tag.trim()) : [],
      });
    } catch (error) {
      throw new BadRequestException(`画像からのクイズ生成に失敗しました: ${error.message}`);
    }
  }

  // クイズ更新
  @Put(':id')
  async updateQuiz(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateQuizDto>,
  ): Promise<Quiz> {
    return this.quizService.updateQuiz(id, updateData);
  }

  // クイズ削除
  @Delete(':id')
  async deleteQuiz(@Param('id') id: string): Promise<{ message: string }> {
    await this.quizService.deleteQuiz(id);
    return { message: 'クイズが正常に削除されました' };
  }
}
