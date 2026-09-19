import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { api, ApiError } from '../../api/client';
import { tokenStorage } from '../../services/tokenStorage';
import * as Haptics from 'expo-haptics';
import io, { Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  userName: string;
  createdAt: string;
  isOwnMessage?: boolean;
}

interface TeamChatScreenProps {
  route: { params: { projectId: string } };
  navigation: any;
}

const BASE_WS_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

export const TeamChatScreen: React.FC<TeamChatScreenProps> = ({ route, navigation }) => {
  const { projectId } = route.params;
  const { colors, typography, spacing } = useTheme();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const currentUserIdRef = useRef<string | null>(null);

  // Fetch message history
  const fetchMessages = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get<ChatMessage[]>(`/projects/${projectId}/messages`);
      
      // Mark own messages
      const userId = currentUserIdRef.current;
      const messagesWithOwnership = response.map(msg => ({
        ...msg,
        isOwnMessage: msg.userId === userId,
      }));
      
      setMessages(messagesWithOwnership);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Setup WebSocket connection
  useEffect(() => {
    const setupSocket = async () => {
      try {
        const token = await tokenStorage.getAccessToken();
        if (!token) {
          setError('Authentication required');
          return;
        }

        // Get current user ID from token or profile
        try {
          const profile = await api.get<{ id: string }>('/profiles/me');
          currentUserIdRef.current = profile.id;
        } catch {}

        // Connect to WebSocket
        const socket = io(BASE_WS_URL, {
          auth: { token },
          transports: ['websocket'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('Chat socket connected');
          setConnected(true);
          setError(null);
          // Join the project room
          socket.emit('joinProject', { projectId });
        });

        socket.on('disconnect', () => {
          console.log('Chat socket disconnected');
          setConnected(false);
        });

        socket.on('error', (err: any) => {
          console.error('Socket error:', err);
          setError('Connection error');
        });

        // Listen for new messages
        socket.on('newMessage', (message: ChatMessage) => {
          const messageWithOwnership = {
            ...message,
            isOwnMessage: message.userId === currentUserIdRef.current,
          };
          setMessages(prev => [...prev, messageWithOwnership]);
          
          // Scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        });

        // Fetch initial messages
        await fetchMessages();
      } catch (err) {
        console.error('Socket setup error:', err);
        setError('Failed to connect to chat');
      }
    };

    setupSocket();

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [projectId, fetchMessages]);

  const handleSendMessage = async () => {
    const content = messageInput.trim();
    if (!content || !socketRef.current || sending) return;

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }

    setSending(true);
    setMessageInput('');

    try {
      // Emit message to server
      socketRef.current.emit('sendMessage', {
        projectId,
        content,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      // Restore input on error
      setMessageInput(content);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwn = item.isOwnMessage;
    const messageTime = new Date(item.createdAt);
    const timeString = messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.messageContainer, isOwn ? styles.ownMessageContainer : styles.otherMessageContainer]}>
        {!isOwn && (
          <Text style={[styles.senderName, { color: colors.onSurfaceVariant, ...typography.labelMedium }]}>
            {item.userName}
          </Text>
        )}
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isOwn ? colors.primaryContainer : colors.surfaceVariant,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              {
                color: isOwn ? colors.onPrimaryContainer : colors.onSurface,
                ...typography.bodyMedium,
              },
            ]}
          >
            {item.content}
          </Text>
        </View>
        <Text style={[styles.messageTime, { color: colors.onSurfaceVariant }]}>{timeString}</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            Loading messages...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={[styles.emptyText, { color: colors.error }]}>{error}</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          No messages yet
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.onSurfaceVariant }]}>
          Be the first to say something!
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Connection Status */}
      {!connected && !loading && (
        <View style={[styles.statusBar, { backgroundColor: colors.errorContainer }]}>
          <Text style={[styles.statusText, { color: colors.onErrorContainer }]}>
            🔴 Disconnected - Reconnecting...
          </Text>
        </View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.messagesList,
          { paddingHorizontal: spacing.md },
          messages.length === 0 && styles.messagesListEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input Area */}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.outlineVariant }]}>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.surfaceVariant,
              color: colors.onSurface,
              borderColor: colors.outlineVariant,
            },
          ]}
          placeholder="Type a message..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={messageInput}
          onChangeText={setMessageInput}
          multiline
          maxLength={1000}
          editable={connected && !sending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: messageInput.trim() && connected ? colors.primary : colors.surfaceVariant,
            },
          ]}
          onPress={handleSendMessage}
          disabled={!messageInput.trim() || !connected || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text style={{ fontSize: 20 }}>
              {messageInput.trim() && connected ? '📤' : '💬'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  messagesList: {
    paddingVertical: 16,
  },
  messagesListEmpty: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
  },
  messageText: {
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    marginHorizontal: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
