import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Shield, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function AccountPage() {
  const { user, token, refreshUser, API } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { toast.error('Yeni sifreler eslesmiyor'); return; }
    if (pwForm.newPw.length < 6) { toast.error('Yeni sifre en az 6 karakter olmali'); return; }
    setPwLoading(true);
    try {
      await axios.post(`${API}/auth/change-password`, {
        current_password: pwForm.current,
        new_password: pwForm.newPw
      }, { headers });
      toast.success('Sifre basariyla degistirildi');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Sifre degistirilemedi');
    } finally {
      setPwLoading(false);
    }
  };

  const kycMap = {
    approved: { label: 'Onaylandi', color: 'bg-emerald-100 text-emerald-700' },
    submitted: { label: 'Inceleniyor', color: 'bg-amber-100 text-amber-700' },
    rejected: { label: 'Reddedildi', color: 'bg-red-100 text-red-700' },
    pending: { label: 'Belge Yukleyin', color: 'bg-slate-100 text-slate-600' }
  };
  const kyc = kycMap[user?.kyc_status] || kycMap.pending;
  const isGoogleUser = !user?.password_hash && user?.picture;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="account-page">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-[Poppins]" data-testid="account-title">Hesabim</h1>
          <p className="text-slate-500 mt-1">Hesap bilgilerinizi ve guvenlik ayarlarinizi yonetin.</p>
        </div>

        {/* Profile Info */}
        <Card className="border-0 shadow-sm rounded-2xl mb-6" data-testid="profile-card">
          <CardHeader>
            <CardTitle className="font-[Poppins] text-lg">Profil Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shrink-0">
                {user?.picture ? (
                  <img src={user.picture} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-white">{user?.name?.charAt(0)?.toUpperCase()}</span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-900" data-testid="profile-name">{user?.name}</h3>
                <p className="text-sm text-slate-500">{user?.role === 'admin' ? 'Yonetici' : 'Yatirimci'}</p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4">
              <div className="flex items-center gap-3 py-2">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">E-posta</p>
                  <p className="text-sm font-medium text-slate-900" data-testid="profile-email">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <Phone className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Telefon</p>
                  <p className="text-sm font-medium text-slate-900" data-testid="profile-phone">{user?.phone || 'Belirtilmemis'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <Shield className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Kimlik Dogrulama (KYC)</p>
                  <Badge className={kyc.color} data-testid="profile-kyc-status">{kyc.label}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <User className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Kayit Tarihi</p>
                  <p className="text-sm font-medium text-slate-900">{user?.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : '-'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card className="border-0 shadow-sm rounded-2xl" data-testid="password-card">
          <CardHeader>
            <CardTitle className="font-[Poppins] text-lg flex items-center gap-2">
              <Lock className="w-5 h-5" /> Sifre Degistir
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isGoogleUser ? (
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-500">Bu hesap Google ile olusturulmustur. Sifre degistirme islemi yapilamaz.</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label className="text-sm text-slate-700">Mevcut Sifre</Label>
                  <div className="relative mt-1">
                    <Input
                      type={showCurrent ? 'text' : 'password'}
                      value={pwForm.current}
                      onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                      placeholder="Mevcut sifreniz"
                      className="h-11 pr-10"
                      required
                      data-testid="current-password-input"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowCurrent(!showCurrent)}>
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-slate-700">Yeni Sifre</Label>
                  <div className="relative mt-1">
                    <Input
                      type={showNew ? 'text' : 'password'}
                      value={pwForm.newPw}
                      onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                      placeholder="En az 6 karakter"
                      className="h-11 pr-10"
                      required
                      data-testid="new-password-input"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowNew(!showNew)}>
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-slate-700">Yeni Sifre (Tekrar)</Label>
                  <div className="relative mt-1">
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      value={pwForm.confirm}
                      onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                      placeholder="Yeni sifrenizi tekrarlayin"
                      className="h-11 pr-10"
                      required
                      data-testid="confirm-password-input"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="bg-[#0F3935] hover:bg-[#0F3935]/90 text-white h-11" disabled={pwLoading} data-testid="change-password-btn">
                  {pwLoading ? 'Degistiriliyor...' : 'Sifreyi Degistir'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
