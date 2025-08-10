import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Card, Title, Paragraph, ProgressBar, Chip, Button, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';

interface LearningDashboard {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  averageTime: number;
  recentAttempts: number;
  reviewCount: number;
  learningStreak: number;
  lastStudyDate: string | null;
}

interface Quiz {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  tags: string[];
}

export default function LearnScreen() {
  const [dashboardData, setDashboardData] = useState<LearningDashboard | null>(null);
  const [reviewQuizzes, setReviewQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // TODO: ユーザーIDは実際の認証システムから取得
  const userId = 'user-123'; // 仮のユーザーID

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 学習ダッシュボードデータを取得
      const dashboardResponse = await fetch(`http://localhost:3001/quiz-attempt/dashboard/${userId}`);
      if (dashboardResponse.ok) {
        const dashboard = await dashboardResponse.json();
        setDashboardData(dashboard);
      }

      // 復習が必要なクイズを取得
      const reviewResponse = await fetch(`http://localhost:3001/quiz-attempt/review/${userId}`);
      if (reviewResponse.ok) {
        const quizzes = await reviewResponse.json();
        setReviewQuizzes(quizzes.slice(0, 5)); // 最大5件表示
      }
    } catch (error) {
      console.log('ダッシュボードデータの取得に失敗しました:', error);
      Alert.alert('エラー', 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const goToQuizList = () => {
    router.push('/(tabs)');
  };

  const goToReviewQuiz = (quizId: string) => {
    // TODO: クイズ画面が実装されたら有効化
    Alert.alert('機能準備中', `クイズID: ${quizId} の画面は準備中です`);
    // router.push(`/screens/QuizScreen?id=${quizId}`);
  };

  const goToProgressReport = () => {
    // TODO: 進捗レポート画面が実装されたら有効化
    Alert.alert('機能準備中', '詳細な進捗レポート画面は準備中です');
    // router.push('/screens/ProgressReportScreen');
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#757575';
    }
  };

  const getStreakMessage = (streak: number): string => {
    if (streak === 0) return '今日から学習を始めましょう！';
    if (streak === 1) return '1日連続で学習中！';
    if (streak < 7) return `${streak}日連続で学習中！`;
    if (streak < 30) return `${streak}日連続！素晴らしいです！`;
    return `${streak}日連続！驚異的な継続力です！`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ea" />
        <Paragraph style={styles.loadingText}>学習データを読み込み中...</Paragraph>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <Title style={styles.title}>📊 学習ダッシュボード</Title>

        {/* 学習ストリーク */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.streakContainer}>
              <Title style={styles.streakNumber}>🔥 {dashboardData?.learningStreak || 0}</Title>
              <Paragraph style={styles.streakText}>
                {getStreakMessage(dashboardData?.learningStreak || 0)}
              </Paragraph>
            </View>
          </Card.Content>
        </Card>

        {/* 学習統計 */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>📈 学習統計</Title>

            <View style={styles.statRow}>
              <Paragraph>総解答数</Paragraph>
              <Paragraph style={styles.statValue}>
                {dashboardData?.totalAttempts || 0}問
              </Paragraph>
            </View>

            <View style={styles.statRow}>
              <Paragraph>正答率</Paragraph>
              <Paragraph style={styles.statValue}>
                {dashboardData?.accuracy || 0}%
              </Paragraph>
            </View>
            <ProgressBar
              progress={(dashboardData?.accuracy || 0) / 100}
              color="#4CAF50"
              style={styles.progressBar}
            />

            <View style={styles.statRow}>
              <Paragraph>平均解答時間</Paragraph>
              <Paragraph style={styles.statValue}>
                {dashboardData?.averageTime || 0}秒
              </Paragraph>
            </View>

            <View style={styles.statRow}>
              <Paragraph>今週の学習</Paragraph>
              <Paragraph style={styles.statValue}>
                {dashboardData?.recentAttempts || 0}問
              </Paragraph>
            </View>
          </Card.Content>
        </Card>

        {/* 復習が必要なクイズ */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.reviewHeader}>
              <Title>📚 復習が必要なクイズ</Title>
              <Chip style={styles.reviewBadge}>
                {dashboardData?.reviewCount || 0}件
              </Chip>
            </View>

            {reviewQuizzes.length > 0 ? (
              <>
                <Paragraph style={styles.subtitle}>
                  効率的な学習のため、復習をお勧めします
                </Paragraph>

                {reviewQuizzes.map((quiz, index) => (
                  <View key={quiz.id} style={styles.quizItem}>
                    <View style={styles.quizInfo}>
                      <Paragraph style={styles.quizTitle}>{quiz.title}</Paragraph>
                      <View style={styles.quizMeta}>
                        <Chip
                          style={[
                            styles.difficultyChip,
                            { backgroundColor: getDifficultyColor(quiz.difficulty) + '20' }
                          ]}
                          textStyle={{ color: getDifficultyColor(quiz.difficulty) }}
                        >
                          {quiz.difficulty}
                        </Chip>
                        <Paragraph style={styles.category}>{quiz.category}</Paragraph>
                      </View>
                    </View>
                    <Button
                      mode="contained"
                      onPress={() => goToReviewQuiz(quiz.id)}
                      style={styles.reviewButton}
                    >
                      復習
                    </Button>
                  </View>
                ))}

                {dashboardData?.reviewCount && dashboardData.reviewCount > 5 && (
                  <Button
                    mode="outlined"
                    onPress={goToQuizList}
                    style={styles.viewMoreButton}
                  >
                    さらに表示 (+{dashboardData.reviewCount - 5}件)
                  </Button>
                )}
              </>
            ) : (
              <View style={styles.noReviewContainer}>
                <Paragraph style={styles.noReviewText}>
                  🎉 復習が必要なクイズはありません！
                </Paragraph>
                <Paragraph style={styles.noReviewSubtext}>
                  新しいクイズに挑戦してみましょう
                </Paragraph>
                <Button
                  mode="contained"
                  onPress={goToQuizList}
                  style={styles.newQuizButton}
                >
                  新しいクイズを探す
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* アクションボタン */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>🎯 学習メニュー</Title>

            <Button
              mode="contained"
              onPress={goToProgressReport}
              style={styles.actionButton}
              icon="chart-line"
            >
              詳細な進捗レポートを見る
            </Button>

            <Button
              mode="outlined"
              onPress={goToQuizList}
              style={styles.actionButton}
              icon="book-open-variant"
            >
              クイズ一覧を見る
            </Button>
          </Card.Content>
        </Card>

        {/* 学習アドバイス */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>🤖 AIからの学習アドバイス</Title>
            <View style={styles.adviceContainer}>
              {dashboardData?.accuracy && dashboardData.accuracy < 60 && (
                <Paragraph style={styles.advice}>
                  📈 正答率が60%を下回っています。基礎的な問題を重点的に復習することをお勧めします。
                </Paragraph>
              )}

              {dashboardData?.learningStreak === 0 && (
                <Paragraph style={styles.advice}>
                  🔥 学習を継続することで記憶の定着が向上します。毎日少しずつでも学習しましょう！
                </Paragraph>
              )}

              {dashboardData?.averageTime && dashboardData.averageTime > 120 && (
                <Paragraph style={styles.advice}>
                  ⚡ 解答時間が長い傾向があります。時間を意識した練習で集中力を高めましょう。
                </Paragraph>
              )}

              {dashboardData?.accuracy && dashboardData.accuracy >= 80 && (
                <Paragraph style={styles.advice}>
                  🎉 素晴らしい正答率です！この調子で継続していきましょう。より難しい問題にも挑戦してみてください。
                </Paragraph>
              )}
            </View>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  streakContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  streakText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1976D2',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginVertical: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewBadge: {
    backgroundColor: '#FF5722',
  },
  quizItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginVertical: 4,
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quizMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyChip: {
    marginRight: 8,
  },
  category: {
    fontSize: 12,
    color: '#666',
  },
  reviewButton: {
    marginLeft: 8,
  },
  viewMoreButton: {
    marginTop: 12,
  },
  noReviewContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noReviewText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noReviewSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  newQuizButton: {
    backgroundColor: '#4CAF50',
  },
  actionButton: {
    marginVertical: 8,
  },
  adviceContainer: {
    marginTop: 8,
  },
  advice: {
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
});
