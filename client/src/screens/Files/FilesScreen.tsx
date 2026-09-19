import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { api, ApiError } from '../../api/client';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';

export interface ProjectFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  downloadUrl?: string;
}

interface FilesScreenProps {
  route: { params: { projectId: string } };
  navigation: any;
}

export const FilesScreen: React.FC<FilesScreenProps> = ({ route, navigation }) => {
  const { projectId } = route.params;
  const { colors, typography, spacing } = useTheme();

  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get<ProjectFile[]>(`/projects/${projectId}/files`);
      setFiles(response);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load files');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFiles();
  };

  const handleUploadFile = async () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      
      // Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size && file.size > maxSize) {
        Alert.alert('File Too Large', 'Maximum file size is 50MB');
        return;
      }

      setUploading(true);
      setError(null);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      } as any);

      // Upload file
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/projects/${projectId}/files`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }

      // Refresh file list
      fetchFiles();
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file');
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadFile = async (file: ProjectFile) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }

    // In a real app, implement download functionality
    Alert.alert(
      'Download File',
      `Download ${file.fileName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            // TODO: Implement actual download using expo-file-system
            console.log('Downloading file:', file.id);
          },
        },
      ]
    );
  };

  const handleDeleteFile = (fileId: string, fileName: string) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${fileName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/files/${fileId}`);
              
              if (Platform.OS !== 'web') {
                try {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch {}
              }
              
              // Remove from list
              setFiles(prev => prev.filter(f => f.id !== fileId));
            } catch (err) {
              const apiError = err as ApiError;
              Alert.alert('Error', apiError.message || 'Failed to delete file');
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📽️';
    return '📎';
  };

  const renderFileCard = (file: ProjectFile) => {
    const uploadDate = new Date(file.uploadedAt).toLocaleDateString();
    const fileIcon = getFileIcon(file.fileType);

    return (
      <Card key={file.id} style={styles.fileCard}>
        <View style={styles.fileHeader}>
          <Text style={styles.fileIcon}>{fileIcon}</Text>
          <View style={styles.fileInfo}>
            <Text style={[styles.fileName, { color: colors.onSurface, ...typography.titleMedium }]}>
              {file.fileName}
            </Text>
            <Text style={[styles.fileMetaText, { color: colors.onSurfaceVariant }]}>
              {formatFileSize(file.fileSize)} • Uploaded by {file.uploadedByName}
            </Text>
            <Text style={[styles.fileMetaText, { color: colors.onSurfaceVariant }]}>
              📅 {uploadDate}
            </Text>
          </View>
        </View>
        <View style={styles.fileActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primaryContainer }]}
            onPress={() => handleDownloadFile(file)}
          >
            <Text style={{ fontSize: 18 }}>⬇️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.errorContainer }]}
            onPress={() => handleDeleteFile(file.id, file.fileName)}
          >
            <Text style={{ fontSize: 18 }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            Loading files...
          </Text>
        </View>
      );
    }

    if (error && files.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <Button title="Retry" onPress={fetchFiles} variant="filled" style={{ marginTop: spacing.md }} />
        </View>
      );
    }

    if (files.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📁</Text>
          <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            No files yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.onSurfaceVariant }]}>
            Upload files to share with your team
          </Text>
          <Button
            title="Upload File"
            onPress={handleUploadFile}
            variant="filled"
            disabled={uploading}
            style={{ marginTop: spacing.md }}
          />
        </View>
      );
    }

    return files.map(renderFileCard);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.onSurface, ...typography.headlineMedium }]}>
            Project Files
          </Text>
          <Badge label={`${files.length} file${files.length !== 1 ? 's' : ''}`} variant="secondary" />
        </View>
        <Button
          title={uploading ? 'Uploading...' : '+ Upload File'}
          onPress={handleUploadFile}
          variant="filled"
          disabled={uploading}
          style={{ marginTop: spacing.sm }}
        />
      </View>

      {/* Files List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: spacing.md },
          files.length === 0 && styles.scrollContentEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {renderContent()}
      </ScrollView>

      {/* Upload Progress Indicator */}
      {uploading && (
        <View style={[styles.uploadingBanner, { backgroundColor: colors.primaryContainer }]}>
          <ActivityIndicator size="small" color={colors.onPrimaryContainer} style={{ marginRight: 8 }} />
          <Text style={[styles.uploadingText, { color: colors.onPrimaryContainer }]}>
            Uploading file...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  scrollContentEmpty: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  fileCard: {
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  fileMetaText: {
    fontSize: 12,
    marginBottom: 2,
  },
  fileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingBanner: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  uploadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
