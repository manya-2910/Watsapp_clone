import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

const SplashScreen: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg-light dark:bg-bg-dark transition-colors duration-500">
            {/* Floating Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{
                            x: Math.random() * window.innerWidth,
                            y: Math.random() * window.innerHeight,
                            opacity: 0
                        }}
                        animate={{
                            y: [null, Math.random() * -100 - 50],
                            opacity: [0, 0.3, 0]
                        }}
                        transition={{
                            duration: Math.random() * 5 + 5,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute w-2 h-2 bg-primary-light rounded-full blur-[1px]"
                    />
                ))}
            </div>

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    duration: 0.8,
                    ease: "easeOut"
                }}
                className="relative"
            >
                <div className="absolute inset-0 bg-primary-light blur-3xl opacity-20 rounded-full"></div>
                <div className="relative bg-bg-card p-6 rounded-full shadow-premium">
                    <MessageCircle size={64} className="text-primary-light" />
                </div>
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="mt-8 text-center"
            >
                <h1 className="text-2xl font-bold text-bg-dark dark:text-text-dark tracking-tight">
                    WhatsApp Clone
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
                    Connect Privately. Chat Freely.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="absolute bottom-12"
            >
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">
                    Secure End-to-End
                </p>
            </motion.div>
        </div>
    );
};

export default SplashScreen;
