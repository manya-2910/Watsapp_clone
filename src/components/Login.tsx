import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Key, ArrowRight, MessageCircle, Sun, Moon } from 'lucide-react';

interface LoginProps {
    onLogin: (email: string) => Promise<void>;
    onVerifyOtp: (email: string, otp: string) => Promise<any>;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onVerifyOtp, isDarkMode, toggleDarkMode }) => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        console.log('Sending OTP to:', email);
        try {
            await onLogin(email);
            console.log('OTP sent successfully');
            setOtpSent(true);
        } catch (err: any) {
            console.error('UI Login Catch:', err);
            setError(err.message || 'Failed to send OTP. Please check your console.');
        } finally {
            setLoading(false);
        }
    };


    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await onVerifyOtp(email, otp);
        } catch (err: any) {
            setError(err.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg-light dark:bg-bg-dark transition-colors duration-500 p-6">
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
                        NHAPP Web
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        {otpSent ? 'Enter the code sent to your email' : 'Sign in with your email'}
                    </p>
                </div>

                <div className="bg-white/80 dark:bg-bg-card/80 backdrop-blur-xl p-8 rounded-30 shadow-premium border border-white/20 dark:border-white/5">
                    <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-6">
                        {!otpSent ? (
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-light transition-colors">
                                        <Mail size={20} />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-bg-light dark:bg-[#202c33] border-none rounded-20 py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary-light transition-all dark:text-white"
                                        placeholder="user@example.com"
                                        required
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label htmlFor="otp" className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                    Verification Code
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-light transition-colors">
                                        <Key size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        id="otp"
                                        name="otp"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-bg-light dark:bg-[#202c33] border-none rounded-20 py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary-light transition-all dark:text-white"
                                        placeholder="123456"
                                        required
                                    />
                                </div>
                            </div>
                        )}

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
                            <span>{loading ? 'Processing...' : (otpSent ? 'Verify' : 'Send Code')}</span>
                            {!loading && <ArrowRight size={20} />}
                        </motion.button>

                        {otpSent && (
                            <button
                                type="button"
                                onClick={() => setOtpSent(false)}
                                className="w-full text-center text-sm text-gray-500 hover:text-primary-light transition-colors mt-2"
                            >
                                Use a different email
                            </button>
                        )}
                    </form>
                </div>

                <p className="mt-10 text-center text-xs text-gray-400 font-medium">
                    By continuing, you agree to our Terms and Privacy Policy.
                </p>
            </motion.div>
        </div>
    );
};

export default Login;

