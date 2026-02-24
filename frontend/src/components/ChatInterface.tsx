import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogOut, Send, Search, MoreVertical, Paperclip,
    Smile, Moon, Sun, Phone, Video,
    Check, CheckCheck, User
} from 'lucide-react';
import { socketService } from '../services/socket';
import SkeletonChat from './SkeletonChat';

interface Message {
    id: string;
    content: string;
    senderId: string;
    timestamp: number;
    status: 'SENT' | 'DELIVERED' | 'READ';
}

interface ChatInterfaceProps {
    user: { id: string; name?: string; phone: string };
    onLogout: () => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, onLogout, isDarkMode, toggleDarkMode }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Simulate initial load
        const timer = setTimeout(() => setLoading(false), 1500);

        socketService.on('message', (message: Message) => {
            setMessages((prev) => [...prev, { ...message, status: 'READ' }]);
        });

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            content: inputText,
            senderId: user.id,
            timestamp: Date.now(),
            status: 'SENT',
        };

        socketService.emit('sendMessage', newMessage);
        setMessages((prev) => [...prev, newMessage]);
        setInputText('');

        // Simulate delivery ticks
        setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'DELIVERED' } : m));
        }, 1000);
        setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'READ' } : m));
        }, 2000);
    };

    return (
        <div className="flex h-screen bg-bg-light dark:bg-bg-dark transition-colors duration-500 overflow-hidden font-inter">
            {/* Sidebar */}
            <div className="w-full md:w-[400px] lg:w-[450px] border-r border-gray-200 dark:border-white/5 flex flex-col bg-white/70 dark:bg-bg-card/70 backdrop-blur-2xl z-20 shadow-xl">
                {/* Sidebar Header */}
                <div className="h-20 px-6 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center space-x-4">
                        <div className="relative group">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-light to-primary-dark rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition-transform">
                                {user.name?.[0] || <User size={24} />}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-accent border-2 border-white dark:border-bg-card rounded-full shadow-sm"></div>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="font-bold text-text-light dark:text-text-dark leading-tight">Messages</h1>
                            <p className="text-[10px] text-accent font-bold uppercase tracking-wider">Active Now</p>
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

                {/* Search */}
                <div className="p-4 px-6">
                    <div className="bg-bg-light/80 dark:bg-card-dark/80 flex items-center px-4 py-3 rounded-20 group transition-all ring-1 ring-gray-200/50 dark:ring-white/5 focus-within:ring-2 focus-within:ring-primary-light focus-within:bg-white dark:focus-within:bg-card-dark">
                        <Search size={18} className="text-gray-400 group-focus-within:text-primary-light transition-colors" />
                        <input
                            type="text"
                            placeholder="Search or start new chat"
                            className="bg-transparent w-full focus:outline-none text-sm ml-3 dark:text-white placeholder:text-gray-500"
                        />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                    {loading ? (
                        Array(6).fill(0).map((_, i) => <SkeletonChat key={i} />)
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8f9fa' }}
                            className="flex items-center p-4 px-4 rounded-24 cursor-pointer relative transition-all group mx-2"
                        >
                            <div className="relative">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
                                    G
                                </div>
                                <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-primary-light border-2 border-white dark:border-bg-card rounded-full shadow-sm"></div>
                            </div>
                            <div className="flex-1 ml-4 py-2">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="font-bold text-[#111b21] dark:text-white">Global Chat</span>
                                    <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">12:45 PM</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-gray-400 dark:text-gray-500 truncate max-w-[200px] font-medium">
                                        Welcome to the premium experience! 🚀
                                    </p>
                                    <div className="bg-primary-light text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-primary-light/30">
                                        3
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative">
                {/* Background Image / Pattern */}
                <div className="absolute inset-0 z-0 dark:opacity-20 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: '400px' }}>
                </div>

                {/* Chat Header */}
                <div className="h-20 px-8 flex items-center justify-between bg-white/80 dark:bg-bg-card/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 z-10 shadow-sm transition-colors duration-500">
                    <div className="flex items-center cursor-pointer group">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
                            G
                        </div>
                        <div className="ml-4">
                            <h2 className="font-bold text-[#111b21] dark:text-white">Global Chat</h2>
                            <p className="text-xs text-primary-light font-bold">online</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-6 text-gray-500 dark:text-gray-400">
                        <button className="hover:text-primary-light transition-colors"><Video size={22} /></button>
                        <button className="hover:text-primary-light transition-colors"><Phone size={20} /></button>
                        <div className="w-[1px] h-6 bg-gray-200 dark:bg-white/10"></div>
                        <button className="hover:text-[#111b21] dark:hover:text-white transition-colors"><Search size={22} /></button>
                        <button className="hover:text-[#111b21] dark:hover:text-white transition-colors"><MoreVertical size={22} /></button>
                    </div>
                </div>

                {/* Message List */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
                    <div className="flex flex-col space-y-4">
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    layout
                                    className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'} mb-1`}
                                >
                                    <div
                                        className={`max-w-[70%] px-4 py-2 rounded-20 shadow-soft relative group ${msg.senderId === user.id
                                            ? 'bg-gradient-to-br from-[#dcf8c6] to-[#c9ebae] dark:from-[#005c4b] dark:to-[#005c4b] text-text-light dark:text-text-dark rounded-tr-none'
                                            : 'bg-white dark:bg-card-dark dark:text-text-dark rounded-tl-none border border-gray-100 dark:border-white/5'
                                            }`}
                                    >
                                        {/* Message Tail */}
                                        <div className={`absolute top-0 w-3 h-3 ${msg.senderId === user.id
                                                ? 'right-[-8px] text-[#c9ebae] dark:text-[#005c4b]'
                                                : 'left-[-8px] text-white dark:text-card-dark'
                                            }`}>
                                            <svg viewBox="0 0 8 13" preserveAspectRatio="none" className="w-full h-full fill-current">
                                                {msg.senderId === user.id ? (
                                                    <path d="M0 0.5V11L8 0.5H0Z" />
                                                ) : (
                                                    <path d="M8 0.5V11L0 0.5H8Z" />
                                                )}
                                            </svg>
                                        </div>

                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        <div className="flex items-center justify-end space-x-1 mt-1 -mr-1">
                                            <span className="text-[10px] opacity-60">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {msg.senderId === user.id && (
                                                <div className="text-primary-dark opacity-100">
                                                    {msg.status === 'SENT' && <Check size={12} />}
                                                    {msg.status === 'DELIVERED' && <CheckCheck size={12} className="text-gray-500" />}
                                                    {msg.status === 'READ' && <CheckCheck size={12} className="text-blue-500" />}
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

                {/* Message Input Container */}
                <div className="px-8 pb-8 pt-2 z-10">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-white/90 dark:bg-bg-card/90 backdrop-blur-xl rounded-30 shadow-premium p-2 flex items-center space-x-3 border border-white/40 dark:border-white/10 transition-colors duration-500"
                    >
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-3 text-gray-500 dark:text-gray-400 hover:text-primary-light transition-colors"
                        >
                            <Smile size={24} />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-3 text-gray-500 dark:text-gray-400 hover:text-primary-light transition-colors"
                        >
                            <Paperclip size={22} className="rotate-45" />
                        </motion.button>

                        <form onSubmit={handleSendMessage} className="flex-1">
                            <input
                                type="text"
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
