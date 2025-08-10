import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz, QuizType, QuizDifficulty } from '../entities/quiz.entity';
import { OpenAIConfig } from '../config/openai.config';
import * as pdfParse from 'pdf-parse';

export interface CreateQuizDto {
  title: string;
  question: string;
  type: QuizType;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty?: QuizDifficulty;
  category?: string;
  source?: string;
  tags?: string[];
  relatedLinks?: {
    title: string;
    url: string;
    description?: string;
  }[];
}

export interface GenerateQuizDto {
  content: string;
  questionCount?: number;
  difficulty?: QuizDifficulty;
  category?: string;
  tags?: string[];
}

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
  ) {}

  // 全クイズ取得
  async findAll(): Promise<Quiz[]> {
    return this.quizRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  // IDでクイズ取得
  async findOne(id: string): Promise<Quiz | null> {
    return this.quizRepository.findOne({
      where: { id, isActive: true },
    });
  }

  // 手動でクイズ作成
  async createQuiz(createQuizDto: CreateQuizDto): Promise<Quiz> {
    const quiz = this.quizRepository.create({
      ...createQuizDto,
      source: 'manual',
    });
    return this.quizRepository.save(quiz);
  }

  // タグでクイズ検索
  async findByTags(tags: string[]): Promise<Quiz[]> {
    return this.quizRepository
      .createQueryBuilder('quiz')
      .where('quiz.isActive = :isActive', { isActive: true })
      .andWhere('JSON_OVERLAPS(quiz.tags, :tags)', {
        tags: JSON.stringify(tags),
      })
      .orderBy('quiz.createdAt', 'DESC')
      .getMany();
  }

  // 利用可能な全タグを取得
  async getAllTags(): Promise<string[]> {
    const result = await this.quizRepository
      .createQueryBuilder('quiz')
      .select('quiz.tags')
      .where('quiz.isActive = :isActive', { isActive: true })
      .andWhere('quiz.tags IS NOT NULL')
      .getMany();

    const allTags = new Set<string>();
    result.forEach((quiz) => {
      if (quiz.tags) {
        quiz.tags.forEach((tag) => allTags.add(tag));
      }
    });

    return Array.from(allTags).sort();
  }

  // 利用可能な全カテゴリを取得
  async getAllCategories(): Promise<string[]> {
    const result = await this.quizRepository
      .createQueryBuilder('quiz')
      .select('DISTINCT quiz.category', 'category')
      .where('quiz.isActive = :isActive', { isActive: true })
      .andWhere('quiz.category IS NOT NULL')
      .getRawMany();

    return result.map((item) => item.category).sort();
  }

  // AIでクイズ生成（テキストから）
  async generateQuizFromText(
    generateQuizDto: GenerateQuizDto,
  ): Promise<Quiz[]> {
    try {
      const openai = OpenAIConfig.getInstance();
      const prompt = OpenAIConfig.getQuizGenerationPrompt(
        generateQuizDto.content,
        generateQuizDto.questionCount || 5,
      );

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      });

      const generatedContent = response.choices[0].message.content;
      if (!generatedContent) {
        throw new Error('AIからの応答が空です');
      }
      const quizData = JSON.parse(generatedContent);

      const quizzes: Quiz[] = [];
      for (const quizItem of quizData.quizzes) {
        const quiz = this.quizRepository.create({
          title: quizItem.title,
          question: quizItem.question,
          type: quizItem.type,
          options: quizItem.options,
          correctAnswer: quizItem.correctAnswer,
          explanation: quizItem.explanation,
          difficulty:
            quizItem.difficulty ||
            generateQuizDto.difficulty ||
            QuizDifficulty.MEDIUM,
          category: quizItem.category || generateQuizDto.category || '一般',
          tags: generateQuizDto.tags || quizItem.tags || [],
          relatedLinks: quizItem.relatedLinks || [],
          source: 'ai_generated',
        });

        const savedQuiz = await this.quizRepository.save(quiz);
        quizzes.push(savedQuiz);
      }

      return quizzes;
    } catch (error) {
      throw new Error(`クイズ生成に失敗しました: ${error.message}`);
    }
  }

  // PDFからテキスト抽出
  async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF解析に失敗しました: ${error.message}`);
    }
  }

  // 画像からクイズ生成
  async generateQuizFromImage(
    imageBuffer: Buffer,
    options?: {
      questionCount?: number;
      difficulty?: QuizDifficulty;
      category?: string;
      tags?: string[];
    },
  ): Promise<Quiz[]> {
    try {
      const openai = OpenAIConfig.getInstance();

      // 画像を解析
      const analysisResponse = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: OpenAIConfig.getImageAnalysisPrompt(),
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });

      const imageContent = analysisResponse.choices[0].message.content;
      if (!imageContent) {
        throw new Error('画像解析に失敗しました');
      }

      // 解析した内容からクイズ生成
      return this.generateQuizFromText({
        content: imageContent,
        questionCount: options?.questionCount || 3,
        difficulty: options?.difficulty,
        category: options?.category,
        tags: options?.tags,
      });
    } catch (error) {
      throw new Error(`画像からのクイズ生成に失敗しました: ${error.message}`);
    }
  }

  // クイズ更新
  async updateQuiz(
    id: string,
    updateData: Partial<CreateQuizDto>,
  ): Promise<Quiz> {
    await this.quizRepository.update(id, updateData);
    const updatedQuiz = await this.findOne(id);
    if (!updatedQuiz) {
      throw new Error('更新されたクイズが見つかりません');
    }
    return updatedQuiz;
  }

  // クイズ削除（論理削除）
  async deleteQuiz(id: string): Promise<void> {
    await this.quizRepository.update(id, { isActive: false });
  }

  // カテゴリ別クイズ取得
  async findByCategory(category: string): Promise<Quiz[]> {
    return this.quizRepository.find({
      where: { category, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  // 難易度別クイズ取得
  async findByDifficulty(difficulty: QuizDifficulty): Promise<Quiz[]> {
    return this.quizRepository.find({
      where: { difficulty, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  // 高度な検索（タグ、カテゴリ、難易度の組み合わせ）
  async searchQuizzes(filters: {
    tags?: string[];
    category?: string;
    difficulty?: QuizDifficulty;
    searchText?: string;
  }): Promise<Quiz[]> {
    let query = this.quizRepository
      .createQueryBuilder('quiz')
      .where('quiz.isActive = :isActive', { isActive: true });

    if (filters.tags && filters.tags.length > 0) {
      query = query.andWhere('JSON_OVERLAPS(quiz.tags, :tags)', {
        tags: JSON.stringify(filters.tags),
      });
    }

    if (filters.category) {
      query = query.andWhere('quiz.category = :category', {
        category: filters.category,
      });
    }

    if (filters.difficulty) {
      query = query.andWhere('quiz.difficulty = :difficulty', {
        difficulty: filters.difficulty,
      });
    }

    if (filters.searchText) {
      query = query.andWhere(
        '(quiz.title LIKE :searchText OR quiz.question LIKE :searchText)',
        { searchText: `%${filters.searchText}%` },
      );
    }

    return query.orderBy('quiz.createdAt', 'DESC').getMany();
  }
}
