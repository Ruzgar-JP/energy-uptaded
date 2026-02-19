import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sun, Wind, LogIn, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function LoginPage() {
  const { login, API } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const userData = await login(form.email, form.password);
      navigate(userData.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Giris basarisiz');
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = `${API}/auth/google`;
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left - Visual Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1545209575-704d1434f9cd?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200"
          alt="Gunes Enerjisi"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F3935]/90 via-[#0F3935]/70 to-emerald-900/80" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-[Poppins] font-bold text-2xl text-white">Alarko Enerji</span>
            </Link>
          </div>
          <h2 className="text-3xl xl:text-4xl font-bold text-white font-[Poppins] leading-tight mb-4">
            Yenilenebilir Enerjide <br />
            <span className="text-emerald-400">Guvenli Yatirim</span>
          </h2>
          <p className="text-emerald-100/70 text-base xl:text-lg leading-relaxed max-w-md">
            GES ve RES projelerine yatirim yaparak aylik %8'e varan getiri elde edin.
          </p>
          {/* Bouncing Icons */}
          <div className="mt-12 flex items-center gap-8">
            <div className="animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }}>
              <div className="w-14 h-14 rounded-2xl bg-amber-400/20 backdrop-blur-sm border border-amber-400/30 flex items-center justify-center">
                <Sun className="w-7 h-7 text-amber-400" />
              </div>
              <p className="text-amber-300/70 text-xs text-center mt-2">GES</p>
            </div>
            <div className="animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}>
              <div className="w-14 h-14 rounded-2xl bg-sky-400/20 backdrop-blur-sm border border-sky-400/30 flex items-center justify-center">
                <Wind className="w-7 h-7 text-sky-400" />
              </div>
              <p className="text-sky-300/70 text-xs text-center mt-2">RES</p>
            </div>
            <div className="animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }}>
              <div className="w-14 h-14 rounded-2xl bg-emerald-400/20 backdrop-blur-sm border border-emerald-400/30 flex items-center justify-center">
                <Sun className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-emerald-300/70 text-xs text-center mt-2">GES</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-[Poppins] font-bold text-xl text-slate-900">Alarko Enerji</span>
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-[Poppins] mb-2" data-testid="login-title">Giris Yap</h1>
          <p className="text-slate-500 mb-8">Hesabiniza giris yaparak yatirimlarinizi yonetin.</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="text-sm text-slate-700">E-posta</Label>
              <Input type="email" placeholder="ornek@email.com" className="h-12 mt-1" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required data-testid="login-email" />
            </div>
            <div>
              <Label className="text-sm text-slate-700">Sifre</Label>
              <div className="relative mt-1">
                <Input type={showPw ? 'text' : 'password'} placeholder="Sifreniz" className="h-12 pr-10" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required data-testid="login-password" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 bg-[#0F3935] hover:bg-[#0F3935]/90 text-white text-base rounded-xl" data-testid="login-submit-btn">
              {loading ? 'Giris yapiliyor...' : 'Giris Yap'}
              {!loading && <LogIn className="w-4 h-4 ml-2" />}
            </Button>
          </form>
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">veya</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <Button variant="outline" className="w-full h-12 rounded-xl text-sm" onClick={handleGoogle} data-testid="google-login-btn">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google ile Giris Yap
          </Button>
          <p className="text-center text-sm text-slate-500 mt-8">
            Hesabiniz yok mu? <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold">Kayit Ol</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Leaf(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  );
}
