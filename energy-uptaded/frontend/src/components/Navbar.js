import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Bell, Menu, User, LogOut, LayoutDashboard, Briefcase, ChevronDown, Shield, Sun, Wind, UserCircle } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Navbar({ transparent = false }) {
  const { user, token, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (token) {
      axios.get(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setUnreadCount(res.data.unread_count))
        .catch(() => {});
    }
  }, [token, location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };

  const isLanding = location.pathname === '/';
  const showTransparent = transparent && isLanding && !scrolled;
  const bgClass = showTransparent ? 'bg-transparent' : 'bg-[#0F3935] shadow-lg';
  const textClass = 'text-white';

  const landingLinks = [
    { href: '#projects', label: 'Projeler' },
    { href: '#plans', label: 'Yatirim Planlari' },
    { href: '#benefits', label: 'Avantajlar' },
    { href: '#faq', label: 'SSS' },
  ];

  const dashLinks = [
    { href: '/dashboard', label: 'Panel', icon: LayoutDashboard },
    { href: '/projects', label: 'Projeler', icon: Briefcase },
    { href: '/deposit', label: 'Para Yatir', icon: null },
    { href: '/withdraw', label: 'Para Cek', icon: null },
  ];

  const links = user && !isLanding ? dashLinks : landingLinks;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${bgClass}`} data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16 md:h-20">
        <Link to="/" className={`flex items-center gap-2 font-bold text-xl ${textClass}`} data-testid="navbar-logo">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Sun className="w-5 h-5 text-white" />
          </div>
          <span className="font-[Poppins] tracking-tight">Alarko Enerji</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {links.map(link => (
            link.href.startsWith('#') ? (
              <a key={link.href} href={link.href} className={`text-sm font-medium ${textClass} opacity-80 hover:opacity-100 transition-opacity`}>
                {link.label}
              </a>
            ) : (
              <Link key={link.href} to={link.href}
                className={`text-sm font-medium transition-opacity ${textClass} ${location.pathname === link.href ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}>
                {link.label}
              </Link>
            )
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/notifications" data-testid="notification-bell" className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
                <Bell className={`w-5 h-5 ${textClass}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>
                )}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={`${textClass} hover:bg-white/10 gap-2`} data-testid="user-menu-trigger">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-sm">{user.name}</span>
                    <ChevronDown className="w-4 h-4 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/account')} data-testid="menu-account">
                    <UserCircle className="w-4 h-4 mr-2" /> Hesabim
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} data-testid="menu-dashboard">
                    <LayoutDashboard className="w-4 h-4 mr-2" /> Panel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/kyc')} data-testid="menu-kyc">
                    <Shield className="w-4 h-4 mr-2" /> Kimlik Dogrulama
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} data-testid="menu-admin">
                      <Shield className="w-4 h-4 mr-2" /> Admin Paneli
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                    <LogOut className="w-4 h-4 mr-2" /> Cikis Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className={`${textClass} hover:bg-white/10`} data-testid="nav-login-btn">Giris Yap</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" data-testid="nav-register-btn">Yatirima Basla</Button>
              </Link>
            </>
          )}
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className={textClass} data-testid="mobile-menu-btn">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#0F3935] border-none text-white w-72">
            <div className="flex flex-col gap-4 mt-8">
              {links.map(link => (
                link.href.startsWith('#') ? (
                  <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="text-lg font-medium py-2 border-b border-white/10">{link.label}</a>
                ) : (
                  <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)} className="text-lg font-medium py-2 border-b border-white/10">{link.label}</Link>
                )
              ))}
              {user ? (
                <>
                  <Link to="/notifications" onClick={() => setMobileOpen(false)} className="text-lg font-medium py-2 border-b border-white/10 flex items-center gap-2">
                    <Bell className="w-5 h-5" /> Bildirimler {unreadCount > 0 && <Badge className="bg-red-500">{unreadCount}</Badge>}
                  </Link>
                  <Link to="/account" onClick={() => setMobileOpen(false)} className="text-lg font-medium py-2 border-b border-white/10 flex items-center gap-2">
                    <UserCircle className="w-5 h-5" /> Hesabim
                  </Link>
                  <Link to="/kyc" onClick={() => setMobileOpen(false)} className="text-lg font-medium py-2 border-b border-white/10 flex items-center gap-2">
                    <Shield className="w-5 h-5" /> Kimlik Dogrulama
                  </Link>
                  <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="text-lg font-medium py-2 text-left text-red-400">Cikis Yap</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="text-lg font-medium py-2 border-b border-white/10">Giris Yap</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-emerald-500 hover:bg-emerald-600 mt-2">Yatirima Basla</Button>
                  </Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
