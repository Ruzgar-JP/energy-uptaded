import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Wallet, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function WithdrawalPage() {
  const { user, token, API, refreshUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  const handleWithdraw = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) { toast.error('Gecerli bir tutar girin'); return; }
    if (val > (user?.balance || 0)) { toast.error('Yetersiz bakiye'); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/transactions`, { amount: val, type: 'withdrawal' }, { headers });
      toast.success('Cekme talebi olusturuldu. Admin onayi bekleniyor.');
      setAmount('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Hata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="withdrawal-page">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 md:px-8 pt-24 pb-12">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Panele Don
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-[Sora] mb-2">Para Cek</h1>
        <p className="text-slate-500 mb-8">Bakiyenizden para cekme talebi olusturun.</p>

        <Card className="border-0 shadow-sm rounded-2xl mb-6">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Mevcut Bakiye</p>
              <p className="text-2xl font-bold text-slate-900 font-[Sora]">{(user?.balance || 0).toLocaleString('tr-TR')} TL</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 font-[Sora] mb-4">Cekme Tutari</h3>
            <Input type="number" placeholder="Tutar (TL)" value={amount} onChange={e => setAmount(e.target.value)} className="h-12 text-lg mb-4" data-testid="withdraw-amount-input" />
            <div className="bg-amber-50 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">Cekme talebi olusturuldugunda bakiyeniz uzerinden admin onayi beklenir. Onay sonrasi tutar bakiyenizden dusulur ve hesabiniza aktarilir.</p>
            </div>
            <Button className="w-full h-12 bg-[#0F3935] hover:bg-[#0F3935]/90 text-white" onClick={handleWithdraw} disabled={loading} data-testid="withdraw-submit-btn">
              {loading ? 'Islem yapiliyor...' : 'Cekme Talebi Olustur'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
