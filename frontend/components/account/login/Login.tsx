import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InputField } from '../../shared/InputField';
import { useAuthStore } from '../../store/auth';

interface LoginProps {
  showContent?: boolean;
  onLoginSuccess?: () => void;
}

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 20, scale: 0.95 },
} as const;

export const Login: React.FC<LoginProps> = ({ showContent = true, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const { login, loading, error, clearError, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && onLoginSuccess) {
      onLoginSuccess();
    }
  }, [isAuthenticated, onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={CONTAINER_VARIANTS}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="max-w-md w-full space-y-8"
          >
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold bg-linear-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                Welcome back
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                Please sign in to your account
              </p>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-center text-sm text-red-600"
                >
                  {error}
                </motion.p>
              )}
            </div>

            <form className="mt-8 space-y-6" onSubmit={(e) => void handleSubmit(e)}>
              <div className="space-y-4">
                <InputField
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Enter your email"
                  index={0}
                  showContent={showContent}
                />

                <InputField
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Enter your password"
                  index={1}
                  showContent={showContent}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-pink-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-900 dark:text-gray-300 cursor-pointer"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a
                    href="#"
                    className="font-medium bg-linear-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent hover:from-purple-500 hover:to-pink-700"
                  >
                    Forgot your password?
                  </a>
                </div>
              </div>

              <div>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className={`w-full bg-linear-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                    loading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    'Sign in'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
