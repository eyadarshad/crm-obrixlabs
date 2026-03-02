'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { messagesService } from '@/services/messages.service';
import type { Message, Conversation } from '@/types';
import { createClient } from '@/lib/supabase/client';

export function useMessages(userId: string, otherUserId?: string) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

    const fetchConversations = useCallback(async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const data = await messagesService.getConversations(userId);
            setConversations(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const fetchMessages = useCallback(async () => {
        if (!userId || !otherUserId) return;
        try {
            setLoading(true);
            const data = await messagesService.getMessages(userId, otherUserId);
            setMessages(data);

            // Mark unread messages as read
            const unread = data
                .filter(m => m.receiver_id === userId && !m.is_read)
                .map(m => m.id);
            if (unread.length > 0) {
                await messagesService.markAsRead(unread);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch messages');
        } finally {
            setLoading(false);
        }
    }, [userId, otherUserId]);

    // Subscribe to realtime messages
    useEffect(() => {
        if (!userId) return;

        const supabase = createClient();
        const channel = supabase
            .channel(`messages-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${userId}`,
                },
                async (payload) => {
                    const newMessage = payload.new as Message;
                    // Fetch full message with user details
                    const { data } = await supabase
                        .from('messages')
                        .select('*, sender:users!sender_id(*), receiver:users!receiver_id(*)')
                        .eq('id', newMessage.id)
                        .single();

                    if (data) {
                        setMessages(prev => [...prev, data as Message]);
                    }
                    fetchConversations();
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [userId, fetchConversations]);

    useEffect(() => {
        if (otherUserId) {
            fetchMessages();
        } else {
            fetchConversations();
        }
    }, [otherUserId, fetchMessages, fetchConversations]);

    const sendMessage = async (content: string, fileUrl?: string) => {
        if (!userId || !otherUserId) return;
        const message = await messagesService.sendMessage({
            sender_id: userId,
            receiver_id: otherUserId,
            message: content,
            file_url: fileUrl,
        });
        setMessages(prev => [...prev, message]);
        return message;
    };

    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    return {
        messages,
        conversations,
        loading,
        error,
        totalUnread,
        sendMessage,
        refetchMessages: fetchMessages,
        refetchConversations: fetchConversations,
    };
}
