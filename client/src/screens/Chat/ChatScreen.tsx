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
import { WorkspaceTabBar } from '../../components/WorkspaceTabBar';
import {
  socketService,
  ChatMessage,
  DirectMessagePayload,
  SocketConnectionStatus,
} from '../../services/socketService';
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

export type ActiveChat =
  | { type: 'channel'; id: string; title: string }
  | {
      type: 'dm';
      targetUserId: string;
      targetUserName: string;
      targetUserAvatar?: string;
      role?: string;
      department?: string;
    };

export const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { user } = useAuth();
  const projectId = route?.params?.projectId || '';
  const projectTitle = route?.params?.projectTitle || 'Team Chat';

  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [activeChat, setActiveChat] = useState<ActiveChat>({
    type: 'channel',
    id: projectId,
    title: projectTitle,
  });

  const [channelMessages, setChannelMessages] = useState<DisplayMessage[]>([]);
  const [dmMessages, setDmMessages] = useState<Record<string, DisplayMessage[]>>({});
  const [unreadDms, setUnreadDms] = useState<Record<string, number>>({});
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [showMobileMembers, setShowMobileMembers] = useState(false);
  const [inputText, setInputText] = useState('');
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [connectionStatus, setConnectionStatus] = useState<SocketConnectionStatus>('disconnected');

  const flatListRef = useRef<FlatList>(null);
  const activeChatRef = useRef<ActiveChat>(activeChat);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

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

  const currentMessages = useMemo(() => {
    if (activeChat.type === 'channel') {
      return channelMessages;
    }
    return dmMessages[activeChat.targetUserId] || [];
  }, [activeChat, channelMessages, dmMessages]);

  const currentScreenState = useMemo<ScreenState>(() => {
    if (screenState === 'loading') return 'loading';
    if (errorMessage) return 'error';
    return currentMessages.length > 0 ? 'populated' : 'empty';
  }, [screenState, errorMessage, currentMessages]);

  const switchConversation = useCallback(
    (target: ActiveChat) => {
      setActiveChat(target);
      if (target.type === 'dm') {
        setUnreadDms((prev) => ({ ...prev, [target.targetUserId]: 0 }));
        socketService.joinDmRoom(target.targetUserId);

        if (!dmMessages[target.targetUserId] || dmMessages[target.targetUserId].length === 0) {
          chatService
            .getDirectMessages(target.targetUserId)
            .then((history) => {
              if (Array.isArray(history)) {
                setDmMessages((prev) => ({
                  ...prev,
                  [target.targetUserId]: history as DisplayMessage[],
                }));
              }
            })
            .catch((err) => {
              console.warn('Failed to fetch direct messages via REST:', err.message);
            });
        }
      } else {
        socketService.joinRoom(projectId);
      }
    },
    [projectId, dmMessages]
  );

  // Initialize socket connection & message history
  const initChat = useCallback(() => {
    if (!projectId) return;

    chatService
      .getProjectMessages(projectId)
      .then((history) => {
        setChannelMessages(history || []);
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
        if (activeChatRef.current.type === 'channel') {
          socketService.joinRoom(projectId);
        } else {
          socketService.joinDmRoom(activeChatRef.current.targetUserId);
        }
      }
    });

    const unsubNewMessage = socketService.onNewMessage((newMsg) => {
      if (newMsg.projectId !== projectId) return;

      setChannelMessages((prev) => {
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

      if (activeChatRef.current.type === 'channel') {
        setScreenState('populated');
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    const unsubHistory = socketService.onMessageHistory((history) => {
      if (Array.isArray(history)) {
        setChannelMessages((prev) => {
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

    const unsubNewDm = socketService.onNewDirectMessage((newDm: DirectMessagePayload) => {
      const currentUserId = user?.userId || user?.id;
      const partnerId = newDm.senderId === currentUserId ? newDm.recipientId : newDm.senderId;

      setDmMessages((prev) => {
        const list = prev[partnerId] || [];
        const pendingIndex = list.findIndex(
          (m) => m.isPending && m.content === newDm.content && m.senderId === newDm.senderId
        );

        if (pendingIndex !== -1) {
          const updated = [...list];
          updated[pendingIndex] = newDm as DisplayMessage;
          return { ...prev, [partnerId]: updated };
        }

        if (list.some((m) => m.id === newDm.id)) {
          return prev;
        }

        return { ...prev, [partnerId]: [...list, newDm as DisplayMessage] };
      });

      if (
        activeChatRef.current.type === 'dm' &&
        activeChatRef.current.targetUserId === partnerId
      ) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else if (newDm.senderId !== currentUserId) {
        setUnreadDms((prev) => ({
          ...prev,
          [partnerId]: (prev[partnerId] || 0) + 1,
        }));
      }
    });

    const unsubDmHistory = socketService.onDmHistory((payload) => {
      if (payload && Array.isArray(payload.messages)) {
        setDmMessages((prev) => ({
          ...prev,
          [payload.targetUserId]: payload.messages as DisplayMessage[],
        }));
      }
    });

    return () => {
      unsubStatus?.();
      unsubNewMessage?.();
      unsubHistory?.();
      unsubNewDm?.();
      unsubDmHistory?.();
      socketService.leaveRoom(projectId);
    };
  }, [projectId, initChat, user]);

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

    const currentUserId = user?.userId || user?.id || 'me';
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (activeChat.type === 'channel') {
      const optimisticMessage: DisplayMessage = {
        id: tempId,
        projectId,
        senderId: currentUserId,
        content: trimmed,
        createdAt: new Date().toISOString(),
        isPending: true,
        sender: {
          id: currentUserId,
          email: user?.email || '',
        },
      };

      setChannelMessages((prev) => [...prev, optimisticMessage]);
      setInputText('');

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);

      socketService.sendMessage(projectId, trimmed, (response) => {
        if (response && response.success && response.message) {
          const confirmedMsg = response.message;
          setChannelMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...confirmedMsg, isPending: false } : m))
          );
        }
      });
    } else {
      const targetUserId = activeChat.targetUserId;
      const optimisticDm: DisplayMessage = {
        id: tempId,
        projectId,
        senderId: currentUserId,
        content: trimmed,
        createdAt: new Date().toISOString(),
        isPending: true,
        sender: {
          id: currentUserId,
          email: user?.email || '',
          profile: {
            fullName: user?.fullName || 'You',
          },
        },
      };

      setDmMessages((prev) => ({
        ...prev,
        [targetUserId]: [...(prev[targetUserId] || []), optimisticDm],
      }));
      setInputText('');

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);

      socketService.sendDirectMessage(targetUserId, trimmed, projectId, (response) => {
        if (response && response.success && response.message) {
          const confirmedDm = response.message as DisplayMessage;
          setDmMessages((prev) => {
            const list = prev[targetUserId] || [];
            return {
              ...prev,
              [targetUserId]: list.map((m) =>
                m.id === tempId ? { ...confirmedDm, isPending: false } : m
              ),
            };
          });
        }
      });
    }
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
    const senderName =
      item.sender?.profile?.fullName || item.sender?.email || (isOwn ? 'You' : 'Teammate');
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
                {timeFormatted} {item.isPending ? '(Sending...)' : ''}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderSidebar = () => {
    const currentUserId = user?.userId || user?.id;
    const dmTeammates = confirmedMembers.filter((m) => {
      const isSelf =
        (currentUserId && m.userId === currentUserId) ||
        (user?.email && m.user?.email && m.user.email.toLowerCase() === user.email.toLowerCase());
      return !isSelf;
    });

    const isChannelActive = activeChat.type === 'channel';

    return (
      <View
        style={[
          styles.sidebarContainer,
          { backgroundColor: colors.surface, borderRightColor: colors.border },
        ]}
      >
        {/* Channel Header */}
        <View style={styles.sidebarHeader}>
          <Text style={[typography.label, { color: colors.textMuted, letterSpacing: 0.8 }]}>
            CHANNELS
          </Text>
        </View>

        {/* Main Team Chat Channel Item */}
        <TouchableOpacity
          style={[
            styles.channelItem,
            {
              backgroundColor: isChannelActive ? colors.primarySoft : 'transparent',
              borderColor: isChannelActive ? colors.primary : colors.border,
              borderRadius: borderRadius.md,
            },
          ]}
          onPress={() =>
            switchConversation({ type: 'channel', id: projectId, title: projectTitle })
          }
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.channelAvatar,
              { backgroundColor: isChannelActive ? colors.primary : colors.surfaceMuted },
            ]}
          >
            <Text
              style={{
                color: isChannelActive ? colors.onPrimary : colors.text,
                fontWeight: '700',
                fontSize: 14,
              }}
            >
              #
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text
              style={[
                typography.body,
                { color: colors.text, fontWeight: isChannelActive ? '700' : '600' },
              ]}
              numberOfLines={1}
            >
              Team Chat
            </Text>
            <Text style={[typography.bodySmall, { color: colors.textMuted, fontSize: 11 }]}>
              {confirmedMembers.length > 0 ? `${confirmedMembers.length} members` : 'Project Channel'}
            </Text>
          </View>
          {isChannelActive && (
            <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
          )}
        </TouchableOpacity>

        {/* Direct Messages Header */}
        <View style={[styles.sidebarHeader, { marginTop: 20 }]}>
          <Text style={[typography.label, { color: colors.textMuted, letterSpacing: 0.8 }]}>
            DIRECT MESSAGES ({dmTeammates.length})
          </Text>
        </View>

        <ScrollView style={styles.membersList} showsVerticalScrollIndicator={false}>
          {dmTeammates.length === 0 ? (
            <Text
              style={[
                typography.bodySmall,
                { color: colors.textMuted, paddingHorizontal: 12, paddingVertical: 8 },
              ]}
            >
              No other teammates joined yet.
            </Text>
          ) : (
            dmTeammates.map((member) => {
              const name = member.user?.profile?.fullName || member.user?.email || 'Team Member';
              const department = member.user?.profile?.department || 'Department N/A';
              const isLeader = member.role === 'LEADER';
              const isDmActive =
                activeChat.type === 'dm' && activeChat.targetUserId === member.userId;
              const unreadCount = member.userId ? unreadDms[member.userId] || 0 : 0;

              return (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.memberRowItem,
                    {
                      backgroundColor: isDmActive ? colors.primarySoft : 'transparent',
                      borderRadius: borderRadius.md,
                      borderColor: isDmActive ? colors.primary : 'transparent',
                      borderWidth: isDmActive ? 1 : 0,
                    },
                  ]}
                  onPress={() => {
                    if (member.userId) {
                      switchConversation({
                        type: 'dm',
                        targetUserId: member.userId,
                        targetUserName: name,
                        targetUserAvatar: member.user?.profile?.avatarUrl,
                        role: member.role,
                        department,
                      });
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
                        {
                          color: colors.text,
                          fontWeight: isDmActive ? '700' : '600',
                          fontSize: 13,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                    <Text
                      style={[typography.bodySmall, { color: colors.textMuted, fontSize: 11 }]}
                      numberOfLines={1}
                    >
                      {department}
                    </Text>
                  </View>

                  {unreadCount > 0 ? (
                    <View
                      style={{
                        backgroundColor: '#EF4444',
                        borderRadius: 10,
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                        marginRight: 4,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                        {unreadCount}
                      </Text>
                    </View>
                  ) : null}

                  <Badge
                    label={isLeader ? 'Leader' : 'Member'}
                    variant={isLeader ? 'primary' : 'secondary'}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Current User Footer */}
        <View
          style={[
            styles.currentUserFooter,
            { borderTopColor: colors.border, backgroundColor: colors.surfaceMuted },
          ]}
        >
          <View
            style={[
              styles.miniSelfAvatar,
              { backgroundColor: colors.primary, borderColor: colors.border },
            ]}
          >
            <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 11 }}>
              {(user?.fullName || user?.email || 'Me').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text
              style={[typography.label, { color: colors.text, fontWeight: '700', fontSize: 12 }]}
              numberOfLines={1}
            >
              {user?.fullName || user?.email || 'Logged In'} (You)
            </Text>
            <Text style={[typography.bodySmall, { color: colors.textMuted, fontSize: 10 }]}>
              Personal Inbox Active
            </Text>
          </View>
        </View>
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
        title={activeChat.type === 'channel' ? projectTitle : activeChat.targetUserName}
        subtitle={activeChat.type === 'channel' ? 'Team Chat' : 'Direct Message'}
        showBack={Boolean(navigation?.canGoBack && navigation.canGoBack())}
        onBack={() => {
          if (activeChat.type === 'dm') {
            switchConversation({ type: 'channel', id: projectId, title: projectTitle });
          } else {
            navigation?.goBack?.();
          }
        }}
        actions={[
          ...(!isWide
            ? [
                {
                  icon: (
                    <Badge
                      label={
                        activeChat.type === 'channel'
                          ? `Inbox (${confirmedMembers.length})`
                          : `DM: ${activeChat.targetUserName.split(' ')[0]}`
                      }
                      variant="secondary"
                    />
                  ),
                  onPress: () => setShowMobileMembers(true),
                  accessibilityLabel: 'Switch Chat',
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
          ...(activeChat.type === 'dm'
            ? [
                {
                  icon: <Badge label="Profile" variant="tertiary" />,
                  onPress: () => {
                    navigation?.navigate('UserProfile', { userId: activeChat.targetUserId });
                  },
                  accessibilityLabel: 'View Profile',
                },
              ]
            : []),
        ]}
      />

      <WorkspaceTabBar
        activeTab="Chat"
        projectId={projectId}
        projectTitle={projectTitle}
        navigation={navigation}
      />

      <View style={styles.contentRow}>
        {/* Left Sidebar on desktop / wide screen */}
        {isWide && renderSidebar()}

        {/* Right Chat Stream Pane */}
        <View style={styles.chatPane}>
          {/* Date Divider Badge */}
          <View style={styles.dateSeparatorRow}>
            <View
              style={[
                styles.dateBadge,
                { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
              ]}
            >
              <Text style={[typography.label, { color: colors.textMuted, fontSize: 10 }]}>
                {activeChat.type === 'channel'
                  ? 'TODAY'
                  : `DIRECT: ${activeChat.targetUserName.toUpperCase()}`}
              </Text>
            </View>
          </View>

          {/* Message List */}
          <View style={styles.messageListContainer}>
            <StateWrapper
              state={currentScreenState}
              errorMessage={errorMessage}
              onRetry={initChat}
              emptyTitle={activeChat.type === 'channel' ? 'No Messages Yet' : activeChat.targetUserName}
              emptySubtitle={
                activeChat.type === 'channel'
                  ? 'Say hello to start communicating with your project team!'
                  : `This is the start of your direct conversation with ${activeChat.targetUserName}. Messages are private.`
              }
            >
              <FlatList
                ref={flatListRef}
                data={currentMessages}
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
              placeholder={
                activeChat.type === 'channel'
                  ? 'Type a message...'
                  : `Message ${activeChat.targetUserName.split(' ')[0]}...`
              }
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

      {/* Mobile Members & Direct Messages Sheet Modal */}
      {!isWide && (
        <Modal
          visible={showMobileMembers}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowMobileMembers(false)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={[styles.modalHeaderRow, { borderBottomColor: colors.border }]}>
                <Text style={[typography.h3, { color: colors.text }]}>
                  Conversations & Inbox
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

              <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
                {/* Channel Section */}
                <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
                  <Text
                    style={[
                      typography.label,
                      { color: colors.textMuted, letterSpacing: 0.8, fontSize: 11 },
                    ]}
                  >
                    CHANNELS
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.memberRowItem,
                    {
                      paddingHorizontal: 16,
                      backgroundColor:
                        activeChat.type === 'channel' ? colors.primarySoft : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    switchConversation({ type: 'channel', id: projectId, title: projectTitle });
                    setShowMobileMembers(false);
                  }}
                >
                  <View style={styles.avatarWrapper}>
                    <View
                      style={[
                        styles.memberAvatarCircle,
                        {
                          backgroundColor:
                            activeChat.type === 'channel' ? colors.primary : colors.surfaceMuted,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color:
                            activeChat.type === 'channel' ? colors.onPrimary : colors.text,
                          fontWeight: '700',
                          fontSize: 13,
                        }}
                      >
                        #
                      </Text>
                    </View>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text
                      style={[
                        typography.body,
                        {
                          color: colors.text,
                          fontWeight: activeChat.type === 'channel' ? '700' : '600',
                        },
                      ]}
                    >
                      Team Chat (Group)
                    </Text>
                    <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
                      {confirmedMembers.length} members
                    </Text>
                  </View>
                  {activeChat.type === 'channel' && (
                    <Badge label="Active" variant="primary" />
                  )}
                </TouchableOpacity>

                {/* Direct Messages Section */}
                <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 }}>
                  <Text
                    style={[
                      typography.label,
                      { color: colors.textMuted, letterSpacing: 0.8, fontSize: 11 },
                    ]}
                  >
                    DIRECT MESSAGES
                  </Text>
                </View>

                {confirmedMembers
                  .filter((member) => {
                    const currentUserId = user?.userId || user?.id;
                    const isSelf =
                      (currentUserId && member.userId === currentUserId) ||
                      (user?.email &&
                        member.user?.email &&
                        member.user.email.toLowerCase() === user.email.toLowerCase());
                    return !isSelf;
                  })
                  .map((member) => {
                    const name =
                      member.user?.profile?.fullName || member.user?.email || 'Team Member';
                    const department = member.user?.profile?.department || 'Department N/A';
                    const isLeader = member.role === 'LEADER';
                    const isDmActive =
                      activeChat.type === 'dm' && activeChat.targetUserId === member.userId;
                    const unreadCount = member.userId ? unreadDms[member.userId] || 0 : 0;

                    return (
                      <TouchableOpacity
                        key={member.id}
                        style={[
                          styles.memberRowItem,
                          {
                            paddingHorizontal: 16,
                            backgroundColor: isDmActive ? colors.primarySoft : 'transparent',
                          },
                        ]}
                        onPress={() => {
                          if (member.userId) {
                            switchConversation({
                              type: 'dm',
                              targetUserId: member.userId,
                              targetUserName: name,
                              targetUserAvatar: member.user?.profile?.avatarUrl,
                              role: member.role,
                              department,
                            });
                            setShowMobileMembers(false);
                          }
                        }}
                      >
                        <View style={styles.avatarWrapper}>
                          <View
                            style={[
                              styles.memberAvatarCircle,
                              {
                                backgroundColor: isLeader
                                  ? colors.primarySoft
                                  : colors.secondarySoft,
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
                          <Text
                            style={[
                              typography.body,
                              {
                                color: colors.text,
                                fontWeight: isDmActive ? '700' : '600',
                              },
                            ]}
                          >
                            {name}
                          </Text>
                          <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
                            {department}
                          </Text>
                        </View>

                        {unreadCount > 0 ? (
                          <View
                            style={{
                              backgroundColor: '#EF4444',
                              borderRadius: 10,
                              paddingHorizontal: 6,
                              paddingVertical: 1,
                              marginRight: 6,
                            }}
                          >
                            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                              {unreadCount}
                            </Text>
                          </View>
                        ) : null}

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
  currentUserFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  miniSelfAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  messageListContainer: {
    flex: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 2,
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
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: 4,
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
    alignItems: 'center',
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  composerInput: {
    flex: 1,
    borderWidth: 1,
    maxHeight: 100,
    fontSize: 14,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
