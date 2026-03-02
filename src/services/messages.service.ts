'use client';

import { createClient } from '@/lib/supabase/client';
import type { Message, Conversation, User } from '@/types';

const supabase = createClient();

export const messagesService = {
    async getConversations(userId: string): Promise<Conversation[]> {
        // Get all unique users this user has communicated with
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*, sender:users!sender_id(*), receiver:users!receiver_id(*)')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const conversationMap = new Map<string, Conversation>();

        (messages || []).forEach((msg: Message & { sender: User; receiver: User }) => {
            const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender;
            if (!otherUser) return;

            if (!conversationMap.has(otherUser.id)) {
                conversationMap.set(otherUser.id, {
                    user: otherUser,
                    lastMessage: msg,
                    unreadCount: 0,
                });
            }

            if (!msg.is_read && msg.receiver_id === userId) {
                const conv = conversationMap.get(otherUser.id)!;
                conv.unreadCount++;
            }
        });

        return Array.from(conversationMap.values());
    },

    async getMessages(userId: string, otherUserId: string): Promise<Message[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*, sender:users!sender_id(*), receiver:users!receiver_id(*)')
            .or(
                `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
            )
            .order('created_at', { ascending: true });

        if (error) throw error;
        return (data || []) as Message[];
    },

    async sendMessage(message: {
        sender_id: string;
        receiver_id: string;
        message?: string;
        file_url?: string;
    }): Promise<Message> {
        const { data, error } = await supabase
            .from('messages')
            .insert(message)
            .select('*, sender:users!sender_id(*), receiver:users!receiver_id(*)')
            .single();

        if (error) throw error;
        return data as Message;
    },

    async markAsRead(messageIds: string[]): Promise<void> {
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', messageIds);

        if (error) throw error;
    },

    async getUnreadCount(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return count || 0;
    },

    async uploadFile(file: File): Promise<string> {
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}.${ext}`;

        const { error } = await supabase.storage
            .from('messages')
            .upload(fileName, file);

        if (error) throw error;

        const { data } = supabase.storage
            .from('messages')
            .getPublicUrl(fileName);

        return data.publicUrl;
    },

    subscribeToMessages(userId: string, callback: (message: Message) => void) {
        return supabase
            .channel('messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${userId}`,
                },
                (payload) => {
                    callback(payload.new as Message);
                }
            )
            .subscribe();
    },
};
