import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar, Card, useTheme, Text, Chip, ProgressBar, FAB, Surface, Badge, Button, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '@/contexts/useAuthStore';
import { useAuth } from '../contexts/AuthContext';

interface ReviewItem {
  id: string;
  questionId: string;
  question: string;
  category: string;
  lastReviewDate: Date;
  nextReviewDate: Date;
  reviewCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  confidence: number; // 0-100
  isOverdue: boolean;
}

interface ReviewStats {
  totalItems: number;
  overdueItems: number;
  todayItems: number;
  masteredItems: number;
}

const ReviewScreen = () => {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const theme = useTheme();
  const router = useRouter();
  const { token } = useAuthStore();
  const { user } = useAuth();

  useEffect(() => {
    fetchReviewItems();
  }, [selectedCategory, user, token]);

  const fetchReviewItems = async () => {
    if (!user || !token) {
      return; // 認証準備が整うまで待機
    }
    setIsLoading(true);
    try {
      // Backendの実装に合わせて、ユーザーIDベースのレビュー対象取得
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/quiz-attempt/review/${user?.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // レスポンス: Quiz[] を画面用の形に軽く整形（カテゴリフィルタはクライアント側で簡易対応）
      const quizzes: any[] = response.data || [];
      const mapped: ReviewItem[] = quizzes
        .filter((q) => selectedCategory === 'all' || q.category === selectedCategory)
        .map((q) => ({
          id: q.id,
          questionId: q.id,
          question: q.title || q.description || '復習項目',
          category: q.category || 'その他',
          lastReviewDate: new Date(),
          nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          reviewCount: 0,
          difficulty: 'medium',
          confidence: 60,
          isOverdue: false,
        }));

      setReviewItems(mapped);
      setReviewStats({
        totalItems: mapped.length,
        overdueItems: mapped.filter((i) => i.isOverdue).length,
        todayItems: 0,
        masteredItems: mapped.filter((i) => i.confidence >= 90).length,
      });
    } catch (error) {
      console.error('Failed to fetch review items:', error);
      // デモデータを使用
      const demoItems: ReviewItem[] = [
        {
          id: '1',
          questionId: 'q1',
          question: '日本の首都はどこですか？',
          category: '地理',
          lastReviewDate: new Date(Date.now() - 86400000 * 2),
          nextReviewDate: new Date(Date.now() - 86400000),
          reviewCount: 3,
          difficulty: 'easy',
          confidence: 85,
          isOverdue: true,
        },
        {
          id: '2',
          questionId: 'q2',
          question: '光合成の化学式を書きなさい',
          category: '理科',
          lastReviewDate: new Date(Date.now() - 86400000),
          nextReviewDate: new Date(),
          reviewCount: 2,
          difficulty: 'hard',
          confidence: 45,
          isOverdue: false,
        },
        {
          id: '3',
          questionId: 'q3',
          question: '英語で「apple」の複数形は？',
          category: '英語',
          lastReviewDate: new Date(Date.now() - 86400000 * 3),
          nextReviewDate: new Date(Date.now() + 86400000),
          reviewCount: 5,
          difficulty: 'easy',
          confidence: 95,
          isOverdue: false,
        },
        {
          id: '4',
          questionId: 'q4',
          question: '二次方程式の解の公式は？',
          category: '数学',
          lastReviewDate: new Date(Date.now() - 86400000 * 4),
          nextReviewDate: new Date(Date.now() - 86400000 * 2),
          reviewCount: 1,
          difficulty: 'medium',
          confidence: 60,
          isOverdue: true,
        },
      ];
      setReviewItems(demoItems);
      setReviewStats({
        totalItems: demoItems.length,
        overdueItems: demoItems.filter(item => item.isOverdue).length,
        todayItems: demoItems.filter(item => {
          const today = new Date();
          const nextReview = new Date(item.nextReviewDate);
          return nextReview.toDateString() === today.toDateString();
        }).length,
        masteredItems: demoItems.filter(item => item.confidence >= 90).length,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getNextReviewText = (date: Date) => {
    const now = new Date();
    const reviewDate = new Date(date);
    const diffTime = reviewDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)}日遅れ`;
    } else if (diffDays === 0) {
      return '今日';
    } else if (diffDays === 1) {
      return '明日';
    } else {
      return `${diffDays}日後`;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return theme.colors.primary;
      case 'medium':
        return theme.colors.secondary;
      case 'hard':
        return theme.colors.error;
      default:
        return theme.colors.outline;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return theme.colors.primary;
    if (confidence >= 60) return theme.colors.secondary;
    if (confidence >= 40) return theme.colors.tertiary;
    return theme.colors.error;
  };

  const handleStartReview = (item: ReviewItem) => {
    router.push({
      pathname: '/quiz/[id]',
      params: { id: item.questionId },
    });
  };

  const categories = ['all', '地理', '理科', '英語', '数学'];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="復習" subtitle="間隔反復学習" />
        <Appbar.Action icon="filter" onPress={() => { }} />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {reviewStats && (
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <Surface style={[styles.statCard, { backgroundColor: theme.colors.errorContainer }]} elevation={1}>
                <Badge size={24} style={{ backgroundColor: theme.colors.error }}>
                  {reviewStats.overdueItems}
                </Badge>
                <Text variant="bodySmall" style={{ marginTop: 4 }}>期限切れ</Text>
              </Surface>
              <Surface style={[styles.statCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={1}>
                <Badge size={24} style={{ backgroundColor: theme.colors.primary }}>
                  {reviewStats.todayItems}
                </Badge>
                <Text variant="bodySmall" style={{ marginTop: 4 }}>今日</Text>
              </Surface>
              <Surface style={[styles.statCard, { backgroundColor: theme.colors.secondaryContainer }]} elevation={1}>
                <Badge size={24} style={{ backgroundColor: theme.colors.secondary }}>
                  {reviewStats.totalItems}
                </Badge>
                <Text variant="bodySmall" style={{ marginTop: 4 }}>全体</Text>
              </Surface>
              <Surface style={[styles.statCard, { backgroundColor: theme.colors.tertiaryContainer }]} elevation={1}>
                <Badge size={24} style={{ backgroundColor: theme.colors.tertiary }}>
                  {reviewStats.masteredItems}
                </Badge>
                <Text variant="bodySmall" style={{ marginTop: 4 }}>習得済み</Text>
              </Surface>
            </View>
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map((category) => (
            <Chip
              key={category}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
              style={styles.categoryChip}
            >
              {category === 'all' ? 'すべて' : category}
            </Chip>
          ))}
        </ScrollView>

        <View style={styles.reviewItemsContainer}>
          {reviewItems.map((item) => (
            <Card
              key={item.id}
              style={[
                styles.reviewCard,
                item.isOverdue && { borderColor: theme.colors.error, borderWidth: 1 }
              ]}
              onPress={() => handleStartReview(item)}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Chip
                      compact
                      style={{ backgroundColor: getDifficultyColor(item.difficulty) }}
                      textStyle={{ color: theme.colors.onPrimary, fontSize: 10 }}
                    >
                      {item.difficulty === 'easy' ? '簡単' :
                        item.difficulty === 'medium' ? '普通' : '難しい'}
                    </Chip>
                    <Text variant="bodySmall" style={styles.categoryText}>
                      {item.category}
                    </Text>
                  </View>
                  <View style={styles.cardHeaderRight}>
                    {item.isOverdue && (
                      <MaterialCommunityIcons
                        name="alert-circle"
                        size={20}
                        color={theme.colors.error}
                        style={{ marginRight: 8 }}
                      />
                    )}
                    <Text
                      variant="bodySmall"
                      style={{
                        color: item.isOverdue ? theme.colors.error : theme.colors.onSurfaceVariant
                      }}
                    >
                      {getNextReviewText(item.nextReviewDate)}
                    </Text>
                  </View>
                </View>

                <Text variant="bodyLarge" style={styles.questionText} numberOfLines={2}>
                  {item.question}
                </Text>

                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text variant="bodySmall">習得度</Text>
                    <Text variant="bodySmall" style={{ color: getConfidenceColor(item.confidence) }}>
                      {item.confidence}%
                    </Text>
                  </View>
                  <ProgressBar
                    progress={item.confidence / 100}
                    color={getConfidenceColor(item.confidence)}
                    style={styles.progressBar}
                  />
                </View>

                <Divider style={{ marginVertical: 8 }} />

                <View style={styles.cardFooter}>
                  <View style={styles.reviewInfo}>
                    <MaterialCommunityIcons
                      name="repeat"
                      size={16}
                      color={theme.colors.onSurfaceVariant}
                    />
                    <Text variant="bodySmall" style={{ marginLeft: 4 }}>
                      {item.reviewCount}回復習
                    </Text>
                  </View>
                  <Button
                    mode="contained-tonal"
                    compact
                    onPress={() => handleStartReview(item)}
                  >
                    復習する
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        {reviewItems.length === 0 && !isLoading && (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={64}
              color={theme.colors.primary}
            />
            <Text variant="titleMedium" style={{ marginTop: 16 }}>
              復習項目はありません
            </Text>
            <Text variant="bodyMedium" style={{ marginTop: 8, textAlign: 'center' }}>
              素晴らしい！すべての項目を復習しました。
            </Text>
          </View>
        )}
      </ScrollView>

      <FAB
        icon="play"
        label="一括復習"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          if (reviewItems.length > 0) {
            router.push('/(tabs)/review');
          }
        }}
        visible={reviewItems.length > 0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryScroll: {
    maxHeight: 50,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  categoryChip: {
    marginRight: 8,
  },
  reviewItemsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  reviewCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    opacity: 0.7,
  },
  questionText: {
    marginBottom: 12,
    lineHeight: 22,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default ReviewScreen;
