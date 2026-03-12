import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

/**
 * 登录页 - 用户名、密码登录（演示用，未对接真实后端）
 * @returns {JSX.Element}
 */
export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (login(username, password)) {
      navigate('/ai-tool/home', { replace: true });
    } else {
      setError('登录失败，请重试');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-4">
      <Card className="glass-strong w-full max-w-sm p-8">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">登录</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">用户名</label>
            <Input
              placeholder="请输入用户名"
              value={username}
              onChange={setUsername}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">密码</label>
            <Input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" variant="primary" size="lg" className="w-full">
            登录
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-zinc-500">
          演示模式：输入任意用户名即可进入
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 w-full text-center text-sm text-zinc-400 hover:text-white"
        >
          返回启动页
        </button>
      </Card>
    </div>
  );
}
