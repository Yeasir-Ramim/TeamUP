import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { apiConfig, DEFAULT_API_URL } from '../services/apiConfig';

interface ServerConfigModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ServerConfigModal: React.FC<ServerConfigModalProps> = ({ visible, onClose }) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [urlInput, setUrlInput] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setUrlInput(apiConfig.getApiUrl());
      setTestResult(null);
    }
  }, [visible]);

  const handleTestConnection = async () => {
    if (!urlInput.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await apiConfig.testConnection(urlInput.trim());
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Connection test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!urlInput.trim()) return;
    setIsSaving(true);
    try {
      await apiConfig.setApiUrl(urlInput.trim());
      onClose();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Failed to save URL',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const defaultUrl = await apiConfig.resetApiUrl();
    setUrlInput(defaultUrl);
    setTestResult({
      success: true,
      message: 'Reset to default URL',
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.lg,
              padding: spacing.xl,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text, ...typography.h3 }]}>
            Server Connection
          </Text>

          <Text style={[styles.description, { color: colors.textMuted, ...typography.bodySmall }]}>
            Connect your Android device to the backend running on your PC. When using Ngrok, paste your tunnel HTTPS URL below.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted, ...typography.label }]}>
              Backend API URL
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.border,
                  color: colors.text,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                },
              ]}
              value={urlInput}
              onChangeText={(text) => {
                setUrlInput(text);
                setTestResult(null);
              }}
              placeholder="https://xxxx.ngrok-free.app/api/v1"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          {testResult && (
            <View
              style={[
                styles.resultBox,
                {
                  backgroundColor: testResult.success ? '#064e3b' : '#7f1d1d',
                  borderRadius: borderRadius.sm,
                  padding: spacing.sm,
                  marginTop: spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  styles.resultText,
                  { color: testResult.success ? '#34d399' : '#f87171', ...typography.bodySmall },
                ]}
              >
                {testResult.message}
              </Text>
            </View>
          )}

          <View style={[styles.buttonRow, { marginTop: spacing.md }]}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                },
              ]}
              onPress={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={{ color: colors.text, ...typography.body, fontWeight: '600' }}>
                  Ping Server
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.lg,
                },
              ]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={{ color: '#ffffff', ...typography.body, fontWeight: '700' }}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.footerRow, { marginTop: spacing.lg }]}>
            <TouchableOpacity onPress={handleReset}>
              <Text style={{ color: colors.textMuted, ...typography.bodySmall }}>
                Reset to Default
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: colors.textMuted, ...typography.bodySmall, fontWeight: '600' }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    marginBottom: 6,
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    fontSize: 14,
  },
  resultBox: {
    marginVertical: 4,
  },
  resultText: {
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
