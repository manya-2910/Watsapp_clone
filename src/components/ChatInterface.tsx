import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogOut, Send, Search, Paperclip,
    Smile, Moon, Sun,
    CheckCheck, User, FileText, ExternalLink
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import SkeletonChat from './SkeletonChat';

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    status?: 'SENT' | 'DELIVERED' | 'READ';
}

interface ChatInterfaceProps {
    user: { id: string; name?: string; email?: string; avatar_url?: string };
    onLogout: () => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, onLogout, isDarkMode, toggleDarkMode }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const emojis = ['😊', '😂', '🔥', '❤️', '👍', '🙌', '🎉', '💡', '✅', '🚀', '✨', '🤔', '😎', '👋', '👀'];

    // For demo purposes, we'll use a fixed chat_id or look for the first one
    const [chatId, setChatId] = useState<string | null>(null);

    useEffect(() => {
        const setupChat = async () => {
            console.log('setupChat: Starting for user:', user.id);
            try {
                // 0. Ensure user profile exists in public.users
                // This handles cases where the user was created before the trigger was active
                console.log('setupChat: Checking user profile...');
                const { data: profile, error: profileError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('id', user.id)
                    .single();

                if (profileError || !profile) {
                    console.log('setupChat: User profile missing, creating...');
                    await supabase
                        .from('users')
                        .insert({
                            id: user.id,
                            name: user.name || user.email?.split('@')[0] || 'User',
                            avatar_url: user.avatar_url
                        });
                }

                // 1. Get or create a "Global Chat"
                const { data: chats, error: fetchChatsError } = await supabase
                    .from('chats')
                    .select('*')
                    .eq('is_group', true)
                    .limit(1);

                if (fetchChatsError) {
                    console.error('setupChat: Error fetching chats:', fetchChatsError);
                    alert(`Fetch Chats Error: ${fetchChatsError.message}`);
                }

                let currentChatId = chats?.[0]?.id;

                if (!currentChatId) {
                    console.log('setupChat: No global chat found, creating one...');
                    const { data: newChat, error: createChatError } = await supabase
                        .from('chats')
                        .insert({ name: 'Global Chat', is_group: true })
                        .select()
                        .single();

                    if (createChatError) {
                        console.error('setupChat: Error creating chat:', createChatError);
                        alert(`Create Chat Error: ${createChatError.message}`);
                    }
                    currentChatId = newChat?.id;
                }

                console.log('setupChat: Resolved chatId:', currentChatId);
                setChatId(currentChatId);

                if (currentChatId) {
                    // 1.5 Ensure user is joined to the chat
                    console.log('setupChat: Joining chat member...');
                    const { error: joinError } = await supabase
                        .from('chat_members')
                        .upsert({ chat_id: currentChatId, user_id: user.id }, { onConflict: 'chat_id,user_id' });

                    if (joinError) {
                        console.error('setupChat: Error joining chat:', joinError);
                        alert(`Join Chat Error: ${joinError.message}`);
                    }

                    // 2. Fetch initial messages
                    console.log('setupChat: Fetching messages...');
                    const { data: initialMessages, error: messagesError } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('chat_id', currentChatId)
                        .order('created_at', { ascending: true });

                    if (messagesError) {
                        console.error('setupChat: Error fetching messages:', messagesError);
                        alert(`Fetch Messages Error: ${messagesError.message}`);
                    }

                    if (initialMessages) {
                        setMessages(initialMessages);
                    }

                    // 3. Subscribe to new messages
                    console.log('setupChat: Subscribing to channel...');
                    const subscription = supabase
                        .channel(`chat:${currentChatId}`)
                        .on('postgres_changes', {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'messages',
                            filter: `chat_id=eq.${currentChatId}`
                        }, (payload: { new: Message }) => {
                            console.log('setupChat: Received new message via realtime:', payload.new);
                            const newMessage = payload.new;
                            setMessages((prev) => {
                                // Prevent duplicates if we already added this message optimistically
                                if (prev.some(m => m.id === newMessage.id)) return prev;
                                return [...prev, newMessage];
                            });
                        })
                        .subscribe((status) => {
                            console.log(`setupChat: Realtime subscription status for chat:${currentChatId}:`, status);
                        });

                    return () => {
                        console.log('setupChat: Unsubscribing...');
                        subscription.unsubscribe();
                    };
                }
            } catch (err: any) {
                console.error('setupChat: Unexpected error:', err);
                alert(`Setup Chat Unexpected Error: ${err.message || 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        };

        setupChat();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        if (!chatId) {
            console.warn('handleSendMessage: chatId is missing');
            alert('Wait! The chat is still connecting or failed to initialize. Please refresh.');
            return;
        }

        const messageContent = inputText;
        setInputText('');

        console.log('handleSendMessage: Sending to chatId:', chatId, 'as user:', user.id);

        // Optimistic Update
        const tempId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2);
        const optimisticMessage: Message = {
            id: tempId,
            sender_id: user.id,
            content: messageContent,
            created_at: new Date().toISOString(),
            status: 'SENT'
        } as any;

        setMessages(prev => [...prev, optimisticMessage]);

        const { data, error } = await supabase
            .from('messages')
            .insert({
                chat_id: chatId,
                sender_id: user.id,
                content: messageContent
            })
            .select()
            .single();

        if (error) {
            console.error('handleSendMessage: Error inserting message:', error);
            alert(`Send Message Error: ${error.message} (Code: ${error.code})`);
            // Remove optimistic message and put text back
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setInputText(messageContent);
        } else {
            console.log('handleSendMessage: Message sent successfully');
            // Replace optimistic message with the real one from DB (with real ID)
            setMessages(prev => prev.map(m => m.id === tempId ? data : m));
        }
    };

    const handleEmojiClick = (emoji: string) => {
        setInputText(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !chatId) return;

        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${chatId}/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('attachments')
                .getPublicUrl(filePath);

            const { error: messageError } = await supabase
                .from('messages')
                .insert({
                    chat_id: chatId,
                    sender_id: user.id,
                    content: `[FILE] ${file.name}|||${publicUrl}`
                });

            if (messageError) throw messageError;

        } catch (error: any) {
            console.error('Error uploading file:', error);
            alert(`Failed to upload file: ${error.message || 'Unknown error'}. Please check if the "attachments" bucket exists in Supabase Storage and is set to Public.`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex h-screen bg-bg-light dark:bg-bg-dark transition-colors duration-500 overflow-hidden font-inter">
            {/* Sidebar (Simplified for unified demo) */}
            <div className="w-full md:w-[400px] lg:w-[450px] border-r border-gray-200 dark:border-white/5 flex flex-col bg-white/70 dark:bg-bg-card/70 backdrop-blur-2xl z-20 shadow-xl">
                <div className="h-20 px-6 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center space-x-4">
                        <div className="relative group">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-light to-primary-dark rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition-transform">
                                {user.name?.[0] || user.email?.[0]?.toUpperCase() || <User size={24} />}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-accent border-2 border-white dark:border-bg-card rounded-full shadow-sm"></div>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="font-bold text-text-light dark:text-text-dark leading-tight">NHAPP</h1>
                            <p className="text-[10px] text-accent font-bold uppercase tracking-wider">Online</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={toggleDarkMode}
                            className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-all active:scale-95"
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={isDarkMode ? 'sun' : 'moon'}
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                                </motion.div>
                            </AnimatePresence>
                        </button>
                        <button
                            onClick={onLogout}
                            className="p-2.5 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-all active:scale-95"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-4 px-6">
                    <div className="bg-bg-light/80 dark:bg-card-dark/80 flex items-center px-4 py-3 rounded-20 group transition-all ring-1 ring-gray-200/50 dark:ring-white/5 focus-within:ring-2 focus-within:ring-primary-light focus-within:bg-white dark:focus-within:bg-card-dark">
                        <Search size={18} className="text-gray-400 group-focus-within:text-primary-light transition-colors" />
                        <input
                            type="text"
                            id="search-chats"
                            name="search-chats"
                            aria-label="Search chats"
                            placeholder="Search or start new chat"
                            className="bg-transparent w-full focus:outline-none text-sm ml-3 dark:text-white placeholder:text-gray-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                    {loading ? (
                        Array(6).fill(0).map((_, i) => <SkeletonChat key={i} />)
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8f9fa' }}
                            className="flex items-center p-4 px-4 rounded-24 cursor-pointer relative transition-all group mx-2 bg-primary-light/10"
                        >
                            <div className="relative">
                                <div className="w-14 h-14 bg-gradient-to-br from-primary-light to-primary-dark rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
                                    G
                                </div>
                                <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-primary-light border-2 border-white dark:border-bg-card rounded-full shadow-sm"></div>
                            </div>
                            <div className="flex-1 ml-4 py-2">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="font-bold text-[#111b21] dark:text-white">Global Chat</span>
                                    <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Live</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-gray-400 dark:text-gray-500 truncate max-w-[200px] font-medium">
                                        Supabase Messaging Enabled
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative">
                <div className="absolute inset-0 z-0 dark:opacity-20 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: '400px' }}>
                </div>

                <div className="h-20 px-8 flex items-center justify-between bg-white/80 dark:bg-bg-card/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 z-10 shadow-sm transition-colors duration-500">
                    <div className="flex items-center cursor-pointer group">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-light to-primary-dark rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
                            G
                        </div>
                        <div className="ml-4">
                            <h2 className="font-bold text-[#111b21] dark:text-white">Global Chat</h2>
                            <p className="text-xs text-primary-light font-bold">online</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
                    <div className="flex flex-col space-y-4">
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    layout
                                    className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'} mb-1`}
                                >
                                    <div
                                        className={`max-w-[70%] px-4 py-2 rounded-20 shadow-soft relative group ${msg.sender_id === user.id
                                            ? 'bg-gradient-to-br from-[#dcf8c6] to-[#c9ebae] dark:from-[#005c4b] dark:to-[#005c4b] text-text-light dark:text-text-dark rounded-tr-none'
                                            : 'bg-white dark:bg-card-dark dark:text-text-dark rounded-tl-none border border-gray-100 dark:border-white/5'
                                            }`}
                                    >
                                        {msg.content.startsWith('[FILE] ') ? (
                                            <div className="flex flex-col space-y-2">
                                                {(() => {
                                                    const parts = msg.content.replace('[FILE] ', '').split('|||');
                                                    const fName = parts[0];
                                                    const fUrl = parts[1];
                                                    const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(fName);

                                                    if (isImg) {
                                                        return (
                                                            <img
                                                                src={fUrl}
                                                                alt={fName}
                                                                className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                                                onClick={() => window.open(fUrl, '_blank')}
                                                            />
                                                        );
                                                    }
                                                    return (
                                                        <div
                                                            className="flex items-center space-x-3 p-3 bg-black/5 dark:bg-white/5 rounded-xl cursor-pointer hover:bg-black/10 transition-colors"
                                                            onClick={() => window.open(fUrl, '_blank')}
                                                        >
                                                            <FileText size={24} className="text-primary-light" />
                                                            <div className="flex-1 overflow-hidden">
                                                                <p className="text-sm font-medium truncate">{fName}</p>
                                                                <p className="text-[10px] opacity-60">Click to preview</p>
                                                            </div>
                                                            <ExternalLink size={16} className="opacity-40" />
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        ) : (
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        )}
                                        <div className="flex items-center justify-end space-x-1 mt-1 -mr-1">
                                            <span className="text-[10px] opacity-60">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {msg.sender_id === user.id && (
                                                <div className="text-primary-dark opacity-100">
                                                    <CheckCheck size={12} className="text-blue-500" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <div className="px-8 pb-8 pt-2 z-10">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-white/90 dark:bg-bg-card/90 backdrop-blur-xl rounded-30 shadow-premium p-2 flex items-center space-x-3 border border-white/40 dark:border-white/10 transition-colors duration-500"
                    >
                        <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className={`p-3 transition-colors ${showEmojiPicker ? 'text-primary-light' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                <Smile size={24} />
                            </motion.button>

                            <AnimatePresence>
                                {showEmojiPicker && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: -20, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                                        className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-bg-card rounded-20 shadow-premium border border-gray-100 dark:border-white/5 grid grid-cols-5 gap-2 w-48 z-50"
                                    >
                                        {emojis.map((emoji) => (
                                            <button
                                                key={emoji}
                                                onClick={() => handleEmojiClick(emoji)}
                                                className="text-xl hover:bg-gray-100 dark:hover:bg-white/10 p-2 rounded-lg transition-colors"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleFileClick}
                            disabled={uploading}
                            className={`p-3 transition-colors ${uploading ? 'animate-pulse text-primary-light' : 'text-gray-500 dark:text-gray-400 hover:text-primary-light'}`}
                        >
                            <Paperclip size={22} className="rotate-45" />
                        </motion.button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                        />

                        <form onSubmit={handleSendMessage} className="flex-1">
                            <input
                                type="text"
                                id="message-input"
                                name="message-input"
                                aria-label="Type a message"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Type a message..."
                                className="w-full bg-transparent py-3 px-2 focus:outline-none dark:text-white placeholder:text-gray-400 text-sm"
                            />
                        </form>

                        <AnimatePresence mode="wait">
                            {inputText.trim() ? (
                                <motion.button
                                    key="send"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleSendMessage}
                                    className="bg-primary-light p-3.5 rounded-full text-white shadow-lg shadow-primary-light/40 hover:shadow-primary-light/60 transition-all"
                                >
                                    <Send size={20} />
                                </motion.button>
                            ) : (
                                <motion.button
                                    key="voice"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="bg-gray-100 dark:bg-white/10 p-3.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-primary-light hover:text-white transition-all"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </div >
    );
};

export default ChatInterface;

