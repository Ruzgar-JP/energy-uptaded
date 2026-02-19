import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Shield, Briefcase, ArrowLeftRight, TrendingUp, Landmark } from 'lucide-react';
import axios from 'axios';

export default function AdminDashboard() {
  const { token, API } = useAuth();
  const [stats, setStats] = useState(null);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API}/admin/stats`, { headers }).then(r => setStats(r.data)).catch(() => {});
  }, []);

  const items = stats ? [
    { icon: Users, label: 'Toplam Yatirimci', value: stats.total_users, color: 'bg-sky-500/10 text-sky-600' },
    { icon: Shield, label: 'Bekleyen KYC', value: stats.pending_kyc, color: 'bg-amber-500/10 text-amber-600' },
    { icon: Briefcase, label: 'Aktif Proje', value: stats.total_projects, color: 'bg-emerald-500/10 text-emerald-600' },
    { icon: TrendingUp, label: 'Toplam Yatirim', value: `${(stats.total_invested / 1000000).toFixed(1)}M TL`, color: 'bg-violet-500/10 text-violet-600' },
    { icon: Landmark, label: 'Toplam Bakiye', value: `${(stats.total_balance).toLocaleString('tr-TR')} TL`, color: 'bg-pink-500/10 text-pink-600' },
    { icon: ArrowLeftRight, label: 'Bekleyen Islem', value: stats.pending_transactions, color: 'bg-orange-500/10 text-orange-600' },
  ] : [];

  return (
    <AdminLayout>
      <div data-testid="admin-dashboard">
        <h1 className="text-2xl font-bold text-slate-900 font-[Poppins] mb-2">Admin Paneli</h1>
        <p className="text-slate-500 mb-8">Platformun genel durumunu buradan takip edin.</p>
        {stats ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((s, i) => (
              <Card key={i} className="border-0 shadow-sm rounded-2xl" data-testid={`admin-stat-${i}`}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm text-slate-500">{s.label}</p>
                    <p className="text-2xl font-bold text-slate-900 font-[Poppins]">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        )}
      </div>
    </AdminLayout>
  );
}
