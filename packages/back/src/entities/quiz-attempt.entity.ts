import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Quiz } from './quiz.entity';
import { User } from './user.entity';

@Entity('quiz_attempts')
export class QuizAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Quiz, quiz => quiz.attempts)
  quiz: Quiz;

  @ManyToOne(() => User, user => user.quizAttempts)
  user: User;

  @Column({ type: 'text' })
  userAnswer: string;

  @Column({ type: 'boolean' })
  isCorrect: boolean;

  @Column({ type: 'int', default: 0 })
  timeSpent: number; // 解答にかかった時間（秒）

  @Column({ type: 'int', default: 1 })
  attemptNumber: number; // 何回目の挑戦か

  @Column({ type: 'timestamp', nullable: true })
  nextReviewDate: Date; // 次回復習すべき日時

  @Column({ type: 'int', default: 1 })
  intervalDays: number; // 復習間隔（日数）

  @Column({ type: 'float', default: 0.0 })
  confidence: number; // 解答の自信度（0.0-1.0）

  @Column({ type: 'float', default: 0 })
  score: number; // 得点（0-100）

  @Column({ type: 'boolean', default: false })
  passed: boolean; // 合格したかどうか

  @CreateDateColumn()
  createdAt: Date;

  @CreateDateColumn()
  startedAt: Date;
}
