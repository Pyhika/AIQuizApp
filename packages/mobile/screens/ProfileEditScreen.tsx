import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useAuthStore } from '../contexts/useAuthStore';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  bio?: string;
  phoneNumber?: string;
  location?: string;
  stats?: {
    totalQuizzesCreated: number;
    totalQuizzesTaken: number;
    averageScore: number;
    passRate: number;
  };
}

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { token } = useAuthStore();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  
  // Form fields
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/users/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to load profile');
      
      const data = await response.json();
      setProfile(data);
      
      // Set form fields
      setUsername(data.username || '');
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setEmail(data.email || '');
      setBio(data.bio || '');
      setPhoneNumber(data.phoneNumber || '');
      setLocation(data.location || '');
      setImageUri(data.profileImage ? `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}${data.profileImage}` : null);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const updateData = {
        username,
        firstName,
        lastName,
        email,
        bio,
        phoneNumber,
        location,
      };

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/users/profile`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      
      const updatedProfile = await response.json();
      setProfile({ ...updatedProfile, stats: profile?.stats });
      setIsEditMode(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload a profile picture');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take a photo');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setIsSaving(true);
      
      const formData = new FormData();
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/users/profile/image`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Failed to upload image');
      
      const data = await response.json();
      setImageUri(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}${data.profileImage}`);
      Alert.alert('Success', 'Profile picture updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProfileImage = async () => {
    Alert.alert(
      'Delete Profile Picture',
      'Are you sure you want to delete your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/users/profile/image`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (!response.ok) throw new Error('Failed to delete image');
              
              setImageUri(null);
              Alert.alert('Success', 'Profile picture deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete image');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  const showImageOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        ...(imageUri ? [{ text: 'Delete Photo', onPress: deleteProfileImage, style: 'destructive' as const }] : []),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            {!isEditMode ? (
              <TouchableOpacity onPress={() => setIsEditMode(true)}>
                <MaterialIcons name="edit" size={24} color="#6200EE" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#6200EE" />
                ) : (
                  <MaterialIcons name="check" size={24} color="#6200EE" />
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Image */}
          <View style={styles.imageSection}>
            <TouchableOpacity onPress={showImageOptions} disabled={!isEditMode}>
              <View style={styles.imageContainer}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.profileImage} />
                ) : (
                  <View style={styles.placeholderImage}>
                    <MaterialIcons name="person" size={60} color="#999" />
                  </View>
                )}
                {isEditMode && (
                  <View style={styles.cameraIcon}>
                    <MaterialIcons name="camera-alt" size={20} color="#fff" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            
            {/* Stats */}
            {profile?.stats && (
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile.stats.totalQuizzesTaken}</Text>
                  <Text style={styles.statLabel}>Quizzes Taken</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile.stats.averageScore}%</Text>
                  <Text style={styles.statLabel}>Avg Score</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile.stats.passRate}%</Text>
                  <Text style={styles.statLabel}>Pass Rate</Text>
                </View>
              </View>
            )}
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[styles.input, !isEditMode && styles.disabledInput]}
                value={username}
                onChangeText={setUsername}
                editable={isEditMode}
                placeholder="Enter username"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={[styles.input, !isEditMode && styles.disabledInput]}
                  value={firstName}
                  onChangeText={setFirstName}
                  editable={isEditMode}
                  placeholder="First name"
                />
              </View>
              
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={[styles.input, !isEditMode && styles.disabledInput]}
                  value={lastName}
                  onChangeText={setLastName}
                  editable={isEditMode}
                  placeholder="Last name"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, !isEditMode && styles.disabledInput]}
                value={email}
                onChangeText={setEmail}
                editable={isEditMode}
                keyboardType="email-address"
                placeholder="Enter email"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={[styles.input, !isEditMode && styles.disabledInput]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                editable={isEditMode}
                keyboardType="phone-pad"
                placeholder="Enter phone number"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={[styles.input, !isEditMode && styles.disabledInput]}
                value={location}
                onChangeText={setLocation}
                editable={isEditMode}
                placeholder="Enter location"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea, !isEditMode && styles.disabledInput]}
                value={bio}
                onChangeText={setBio}
                editable={isEditMode}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Action Buttons */}
          {isEditMode && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setIsEditMode(false);
                  loadProfile(); // Reset to original values
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#6200EE',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#6200EE',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6200EE',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  formSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#6200EE',
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});