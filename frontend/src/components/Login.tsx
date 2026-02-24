import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, User as UserIcon, ArrowRight, MessageCircle, Sun, Moon } from 'lucide-react';

interface LoginProps {
    onLogin: (phone: string) => Promise<void>;
    onRegister: (phone: string, name: string) => Promise<void>;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, isDarkMode, toggleDarkMode }) => {
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isRegistering) {
                await onRegister(phone, name);
            } else {
                await onLogin(phone);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg-light dark:bg-bg-dark transition-colors duration-500 p-6">
            {/* Dark Mode Toggle */}
            <div className="fixed top-8 right-8 z-50">
                <button
                    onClick={toggleDarkMode}
                    className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-gray-800 dark:text-white hover:bg-white/20 transition-all shadow-lg active:scale-95"
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isDarkMode ? 'sun' : 'moon'}
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
                        </motion.div>
                    </AnimatePresence>
                </button>
            </div>

            {/* Background Blobs */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-light blur-[120px] rounded-full animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent blur-[120px] rounded-full animate-blob animation-delay-2000"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-10">
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="inline-block p-4 bg-white dark:bg-bg-card rounded-24 shadow-soft mb-6"
                    >
                        <MessageCircle size={40} className="text-primary-light" />
                    </motion.div>
                    <h2 className="text-3xl font-extrabold text-[#111b21] dark:text-white mb-2">
                        {isRegistering ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        {isRegistering ? 'Join the secure chat community' : 'Sign in to stay connected'}
                    </p>
                </div>

                <div className="bg-white/80 dark:bg-bg-card/80 backdrop-blur-xl p-8 rounded-30 shadow-premium border border-white/20 dark:border-white/5">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                Phone Number
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-light transition-colors">
                                    <Phone size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full bg-bg-light dark:bg-[#202c33] border-none rounded-20 py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary-light transition-all dark:text-white"
                                    placeholder="+1 (123) 456-7890"
                                    required
                                />
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {isRegistering && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2"
                                >
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                        Your Name
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-light transition-colors">
                                            <UserIcon size={20} />
                                        </div>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-bg-light dark:bg-[#202c33] border-none rounded-20 py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary-light transition-all dark:text-white"
                                            placeholder="John Doe"
                                            required={isRegistering}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-red-500 text-sm text-center font-medium"
                            >
                                {error}
                            </motion.p>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary-light to-primary-dark text-white rounded-20 py-4 font-bold shadow-lg shadow-primary-light/30 flex items-center justify-center space-x-2 disabled:opacity-70 transition-all"
                        >
                            <span>{loading ? 'Processing...' : (isRegistering ? 'Get Started' : 'Sign In')}</span>
                            {!loading && <ArrowRight size={20} />}
                        </motion.button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError('');
                            }}
                            className="text-primary-light font-semibold hover:text-primary-dark transition-colors text-sm"
                        >
                            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
                        </button>
                    </div>
                </div>

                <p className="mt-10 text-center text-xs text-gray-400 font-medium">
                    By continuing, you agree to our Terms and Privacy Policy.
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
