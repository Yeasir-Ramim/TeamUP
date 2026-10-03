import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/ThemeContext';
import { ChatScreen } from '../screens/Chat/ChatScreen';
import { socketService, ChatMessage } from '../services/socketService';
import { chatService } from '../services/chatService';

jest.mock('../services/socketService');
jest.mock('../services/chatService');
jest.mock('../services/workspaceService', () => ({
  workspaceService: {
    getProjectMembers: jest.fn().mockResolvedValue([
      {
        id: 'member-1',
        projectId: 'proj-1',
        userId: 'user-me',
        role: 'LEADER',
        status: 'ACCEPTED',
        user: { id: 'user-me', email: 'me@example.com', profile: { fullName: 'Tanvir Hasan' } },
      },
      {
        id: 'member-2',
        projectId: 'proj-1',
        userId: 'user-other',
        role: 'MEMBER',
        status: 'ACCEPTED',
        user: { id: 'user-other', email: 'other@example.com', profile: { fullName: 'Mahin Khan' } },
      },
    ]),
  },
}));
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-me', email: 'me@example.com' },
    isAuthenticated: true,
  }),
}));

const mockMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    projectId: 'proj-1',
    senderId: 'user-other',
    content: 'Hello team, welcome to the project!',
    createdAt: '2026-09-22T01:00:00.000Z',
    sender: {
      id: 'user-other',
      email: 'other@example.com',
      profile: { fullName: 'Other Teammate' },
    },
  },
  {
    id: 'msg-2',
    projectId: 'proj-1',
    senderId: 'user-me',
    content: 'Glad to be here! Working on Phase 4 now.',
    createdAt: '2026-09-22T01:05:00.000Z',
    sender: {
      id: 'user-me',
      email: 'me@example.com',
    },
  },
];

describe('Phase 4 — Team Chat', () => {
  let statusCallback: (status: any) => void;

  beforeEach(() => {
    jest.clearAllMocks();

    (socketService.connect as jest.Mock).mockResolvedValue({});
    (socketService.onStatusChange as jest.Mock).mockImplementation((cb) => {
      statusCallback = cb;
      cb('connected');
      return jest.fn();
    });
    (socketService.onNewMessage as jest.Mock).mockImplementation(() => jest.fn());
    (socketService.onMessageHistory as jest.Mock).mockImplementation(() => jest.fn());
    (socketService.onNewDirectMessage as jest.Mock).mockImplementation(() => jest.fn());
    (socketService.onDmHistory as jest.Mock).mockImplementation(() => jest.fn());
    (socketService.joinRoom as jest.Mock).mockImplementation(() => {});
    (socketService.joinDmRoom as jest.Mock).mockImplementation(() => {});
    (socketService.leaveRoom as jest.Mock).mockImplementation(() => {});
    (socketService.leaveDmRoom as jest.Mock).mockImplementation(() => {});
    (socketService.sendMessage as jest.Mock).mockImplementation((_pid, _content, cb) => {
      if (cb) {
        cb({
          success: true,
          message: {
            id: 'confirmed-123',
            projectId: 'proj-1',
            senderId: 'user-me',
            content: _content,
            createdAt: new Date().toISOString(),
          },
        });
      }
    });
    (socketService.sendDirectMessage as jest.Mock).mockImplementation((_uid, _content, _pid, cb) => {
      if (cb) {
        cb({
          success: true,
          message: {
            id: 'dm-confirmed-123',
            senderId: 'user-me',
            recipientId: _uid,
            content: _content,
            createdAt: new Date().toISOString(),
          },
        });
      }
    });

    (chatService.getProjectMessages as jest.Mock).mockResolvedValue(mockMessages);
    (chatService.getDirectMessages as jest.Mock).mockResolvedValue([]);
  });

  it('connects to chat, joins room, and loads message history', async () => {
    const route = { params: { projectId: 'proj-1', projectTitle: 'Drone Fleet Chat' } };

    const { getByText } = render(
      <ThemeProvider>
        <ChatScreen route={route} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('Drone Fleet Chat')).toBeTruthy();
      expect(getByText('Online')).toBeTruthy();
      expect(getByText('Hello team, welcome to the project!')).toBeTruthy();
      expect(getByText('Glad to be here! Working on Phase 4 now.')).toBeTruthy();
      expect(getByText('Other Teammate')).toBeTruthy();
    });

    expect(socketService.connect).toHaveBeenCalled();
    expect(socketService.joinRoom).toHaveBeenCalledWith('proj-1');
  });

  it('sends message optimistically, reconciles response, and clears composer', async () => {
    const route = { params: { projectId: 'proj-1' } };

    const { getByPlaceholderText, getByText } = render(
      <ThemeProvider>
        <ChatScreen route={route} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('Hello team, welcome to the project!')).toBeTruthy();
    });

    const input = getByPlaceholderText('Type a message...');
    fireEvent.changeText(input, 'New test message from composer');

    const sendBtn = getByText('Send');
    fireEvent.press(sendBtn);

    await waitFor(() => {
      expect(getByText('New test message from composer')).toBeTruthy();
      expect(socketService.sendMessage).toHaveBeenCalledWith(
        'proj-1',
        'New test message from composer',
        expect.any(Function)
      );
    });
  });

  it('handles reconnect status without losing input draft', async () => {
    const route = { params: { projectId: 'proj-1' } };

    const { getByPlaceholderText, getByText } = render(
      <ThemeProvider>
        <ChatScreen route={route} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('Online')).toBeTruthy();
    });

    const input = getByPlaceholderText('Type a message...');
    fireEvent.changeText(input, 'Draft message in progress...');

    // Simulate network drop and reconnecting
    if (statusCallback) {
      statusCallback('reconnecting');
    }

    await waitFor(() => {
      expect(getByText('Reconnecting...')).toBeTruthy();
    });

    // Reconnected
    if (statusCallback) {
      statusCallback('connected');
    }

    await waitFor(() => {
      expect(getByText('Online')).toBeTruthy();
      // Composer draft is preserved
      expect(input.props.value).toBe('Draft message in progress...');
    });
  });

  it('switches to direct message with a teammate and sends DM', async () => {
    const route = { params: { projectId: 'proj-1', projectTitle: 'Drone Fleet Chat' } };

    const { getByText, getByPlaceholderText, getByLabelText } = render(
      <ThemeProvider>
        <ChatScreen route={route} />
      </ThemeProvider>
    );

    // In mobile view (default jest dimensions), press Switch Chat button to open modal
    const switchBtn = getByLabelText('Switch Chat');
    fireEvent.press(switchBtn);

    await waitFor(() => {
      expect(getByText('Mahin Khan')).toBeTruthy();
    });

    // Click on Mahin Khan in the DM list
    fireEvent.press(getByText('Mahin Khan'));

    await waitFor(() => {
      expect(getByText('Direct Message')).toBeTruthy();
      expect(socketService.joinDmRoom).toHaveBeenCalledWith('user-other');
    });

    const dmInput = getByPlaceholderText('Message Mahin...');
    fireEvent.changeText(dmInput, 'Private direct message to Mahin');

    const sendBtn = getByText('Send');
    fireEvent.press(sendBtn);

    await waitFor(() => {
      expect(getByText('Private direct message to Mahin')).toBeTruthy();
      expect(socketService.sendDirectMessage).toHaveBeenCalledWith(
        'user-other',
        'Private direct message to Mahin',
        'proj-1',
        expect.any(Function)
      );
    });
  });

  it('renders Messenger-style mobile inbox view and switches to chat thread', async () => {
    const route = {
      params: {
        projectId: 'proj-1',
        projectTitle: 'Drone Fleet Chat',
        initialView: 'inbox' as const,
      },
    };

    const { getByText, getByPlaceholderText, getByLabelText } = render(
      <ThemeProvider>
        <ChatScreen route={route} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('CHANNELS')).toBeTruthy();
      expect(getByText('Team Chat')).toBeTruthy();
      expect(getByText('Mahin Khan')).toBeTruthy();
      expect(getByPlaceholderText('Search conversations & teammates...')).toBeTruthy();
    });

    // Tap on Mahin Khan in the inbox list to enter direct conversation
    fireEvent.press(getByText('Mahin Khan'));

    await waitFor(() => {
      expect(getByText('Direct Message')).toBeTruthy();
      expect(getByPlaceholderText('Message Mahin...')).toBeTruthy();
    });

    // Press Inbox tab to return to the inbox list
    const inboxTab = getByLabelText('Inbox Tab');
    fireEvent.press(inboxTab);

    await waitFor(() => {
      expect(getByText('CHANNELS')).toBeTruthy();
      expect(getByText('Team Chat')).toBeTruthy();
    });
  });

  it('opens attachment options sheet when plus button is tapped', async () => {
    const route = {
      params: {
        projectId: 'proj-1',
        projectTitle: 'Drone Fleet Chat',
      },
    };

    const { getByLabelText, getByText } = render(
      <ThemeProvider>
        <ChatScreen route={route} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('Team Chat')).toBeTruthy();
    });

    // Tap + button
    const plusButton = getByLabelText('Add attachment');
    fireEvent.press(plusButton);

    await waitFor(() => {
      expect(getByText('Add Attachment')).toBeTruthy();
      expect(getByText('Photo or Image')).toBeTruthy();
      expect(getByText('Document or File')).toBeTruthy();
    });

    // Tap Cancel
    fireEvent.press(getByText('Cancel'));
  });
});
