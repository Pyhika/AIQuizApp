import React, { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph } from 'react-native-paper';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'こんにちは！学習についてなんでも質問してください。🤖',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // TODO: 実際のAI APIを呼び出す
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(userMessage.text),
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);

      // 新しいメッセージにスクロール
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1000);
  };

  const getAIResponse = (userInput: string): string => {
    // 簡単なレスポンス例（実際にはAI APIを使用）
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes('数学') || lowerInput.includes('math')) {
      return '数学についてですね！どの分野で困っていますか？代数、幾何、微積分など、具体的に教えてください。📐';
    } else if (lowerInput.includes('英語') || lowerInput.includes('english')) {
      return '英語学習ですね！文法、語彙、リーディング、リスニングなど、どの分野を改善したいですか？🇺🇸';
    } else if (lowerInput.includes('勉強法') || lowerInput.includes('学習法')) {
      return '効果的な勉強法をお探しですね！以下のポイントを参考にしてください：\n\n1. 定期的な復習\n2. アクティブラーニング\n3. 短時間集中\n4. 理解度の確認\n\n何か特定の科目についてアドバイスが欲しいですか？📚';
    } else if (lowerInput.includes('クイズ') || lowerInput.includes('quiz')) {
      return 'クイズについてですね！どんなクイズを作りたいですか？PDFや画像からの自動生成、または手動作成もできますよ。どちらに興味がありますか？🧩';
    } else {
      return 'なるほど！もう少し詳しく教えていただけますか？学習に関することなら何でもお手伝いできます。💭';
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.aiMessage
    ]}>
      <Card style={[
        styles.messageCard,
        item.isUser ? styles.userMessageCard : styles.aiMessageCard
      ]}>
        <Card.Content style={styles.messageContent}>
          <Paragraph style={[
            styles.messageText,
            item.isUser ? styles.userMessageText : styles.aiMessageText
          ]}>
            {item.text}
          </Paragraph>
        </Card.Content>
      </Card>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Title style={styles.title}>💬 AI学習アシスタント</Title>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Card style={styles.loadingCard}>
            <Card.Content>
              <Paragraph style={styles.loadingText}>AIが考え中...</Paragraph>
            </Card.Content>
          </Card>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="メッセージを入力..."
          multiline
          maxLength={500}
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        <Button
          mode="contained"
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
          style={styles.sendButton}
          icon="send"
        >
          送信
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageCard: {
    maxWidth: '80%',
    elevation: 2,
  },
  userMessageCard: {
    backgroundColor: '#2196F3',
  },
  aiMessageCard: {
    backgroundColor: '#fff',
  },
  messageContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#333',
  },
  loadingContainer: {
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  loadingCard: {
    maxWidth: '80%',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    fontStyle: 'italic',
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    marginRight: 12,
    maxHeight: 100,
  },
  sendButton: {
    alignSelf: 'flex-end',
  },
});
