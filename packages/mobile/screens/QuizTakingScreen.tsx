import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProgressBar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthContext } from '../contexts/AuthContext';

interface Question {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string | boolean | string[];
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  category?: string;
  tags?: string[];
  totalQuestions: number;
  passingScore?: number;
}

export default function QuizTakingScreen() {
  const router = useRouter();
  const { quizId } = useLocalSearchParams();
  const { token } = useAuthContext();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | boolean | null>(null);
  const [shortAnswer, setShortAnswer] = useState('');
  const [answers, setAnswers] = useState<Map<string, any>>(new Map());
  const [timeSpent, setTimeSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load quiz data
  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      setIsLoading(true);
      
      // Fetch quiz data
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/quizzes/${quizId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load quiz');
      
      const data = await response.json();
      setQuiz(data);

      // Start a new attempt
      const attemptResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/quiz-attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quizId: quizId,
        }),
      });

      if (!attemptResponse.ok) throw new Error('Failed to start quiz attempt');
      
      const attemptData = await attemptResponse.json();
      setAttemptId(attemptData.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to load quiz. Please try again.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuestion = quiz?.questions[currentQuestionIndex];
  const progress = quiz ? (currentQuestionIndex + 1) / quiz.totalQuestions : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (answer: string | boolean) => {
    setSelectedAnswer(answer);
    if (currentQuestion) {
      answers.set(currentQuestion.id, answer);
    }
  };

  const handleShortAnswerChange = (text: string) => {
    setShortAnswer(text);
    if (currentQuestion) {
      answers.set(currentQuestion.id, text);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      const nextQuestion = quiz!.questions[currentQuestionIndex + 1];
      setSelectedAnswer(answers.get(nextQuestion.id) || null);
      setShortAnswer(answers.get(nextQuestion.id) || '');
      setShowExplanation(false);
    } else {
      // Last question - submit quiz
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const prevQuestion = quiz!.questions[currentQuestionIndex - 1];
      setSelectedAnswer(answers.get(prevQuestion.id) || null);
      setShortAnswer(answers.get(prevQuestion.id) || '');
      setShowExplanation(false);
    }
  };

  const handleSubmit = async () => {
    Alert.alert(
      'Submit Quiz',
      'Are you sure you want to submit your answers?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              
              // Prepare answers array
              const answersArray = Array.from(answers.entries()).map(([questionId, answer]) => ({
                questionId,
                answer,
              }));

              // Submit attempt
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/quiz-attempts/${attemptId}/submit`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    answers: answersArray,
                    timeSpent,
                  }),
                }
              );

              if (!response.ok) throw new Error('Failed to submit quiz');
              
              const result = await response.json();
              
              // Navigate to results screen
              router.push({
                pathname: '/quiz-result',
                params: {
                  attemptId: result.id,
                  score: result.score,
                  totalQuestions: quiz!.totalQuestions,
                  passed: result.passed,
                },
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to submit quiz. Please try again.');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'multiple_choice':
        return (
          <View style={styles.optionsContainer}>
            {currentQuestion.options?.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedAnswer === option && styles.selectedOption,
                ]}
                onPress={() => handleSelectAnswer(option)}
              >
                <View style={styles.optionContent}>
                  <View style={[
                    styles.optionRadio,
                    selectedAnswer === option && styles.selectedRadio,
                  ]} />
                  <Text style={[
                    styles.optionText,
                    selectedAnswer === option && styles.selectedOptionText,
                  ]}>
                    {option}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'true_false':
        return (
          <View style={styles.trueFalseContainer}>
            <TouchableOpacity
              style={[
                styles.trueFalseButton,
                selectedAnswer === true && styles.selectedTrueButton,
              ]}
              onPress={() => handleSelectAnswer(true)}
            >
              <MaterialIcons
                name="check-circle"
                size={32}
                color={selectedAnswer === true ? '#fff' : '#4CAF50'}
              />
              <Text style={[
                styles.trueFalseText,
                selectedAnswer === true && styles.selectedTrueFalseText,
              ]}>
                True
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.trueFalseButton,
                selectedAnswer === false && styles.selectedFalseButton,
              ]}
              onPress={() => handleSelectAnswer(false)}
            >
              <MaterialIcons
                name="cancel"
                size={32}
                color={selectedAnswer === false ? '#fff' : '#F44336'}
              />
              <Text style={[
                styles.trueFalseText,
                selectedAnswer === false && styles.selectedTrueFalseText,
              ]}>
                False
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'short_answer':
        return (
          <View style={styles.shortAnswerContainer}>
            <TextInput
              style={styles.shortAnswerInput}
              placeholder="Type your answer here..."
              value={shortAnswer}
              onChangeText={handleShortAnswerChange}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Loading quiz...</Text>
      </View>
    );
  }

  if (!quiz) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Quiz not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.timer}>{formatTime(timeSpent)}</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {quiz.totalQuestions}
        </Text>
        <ProgressBar progress={progress} color="#6200EE" style={styles.progressBar} />
      </View>

      {/* Question */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionContainer}>
          <View style={styles.difficultyBadge}>
            <Text style={[
              styles.difficultyText,
              currentQuestion?.difficulty === 'easy' && styles.easyText,
              currentQuestion?.difficulty === 'medium' && styles.mediumText,
              currentQuestion?.difficulty === 'hard' && styles.hardText,
            ]}>
              {currentQuestion?.difficulty?.toUpperCase()}
            </Text>
          </View>
          
          <Text style={styles.questionText}>{currentQuestion?.question}</Text>
        </View>

        {/* Answer Options */}
        {renderQuestion()}

        {/* Explanation (if shown) */}
        {showExplanation && currentQuestion?.explanation && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationTitle}>Explanation:</Text>
            <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, currentQuestionIndex === 0 && styles.disabledButton]}
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <MaterialIcons name="arrow-back" size={20} color={currentQuestionIndex === 0 ? '#ccc' : '#333'} />
          <Text style={[styles.navButtonText, currentQuestionIndex === 0 && styles.disabledText]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.primaryButton]}
          onPress={handleNext}
          disabled={
            (currentQuestion?.type === 'short_answer' && !shortAnswer) ||
            (currentQuestion?.type !== 'short_answer' && selectedAnswer === null)
          }
        >
          <Text style={styles.primaryButtonText}>
            {currentQuestionIndex === quiz.questions.length - 1 ? 'Submit' : 'Next'}
          </Text>
          {currentQuestionIndex < quiz.questions.length - 1 && (
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Submitting overlay */}
      {isSubmitting && (
        <View style={styles.submittingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.submittingText}>Submitting your answers...</Text>
        </View>
      )}
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
  timer: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  easyText: {
    backgroundColor: '#E8F5E9',
    color: '#4CAF50',
  },
  mediumText: {
    backgroundColor: '#FFF3E0',
    color: '#FF9800',
  },
  hardText: {
    backgroundColor: '#FFEBEE',
    color: '#F44336',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    lineHeight: 26,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedOption: {
    borderColor: '#6200EE',
    backgroundColor: '#F3E5F5',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
  },
  selectedRadio: {
    borderColor: '#6200EE',
    backgroundColor: '#6200EE',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#6200EE',
    fontWeight: '500',
  },
  trueFalseContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  trueFalseButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedTrueButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  selectedFalseButton: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  trueFalseText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    color: '#333',
  },
  selectedTrueFalseText: {
    color: '#fff',
  },
  shortAnswerContainer: {
    marginBottom: 20,
  },
  shortAnswerInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    minHeight: 120,
  },
  explanationContainer: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  primaryButton: {
    backgroundColor: '#6200EE',
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    color: '#333',
    marginHorizontal: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginHorizontal: 8,
  },
  disabledText: {
    color: '#ccc',
  },
  submittingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submittingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
});