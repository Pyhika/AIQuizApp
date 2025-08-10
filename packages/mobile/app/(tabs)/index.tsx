import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Avatar, Searchbar, Chip, ActivityIndicator, FAB } from 'react-native-paper';
import { router } from 'expo-router';

interface Quiz {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  tags: string[];
  createdAt: string;
}

interface RecentAttempt {
  id: string;
  quiz: Quiz;
  isCorrect: boolean;
  timeSpent: number;
  createdAt: string;
}

interface DashboardData {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  averageTime: number;
  recentAttempts: number;
  reviewCount: number;
  learningStreak: number;
  lastStudyDate: string | null;
}

export default function HomeScreen() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // TODO: ユーザーIDは実際の認証システムから取得
  const userId = 'user-123';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      await Promise.all([
        loadQuizzes(),
        loadDashboardData(),
        loadRecentAttempts(),
        loadCategories(),
      ]);
    } catch (error) {
      console.log('データの取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuizzes = async () => {
    try {
      const response = await fetch('http://localhost:3001/quiz');
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data.slice(0, 10)); // 最新10件を表示
      }
    } catch (error) {
      console.log('クイズの取得に失敗しました:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      const response = await fetch(`http://localhost:3001/quiz-attempt/dashboard/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.log('ダッシュボードデータの取得に失敗しました:', error);
    }
  };

  const loadRecentAttempts = async () => {
    try {
      const response = await fetch(`http://localhost:3001/quiz-attempt/history/${userId}?limit=5`);
      if (response.ok) {
        const data = await response.json();
        setRecentAttempts(data);
      }
    } catch (error) {
      console.log('解答履歴の取得に失敗しました:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:3001/quiz/metadata/categories');
      if (response.ok) {
        const data = await response.json();
        setAvailableCategories(data.categories);
      }
    } catch (error) {
      console.log('カテゴリの取得に失敗しました:', error);
    }
  };

  const searchQuizzes = async () => {
    try {
      let searchUrl = 'http://localhost:3001/quiz/search?';
      const params = new URLSearchParams();

      if (searchQuery.trim()) {
        params.append('searchText', searchQuery.trim());
      }

      if (selectedCategories.length > 0) {
        params.append('category', selectedCategories[0]); // 単一カテゴリのみ
      }

      const response = await fetch(searchUrl + params.toString());
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      }
    } catch (error) {
      console.log('検索に失敗しました:', error);
      Alert.alert('エラー', '検索に失敗しました');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([category]); // 単一選択
    }
  };

  const handleQuizPress = (quiz: Quiz) => {
    // クイズの詳細と編集オプションを表示
    Alert.alert(
      quiz.title,
      `カテゴリ: ${quiz.category}\n難易度: ${quiz.difficulty}\n作成日: ${formatDate(quiz.createdAt)}`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '編集',
          onPress: () => {
            router.push(`/screens/ManualCreateScreen?id=${quiz.id}`);
          }
        },
        {
          text: '開始',
          onPress: () => {
            router.push(`/quiz/${quiz.id}`);
          }
        }
      ]
    );
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#757575';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今日';
    if (days === 1) return '昨日';
    if (days < 7) return `${days}日前`;
    return date.toLocaleDateString('ja-JP');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ea" />
        <Paragraph style={styles.loadingText}>データを読み込み中...</Paragraph>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Avatar.Text size={60} label="U" style={styles.avatar} />
            <View style={styles.welcomeText}>
              <Title style={styles.welcomeTitle}>こんにちは！</Title>
              <Paragraph style={styles.welcomeSubtitle}>今日も学習を続けましょう 📚</Paragraph>
            </View>
          </View>

          {/* 学習統計カード */}
          <Card style={styles.statsCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>📊 学習状況</Title>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Title style={styles.statNumber}>{dashboardData?.totalAttempts || 0}</Title>
                  <Paragraph style={styles.statLabel}>総解答数</Paragraph>
                </View>
                <View style={styles.statItem}>
                  <Title style={styles.statNumber}>{dashboardData?.accuracy || 0}%</Title>
                  <Paragraph style={styles.statLabel}>正答率</Paragraph>
                </View>
                <View style={styles.statItem}>
                  <Title style={styles.statNumber}>{dashboardData?.learningStreak || 0}</Title>
                  <Paragraph style={styles.statLabel}>連続日数</Paragraph>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* 検索機能 */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>🔍 クイズを検索</Title>

              <Searchbar
                placeholder="クイズを検索..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                onSubmitEditing={searchQuizzes}
                style={styles.searchBar}
              />

              <View style={styles.categoryContainer}>
                <Paragraph style={styles.categoryLabel}>カテゴリで絞り込み:</Paragraph>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryChips}>
                    {availableCategories.map((category, index) => (
                      <Chip
                        key={index}
                        selected={selectedCategories.includes(category)}
                        onPress={() => toggleCategory(category)}
                        style={styles.categoryChip}
                      >
                        {category}
                      </Chip>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <Button
                mode="contained"
                onPress={searchQuizzes}
                style={styles.searchButton}
                icon="magnify"
              >
                検索
              </Button>
            </Card.Content>
          </Card>

          {/* クイズ一覧 */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.quizListHeader}>
                <Title style={styles.sectionTitle}>📝 利用可能なクイズ</Title>
                <Paragraph style={styles.quizCount}>{quizzes.length}件</Paragraph>
              </View>

              {quizzes.length > 0 ? (
                quizzes.map((quiz) => (
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
                    <View style={styles.quizActions}>
                      <Button
                        mode="outlined"
                        onPress={() => router.push(`/screens/ManualCreateScreen?id=${quiz.id}`)}
                        style={styles.editButton}
                        compact
                      >
                        編集
                      </Button>
                      <Button
                        mode="contained"
                        onPress={() => router.push(`/quiz/${quiz.id}`)}
                        style={styles.startButton}
                        compact
                      >
                        開始
                      </Button>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noQuizzesContainer}>
                  <Paragraph style={styles.noQuizzesText}>クイズが見つかりません</Paragraph>
                  <Button
                    mode="outlined"
                    onPress={() => router.push('/(tabs)/create')}
                    style={styles.createButton}
                  >
                    新しいクイズを作成
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* 最近の解答履歴 */}
          {recentAttempts.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.sectionTitle}>📊 最近の解答履歴</Title>
                {recentAttempts.map((attempt) => (
                  <View key={attempt.id} style={styles.attemptItem}>
                    <View style={styles.attemptInfo}>
                      <Paragraph style={styles.attemptTitle}>{attempt.quiz.title}</Paragraph>
                      <Paragraph style={styles.attemptDate}>{formatDate(attempt.createdAt)}</Paragraph>
                    </View>
                    <View style={styles.attemptResult}>
                      <Paragraph style={[
                        styles.attemptStatus,
                        { color: attempt.isCorrect ? '#4CAF50' : '#F44336' }
                      ]}>
                        {attempt.isCorrect ? '正解' : '不正解'}
                      </Paragraph>
                    </View>
                  </View>
                ))}

                <Button
                  mode="text"
                  onPress={() => router.push('/(tabs)/learn')}
                  style={styles.viewAllButton}
                >
                  詳細な学習分析を見る →
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* フローティングアクションボタン */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => router.push('/(tabs)/create')}
        label="クイズ作成"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100, // FABのためのスペース
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  avatar: {
    backgroundColor: '#6200ea',
  },
  welcomeText: {
    marginLeft: 16,
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statsCard: {
    marginBottom: 16,
    elevation: 4,
    backgroundColor: '#6200ea',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    color: '#fff',
    fontSize: 12,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  searchBar: {
    marginBottom: 16,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  categoryChips: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  categoryChip: {
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#2196F3',
  },
  quizListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quizCount: {
    fontSize: 14,
    color: '#666',
  },
  quizItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '500',
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
  quizActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    marginRight: 8,
  },
  startButton: {
    marginLeft: 8,
  },
  noQuizzesContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noQuizzesText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  createButton: {
    borderColor: '#6200ea',
  },
  attemptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  attemptInfo: {
    flex: 1,
  },
  attemptTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  attemptDate: {
    fontSize: 12,
    color: '#666',
  },
  attemptResult: {
    alignItems: 'flex-end',
  },
  attemptStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  viewAllButton: {
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ea',
  },
});
