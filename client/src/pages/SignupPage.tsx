import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MessageCircle } from 'lucide-react';

export default function SignupPage() {
  const [form, setForm] = useState({ email: '', password: '', username: '', displayName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
          <div className="mx-auto h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
            <MessageCircle className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Create account</h1>
          <p className="text-muted-foreground mt-2">Join ChatSphere today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Display Name" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} required />
          <Input placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
          <Input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <Input type="password" placeholder="Password (min 8 characters)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
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
