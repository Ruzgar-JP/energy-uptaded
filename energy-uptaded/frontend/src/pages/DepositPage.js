import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Landmark, Copy, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function DepositPage() {
  const { token, API, refreshUser } = useAuth();
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API}/banks`).then(r => setBanks(r.data)).catch(() => {});
  }, []);

  const copyIban = (iban) => {
    navigator.clipboard.writeText(iban.replace(/\s/g, ''));
    toast.success('IBAN kopyalandi');
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) { toast.error('Gecerli bir tutar girin'); return; }
    if (!selectedBank) { toast.error('Banka secin'); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/transactions`, { amount: parseFloat(amount), bank_id: selectedBank.bank_id, type: 'deposit' }, { headers });
      toast.success('Yatirma talebi olusturuldu. Havale yaptiktan sonra admin onayi bekleniyor.');
      setAmount('');
      setSelectedBank(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Hata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="deposit-page">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-24 pb-12">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Panele Don
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-[Sora] mb-2">Para Yatir</h1>
        <p className="text-slate-500 mb-8">Asagidaki bankalardan birini secerek havale/EFT yapabilirsiniz.</p>

        <div className="space-y-4 mb-8">
          <h3 className="font-semibold text-slate-900 font-[Sora]">Banka Secin</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {banks.map(bank => (
              <Card key={bank.bank_id}
                className={`cursor-pointer transition-all rounded-2xl ${selectedBank?.bank_id === bank.bank_id ? 'border-2 border-emerald-500 shadow-md' : 'border hover:shadow-md'}`}
                onClick={() => setSelectedBank(bank)}
                data-testid={`bank-card-${bank.bank_id}`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Landmark className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="font-semibold text-slate-900">{bank.name}</span>
                    {selectedBank?.bank_id === bank.bank_id && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between bg-slate-50 rounded-lg p-2">
                      <div>
                        <p className="text-xs text-slate-400">IBAN</p>
                        <p className="font-mono text-slate-700 text-xs">{bank.iban}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); copyIban(bank.iban); }} className="p-1 hover:bg-slate-200 rounded" data-testid={`copy-iban-${bank.bank_id}`}>
                        <Copy className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Alici Adi</p>
                      <p className="font-medium text-slate-700">{bank.account_holder}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {selectedBank && (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-900 font-[Sora] mb-4">Yatirma Tutari</h3>
              <Input type="number" placeholder="Tutar (TL)" value={amount} onChange={e => setAmount(e.target.value)} className="h-12 text-lg mb-4" data-testid="deposit-amount-input" />
              <Button className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleDeposit} disabled={loading} data-testid="deposit-submit-btn">
                {loading ? 'Islem yapiliyor...' : 'Yatirma Talebi Olustur'}
              </Button>
              <p className="text-xs text-slate-400 mt-3 text-center">Havale/EFT yaptiktan sonra admin onayi ile bakiyenize eklenecektir.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
