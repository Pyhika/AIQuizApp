import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator, HelperText, Surface, Divider, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail } from '../../utils/validation';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  // Email validation
  useEffect(() => {
    if (email && !validateEmail(email)) {
      setEmailError('有効なメールアドレスを入力してください');
    } else {
      setEmailError('');
    }
  }, [email]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('エラー', '有効なメールアドレスを入力してください');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Success alert is removed - redirect happens automatically
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('ログインエラー', error instanceof Error ? error.message : 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Surface style={styles.logoContainer} elevation={0}>
          <View style={styles.logoPlaceholder}>
            <Text variant="displaySmall" style={styles.logoText}>🎓</Text>
          </View>
          <Text variant="headlineMedium" style={styles.title}>
            Quiz Master
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            学習を始めましょう
          </Text>
        </Surface>

        <TextInput
          label="メールアドレス"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={styles.input}
          error={!!emailError}
          left={<TextInput.Icon icon="email" />}
        />
        <HelperText type="error" visible={!!emailError}>
          {emailError}
        </HelperText>

        <TextInput
          label="パスワード"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          left={<TextInput.Icon icon="lock" />}
          right={
            <TextInput.Icon
              icon={showPassword ? "eye-off" : "eye"}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
          style={styles.input}
        />
        
        <View style={styles.forgotPasswordContainer}>
          <Button
            mode="text"
            onPress={() => Alert.alert('開発中', 'パスワードリセット機能は開発中です')}
            style={styles.forgotPasswordButton}
          >
            パスワードを忘れた方
          </Button>
        </View>

        <Button
          mode="contained"
          onPress={handleLogin}
          disabled={loading || !email || !password}
          style={styles.button}
          icon="login"
        >
          {loading ? <ActivityIndicator color="white" /> : 'ログイン'}
        </Button>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text variant="bodyMedium" style={styles.dividerText}>または</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          mode="outlined"
          onPress={() => router.push('/auth/register')}
          style={styles.registerButton}
          icon="account-plus"
        >
          新しいアカウントを作成
        </Button>
        
        <View style={styles.socialLoginContainer}>
          <Text variant="bodyMedium" style={styles.socialLoginText}>
            ソーシャルアカウントでログイン
          </Text>
          <View style={styles.socialButtons}>
            <IconButton
              icon="google"
              size={30}
              onPress={() => Alert.alert('開発中', 'Googleログインは開発中です')}
              style={styles.socialButton}
            />
            <IconButton
              icon="apple"
              size={30}
              onPress={() => Alert.alert('開発中', 'Appleログインは開発中です')}
              style={styles.socialButton}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: 'transparent',
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6200ea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
  },
  input: {
    marginBottom: 4,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordButton: {
    marginRight: -8,
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
  },
  registerButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
  },
  socialLoginContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  socialLoginText: {
    color: '#666',
    marginBottom: 12,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButton: {
    marginHorizontal: 8,
  },
});
