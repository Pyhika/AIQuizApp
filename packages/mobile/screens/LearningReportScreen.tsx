import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Appbar, Card, useTheme, Text, SegmentedButtons, ActivityIndicator, Surface } from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuthStore } from '../contexts/useAuthStore';

const screenWidth = Dimensions.get('window').width;

interface LearningData {
  dailyProgress: { date: string; score: number }[];
  categoryScores: { category: string; score: number; count: number }[];
  totalQuizzes: number;
  averageScore: number;
  completionRate: number;
  streakDays: number;
}

const LearningReportScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [isLoading, setIsLoading] = useState(true);
  const [learningData, setLearningData] = useState<LearningData | null>(null);
  const theme = useTheme();
  const router = useRouter();
  const { token } = useAuthStore();

  useEffect(() => {
    fetchLearningData();
  }, [selectedPeriod]);

  const fetchLearningData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/quiz-attempts/learning-report?period=${selectedPeriod}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setLearningData(response.data);
    } catch (error) {
      console.error('Failed to fetch learning data:', error);
      // デモデータを使用
      setLearningData({
        dailyProgress: [
          { date: '月', score: 75 },
          { date: '火', score: 82 },
          { date: '水', score: 78 },
          { date: '木', score: 85 },
          { date: '金', score: 90 },
          { date: '土', score: 88 },
          { date: '日', score: 92 },
        ],
        categoryScores: [
          { category: '数学', score: 85, count: 15 },
          { category: '英語', score: 78, count: 20 },
          { category: '理科', score: 92, count: 12 },
          { category: '社会', score: 88, count: 18 },
        ],
        totalQuizzes: 65,
        averageScore: 85.75,
        completionRate: 92,
        streakDays: 14,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.primary,
    labelColor: (opacity = 1) => theme.colors.onSurface,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="学習レポート" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  if (!learningData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="学習レポート" />
        </Appbar.Header>
        <View style={styles.emptyContainer}>
          <Text>データがありません</Text>
        </View>
      </View>
    );
  }

  const pieData = learningData.categoryScores.map((item, index) => ({
    name: item.category,
    population: item.count,
    color: [
      theme.colors.primary,
      theme.colors.secondary,
      theme.colors.tertiary,
      theme.colors.error,
    ][index % 4],
    legendFontColor: theme.colors.onSurface,
    legendFontSize: 12,
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="学習レポート" />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.periodSelector}>
          <SegmentedButtons
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
            buttons={[
              { value: 'week', label: '週間' },
              { value: 'month', label: '月間' },
              { value: 'year', label: '年間' },
            ]}
          />
        </View>

        <View style={styles.statsRow}>
          <Surface style={[styles.statCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
              {learningData.totalQuizzes}
            </Text>
            <Text variant="bodyMedium">完了クイズ</Text>
          </Surface>
          <Surface style={[styles.statCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
            <Text variant="headlineMedium" style={{ color: theme.colors.secondary, fontWeight: 'bold' }}>
              {learningData.averageScore.toFixed(1)}%
            </Text>
            <Text variant="bodyMedium">平均スコア</Text>
          </Surface>
        </View>

        <View style={styles.statsRow}>
          <Surface style={[styles.statCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
            <Text variant="headlineMedium" style={{ color: theme.colors.tertiary, fontWeight: 'bold' }}>
              {learningData.completionRate}%
            </Text>
            <Text variant="bodyMedium">完了率</Text>
          </Surface>
          <Surface style={[styles.statCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
            <Text variant="headlineMedium" style={{ color: theme.colors.error, fontWeight: 'bold' }}>
              {learningData.streakDays}日
            </Text>
            <Text variant="bodyMedium">連続学習</Text>
          </Surface>
        </View>

        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>
              日別進捗
            </Text>
            <LineChart
              data={{
                labels: learningData.dailyProgress.map(d => d.date),
                datasets: [
                  {
                    data: learningData.dailyProgress.map(d => d.score),
                  },
                ],
              }}
              width={screenWidth - 60}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>
              カテゴリー別スコア
            </Text>
            <BarChart
              data={{
                labels: learningData.categoryScores.map(c => c.category),
                datasets: [
                  {
                    data: learningData.categoryScores.map(c => c.score),
                  },
                ],
              }}
              width={screenWidth - 60}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              yAxisLabel=""
              yAxisSuffix="%"
            />
          </Card.Content>
        </Card>

        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>
              学習分布
            </Text>
            <PieChart
              data={pieData}
              width={screenWidth - 60}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodSelector: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  chartCard: {
    margin: 16,
    marginTop: 0,
  },
  chartTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default LearningReportScreen;