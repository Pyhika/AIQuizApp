import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator, HelperText, ProgressBar, Checkbox, Surface, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail, validateUsername, getPasswordStrength } from '../../utils/validation';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  // Validation states
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<ReturnType<typeof getPasswordStrength> | null>(null);

  const { register } = useAuth();

  // Real-time validation
  useEffect(() => {
    if (email && !validateEmail(email)) {
      setEmailError('有効なメールアドレスを入力してください');
    } else {
      setEmailError('');
    }
  }, [email]);

  useEffect(() => {
    if (username) {
      const validation = validateUsername(username);
      if (!validation.isValid) {
        setUsernameError(validation.error || '');
      } else {
        setUsernameError('');
      }
    }
  }, [username]);

  useEffect(() => {
    if (password) {
      const strength = getPasswordStrength(password);
      setPasswordStrength(strength);
      if (strength.strength === 'weak') {
        setPasswordError('パスワードが弱すぎます');
      } else {
        setPasswordError('');
      }
    } else {
      setPasswordStrength(null);
    }
  }, [password]);

  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError('パスワードが一致しません');
    } else {
      setConfirmPasswordError('');
    }
  }, [password, confirmPassword]);

  const getPasswordStrengthColor = () => {
    if (!passwordStrength) return '#e0e0e0';
    switch (passwordStrength.strength) {
      case 'weak': return '#f44336';
      case 'medium': return '#ff9800';
      case 'strong': return '#4caf50';
    }
  };

  const getPasswordStrengthProgress = () => {
    if (!passwordStrength) return 0;
    return passwordStrength.score / 5;
  };

  const handleRegister = async () => {
    // Validation
    if (!email || !username || !password) {
      Alert.alert('エラー', '必須項目を入力してください');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('エラー', '有効なメールアドレスを入力してください');
      return;
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      Alert.alert('エラー', usernameValidation.error || 'ユーザー名が無効です');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }

    if (passwordStrength?.strength === 'weak') {
      Alert.alert('エラー', 'パスワードが弱すぎます。より強力なパスワードを設定してください');
      return;
    }

    if (!agreeToTerms) {
      Alert.alert('エラー', '利用規約に同意してください');
      return;
    }

    setLoading(true);
    try {
      await register({
        email,
        username,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });
      Alert.alert('成功', 'アカウントを作成しました');
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('エラー', error instanceof Error ? error.message : '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => router.back()}
              style={styles.backButton}
            />
            <Text variant="headlineMedium" style={styles.title}>
              アカウント作成
            </Text>
          </View>
          
          <Text variant="bodyMedium" style={styles.subtitle}>
            新しいアカウントを作成して、学習を始めましょう
          </Text>

          <TextInput
            label="メールアドレス *"
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
            label="ユーザー名 *"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={styles.input}
            error={!!usernameError}
            left={<TextInput.Icon icon="account" />}
          />
          <HelperText type="error" visible={!!usernameError}>
            {usernameError}
          </HelperText>

          <TextInput
            label="姓"
            value={lastName}
            onChangeText={setLastName}
            style={styles.input}
          />

          <TextInput
            label="名"
            value={firstName}
            onChangeText={setFirstName}
            style={styles.input}
          />

          <TextInput
            label="パスワード *"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            error={!!passwordError}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
          />
          <HelperText type="error" visible={!!passwordError}>
            {passwordError}
          </HelperText>
          
          {passwordStrength && (
            <View style={styles.passwordStrength}>
              <Text variant="bodySmall" style={styles.strengthLabel}>
                パスワード強度: {passwordStrength.strength === 'weak' ? '弱' : passwordStrength.strength === 'medium' ? '中' : '強'}
              </Text>
              <ProgressBar
                progress={getPasswordStrengthProgress()}
                color={getPasswordStrengthColor()}
                style={styles.progressBar}
              />
              {passwordStrength.feedback.length > 0 && (
                <View style={styles.feedbackContainer}>
                  {passwordStrength.feedback.map((feedback, index) => (
                    <Text key={index} variant="bodySmall" style={styles.feedbackText}>
                      • {feedback}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          <TextInput
            label="パスワード確認 *"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            error={!!confirmPasswordError}
            left={<TextInput.Icon icon="lock-check" />}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? "eye-off" : "eye"}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
            style={styles.input}
          />
          <HelperText type="error" visible={!!confirmPasswordError}>
            {confirmPasswordError}
          </HelperText>
          
          <View style={styles.checkboxContainer}>
            <Checkbox
              status={agreeToTerms ? 'checked' : 'unchecked'}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
            />
            <Text style={styles.checkboxLabel}>
              <Text>利用規約</Text>
              <Text style={styles.link}> 及び </Text>
              <Text>プライバシーポリシー</Text>
              <Text>に同意します</Text>
            </Text>
          </View>

          <Button
            mode="contained"
            onPress={handleRegister}
            disabled={loading}
            style={styles.button}
          >
            {loading ? <ActivityIndicator color="white" /> : 'アカウント作成'}
          </Button>

          <Button
            mode="text"
            onPress={() => router.push('/auth/login')}
            style={styles.linkButton}
          >
            既にアカウントをお持ちの方はこちら
          </Button>
        </View>
      </ScrollView>
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
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginLeft: -8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    marginRight: 32,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 4,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  linkButton: {
    marginTop: 16,
  },
  passwordStrength: {
    marginBottom: 16,
  },
  strengthLabel: {
    marginBottom: 4,
    color: '#666',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  feedbackContainer: {
    marginTop: 4,
  },
  feedbackText: {
    color: '#666',
    marginTop: 2,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  checkboxLabel: {
    flex: 1,
    marginLeft: 8,
  },
  link: {
    color: '#6200ea',
    textDecorationLine: 'underline',
  },
});
