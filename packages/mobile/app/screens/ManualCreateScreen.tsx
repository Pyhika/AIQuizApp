import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  TextInput,
  Button,
  Menu,
  Chip,
  Portal,
  Dialog,
  RadioButton,
  IconButton,
  Appbar,
  Divider
} from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';

interface RelatedLink {
  title: string;
  url: string;
  description?: string;
}

interface QuizFormData {
  id?: string;
  title: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  relatedLinks: RelatedLink[];
}

export default function ManualCreateScreen() {
  const params = useLocalSearchParams();
  const isEditing = !!params.id;

  const [formData, setFormData] = useState<QuizFormData>({
    title: '',
    question: '',
    type: 'multiple_choice',
    options: ['選択肢1', '選択肢2', '選択肢3', '選択肢4'],
    correctAnswer: '選択肢1',
    explanation: '',
    difficulty: 'medium',
    category: '一般',
    tags: [],
    relatedLinks: []
  });

  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newOption, setNewOption] = useState('');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [newLink, setNewLink] = useState<RelatedLink>({ title: '', url: '', description: '' });
  const [availableCategories, setAvailableCategories] = useState<string[]>(['一般', 'プログラミング', '数学', '科学', '語学', 'その他']);

  // オプション
  const difficultyOptions = [
    { value: 'easy', label: '簡単' },
    { value: 'medium', label: '普通' },
    { value: 'hard', label: '難しい' },
  ];

  const typeOptions = [
    { value: 'multiple_choice', label: '選択式' },
    { value: 'true_false', label: '○×問題' },
    { value: 'short_answer', label: '記述式' },
  ];

  useEffect(() => {
    if (isEditing) {
      loadQuizForEdit();
    }
    loadCategories();
  }, []);

  const loadQuizForEdit = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/quiz/${params.id}`);
      if (response.ok) {
        const quiz = await response.json();
        setFormData({
          id: quiz.id,
          title: quiz.title,
          question: quiz.question,
          type: quiz.type,
          options: quiz.options || ['', '', '', ''],
          correctAnswer: quiz.correctAnswer,
          explanation: quiz.explanation || '',
          difficulty: quiz.difficulty,
          category: quiz.category,
          tags: quiz.tags || [],
          relatedLinks: quiz.relatedLinks || []
        });
      }
    } catch (error) {
      console.log('クイズの読み込みに失敗しました:', error);
      Alert.alert('エラー', 'クイズの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:3001/quiz/metadata/categories');
      if (response.ok) {
        const data = await response.json();
        setAvailableCategories(['一般', 'プログラミング', '数学', '科学', '語学', 'その他', ...data.categories]);
      }
    } catch (error) {
      console.log('カテゴリの取得に失敗しました:', error);
    }
  };

  const updateFormData = (field: keyof QuizFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      updateFormData('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateFormData('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const addOption = () => {
    if (newOption.trim()) {
      updateFormData('options', [...formData.options, newOption.trim()]);
      setNewOption('');
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    updateFormData('options', newOptions);
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      updateFormData('options', newOptions);

      // 正解が削除された選択肢だった場合、正解をクリア
      if (formData.correctAnswer === formData.options[index]) {
        updateFormData('correctAnswer', '');
      }
    }
  };

  const addRelatedLink = () => {
    if (newLink.title.trim() && newLink.url.trim()) {
      updateFormData('relatedLinks', [...formData.relatedLinks, { ...newLink }]);
      setNewLink({ title: '', url: '', description: '' });
      setShowLinkDialog(false);
    }
  };

  const removeRelatedLink = (index: number) => {
    updateFormData('relatedLinks', formData.relatedLinks.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    // デバッグ用ログ
    console.log('--- バリデーション開始 ---');
    console.log('問題タイプ:', formData.type);
    console.log('正解:', `"${formData.correctAnswer}"`);
    console.log('正解の長さ:', formData.correctAnswer.length);
    console.log('選択肢:', formData.options);
    console.log('有効な選択肢:', formData.options.filter(opt => opt.trim()));

    if (!formData.title.trim()) {
      Alert.alert('入力エラー', 'タイトルを入力してください');
      return false;
    }

    if (!formData.question.trim()) {
      Alert.alert('入力エラー', '問題文を入力してください');
      return false;
    }

    if (!formData.correctAnswer.trim()) {
      console.log('正解が入力されていません');
      Alert.alert('入力エラー', '正解を入力してください');
      return false;
    }

    if (formData.type === 'multiple_choice') {
      const validOptions = formData.options.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        Alert.alert('入力エラー', '選択式問題には最低2つの選択肢が必要です');
        return false;
      }

      if (!validOptions.includes(formData.correctAnswer)) {
        console.log('正解が選択肢に含まれていません');
        console.log('正解:', `"${formData.correctAnswer}"`);
        console.log('有効な選択肢:', validOptions);
        Alert.alert('入力エラー', '正解は選択肢の中から選んでください');
        return false;
      }
    }

    console.log('バリデーション成功');
    return true;
  };

  const saveQuiz = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const url = isEditing
        ? `http://localhost:3001/quiz/${formData.id}`
        : 'http://localhost:3001/quiz/create';

      const method = isEditing ? 'PUT' : 'POST';

      const requestData = {
        ...formData,
        options: formData.type === 'multiple_choice'
          ? formData.options.filter(opt => opt.trim())
          : undefined
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        Alert.alert(
          '成功',
          isEditing ? 'クイズが更新されました！' : 'クイズが作成されました！',
          [
            {
              text: 'OK',
              onPress: () => {
                router.back();
              }
            }
          ]
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'クイズの保存に失敗しました');
      }
    } catch (error: any) {
      Alert.alert('エラー', `クイズの保存に失敗しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyLabel = (value: string) => {
    return difficultyOptions.find(option => option.value === value)?.label || value;
  };

  const getTypeLabel = (value: string) => {
    return typeOptions.find(option => option.value === value)?.label || value;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={isEditing ? 'クイズを編集' : 'クイズを作成'} />
        <Appbar.Action icon="check" onPress={saveQuiz} disabled={loading} />
      </Appbar.Header>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>

          {/* 基本情報 */}
          <Card style={styles.card}>
            <Card.Content>
              <Title>📝 基本情報</Title>

              <TextInput
                mode="outlined"
                label="タイトル *"
                value={formData.title}
                onChangeText={(text) => updateFormData('title', text)}
                style={styles.input}
                placeholder="クイズのタイトルを入力"
              />

              <TextInput
                mode="outlined"
                label="問題文 *"
                value={formData.question}
                onChangeText={(text) => updateFormData('question', text)}
                style={styles.input}
                multiline
                numberOfLines={4}
                placeholder="問題文を入力"
              />
            </Card.Content>
          </Card>

          {/* 問題設定 */}
          <Card style={styles.card}>
            <Card.Content>
              <Title>⚙️ 問題設定</Title>

              {/* 問題タイプ */}
              <Paragraph style={styles.label}>問題タイプ</Paragraph>
              <Menu
                visible={showTypeMenu}
                onDismiss={() => setShowTypeMenu(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setShowTypeMenu(true)}
                    contentStyle={styles.menuButton}
                  >
                    {getTypeLabel(formData.type)}
                  </Button>
                }
              >
                {typeOptions.map((option, index) => (
                  <Menu.Item
                    key={index}
                    onPress={() => {
                      updateFormData('type', option.value);
                      setShowTypeMenu(false);
                      // タイプ変更時に適切な初期値を設定
                      if (option.value === 'true_false') {
                        updateFormData('options', ['正しい', '間違い']);
                        updateFormData('correctAnswer', '正しい'); // デフォルトで「正しい」を選択
                      } else if (option.value === 'short_answer') {
                        updateFormData('options', []);
                        updateFormData('correctAnswer', ''); // 記述式は空文字列
                      } else if (option.value === 'multiple_choice') {
                        // 選択式の場合、既存の選択肢があれば保持
                        if (formData.options.length === 0 || formData.options.every(opt => !opt.trim())) {
                          updateFormData('options', ['選択肢1', '選択肢2', '選択肢3', '選択肢4']);
                        }
                        updateFormData('correctAnswer', '');
                      }
                    }}
                    title={option.label}
                  />
                ))}
              </Menu>

              {/* 選択肢 (選択式・○×問題の場合) */}
              {(formData.type === 'multiple_choice' || formData.type === 'true_false') && (
                <>
                  <Paragraph style={styles.label}>選択肢</Paragraph>
                  {formData.options.map((option, index) => (
                    <View key={index} style={styles.optionContainer}>
                      <TextInput
                        mode="outlined"
                        label={`選択肢 ${index + 1}`}
                        value={option}
                        onChangeText={(text) => updateOption(index, text)}
                        style={styles.optionInput}
                        disabled={formData.type === 'true_false'} // ○×問題は固定
                      />
                      {formData.type === 'multiple_choice' && formData.options.length > 2 && (
                        <IconButton
                          icon="delete"
                          onPress={() => removeOption(index)}
                          style={styles.deleteButton}
                        />
                      )}
                    </View>
                  ))}

                  {formData.type === 'multiple_choice' && (
                    <View style={styles.addOptionContainer}>
                      <TextInput
                        mode="outlined"
                        placeholder="新しい選択肢を追加"
                        value={newOption}
                        onChangeText={setNewOption}
                        style={styles.newOptionInput}
                        onSubmitEditing={addOption}
                      />
                      <Button onPress={addOption} mode="contained" style={styles.addButton}>
                        追加
                      </Button>
                    </View>
                  )}
                </>
              )}

              {/* 正解 */}
              <Paragraph style={styles.label}>正解 *</Paragraph>
              {formData.type === 'multiple_choice' || formData.type === 'true_false' ? (
                <View style={styles.correctAnswerContainer}>
                  <RadioButton.Group
                    onValueChange={(value) => updateFormData('correctAnswer', value)}
                    value={formData.correctAnswer}
                  >
                    {formData.options.filter(opt => opt.trim()).map((option, index) => (
                      <View key={index} style={styles.radioOption}>
                        <RadioButton value={option} />
                        <Paragraph style={styles.radioLabel}>{option}</Paragraph>
                      </View>
                    ))}
                  </RadioButton.Group>
                </View>
              ) : (
                <TextInput
                  mode="outlined"
                  label="正解"
                  value={formData.correctAnswer}
                  onChangeText={(text) => updateFormData('correctAnswer', text)}
                  style={styles.input}
                  placeholder="正解を入力"
                />
              )}

              <TextInput
                mode="outlined"
                label="解説"
                value={formData.explanation}
                onChangeText={(text) => updateFormData('explanation', text)}
                style={styles.input}
                multiline
                numberOfLines={3}
                placeholder="解説を入力（任意）"
              />
            </Card.Content>
          </Card>

          {/* カテゴリと難易度 */}
          <Card style={styles.card}>
            <Card.Content>
              <Title>📂 分類</Title>

              <Paragraph style={styles.label}>カテゴリ</Paragraph>
              <Menu
                visible={showCategoryMenu}
                onDismiss={() => setShowCategoryMenu(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setShowCategoryMenu(true)}
                    contentStyle={styles.menuButton}
                  >
                    {formData.category}
                  </Button>
                }
              >
                {availableCategories.map((category, index) => (
                  <Menu.Item
                    key={index}
                    onPress={() => {
                      updateFormData('category', category);
                      setShowCategoryMenu(false);
                    }}
                    title={category}
                  />
                ))}
              </Menu>

              <Paragraph style={styles.label}>難易度</Paragraph>
              <Menu
                visible={showDifficultyMenu}
                onDismiss={() => setShowDifficultyMenu(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setShowDifficultyMenu(true)}
                    contentStyle={styles.menuButton}
                  >
                    {getDifficultyLabel(formData.difficulty)}
                  </Button>
                }
              >
                {difficultyOptions.map((option, index) => (
                  <Menu.Item
                    key={index}
                    onPress={() => {
                      updateFormData('difficulty', option.value);
                      setShowDifficultyMenu(false);
                    }}
                    title={option.label}
                  />
                ))}
              </Menu>
            </Card.Content>
          </Card>

          {/* タグ */}
          <Card style={styles.card}>
            <Card.Content>
              <Title>🏷️ タグ</Title>

              <View style={styles.tagInputContainer}>
                <TextInput
                  mode="outlined"
                  placeholder="タグを追加"
                  value={newTag}
                  onChangeText={setNewTag}
                  style={styles.tagInput}
                  onSubmitEditing={addTag}
                />
                <Button onPress={addTag} mode="contained" style={styles.addButton}>
                  追加
                </Button>
              </View>

              <View style={styles.chipContainer}>
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    style={styles.chip}
                    onClose={() => removeTag(tag)}
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* 関連リンク */}
          <Card style={styles.card}>
            <Card.Content>
              <Title>🔗 関連リンク</Title>

              <Button
                mode="outlined"
                onPress={() => setShowLinkDialog(true)}
                style={styles.button}
                icon="link-plus"
              >
                リンクを追加
              </Button>

              {formData.relatedLinks.map((link, index) => (
                <View key={index} style={styles.linkItem}>
                  <View style={styles.linkContent}>
                    <Paragraph style={styles.linkTitle}>{link.title}</Paragraph>
                    <Paragraph style={styles.linkUrl}>{link.url}</Paragraph>
                    {link.description && (
                      <Paragraph style={styles.linkDescription}>{link.description}</Paragraph>
                    )}
                  </View>
                  <IconButton
                    icon="delete"
                    onPress={() => removeRelatedLink(index)}
                  />
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* 保存ボタン */}
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={saveQuiz}
              style={styles.saveButton}
              loading={loading}
              disabled={loading}
              icon="content-save"
            >
              {isEditing ? 'クイズを更新' : 'クイズを作成'}
            </Button>

            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={styles.cancelButton}
              disabled={loading}
            >
              キャンセル
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* 関連リンク追加ダイアログ */}
      <Portal>
        <Dialog visible={showLinkDialog} onDismiss={() => setShowLinkDialog(false)}>
          <Dialog.Title>関連リンクを追加</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="タイトル *"
              value={newLink.title}
              onChangeText={(text) => setNewLink({ ...newLink, title: text })}
              style={styles.dialogInput}
            />
            <TextInput
              mode="outlined"
              label="URL *"
              value={newLink.url}
              onChangeText={(text) => setNewLink({ ...newLink, url: text })}
              style={styles.dialogInput}
              keyboardType="url"
            />
            <TextInput
              mode="outlined"
              label="説明（任意）"
              value={newLink.description}
              onChangeText={(text) => setNewLink({ ...newLink, description: text })}
              style={styles.dialogInput}
              multiline
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLinkDialog(false)}>キャンセル</Button>
            <Button onPress={addRelatedLink}>追加</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
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
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  input: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  menuButton: {
    justifyContent: 'flex-start',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  optionInput: {
    flex: 1,
  },
  deleteButton: {
    marginLeft: 8,
  },
  addOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  newOptionInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    marginLeft: 8,
  },
  correctAnswerContainer: {
    marginVertical: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  radioLabel: {
    marginLeft: 8,
    flex: 1,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagInput: {
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    margin: 4,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    marginVertical: 4,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  linkUrl: {
    color: '#1976d2',
    marginVertical: 2,
  },
  linkDescription: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  saveButton: {
    marginVertical: 8,
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    marginVertical: 8,
  },
  button: {
    marginVertical: 8,
  },
  dialogInput: {
    marginVertical: 8,
  },
});
