import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProgressBar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { useAuthContext } from '../contexts/AuthContext';

interface QuestionResult {
  questionId: string;
  question: string;
  userAnswer: any;
  correctAnswer: any;
  isCorrect: boolean;
  explanation?: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
}

interface AttemptResult {
  id: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeSpent: number;
  passed: boolean;
  passingScore: number;
  questions: QuestionResult[];
  completedAt: string;
}

export default function QuizResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuthContext();
  
  const [attemptResult, setAttemptResult] = useState<AttemptResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadAttemptResult();
  }, [params.attemptId]);

  const loadAttemptResult = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/quiz-attempts/${params.attemptId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to load results');
      
      const data = await response.json();
      setAttemptResult(data);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const renderQuestionResult = (result: QuestionResult, index: number) => {
    const getAnswerDisplay = (answer: any) => {
      if (typeof answer === 'boolean') {
        return answer ? 'True' : 'False';
      }
      return answer?.toString() || 'No answer';
    };

    return (
      <View key={result.questionId} style={styles.questionResultCard}>
        <View style={styles.questionResultHeader}>
          <Text style={styles.questionNumber}>Question {index + 1}</Text>
          {result.isCorrect ? (
            <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
          ) : (
            <MaterialIcons name="cancel" size={24} color="#F44336" />
          )}
        </View>
        
        <Text style={styles.questionText}>{result.question}</Text>
        
        <View style={styles.answerContainer}>
          <View style={styles.answerRow}>
            <Text style={styles.answerLabel}>Your Answer:</Text>
            <Text style={[
              styles.answerText,
              result.isCorrect ? styles.correctAnswer : styles.incorrectAnswer
            ]}>
              {getAnswerDisplay(result.userAnswer)}
            </Text>
          </View>
          
          {!result.isCorrect && (
            <View style={styles.answerRow}>
              <Text style={styles.answerLabel}>Correct Answer:</Text>
              <Text style={styles.correctAnswerText}>
                {getAnswerDisplay(result.correctAnswer)}
              </Text>
            </View>
          )}
        </View>
        
        {result.explanation && (
          <View style={styles.explanationBox}>
            <Text style={styles.explanationLabel}>Explanation:</Text>
            <Text style={styles.explanationText}>{result.explanation}</Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  if (!attemptResult) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Results not found</Text>
      </View>
    );
  }

  const scorePercentage = Math.round((attemptResult.score / attemptResult.totalQuestions) * 100);
  const scoreColor = getScoreColor(scorePercentage);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)')}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quiz Results</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Score Card */}
        <View style={styles.scoreCard}>
          <AnimatedCircularProgress
            size={180}
            width={15}
            fill={scorePercentage}
            tintColor={scoreColor}
            backgroundColor="#E0E0E0"
            rotation={0}
            lineCap="round"
          >
            {() => (
              <View style={styles.scoreCenter}>
                <Text style={[styles.scorePercentage, { color: scoreColor }]}>
                  {scorePercentage}%
                </Text>
                <Text style={styles.scoreText}>
                  {attemptResult.correctAnswers}/{attemptResult.totalQuestions}
                </Text>
              </View>
            )}
          </AnimatedCircularProgress>

          <View style={styles.resultBadge}>
            {attemptResult.passed ? (
              <>
                <MaterialIcons name="emoji-events" size={32} color="#FFD700" />
                <Text style={styles.passedText}>PASSED!</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="replay" size={32} color="#F44336" />
                <Text style={styles.failedText}>Try Again</Text>
              </>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialIcons name="check" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{attemptResult.correctAnswers}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          
          <View style={styles.statCard}>
            <MaterialIcons name="close" size={24} color="#F44336" />
            <Text style={styles.statValue}>{attemptResult.incorrectAnswers}</Text>
            <Text style={styles.statLabel}>Incorrect</Text>
          </View>
          
          <View style={styles.statCard}>
            <MaterialIcons name="timer" size={24} color="#2196F3" />
            <Text style={styles.statValue}>{formatTime(attemptResult.timeSpent)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
        </View>

        {/* Performance Analysis */}
        <View style={styles.analysisCard}>
          <Text style={styles.analysisTitle}>Performance Analysis</Text>
          
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Accuracy</Text>
            <View style={styles.progressContainer}>
              <ProgressBar 
                progress={scorePercentage / 100} 
                color={scoreColor}
                style={styles.progressBar}
              />
              <Text style={styles.performanceValue}>{scorePercentage}%</Text>
            </View>
          </View>
          
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Speed</Text>
            <Text style={styles.performanceValue}>
              {Math.round(attemptResult.timeSpent / attemptResult.totalQuestions)}s per question
            </Text>
          </View>
          
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Passing Score</Text>
            <Text style={styles.performanceValue}>
              {attemptResult.passingScore}%
            </Text>
          </View>
        </View>

        {/* Review Answers Button */}
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => setShowDetails(!showDetails)}
        >
          <Text style={styles.reviewButtonText}>
            {showDetails ? 'Hide' : 'Review'} Answers
          </Text>
          <MaterialIcons 
            name={showDetails ? 'expand-less' : 'expand-more'} 
            size={24} 
            color="#6200EE" 
          />
        </TouchableOpacity>

        {/* Detailed Results */}
        {showDetails && (
          <View style={styles.detailsContainer}>
            {attemptResult.questions.map((question, index) => 
              renderQuestionResult(question, index)
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="replay" size={20} color="#6200EE" />
            <Text style={styles.retryButtonText}>Retry Quiz</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.push('/(tabs)')}
          >
            <MaterialIcons name="home" size={20} color="#fff" />
            <Text style={styles.homeButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scoreCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scoreCenter: {
    alignItems: 'center',
  },
  scorePercentage: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  resultBadge: {
    marginTop: 20,
    alignItems: 'center',
  },
  passedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 8,
  },
  failedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F44336',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  analysisCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  performanceLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  progressContainer: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 50,
    textAlign: 'right',
  },
  reviewButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  reviewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6200EE',
    marginRight: 8,
  },
  detailsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  questionResultCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  questionResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  answerContainer: {
    marginBottom: 12,
  },
  answerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  answerLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
    minWidth: 100,
  },
  answerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  correctAnswer: {
    color: '#4CAF50',
  },
  incorrectAnswer: {
    color: '#F44336',
  },
  correctAnswerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
  },
  explanationBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  explanationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#6200EE',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6200EE',
    marginLeft: 8,
  },
  homeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6200EE',
    padding: 16,
    borderRadius: 12,
    marginLeft: 8,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});