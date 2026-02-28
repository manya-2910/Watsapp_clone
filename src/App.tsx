import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import ChatInterface from './components/ChatInterface';
import SplashScreen from './components/SplashScreen';

const App: React.FC = () => {
  const { user, loading, login, verifyOtp, logout } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Initial splash delay
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <AnimatePresence mode="wait">
      {showSplash || loading ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-50"
        >
          <SplashScreen />
        </motion.div>
      ) : !user ? (
        <motion.div
          key="login"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
        >
          <Login
            onLogin={login}
            onVerifyOtp={verifyOtp}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          />
        </motion.div>
      ) : (
        <motion.div
          key="chat"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-screen overflow-hidden"
        >
          <ChatInterface
            user={user}
            onLogout={logout}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default App;
