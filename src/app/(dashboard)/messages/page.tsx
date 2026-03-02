'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { messagesService } from '@/services/messages.service';
import { employeesService } from '@/services/employees.service';
import { activityLogsService } from '@/services/activity-logs.service';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Send, Paperclip, Search, MessageSquare } from 'lucide-react';
import type { User, Conversation } from '@/types';
import { toast } from 'sonner';

export default function MessagesPage() {
    const { user } = useAuth();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const {
        messages,
        conversations,
        sendMessage,
        refetchConversations,
    } = useMessages(user?.id || '', selectedUser?.id);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchUsers() {
            try {
                if (user?.role === 'employee') {
                    const admins = await employeesService.getAdmins();
                    setAllUsers(admins);
                } else {
                    const all = await employeesService.getAllUsers();
                    setAllUsers(all.filter(u => u.id !== user?.id));
                }
            } catch (err) {
                console.error(err);
            }
        }
        if (user) fetchUsers();
    }, [user]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !selectedUser || !user) return;

        setSending(true);
        try {
            await sendMessage(messageText.trim());
            await activityLogsService.logActivity({
                user_id: user.id,
                action: 'message_sent',
                metadata: { receiver_id: selectedUser.id },
            });
            setMessageText('');
            refetchConversations();
        } catch {
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedUser || !user) return;

        setSending(true);
        try {
            const fileUrl = await messagesService.uploadFile(file);
            await sendMessage('', fileUrl);
            refetchConversations();
        } catch {
            toast.error('Failed to upload file');
        } finally {
            setSending(false);
        }
    };

    const getInitials = (name: string) =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    // Merge conversations with available users
    const contactList = (() => {
        const convMap = new Map(conversations.map(c => [c.user.id, c]));
        const merged: (Conversation | { user: User; lastMessage: null; unreadCount: 0 })[] = [];

        // Add existing conversations first
        conversations.forEach(c => merged.push(c));

        // Add users not yet in conversations
        allUsers.forEach(u => {
            if (!convMap.has(u.id)) {
                merged.push({ user: u, lastMessage: null, unreadCount: 0 });
            }
        });

        if (searchQuery) {
            return merged.filter(c =>
                c.user.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return merged;
    })();

    return (
        <div className="flex h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-white/[0.06]">
            {/* Sidebar - Conversations */}
            <div className="w-80 bg-[#0a0f1a] border-r border-white/[0.06] flex flex-col">
                <div className="p-4 border-b border-white/[0.06]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                            placeholder="Search contacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 h-9"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    {contactList.map((conv) => (
                        <button
                            key={conv.user.id}
                            onClick={() => setSelectedUser(conv.user)}
                            className={`w-full flex items-center gap-3 p-3 hover:bg-white/[0.04] transition-colors text-left ${selectedUser?.id === conv.user.id ? 'bg-white/[0.06]' : ''
                                }`}
                        >
                            <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white text-xs font-bold">
                                    {getInitials(conv.user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-white truncate">
                                        {conv.user.name}
                                    </p>
                                    {conv.unreadCount > 0 && (
                                        <Badge className="bg-blue-500 text-white text-[10px] px-1.5 h-5 min-w-5 flex items-center justify-center ml-2">
                                            {conv.unreadCount}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">
                                    {conv.lastMessage?.message || conv.user.role.replace('_', ' ')}
                                </p>
                            </div>
                        </button>
                    ))}
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-[#030712]">
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 px-6 flex items-center gap-3 border-b border-white/[0.06] bg-[#0a0f1a]/50">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white text-xs font-bold">
                                    {getInitials(selectedUser.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-medium text-white">
                                    {selectedUser.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {selectedUser.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                            <div className="space-y-4 max-w-3xl mx-auto">
                                {messages.map((msg) => {
                                    const isMine = msg.sender_id === user?.id;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMine
                                                    ? 'bg-blue-600 text-white rounded-br-md'
                                                    : 'bg-white/[0.06] text-gray-200 rounded-bl-md'
                                                    }`}
                                            >
                                                {msg.message && (
                                                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                                )}
                                                {msg.file_url && (
                                                    <a
                                                        href={msg.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs underline opacity-80 mt-1 inline-block"
                                                    >
                                                        📎 View Attachment
                                                    </a>
                                                )}
                                                <p
                                                    className={`text-[10px] mt-1 ${isMine ? 'text-blue-200' : 'text-gray-500'
                                                        }`}
                                                >
                                                    {format(new Date(msg.created_at), 'HH:mm')}
                                                    {isMine && msg.is_read && ' ✓✓'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>

                        {/* Input */}
                        <form
                            onSubmit={handleSend}
                            className="p-4 border-t border-white/[0.06] bg-[#0a0f1a]/50"
                        >
                            <div className="flex items-center gap-2 max-w-3xl mx-auto">
                                <label className="cursor-pointer text-gray-500 hover:text-gray-300 transition-colors p-2">
                                    <Paperclip className="w-5 h-5" />
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </label>
                                <Input
                                    placeholder="Type a message..."
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    className="flex-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600"
                                />
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={!messageText.trim() || sending}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-3"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="w-8 h-8 text-gray-600" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-1">
                                Select a conversation
                            </h3>
                            <p className="text-sm text-gray-500">
                                Choose a contact to start messaging
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
