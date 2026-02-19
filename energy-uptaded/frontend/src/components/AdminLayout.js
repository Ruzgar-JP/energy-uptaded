import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, Shield, Landmark, Briefcase, ArrowLeftRight, LogOut, Sun, ChevronLeft } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Genel Bakis', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Kullanicilar', icon: Users },
  { href: '/admin/kyc', label: 'Kimlik Dogrulama', icon: Shield },
  { href: '/admin/banks', label: 'Bankalar', icon: Landmark },
  { href: '/admin/portfolios', label: 'Portfolyolar', icon: Briefcase },
  { href: '/admin/transactions', label: 'Islemler', icon: ArrowLeftRight },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-[#0F3935] text-white flex flex-col fixed h-full" data-testid="admin-sidebar">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Sun className="w-4 h-4 text-white" />
            </div>
            <span className="font-[Sora] font-bold text-lg">Alarko Enerji</span>
          </Link>
          <p className="text-xs text-emerald-300/60 ml-10">Admin Paneli</p>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.href} to={item.href}
                data-testid={`admin-nav-${item.href.split('/').pop() || 'dashboard'}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-emerald-500/20 text-emerald-300' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Yatirimci Paneli
          </Link>
          <button onClick={() => { logout(); navigate('/'); }}
            data-testid="admin-logout"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 w-full transition-colors">
            <LogOut className="w-4 h-4" /> Cikis Yap
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-64 p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
