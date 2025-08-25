import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { GiftedChat, IMessage, Send, InputToolbar, Composer } from 'react-native-gifted-chat';
import { Appbar, useTheme, ActivityIndicator, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useAuthStore } from '../contexts/useAuthStore';

const AIChatScreen = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();
  const router = useRouter();
  const { token } = useAuthStore();

  useEffect(() => {
    loadChatHistory();
    setMessages([
      {
        _id: 1,
        text: 'こんにちは！学習についてお手伝いします。何でも聞いてください！',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'AI Assistant',
          avatar: 'https://i.pravatar.cc/300?img=5',
        },
      },
    ]);
  }, []);

  const loadChatHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('chat_history');
      if (history) {
        setMessages(JSON.parse(history));
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const saveChatHistory = async (newMessages: IMessage[]) => {
    try {
      await AsyncStorage.setItem('chat_history', JSON.stringify(newMessages));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  };

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    setMessages(previousMessages => {
      const updatedMessages = GiftedChat.append(previousMessages, newMessages);
      saveChatHistory(updatedMessages);
      return updatedMessages;
    });

    if (newMessages.length > 0) {
      setIsLoading(true);
      const userMessage = newMessages[0].text;

      try {
        const response = await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/ai/chat`,
          { message: userMessage },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const aiResponse: IMessage = {
          _id: Math.random().toString(),
          text: response.data.reply || 'すみません、お返事できませんでした。',
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'AI Assistant',
            avatar: 'https://i.pravatar.cc/300?img=5',
          },
        };

        setMessages(previousMessages => {
          const updatedMessages = GiftedChat.append(previousMessages, [aiResponse]);
          saveChatHistory(updatedMessages);
          return updatedMessages;
        });
      } catch (error) {
        console.error('Failed to get AI response:', error);
        const errorMessage: IMessage = {
          _id: Math.random().toString(),
          text: 'すみません、エラーが発生しました。もう一度お試しください。',
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'AI Assistant',
            avatar: 'https://i.pravatar.cc/300?img=5',
          },
        };
        setMessages(previousMessages => GiftedChat.append(previousMessages, [errorMessage]));
      } finally {
        setIsLoading(false);
      }
    }
  }, [token]);

  const renderSend = (props: any) => (
    <Send {...props} containerStyle={styles.sendContainer}>
      <MaterialIcons name="send" size={24} color={theme.colors.primary} />
    </Send>
  );

  const renderInputToolbar = (props: any) => (
    <InputToolbar
      {...props}
      containerStyle={[
        styles.inputToolbar,
        { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outline }
      ]}
    />
  );

  const renderComposer = (props: any) => (
    <Composer
      {...props}
      placeholder="メッセージを入力..."
      placeholderTextColor={theme.colors.onSurfaceVariant}
      textInputStyle={[
        styles.textInput,
        { color: theme.colors.onSurface }
      ]}
    />
  );

  const clearChat = async () => {
    setMessages([
      {
        _id: 1,
        text: 'こんにちは！学習についてお手伝いします。何でも聞いてください！',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'AI Assistant',
          avatar: 'https://i.pravatar.cc/300?img=5',
        },
      },
    ]);
    await AsyncStorage.removeItem('chat_history');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="AI学習アシスタント" />
        <Appbar.Action icon="delete" onPress={clearChat} />
      </Appbar.Header>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{
            _id: 1,
            name: 'User',
          }}
          renderSend={renderSend}
          renderInputToolbar={renderInputToolbar}
          renderComposer={renderComposer}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={{ marginTop: 10 }}>AI が考えています...</Text>
            </View>
          )}
          isTyping={isLoading}
          alwaysShowSend
          scrollToBottomComponent={() => (
            <MaterialIcons name="keyboard-arrow-down" size={24} color={theme.colors.primary} />
          )}
          messagesContainerStyle={{
            backgroundColor: theme.colors.background,
          }}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
  },
  inputToolbar: {
    borderTopWidth: 1,
    paddingTop: 6,
    paddingBottom: 6,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 20,
    marginLeft: 10,
    marginRight: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AIChatScreen;