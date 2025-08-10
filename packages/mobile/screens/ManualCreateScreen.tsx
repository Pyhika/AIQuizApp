import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, Title, TextInput, SegmentedButtons, Chip } from 'react-native-paper';
import { router } from 'expo-router';

export interface QuizFormData {
  title: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export default function ManualCreateScreen() {
  const [formData, setFormData] = useState<QuizFormData>({
    title: '',
    question: '',
    type: 'multiple_choice',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    difficulty: 'medium',
    category: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const typeOptions = [
    { value: 'multiple_choice', label: '選択肢' },
    { value: 'true_false', label: '○×' },
    { value: 'short_answer', label: '記述' },
  ];

  const difficultyOptions = [
    { value: 'easy', label: '簡単' },
    { value: 'medium', label: '普通' },
    { value: 'hard', label: '難しい' },
  ];

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData({ ...formData, options: [...formData.options, ''] });
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({ ...formData, options: newOptions });
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert('エラー', 'クイズタイトルを入力してください');
      return false;
    }
    if (!formData.question.trim()) {
      Alert.alert('エラー', '問題文を入力してください');
      return false;
    }
    if (!formData.correctAnswer.trim()) {
      Alert.alert('エラー', '正解を入力してください');
      return false;
    }

    if (formData.type === 'multiple_choice') {
      const validOptions = formData.options.filter(option => option.trim());
      if (validOptions.length < 2) {
        Alert.alert('エラー', '選択肢を2つ以上入力してください');
        return false;
      }
      if (!validOptions.includes(formData.correctAnswer)) {
        Alert.alert('エラー', '正解は選択肢のいずれかと一致する必要があります');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // TODO: APIエンドポイントに送信
      const response = await fetch('http://localhost:3001/quiz/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          options: formData.type === 'multiple_choice' ? formData.options.filter(o => o.trim()) : [],
        }),
      });

      if (response.ok) {
        Alert.alert('成功', 'クイズが作成されました！', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        throw new Error('クイズ作成に失敗しました');
      }
    } catch (error: any) {
      Alert.alert('エラー', `クイズ作成に失敗しました: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Title style={styles.title}>✍️ 手動クイズ作成</Title>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>基本情報</Text>

            <TextInput
              label="クイズタイトル"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="問題文"
              value={formData.question}
              onChangeText={(text) => setFormData({ ...formData, question: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>問題の種類</Text>
            <SegmentedButtons
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as any })}
              buttons={typeOptions}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {formData.type === 'multiple_choice' && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>選択肢</Text>
              {formData.options.map((option, index) => (
                <View key={index} style={styles.optionContainer}>
                  <TextInput
                    label={`選択肢 ${index + 1}`}
                    value={option}
                    onChangeText={(text) => updateOption(index, text)}
                    style={styles.optionInput}
                    mode="outlined"
                  />
                  {formData.options.length > 2 && (
                    <Button
                      mode="text"
                      onPress={() => removeOption(index)}
                      style={styles.removeButton}
                    >
                      削除
                    </Button>
                  )}
                </View>
              ))}

              {formData.options.length < 6 && (
                <Button mode="outlined" onPress={addOption} style={styles.addButton}>
                  選択肢を追加
                </Button>
              )}
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>正解と解説</Text>

            <TextInput
              label="正解"
              value={formData.correctAnswer}
              onChangeText={(text) => setFormData({ ...formData, correctAnswer: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="解説（任意）"
              value={formData.explanation}
              onChangeText={(text) => setFormData({ ...formData, explanation: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={2}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>カテゴリと難易度</Text>

            <TextInput
              label="カテゴリ"
              value={formData.category}
              onChangeText={(text) => setFormData({ ...formData, category: text })}
              style={styles.input}
              mode="outlined"
              placeholder="例: 数学、歴史、科学"
            />

            <Text style={styles.label}>難易度</Text>
            <SegmentedButtons
              value={formData.difficulty}
              onValueChange={(value) => setFormData({ ...formData, difficulty: value as any })}
              buttons={difficultyOptions}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'クイズ作成中...' : 'クイズを作成'}
        </Button>
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
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    marginBottom: 12,
  },
  segmentedButtons: {
    marginBottom: 12,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    marginLeft: 8,
  },
  addButton: {
    marginTop: 8,
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#6200ea',
  },
});
