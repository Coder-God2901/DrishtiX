import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyTo?: string;
  timestamp: Date;
  edited?: boolean;
  reactions?: { emoji: string; users: string[] }[];
  readBy: string[];
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  members: string[];
  admins: string[];
  createdAt: Date;
  lastMessage?: Message;
  unreadCount?: number;
  avatar?: string;
}

export interface TypingIndicator {
  channelId: string;
  userId: string;
  userName: string;
}

interface MessagingState {
  channels: Channel[];
  messages: Record<string, Message[]>;
  activeChannelId: string | null;
  typingIndicators: TypingIndicator[];
  isConnected: boolean;

  // Actions
  setChannels: (channels: Channel[]) => void;
  addChannel: (channel: Channel) => void;
  updateChannel: (channelId: string, updates: Partial<Channel>) => void;
  deleteChannel: (channelId: string) => void;

  setMessages: (channelId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;

  setActiveChannel: (channelId: string | null) => void;
  markChannelAsRead: (channelId: string, userId: string) => void;

  addTypingIndicator: (indicator: TypingIndicator) => void;
  removeTypingIndicator: (channelId: string, userId: string) => void;

  setConnected: (connected: boolean) => void;

  addReaction: (messageId: string, emoji: string, userId: string) => void;
  removeReaction: (messageId: string, emoji: string, userId: string) => void;
}

export const useMessagingStore = create<MessagingState>()(
  persist(
    (set, get) => ({
      channels: [],
      messages: {},
      activeChannelId: null,
      typingIndicators: [],
      isConnected: false,

      setChannels: (channels) => set({ channels }),

      addChannel: (channel) => set((state) => ({
        channels: [...state.channels, channel],
      })),

      updateChannel: (channelId, updates) => set((state) => ({
        channels: state.channels.map((c) =>
          c.id === channelId ? { ...c, ...updates } : c
        ),
      })),

      deleteChannel: (channelId) => set((state) => ({
        channels: state.channels.filter((c) => c.id !== channelId),
        messages: Object.fromEntries(
          Object.entries(state.messages).filter(([key]) => key !== channelId)
        ),
      })),

      setMessages: (channelId, messages) => set((state) => ({
        messages: { ...state.messages, [channelId]: messages },
      })),

      addMessage: (message) => set((state) => {
        const channelMessages = state.messages[message.channelId] || [];
        return {
          messages: {
            ...state.messages,
            [message.channelId]: [...channelMessages, message],
          },
          channels: state.channels.map((c) =>
            c.id === message.channelId
              ? { ...c, lastMessage: message }
              : c
          ),
        };
      }),

      updateMessage: (messageId, updates) => set((state) => {
        const newMessages = { ...state.messages };
        Object.keys(newMessages).forEach((channelId) => {
          newMessages[channelId] = newMessages[channelId].map((m) =>
            m.id === messageId ? { ...m, ...updates } : m
          );
        });
        return { messages: newMessages };
      }),

      deleteMessage: (messageId) => set((state) => {
        const newMessages = { ...state.messages };
        Object.keys(newMessages).forEach((channelId) => {
          newMessages[channelId] = newMessages[channelId].filter(
            (m) => m.id !== messageId
          );
        });
        return { messages: newMessages };
      }),

      setActiveChannel: (channelId) => set({ activeChannelId: channelId }),

      markChannelAsRead: (channelId, userId) => set((state) => {
        const channelMessages = state.messages[channelId] || [];
        const updatedMessages = channelMessages.map((m) => ({
          ...m,
          readBy: m.readBy.includes(userId) ? m.readBy : [...m.readBy, userId],
        }));

        return {
          messages: { ...state.messages, [channelId]: updatedMessages },
          channels: state.channels.map((c) =>
            c.id === channelId ? { ...c, unreadCount: 0 } : c
          ),
        };
      }),

      addTypingIndicator: (indicator) => set((state) => ({
        typingIndicators: [
          ...state.typingIndicators.filter(
            (t) => !(t.channelId === indicator.channelId && t.userId === indicator.userId)
          ),
          indicator,
        ],
      })),

      removeTypingIndicator: (channelId, userId) => set((state) => ({
        typingIndicators: state.typingIndicators.filter(
          (t) => !(t.channelId === channelId && t.userId === userId)
        ),
      })),

      setConnected: (connected) => set({ isConnected: connected }),

      addReaction: (messageId, emoji, userId) => set((state) => {
        const newMessages = { ...state.messages };
        Object.keys(newMessages).forEach((channelId) => {
          newMessages[channelId] = newMessages[channelId].map((m) => {
            if (m.id === messageId) {
              const reactions = m.reactions || [];
              const existingReaction = reactions.find((r) => r.emoji === emoji);

              if (existingReaction) {
                return {
                  ...m,
                  reactions: reactions.map((r) =>
                    r.emoji === emoji
                      ? { ...r, users: [...r.users, userId] }
                      : r
                  ),
                };
              } else {
                return {
                  ...m,
                  reactions: [...reactions, { emoji, users: [userId] }],
                };
              }
            }
            return m;
          });
        });
        return { messages: newMessages };
      }),

      removeReaction: (messageId, emoji, userId) => set((state) => {
        const newMessages = { ...state.messages };
        Object.keys(newMessages).forEach((channelId) => {
          newMessages[channelId] = newMessages[channelId].map((m) => {
            if (m.id === messageId && m.reactions) {
              return {
                ...m,
                reactions: m.reactions
                  .map((r) =>
                    r.emoji === emoji
                      ? { ...r, users: r.users.filter((u) => u !== userId) }
                      : r
                  )
                  .filter((r) => r.users.length > 0),
              };
            }
            return m;
          });
        });
        return { messages: newMessages };
      }),
    }),
    {
      name: 'messaging-storage',
      partialize: (state) => ({
        channels: state.channels,
        messages: state.messages,
      }),
    }
  )
);
