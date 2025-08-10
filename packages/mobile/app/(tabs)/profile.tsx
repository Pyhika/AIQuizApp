import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Paragraph, Avatar, Button, Divider, List, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const { isAuthenticated, user, loading, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト', style: 'destructive', onPress: async () => {
            try {
              await logout();
              Alert.alert('ログアウトしました');
            } catch (error) {
              Alert.alert('エラー', 'ログアウトに失敗しました');
            }
          }
        },
      ]
    );
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const handleRegister = () => {
    router.push('/auth/register');
  };

  const handleDataExport = () => {
    Alert.alert('データエクスポート', '学習データをエクスポートしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '開始', onPress: () => Alert.alert('エクスポート開始', 'データの準備中です...') },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ アカウント削除',
      'この操作は取り消せません。すべてのデータが削除されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除', style: 'destructive', onPress: () => {
            Alert.alert('確認', 'アカウントを削除してもよろしいですか？', [
              { text: 'キャンセル', style: 'cancel' },
              {
                text: '削除', style: 'destructive', onPress: () => {
                  // TODO: アカウント削除処理
                  Alert.alert('アカウントが削除されました');
                }
              },
            ]);
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Paragraph style={styles.loadingText}>読み込み中...</Paragraph>
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    // 未認証時の表示
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Title style={styles.title}>👤 プロフィール</Title>

          <Card style={styles.card}>
            <Card.Content style={styles.authCard}>
              <Avatar.Icon size={80} icon="account" style={styles.avatar} />
              <Title style={styles.authTitle}>アカウントでログイン</Title>
              <Paragraph style={styles.authDescription}>
                クイズの進行状況を保存したり、学習データを同期するには、アカウントが必要です。
              </Paragraph>

              <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.authButton}
                icon="login"
              >
                ログイン
              </Button>

              <Button
                mode="outlined"
                onPress={handleRegister}
                style={styles.authButton}
                icon="account-plus"
              >
                アカウント作成
              </Button>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title>ゲストモード</Title>
              <Paragraph>
                ログインしなくても一部機能をご利用いただけますが、
                データの保存や同期はできません。
              </Paragraph>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    );
  }

  // 認証済み時の表示
  const userData = {
    name: user.firstName && user.lastName ? `${user.lastName} ${user.firstName}` : user.username,
    email: user.email,
    joinDate: '2024年1月', // TODO: 実際の登録日を表示
    totalQuizzes: 45, // TODO: 実際のクイズ数を取得
    totalScore: 3780, // TODO: 実際のスコアを取得
    level: 'アドバンス', // TODO: 実際のレベルを計算
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Title style={styles.title}>👤 プロフィール</Title>

        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <Avatar.Text
                size={80}
                label={userData.name.charAt(0)}
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Title style={styles.userName}>{userData.name}</Title>
                <Paragraph style={styles.userEmail}>{userData.email}</Paragraph>
                <Paragraph style={styles.userLevel}>レベル: {userData.level}</Paragraph>
              </View>
            </View>
            <Button
              mode="outlined"
              onPress={() => router.push('/profile-edit')}
              style={styles.editButton}
              icon="account-edit"
            >
              プロフィールを編集
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>📊 学習統計</Title>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Title style={styles.statNumber}>{userData.totalQuizzes}</Title>
                <Paragraph>完了クイズ</Paragraph>
              </View>
              <View style={styles.statItem}>
                <Title style={styles.statNumber}>{userData.totalScore}</Title>
                <Paragraph>総スコア</Paragraph>
              </View>
              <View style={styles.statItem}>
                <Title style={styles.statNumber}>{userData.joinDate}</Title>
                <Paragraph>利用開始</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>⚙️ 設定</Title>
          </Card.Content>

          <List.Item
            title="通知設定"
            description="プッシュ通知の設定"
            left={props => <List.Icon {...props} icon="bell" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('開発中', '通知設定は開発中です')}
          />

          <Divider />

          <List.Item
            title="学習リマインダー"
            description="学習時間のリマインダー設定"
            left={props => <List.Icon {...props} icon="clock" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('開発中', 'リマインダー設定は開発中です')}
          />

          <Divider />

          <List.Item
            title="ダークモード"
            description="テーマの変更"
            left={props => <List.Icon {...props} icon="brightness-6" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('開発中', 'テーマ設定は開発中です')}
          />
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>📤 データ管理</Title>

            <Button
              mode="outlined"
              onPress={handleDataExport}
              style={styles.button}
              icon="download"
            >
              学習データをエクスポート
            </Button>

            <Button
              mode="outlined"
              onPress={() => Alert.alert('開発中', 'データインポート機能は開発中です')}
              style={styles.button}
              icon="upload"
            >
              データをインポート
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>🔐 アカウント</Title>

            <Button
              mode="contained"
              onPress={handleLogout}
              style={[styles.button, styles.logoutButton]}
              icon="logout"
            >
              ログアウト
            </Button>

            <Button
              mode="outlined"
              onPress={handleDeleteAccount}
              style={[styles.button, styles.deleteButton]}
              textColor="#d32f2f"
              icon="delete"
            >
              アカウントを削除
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Paragraph style={styles.version}>Quiz Master v1.0.0</Paragraph>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
  },
  profileCard: {
    marginBottom: 16,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#6200ea',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#666',
    marginBottom: 4,
  },
  userLevel: {
    color: '#6200ea',
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  authCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  authTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  authDescription: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  authButton: {
    marginVertical: 8,
    minWidth: 200,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ea',
  },
  button: {
    marginVertical: 8,
  },
  editButton: {
    marginTop: 16,
  },
  logoutButton: {
    backgroundColor: '#ff9800',
  },
  deleteButton: {
    borderColor: '#d32f2f',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  version: {
    color: '#999',
    fontSize: 12,
  },
});
