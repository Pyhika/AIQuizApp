import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { Button, Card, Title, Paragraph, TextInput, Chip, Portal, Dialog, Menu, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

interface RelatedLink {
  title: string;
  url: string;
  description?: string;
}

export default function CreateScreen() {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // 新しい状態管理
  const [category, setCategory] = useState('一般');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [relatedLinks, setRelatedLinks] = useState<RelatedLink[]>([]);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [newLink, setNewLink] = useState<RelatedLink>({ title: '', url: '', description: '' });

  // メニュー表示状態
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
  const [showQuestionCountMenu, setShowQuestionCountMenu] = useState(false);

  // 利用可能なカテゴリとタグ
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // 難易度とラベルのマッピング
  const difficultyOptions = [
    { value: 'easy', label: '簡単' },
    { value: 'medium', label: '普通' },
    { value: 'hard', label: '難しい' },
  ];

  const questionCountOptions = [3, 5, 10, 15];

  // 初期データ取得
  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [categoriesRes, tagsRes] = await Promise.all([
        fetch('http://localhost:3001/quiz/metadata/categories'),
        fetch('http://localhost:3001/quiz/metadata/tags')
      ]);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setAvailableCategories(['一般', ...categoriesData.categories]);
      }

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setAvailableTags(tagsData.tags);
      }
    } catch (error) {
      console.log('メタデータの取得に失敗しました:', error);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error: any) {
      Alert.alert('エラー', 'ファイルの選択に失敗しました');
    }
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.granted === false) {
        Alert.alert('権限エラー', 'カメラロールへのアクセス権限が必要です');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error: any) {
      Alert.alert('エラー', '画像の選択に失敗しました');
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addRelatedLink = () => {
    if (newLink.title.trim() && newLink.url.trim()) {
      setRelatedLinks([...relatedLinks, { ...newLink }]);
      setNewLink({ title: '', url: '', description: '' });
      setShowLinkDialog(false);
    }
  };

  const removeRelatedLink = (index: number) => {
    setRelatedLinks(relatedLinks.filter((_, i) => i !== index));
  };

  const generateQuiz = async () => {
    if (!selectedFile) {
      Alert.alert('ファイルが選択されていません', 'PDFまたは画像を選択してください');
      return;
    }

    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || selectedFile.type,
        name: selectedFile.name || 'file',
      } as any);

      // 拡張された設定項目
      formData.append('questionCount', questionCount.toString());
      formData.append('difficulty', difficulty);
      formData.append('category', category);
      formData.append('tags', tags.join(','));

      const endpoint = selectedFile.mimeType === 'application/pdf'
        ? 'http://localhost:3001/quiz/generate/pdf'
        : 'http://localhost:3001/quiz/generate/image';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert(
          '成功',
          `${result.length}問のクイズが生成されました！`,
          [
            {
              text: 'OK', onPress: () => {
                setSelectedFile(null);
                // クイズ一覧画面に遷移
                router.push('/(tabs)');
              }
            }
          ]
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'クイズ生成に失敗しました');
      }
    } catch (error: any) {
      Alert.alert('エラー', `クイズの生成に失敗しました: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const goToManualCreate = () => {
    router.push('/screens/ManualCreateScreen');
  };

  const getDifficultyLabel = (value: string) => {
    return difficultyOptions.find(option => option.value === value)?.label || value;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Title style={styles.title}>📚 クイズ作成</Title>

        <Card style={styles.card}>
          <Card.Content>
            <Title>⚙️ 設定</Title>

            {/* カテゴリ選択 */}
            <Text style={styles.label}>📁 カテゴリ</Text>
            <Menu
              visible={showCategoryMenu}
              onDismiss={() => setShowCategoryMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setShowCategoryMenu(true)}
                  contentStyle={styles.menuButton}
                >
                  {category}
                </Button>
              }
            >
              {availableCategories.map((cat, index) => (
                <Menu.Item
                  key={index}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategoryMenu(false);
                  }}
                  title={cat}
                />
              ))}
            </Menu>

            {/* 難易度選択 */}
            <Text style={styles.label}>🎯 難易度</Text>
            <Menu
              visible={showDifficultyMenu}
              onDismiss={() => setShowDifficultyMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setShowDifficultyMenu(true)}
                  contentStyle={styles.menuButton}
                >
                  {getDifficultyLabel(difficulty)}
                </Button>
              }
            >
              {difficultyOptions.map((option, index) => (
                <Menu.Item
                  key={index}
                  onPress={() => {
                    setDifficulty(option.value);
                    setShowDifficultyMenu(false);
                  }}
                  title={option.label}
                />
              ))}
            </Menu>

            {/* 問題数設定 */}
            <Text style={styles.label}>📊 問題数</Text>
            <Menu
              visible={showQuestionCountMenu}
              onDismiss={() => setShowQuestionCountMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setShowQuestionCountMenu(true)}
                  contentStyle={styles.menuButton}
                >
                  {questionCount}問
                </Button>
              }
            >
              {questionCountOptions.map((count, index) => (
                <Menu.Item
                  key={index}
                  onPress={() => {
                    setQuestionCount(count);
                    setShowQuestionCountMenu(false);
                  }}
                  title={`${count}問`}
                />
              ))}
            </Menu>

            {/* タグ追加 */}
            <Text style={styles.label}>🏷️ タグ</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                mode="outlined"
                placeholder="タグを入力"
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
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  style={styles.chip}
                  onClose={() => removeTag(tag)}
                >
                  {tag}
                </Chip>
              ))}
            </View>

            {/* 関連リンク */}
            <Text style={styles.label}>🔗 関連リンク</Text>
            <Button
              mode="outlined"
              onPress={() => setShowLinkDialog(true)}
              style={styles.button}
              icon="link-plus"
            >
              リンクを追加
            </Button>

            {relatedLinks.map((link, index) => (
              <View key={index} style={styles.linkItem}>
                <Text style={styles.linkTitle}>{link.title}</Text>
                <Text style={styles.linkUrl}>{link.url}</Text>
                <Button onPress={() => removeRelatedLink(index)} mode="text">
                  削除
                </Button>
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>📄 ファイルからクイズ生成</Title>
            <Paragraph>PDFや画像から自動でクイズを作成します</Paragraph>

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={pickDocument}
                style={styles.button}
                icon="file-pdf-box"
              >
                PDFを選択
              </Button>

              <Button
                mode="contained"
                onPress={pickImage}
                style={styles.button}
                icon="image"
              >
                画像を選択
              </Button>
            </View>

            {selectedFile && (
              <View style={styles.selectedFile}>
                <Text style={styles.fileName}>選択されたファイル:</Text>
                <Text>{selectedFile.name || selectedFile.uri}</Text>
                <Text style={styles.fileType}>
                  種類: {selectedFile.mimeType || selectedFile.type}
                </Text>
              </View>
            )}

            <Button
              mode="contained"
              onPress={generateQuiz}
              style={[styles.button, styles.generateButton]}
              loading={isGenerating}
              disabled={!selectedFile || isGenerating}
              icon="auto-fix"
            >
              {isGenerating ? 'クイズ生成中...' : 'AIでクイズ生成'}
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>✍️ 手動でクイズ作成</Title>
            <Paragraph>オリジナルのクイズを手動で作成します</Paragraph>

            <Button
              mode="outlined"
              onPress={goToManualCreate}
              style={styles.button}
              icon="pencil"
            >
              手動で作成
            </Button>
          </Card.Content>
        </Card>
      </View>

      {/* 関連リンク追加ダイアログ */}
      <Portal>
        <Dialog visible={showLinkDialog} onDismiss={() => setShowLinkDialog(false)}>
          <Dialog.Title>関連リンクを追加</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="タイトル"
              value={newLink.title}
              onChangeText={(text) => setNewLink({ ...newLink, title: text })}
              style={styles.dialogInput}
            />
            <TextInput
              mode="outlined"
              label="URL"
              value={newLink.url}
              onChangeText={(text) => setNewLink({ ...newLink, url: text })}
              style={styles.dialogInput}
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
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    marginVertical: 8,
  },
  addButton: {
    marginLeft: 8,
  },
  generateButton: {
    marginTop: 16,
    backgroundColor: '#6200ea',
  },
  selectedFile: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  fileName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fileType: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  menuButton: {
    justifyContent: 'flex-start',
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
    padding: 12,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    marginVertical: 4,
  },
  linkTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  linkUrl: {
    color: '#1976d2',
    marginVertical: 4,
  },
  dialogInput: {
    marginVertical: 8,
  },
});
