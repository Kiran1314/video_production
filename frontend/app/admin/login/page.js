"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Authenticating...');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        toast.success('Login successful!', { id: loadingToast });
        router.push('/admin');
      } else {
        toast.error('Invalid credentials.', { id: loadingToast });
      }
    } catch (error) {
      toast.error('Server error.', { id: loadingToast });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen animated-bg text-gray-200 p-4">
      <motion.form 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="p-8 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl w-full max-w-sm"
        onSubmit={handleLogin}
      >
        {/* Updated Logo Section */}
        <div className="flex justify-center mb-6">
          <img 
            src="/logo.png" 
            alt="Company Logo" 
            className="w-40 h-40 object-contain" 
          />
        </div>

        <h2 className="text-xl font-bold mb-6 text-center text-white">Admin Portal</h2>
        <input 
          type="text" placeholder="Username" required
          className="w-full mb-4 p-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded focus:outline-none focus:border-blue-500 transition"
          onChange={e => setUsername(e.target.value)}
        />
        
        <input 
          type="password" placeholder="Password" required
          className="w-full mb-6 p-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded focus:outline-none focus:border-blue-500 transition"
          onChange={e => setPassword(e.target.value)}
        />
        
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium p-3 rounded transition shadow-lg shadow-blue-500/20">
          Login
        </button>
      </motion.form>
    </div>
  );
}