import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { QuizAttempt } from './quiz-attempt.entity';

export enum QuizType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
}

export enum QuizDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'enum', enum: QuizType, default: QuizType.MULTIPLE_CHOICE })
  type: QuizType;

  @Column({ type: 'json', nullable: true })
  options: string[];

  @Column({ type: 'varchar', length: 1000 })
  correctAnswer: string;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({ type: 'enum', enum: QuizDifficulty, default: QuizDifficulty.MEDIUM })
  difficulty: QuizDifficulty;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'json', nullable: true })
  relatedLinks: {
    title: string;
    url: string;
    description?: string;
  }[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  source: string; // 'ai_generated' or 'manual'

  @Column({ type: 'text', nullable: true })
  originalFile: string; // ファイル名やパス

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => User, user => user.quizzes)
  user: User;

  @OneToMany(() => QuizAttempt, attempt => attempt.quiz)
  attempts: QuizAttempt[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
