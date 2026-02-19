import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, Briefcase, ArrowUpRight, ArrowDownRight, Plus, Minus, Shield, Eye, ArrowRight, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { toast } from 'sonner';
import axios from 'axios';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899'];

export default function DashboardPage() {
  const { user, token, refreshUser, API } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/portfolio`, { headers }),
      axios.get(`${API}/transactions`, { headers })
    ]).then(([pRes, tRes]) => {
      setPortfolio(pRes.data);
      setTransactions(tRes.data.slice(0, 5));
    }).catch(() => toast.error('Veri yuklenemedi'))
      .finally(() => setLoading(false));
  }, []);

  const handleSell = async (portfolioId) => {
    try {
      await axios.post(`${API}/portfolio/sell`, { portfolio_id: portfolioId }, { headers });
      toast.success('Yatirim satildi');
      const pRes = await axios.get(`${API}/portfolio`, { headers });
      setPortfolio(pRes.data);
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Hata');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const kycPending = user?.kyc_status !== 'approved';

  // Chart data
  const pieData = portfolio?.investments?.reduce((acc, inv) => {
    const existing = acc.find(a => a.name === inv.project_name);
    if (existing) { existing.value += inv.amount; }
    else { acc.push({ name: inv.project_name, value: inv.amount, type: inv.project_type }); }
    return acc;
  }, []) || [];

  const barData = portfolio?.investments?.map(inv => ({
    name: inv.project_name?.length > 15 ? inv.project_name.slice(0, 15) + '...' : inv.project_name,
    maliyet: inv.amount,
    getiri: inv.monthly_return,
    oran: inv.return_rate
  })) || [];

  const typeData = portfolio?.investments?.reduce((acc, inv) => {
    const existing = acc.find(a => a.name === inv.project_type);
    if (existing) { existing.value += inv.amount; }
    else { acc.push({ name: inv.project_type === 'GES' ? 'Gunes (GES)' : 'Ruzgar (RES)', value: inv.amount }); }
    return acc;
  }, []) || [];

  return (
    <div className="min-h-screen bg-slate-50" data-testid="dashboard-page">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-[Poppins]">Hos Geldiniz, {user?.name}</h1>
          <p className="text-slate-500 mt-1">Yatirim portfolyonuzu buradan yonetin.</p>
        </div>

        {kycPending && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between" data-testid="kyc-warning">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 text-sm">Kimlik Dogrulamasi Gerekli</p>
                <p className="text-xs text-amber-600">Yatirim yapabilmek icin kimlik dogrulamanizi tamamlayin.</p>
              </div>
            </div>
            <Link to="/kyc"><Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white" data-testid="kyc-go-btn">Dogrula</Button></Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-5 mb-8">
          {[
            { icon: Wallet, label: 'Bakiye', value: `₺${(user?.balance || 0).toLocaleString('tr-TR')}`, color: 'bg-emerald-500/10 text-emerald-600', sub: 'Kullanilabilir' },
            { icon: Briefcase, label: 'Toplam Yatirim', value: `₺${(portfolio?.total_invested || 0).toLocaleString('tr-TR')}`, color: 'bg-sky-500/10 text-sky-600', sub: `${portfolio?.investments?.length || 0} proje` },
            { icon: TrendingUp, label: 'Aylik Getiri', value: `₺${(portfolio?.total_monthly_return || 0).toLocaleString('tr-TR')}`, color: 'bg-violet-500/10 text-violet-600', sub: 'Tahmini' },
            { icon: PieIcon, label: 'Yillik Getiri', value: `₺${((portfolio?.total_monthly_return || 0) * 12).toLocaleString('tr-TR')}`, color: 'bg-amber-500/10 text-amber-600', sub: '12 aylik projeksiyon' },
          ].map((s, i) => (
            <Card key={i} className="border-0 shadow-sm rounded-2xl" data-testid={`stat-card-${i}`}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm text-slate-500">{s.label}</p>
                  <p className="text-xl font-bold text-slate-900 font-[Poppins]">{s.value}</p>
                  <p className="text-[10px] text-slate-400">{s.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link to="/deposit"><Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 rounded-xl" data-testid="deposit-btn"><Plus className="w-4 h-4" /> Para Yatir</Button></Link>
          <Link to="/withdraw"><Button variant="outline" className="gap-2 rounded-xl" data-testid="withdraw-btn"><Minus className="w-4 h-4" /> Para Cek</Button></Link>
          <Link to="/projects"><Button variant="outline" className="gap-2 rounded-xl" data-testid="invest-btn"><Eye className="w-4 h-4" /> Projeleri Incele</Button></Link>
        </div>

        {/* Charts Section */}
        {portfolio?.investments?.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Portfolio Distribution */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader><CardTitle className="font-[Poppins] text-lg">Portfolyo Dagilimi</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value"
                        label={({ name, percent }) => `${name.slice(0, 12)}${name.length > 12 ? '...' : ''} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => [`₺${value.toLocaleString('tr-TR')}`, 'Tutar']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Type distribution */}
                <div className="flex justify-center gap-6 mt-2">
                  {typeData.map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-xs text-slate-600">{t.name}: ₺{t.value.toLocaleString('tr-TR')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Return Chart */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader><CardTitle className="font-[Poppins] text-lg">Maliyet & Aylik Getiri</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₺${(v/1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value, name) => [`₺${value.toLocaleString('tr-TR')}`, name === 'maliyet' ? 'Maliyet' : 'Aylik Getiri']} />
                      <Legend formatter={(value) => value === 'maliyet' ? 'Maliyet' : 'Aylik Getiri'} />
                      <Bar dataKey="maliyet" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="getiri" fill="#10B981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Investments & Transactions */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader><CardTitle className="font-[Poppins] text-lg">Aktif Yatirimlar</CardTitle></CardHeader>
              <CardContent>
                {portfolio?.investments?.length > 0 ? (
                  <div className="space-y-3">
                    {portfolio.investments.map(inv => (
                      <div key={inv.portfolio_id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border hover:shadow-sm transition-shadow" data-testid={`investment-${inv.portfolio_id}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${inv.project_type === 'GES' ? 'bg-amber-500/10' : 'bg-sky-500/10'}`}>
                            {inv.project_type === 'GES' ? <span className="text-amber-600 text-xs font-bold">GES</span> : <span className="text-sky-600 text-xs font-bold">RES</span>}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900">{inv.project_name}</p>
                            <p className="text-xs text-slate-500">%{inv.return_rate} aylik getiri</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className="font-semibold text-slate-900">₺{inv.amount.toLocaleString('tr-TR')}</p>
                            <p className="text-xs text-emerald-600 font-medium">+₺{inv.monthly_return.toLocaleString('tr-TR')}/ay</p>
                          </div>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 rounded-lg" onClick={() => handleSell(inv.portfolio_id)} data-testid={`sell-btn-${inv.portfolio_id}`}>
                            Sat
                          </Button>
                        </div>
                      </div>
                    ))}
                    {/* Summary */}
                    <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div><p className="text-xs text-emerald-600">Toplam Maliyet</p><p className="font-bold text-emerald-800 font-[Poppins]">₺{(portfolio.total_invested || 0).toLocaleString('tr-TR')}</p></div>
                        <div><p className="text-xs text-emerald-600">Aylik Getiri</p><p className="font-bold text-emerald-800 font-[Poppins]">₺{(portfolio.total_monthly_return || 0).toLocaleString('tr-TR')}</p></div>
                        <div><p className="text-xs text-emerald-600">Yillik Getiri</p><p className="font-bold text-emerald-800 font-[Poppins]">₺{((portfolio.total_monthly_return || 0) * 12).toLocaleString('tr-TR')}</p></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="mb-1 font-medium">Henuz yatiriminiz yok</p>
                    <p className="text-sm mb-4">Projeleri inceleyerek ilk yatiriminizi yapin.</p>
                    <Link to="/projects"><Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl" data-testid="start-investing-btn">Yatirima Basla</Button></Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader><CardTitle className="font-[Poppins] text-lg">Son Islemler</CardTitle></CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map(t => (
                      <div key={t.transaction_id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          {t.type === 'deposit' ? <ArrowDownRight className="w-4 h-4 text-emerald-500" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                          <div>
                            <p className="text-sm font-medium">{t.type === 'deposit' ? 'Para Yatirma' : 'Para Cekme'}</p>
                            <p className="text-xs text-slate-400">{new Date(t.created_at).toLocaleDateString('tr-TR')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${t.type === 'deposit' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {t.type === 'deposit' ? '+' : '-'}₺{t.amount.toLocaleString('tr-TR')}
                          </p>
                          <Badge variant={t.status === 'approved' ? 'default' : t.status === 'pending' ? 'secondary' : 'destructive'} className="text-[10px]">
                            {t.status === 'approved' ? 'Onaylandi' : t.status === 'pending' ? 'Bekliyor' : 'Reddedildi'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-slate-400 py-6">Islem yok</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
