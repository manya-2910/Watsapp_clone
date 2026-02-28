import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogOut, Send, Search, Paperclip,
    Smile, Moon, Sun,
    CheckCheck, User, FileText, ExternalLink,
    Mic, Trash2
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
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);

    const emojis = ['😊', '😂', '🔥', '❤️', '👍', '🙌', '🎉', '💡', '✅', '🚀', '✨', '🤔', '😎', '👋', '👀'];

    // For demo purposes, we'll use a fixed chat_id or look for the first one
    const [chatId, setChatId] = useState<string | null>(null);

    const setupChat = async () => {
        try {
            // Ensure user profile exists
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('id')
                .eq('id', user.id)
                .single();

            if (profileError || !profile) {
                await supabase
                    .from('users')
                    .insert({
                        id: user.id,
                        name: user.name || user.email?.split('@')[0] || 'User',
                        avatar_url: user.avatar_url
                    });
            }

            // Get or create a "Global Chat"
            const { data: chats, error: fetchChatsError } = await supabase
                .from('chats')
                .select('*')
                .eq('is_group', true)
                .limit(1);

            if (fetchChatsError) {
                console.error('setupChat: Error fetching chats:', fetchChatsError);
            }

            let currentChatId = chats?.[0]?.id;

            if (!currentChatId) {
                const { data: newChat, error: createChatError } = await supabase
                    .from('chats')
                    .insert({ name: 'Global Chat', is_group: true })
                    .select()
                    .single();

                if (createChatError) {
                    console.error('setupChat: Error creating chat:', createChatError);
                }
                currentChatId = newChat?.id;
            }

            setChatId(currentChatId);

            if (currentChatId) {
                // Ensure user is joined to the chat
                await supabase
                    .from('chat_members')
                    .upsert({ chat_id: currentChatId, user_id: user.id }, { onConflict: 'chat_id,user_id' });

                // Fetch initial messages
                const { data: initialMessages, error: messagesError } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('chat_id', currentChatId)
                    .order('created_at', { ascending: true });

                if (messagesError) {
                    console.error('setupChat: Error fetching messages:', messagesError);
                }

                if (initialMessages) {
                    setMessages(initialMessages);
                }

                // Subscribe to new messages
                const subscription = supabase
                    .channel(`chat:${currentChatId}`)
                    .on('postgres_changes', {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `chat_id=eq.${currentChatId}`
                    }, (payload: { new: Message }) => {
                        const newMessage = payload.new;
                        setMessages((prev) => {
                            // 1. If we already have this ID, skip
                            if (prev.some(m => m.id === newMessage.id)) return prev;

                            // 2. If it's our message, try to replace a matching optimistic message
                            if (newMessage.sender_id === user.id) {
                                // Match by content - slightly risky but usually fine for chat
                                // We also check if it starts with 'temp-'
                                const tempIndex = prev.findIndex(m =>
                                    m.id.toString().startsWith('temp-') &&
                                    m.content === newMessage.content
                                );

                                if (tempIndex !== -1) {
                                    const next = [...prev];
                                    next[tempIndex] = { ...newMessage, status: 'SENT' };
                                    return next;
                                }
                            }

                            return [...prev, newMessage];
                        });
                    })
                    .subscribe();

                return () => {
                    subscription.unsubscribe();
                };
            }
        } catch (err: any) {
            console.error('setupChat: Unexpected error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cleanup: any;
        setupChat().then(c => cleanup = c);
        return () => { if (cleanup) cleanup(); };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !chatId) return;

        const messageContent = inputText;
        setInputText('');

        // Optimistic Update
        const tempId = `temp-${Date.now()}`;
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
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setInputText(messageContent);
        } else {
            setMessages(prev => prev.map(m => m.id === tempId ? data : m));
        }
    };

    const handleEmojiClick = (emoji: string) => {
        setInputText(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                if (audioBlob.size > 0 && !isCancelled.current) {
                    await uploadAudioMessage(audioBlob);
                }
                stream.getTracks().forEach(track => track.stop());
            };

            isCancelled.current = false;
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);

            timerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            alert("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            isCancelled.current = true;
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            setRecordingDuration(0);
        }
    };

    const isCancelled = useRef(false);

    const uploadAudioMessage = async (blob: Blob) => {
        if (!chatId) return;
        setUploading(true);

        const fileName = `${Date.now()}-voice.webm`;
        const filePath = `${chatId}/${fileName}`;

        try {
            const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(filePath);

            const tempId = `temp-audio-${Date.now()}`;
            const optimisticAudioMsg: Message = {
                id: tempId,
                sender_id: user.id,
                content: `[AUDIO] ${fileName}|||${publicUrl}`,
                created_at: new Date().toISOString(),
                status: 'SENT'
            } as any;
            setMessages(prev => [...prev, optimisticAudioMsg]);
            const { error: uploadError } = await supabase.storage
                .from('attachments')
                .upload(filePath, blob);

            if (uploadError) {
                setMessages(prev => prev.filter(m => m.id !== tempId));
                return;
            }

            const { data: dbData, error: messageError } = await supabase
                .from('messages')
                .insert({
                    chat_id: chatId,
                    sender_id: user.id,
                    content: `[AUDIO] ${fileName}|||${publicUrl}`
                })
                .select('*')
                .single();

            if (messageError) {
                setMessages(prev => prev.filter(m => m.id !== tempId));
                return;
            }

            setMessages(prev => prev.map(m => m.id === tempId ? { ...dbData, status: 'SENT' } : m));

        } catch (error) {
            // Silently fail as requested
        } finally {
            setUploading(false);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !chatId) {
                return;
            }

            setUploading(true);
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${file.name.split('.').pop()}`;
            const filePath = `${chatId}/${fileName}`;

            // Get Public URL first
            const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(filePath);

            const tempId = `temp-file-${Date.now()}`;
            const optimisticFileMsg: Message = {
                id: tempId,
                sender_id: user.id,
                content: `[FILE] ${file.name}|||${publicUrl}`,
                created_at: new Date().toISOString(),
                status: 'SENT'
            } as any;
            setMessages(prev => [...prev, optimisticFileMsg]);

            const { error: uploadError } = await supabase.storage
                .from('attachments')
                .upload(filePath, file);

            if (uploadError) {
                setMessages(prev => prev.filter(m => m.id !== tempId));
                setUploading(false);
                return;
            }

            const { data: dbData, error: messageError } = await supabase
                .from('messages')
                .insert({
                    chat_id: chatId,
                    sender_id: user.id,
                    content: `[FILE] ${file.name}|||${publicUrl}`
                })
                .select('*')
                .single();

            if (messageError) {
                setMessages(prev => prev.filter(m => m.id !== tempId));
                return;
            }

            // Replace optimistic message with actual data
            setMessages(prev => prev.map(m => m.id === tempId ? { ...dbData, status: 'SENT' } : m));
        } catch (error: any) {

        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex h-screen bg-bg-app text-text-main transition-colors duration-500 overflow-hidden font-inter">
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
                            <h1 className="font-bold text-text-main leading-tight">NHAPP</h1>
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
                    <div className="bg-bg-light/80 dark:bg-bg-card/80 flex items-center px-4 py-3 rounded-20 group transition-all ring-1 ring-gray-200/50 dark:ring-white/5 focus-within:ring-2 focus-within:ring-primary-light focus-within:bg-white dark:focus-within:bg-card-dark">
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
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <h3 className="font-bold text-text-main group-hover:text-primary-light transition-colors truncate">Global Chat</h3>
                                    <span className="text-[11px] text-text-muted font-medium">9:41 PM</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <p className="text-xs text-text-muted truncate">Welcome to the global chat!</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative bg-bg-app">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.02] pointer-events-none transition-opacity duration-500"
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
                                                    const raw = msg.content.replace('[FILE] ', '');
                                                    const [fName, fUrl] = raw.split('|||');

                                                    if (!fName || !fUrl) {
                                                        return <p className="text-xs text-red-500">Invalid file message</p>;
                                                    }

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
                                        ) : msg.content.startsWith('[AUDIO] ') ? (
                                            <div className="flex flex-col space-y-1 min-w-[200px]">
                                                {(() => {
                                                    const raw = msg.content.replace('[AUDIO] ', '');
                                                    const [_, fUrl] = raw.split('|||');
                                                    return (
                                                        <div className="flex items-center space-x-2 py-1">
                                                            <div className="w-10 h-10 bg-primary-light/20 rounded-full flex items-center justify-center text-primary-light">
                                                                <Mic size={20} />
                                                            </div>
                                                            <audio src={fUrl} controls className="h-8 max-w-[180px]" />
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
                                        className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-card-dark rounded-20 shadow-premium border border-gray-100 dark:border-white/5 grid grid-cols-5 gap-2 w-48 z-50"
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

                        <AnimatePresence mode="wait">
                            {isRecording ? (
                                <motion.div
                                    key="recording-ui"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex-1 flex items-center justify-between px-4"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                        <span className="text-sm font-mono font-bold text-red-500">
                                            {formatDuration(recordingDuration)}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={cancelRecording}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                        <button
                                            onClick={stopRecording}
                                            className="p-2 text-primary-light hover:scale-110 transition-transform"
                                        >
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                            >
                                                <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-white">
                                                    <Send size={18} />
                                                </div>
                                            </motion.div>
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <>
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
                                </>
                            )}
                        </AnimatePresence>

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
                            ) : !isRecording && (
                                <motion.button
                                    key="mic"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={startRecording}
                                    className="bg-gray-100 dark:bg-white/10 p-3.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-primary-light hover:text-white transition-all"
                                >
                                    <Mic size={20} />
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
