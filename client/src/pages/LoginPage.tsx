import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icons } from '@/lib/icons';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const login = useAuthStore(s => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-6 animate-pulse-glow">
            <svg width="80" height="80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="200" height="200" rx="40" fill="#2a2520"/>
              <g transform="translate(30, 40)">
                <rect x="0" y="20" width="20" height="100" rx="3" fill="#5a5040"/>
                <path d="M65 30 C40 30, 30 50, 30 70 C30 90, 40 110, 65 110" stroke="#e8e0d0" stroke-width="18" stroke-linecap="round" fill="none"/>
                <path d="M90 110 L115 30 L140 110" stroke="#e8e0d0" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <line x1="98" y1="85" x2="132" y2="85" stroke="#e8e0d0" stroke-width="14" stroke-linecap="round"/>
              </g>
            </svg>
          </div>
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground mt-2">Sign in to continue to ChatSphere</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <div className="relative">
            <Input type={showPass ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground [&>svg]:w-5 [&>svg]:h-5" dangerouslySetInnerHTML={{ __html: showPass ? Icons.eye : Icons.lock }} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" size="lg" isLoading={loading}>Sign In</Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <a href="/signup" className="text-primary hover:underline font-medium">Sign up</a>
        </p>
      </div>
    </div>
  );
}
