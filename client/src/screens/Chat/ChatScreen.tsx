import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  ScrollView,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { AppHeader } from '../../components/AppHeader';
import { Badge } from '../../components/Badge';
import { StateWrapper, ScreenState } from '../../components/StateWrapper';
import { socketService, ChatMessage, SocketConnectionStatus } from '../../services/socketService';
import { chatService } from '../../services/chatService';
import { workspaceService } from '../../services/workspaceService';
import { ProjectMember } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';

export interface ChatScreenProps {
  route?: {
    params?: {
      projectId: string;
      projectTitle?: string;
    };
  };
  navigation?: any;
}

interface DisplayMessage extends ChatMessage {
  isPending?: boolean;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { user } = useAuth();
  const projectId = route?.params?.projectId || '';
  const projectTitle = route?.params?.projectTitle || 'Team Chat';

  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [showMobileMembers, setShowMobileMembers] = useState(false);
  const [inputText, setInputText] = useState('');
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [connectionStatus, setConnectionStatus] = useState<SocketConnectionStatus>('disconnected');

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!projectId) return;
    workspaceService
      ?.getProjectMembers?.(projectId)
      ?.then((data) => {
        setMembers(data || []);
      })
      ?.catch((err: any) => {
        console.warn('Failed to load project members for chat sidebar:', err?.message);
      });
  }, [projectId]);

  const confirmedMembers = useMemo(
    () => members.filter((m) => m.status === 'ACCEPTED'),
    [members]
  );

  // Initialize socket connection & message history
  const initChat = useCallback(() => {
    if (!projectId) return;

    chatService
      .getProjectMessages(projectId)
      .then((history) => {
        setMessages(history || []);
        setScreenState(history && history.length > 0 ? 'populated' : 'empty');
        setErrorMessage(undefined);
      })
      .catch((err: any) => {
        console.warn('Initial REST message fetch failed, connecting to WS:', err.message);
      });

    socketService
      .connect()
      .then(() => {
        socketService.joinRoom(projectId);
      })
      .catch((err) => {
        console.warn('Socket connect failed:', err);
      });
  }, [projectId]);

  useEffect(() => {
    initChat();

    const unsubStatus = socketService.onStatusChange((status) => {
      setConnectionStatus(status);
      if (status === 'connected') {
        socketService.joinRoom(projectId);
      }
    });

    const unsubNewMessage = socketService.onNewMessage((newMsg) => {
      if (newMsg.projectId !== projectId) return;

      setMessages((prev) => {
        const pendingIndex = prev.findIndex(
          (m) => m.isPending && m.content === newMsg.content && m.senderId === newMsg.senderId
        );

        if (pendingIndex !== -1) {
          const updated = [...prev];
          updated[pendingIndex] = newMsg;
          return updated;
        }

        if (prev.some((m) => m.id === newMsg.id)) {
          return prev;
        }

        return [...prev, newMsg];
      });

      setScreenState('populated');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const unsubHistory = socketService.onMessageHistory((history) => {
      if (Array.isArray(history)) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const toAdd = history.filter((m) => !existingIds.has(m.id));
          const merged = [...prev, ...toAdd].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return merged;
        });
        setScreenState('populated');
      }
    });

    return () => {
      unsubStatus();
      unsubNewMessage();
      unsubHistory();
      socketService.leaveRoom(projectId);
    };
  }, [projectId, initChat]);

  const handleSendMessage = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // ignore
      }
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage: DisplayMessage = {
      id: tempId,
      projectId,
      senderId: user?.id || 'me',
      content: trimmed,
      createdAt: new Date().toISOString(),
      isPending: true,
      sender: {
        id: user?.id || 'me',
        email: user?.email || '',
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setScreenState('populated');
    setInputText('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    socketService.sendMessage(projectId, trimmed, (response) => {
      if (response && response.success && response.message) {
        const confirmedMsg = response.message;
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...confirmedMsg, isPending: false } : m))
        );
      }
    });
  };

  const handleAttachment = () => {
    Alert.alert('Share with Team', 'Select an attachment type:', [
      { text: 'Image', onPress: () => {} },
      { text: 'Document', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderMessageItem = ({ item }: { item: DisplayMessage }) => {
    const currentUserId = user?.userId || user?.id;
    const isOwn =
      (currentUserId && item.senderId === currentUserId) ||
      (user?.email && item.sender?.email && user.email.toLowerCase() === item.sender.email.toLowerCase()) ||
      item.senderId === 'me';
    const senderName = item.sender?.profile?.fullName || item.sender?.email || (isOwn ? 'You' : 'Teammate');
    const timeFormatted = item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <View
        style={[
          styles.messageRow,
          isOwn ? styles.messageRowOwn : styles.messageRowOther,
          { marginBottom: spacing.md },
        ]}
      >
        {!isOwn && (
          <View
            style={[
              styles.avatarMini,
              { backgroundColor: colors.secondarySoft, borderColor: colors.secondary },
            ]}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.secondary }}>
              {senderName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={{ maxWidth: isWide ? '72%' : '80%' }}>
          {!isOwn && (
            <Text
              style={[
                typography.label,
                { color: colors.textMuted, marginBottom: 2, marginLeft: 2 },
              ]}
            >
              {senderName}
            </Text>
          )}

          <View
            style={[
              styles.messageBubble,
              {
                backgroundColor: isOwn ? '#2563EB' : colors.surfaceMuted,
                borderRadius: borderRadius.md,
                borderColor: isOwn ? '#2563EB' : colors.border,
                padding: spacing.md,
              },
              isOwn ? styles.bubbleOwn : styles.bubbleOther,
            ]}
          >
            <Text
              style={[
                typography.body,
                { color: isOwn ? '#FFFFFF' : colors.text },
              ]}
            >
              {item.content}
            </Text>

            <View style={styles.messageMetaRow}>
              <Text
                style={[
                  typography.bodySmall,
                  {
                    fontSize: 10,
                    color: isOwn ? 'rgba(255,255,255,0.75)' : colors.textMuted,
                    marginTop: 4,
                  },
                ]}
              >
                {timeFormatted} {item.isPending ? '• Sending...' : ''}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderSidebar = () => {
    return (
      <View style={[styles.sidebarContainer, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
        {/* Channel Header */}
        <View style={styles.sidebarHeader}>
          <Text style={[typography.label, { color: colors.textMuted, letterSpacing: 0.8 }]}>
            CONVERSATION
          </Text>
        </View>

        {/* Main Team Chat Channel Item */}
        <TouchableOpacity
          style={[
            styles.channelItem,
            {
              backgroundColor: colors.primarySoft,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
            },
          ]}
          activeOpacity={0.8}
        >
          <View style={[styles.channelAvatar, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 14 }}>
              #
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>
              Team Chat
            </Text>
            <Text style={[typography.bodySmall, { color: colors.textMuted, fontSize: 11 }]}>
              {confirmedMembers.length > 0 ? `${confirmedMembers.length} members` : 'Project Channel'}
            </Text>
          </View>
          <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
        </TouchableOpacity>

        {/* Team Members Roster */}
        <View style={[styles.sidebarHeader, { marginTop: 20 }]}>
          <Text style={[typography.label, { color: colors.textMuted, letterSpacing: 0.8 }]}>
            TEAM MEMBERS ({confirmedMembers.length})
          </Text>
        </View>

        <ScrollView style={styles.membersList} showsVerticalScrollIndicator={false}>
          {confirmedMembers.length === 0 ? (
            <Text style={[typography.bodySmall, { color: colors.textMuted, paddingHorizontal: 12, paddingVertical: 8 }]}>
              No team members joined yet.
            </Text>
          ) : (
            confirmedMembers.map((member) => {
              const currentUserId = user?.userId || user?.id;
              const isSelf =
                (currentUserId && member.userId === currentUserId) ||
                (user?.email && member.user?.email && member.user.email.toLowerCase() === user.email.toLowerCase());
              const name = member.user?.profile?.fullName || member.user?.email || 'Team Member';
              const department = member.user?.profile?.department || 'Department N/A';
              const isLeader = member.role === 'LEADER';

              return (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.memberRowItem,
                    {
                      borderRadius: borderRadius.md,
                    },
                  ]}
                  onPress={() => {
                    if (member.userId) {
                      navigation?.navigate('UserProfile', { userId: member.userId });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatarWrapper}>
                    <View
                      style={[
                        styles.memberAvatarCircle,
                        {
                          backgroundColor: isLeader ? colors.primarySoft : colors.secondarySoft,
                          borderColor: isLeader ? colors.primary : colors.secondary,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: isLeader ? colors.primary : colors.secondary,
                          fontWeight: '700',
                          fontSize: 13,
                        }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.onlineDot} />
                  </View>

                  <View style={{ flex: 1, marginLeft: 10, marginRight: 6 }}>
                    <Text
                      style={[
                        typography.body,
                        { color: colors.text, fontWeight: isSelf ? '700' : '600', fontSize: 13 },
                      ]}
                      numberOfLines={1}
                    >
                      {name} {isSelf ? '(You)' : ''}
                    </Text>
                    <Text
                      style={[typography.bodySmall, { color: colors.textMuted, fontSize: 11 }]}
                      numberOfLines={1}
                    >
                      {department}
                    </Text>
                  </View>

                  <Badge
                    label={isLeader ? 'Leader' : 'Member'}
                    variant={isLeader ? 'primary' : 'secondary'}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <AppHeader
        title={projectTitle}
        subtitle="Team Chat"
        showBack={Boolean(navigation?.canGoBack && navigation.canGoBack())}
        onBack={() => navigation?.goBack?.()}
        actions={[
          ...(!isWide
            ? [
                {
                  icon: (
                    <Badge
                      label={`Team (${confirmedMembers.length})`}
                      variant="secondary"
                    />
                  ),
                  onPress: () => setShowMobileMembers(true),
                  accessibilityLabel: 'View Team Members',
                },
              ]
            : []),
          {
            icon: (
              <Badge
                label={
                  connectionStatus === 'connected'
                    ? 'Online'
                    : connectionStatus === 'connecting'
                    ? 'Connecting...'
                    : connectionStatus === 'reconnecting'
                    ? 'Reconnecting...'
                    : 'Offline'
                }
                variant={connectionStatus === 'connected' ? 'secondary' : 'tertiary'}
              />
            ),
            onPress: () => {},
            accessibilityLabel: 'Connection Status',
          },
        ]}
      />

      <View style={styles.contentRow}>
        {/* Left Sidebar on desktop / wide screen */}
        {isWide && renderSidebar()}

        {/* Right Chat Stream Pane */}
        <View style={styles.chatPane}>
          {/* Date Divider Badge */}
          <View style={styles.dateSeparatorRow}>
            <View style={[styles.dateBadge, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Text style={[typography.label, { color: colors.textMuted, fontSize: 10 }]}>TODAY</Text>
            </View>
          </View>

          {/* Message List */}
          <View style={styles.messageListContainer}>
            <StateWrapper
              state={screenState}
              errorMessage={errorMessage}
              onRetry={initChat}
              emptyTitle="No Messages Yet"
              emptySubtitle="Say hello to start communicating with your project team!"
            >
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessageItem}
                contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: 16 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              />
            </StateWrapper>
          </View>

          {/* Composer Input Bar */}
          <View
            style={[
              styles.composerContainer,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
                paddingHorizontal: spacing.screenPadding,
                paddingVertical: spacing.sm,
              },
            ]}
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Add attachment"
              onPress={handleAttachment}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.attachButton, { backgroundColor: colors.surfaceMuted }]}
            >
              <Text style={{ fontSize: 18, color: colors.text }}>+</Text>
            </TouchableOpacity>

            <TextInput
              style={[
                styles.composerInput,
                {
                  backgroundColor: colors.surfaceMuted,
                  color: colors.text,
                  borderColor: colors.border,
                  borderRadius: borderRadius.pill,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                },
              ]}
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />

            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim() ? colors.primary : colors.surfaceMuted,
                  borderRadius: borderRadius.pill,
                  marginLeft: spacing.xs + 2,
                },
              ]}
            >
              <Text
                style={[
                  typography.label,
                  {
                    color: inputText.trim() ? colors.onPrimary : colors.textMuted,
                    fontWeight: '700',
                  },
                ]}
              >
                Send
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Mobile Members Sheet Modal */}
      {!isWide && (
        <Modal
          visible={showMobileMembers}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowMobileMembers(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.modalHeaderRow, { borderBottomColor: colors.border }]}>
                <Text style={[typography.h3, { color: colors.text }]}>
                  Team Members ({confirmedMembers.length})
                </Text>
                <TouchableOpacity
                  onPress={() => setShowMobileMembers(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[typography.label, { color: colors.primary, fontWeight: '700' }]}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {confirmedMembers.map((member) => {
                  const currentUserId = user?.userId || user?.id;
                  const isSelf =
                    (currentUserId && member.userId === currentUserId) ||
                    (user?.email && member.user?.email && member.user.email.toLowerCase() === user.email.toLowerCase());
                  const name = member.user?.profile?.fullName || member.user?.email || 'Team Member';
                  const department = member.user?.profile?.department || 'Department N/A';
                  const isLeader = member.role === 'LEADER';

                  return (
                    <TouchableOpacity
                      key={member.id}
                      style={[styles.memberRowItem, { paddingHorizontal: 16 }]}
                      onPress={() => {
                        setShowMobileMembers(false);
                        if (member.userId) {
                          navigation?.navigate('UserProfile', { userId: member.userId });
                        }
                      }}
                    >
                      <View style={styles.avatarWrapper}>
                        <View
                          style={[
                            styles.memberAvatarCircle,
                            {
                              backgroundColor: isLeader ? colors.primarySoft : colors.secondarySoft,
                              borderColor: isLeader ? colors.primary : colors.secondary,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: isLeader ? colors.primary : colors.secondary,
                              fontWeight: '700',
                              fontSize: 13,
                            }}
                          >
                            {name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.onlineDot} />
                      </View>

                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[typography.body, { color: colors.text, fontWeight: isSelf ? '700' : '600' }]}>
                          {name} {isSelf ? '(You)' : ''}
                        </Text>
                        <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
                          {department}
                        </Text>
                      </View>

                      <Badge
                        label={isLeader ? 'Leader' : 'Member'}
                        variant={isLeader ? 'primary' : 'secondary'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarContainer: {
    width: 300,
    borderRightWidth: 1,
    paddingTop: 12,
  },
  sidebarHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    padding: 10,
    borderWidth: 1,
  },
  channelAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
  },
  membersList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  memberRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  avatarWrapper: {
    position: 'relative',
  },
  memberAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  chatPane: {
    flex: 1,
  },
  dateSeparatorRow: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  messageListContainer: {
    flex: 1,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  avatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  messageBubble: {
    borderWidth: 1,
  },
  bubbleOwn: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
  },
  messageMetaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  attachButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  composerInput: {
    flex: 1,
    borderWidth: 1,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    paddingBottom: 24,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
});
