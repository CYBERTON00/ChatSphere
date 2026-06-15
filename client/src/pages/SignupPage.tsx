import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icons } from '@/lib/icons';

export default function SignupPage() {
  const [form, setForm] = useState({ email: '', password: '', username: '', displayName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const register = useAuthStore(s => s.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
          <h1 className="text-3xl font-bold">Create account</h1>
          <p className="text-muted-foreground mt-2">Join ChatSphere today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Display Name" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} required />
          <Input placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
          <Input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <div className="relative">
            <Input type={showPass ? 'text' : 'password'} placeholder="Password (min 8 characters)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground [&>svg]:w-5 [&>svg]:h-5" dangerouslySetInnerHTML={{ __html: showPass ? Icons.eye : Icons.lock }} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" size="lg" isLoading={loading}>Create Account</Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <a href="/login" className="text-primary hover:underline font-medium">Sign in</a>
        </p>
      </div>
    </div>
  );
}
