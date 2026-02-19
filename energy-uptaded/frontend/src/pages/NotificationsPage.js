import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle2, ArrowLeft, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function NotificationsPage() {
  const { token, API } = useAuth();
  const [data, setData] = useState({ notifications: [], unread_count: 0 });
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  const fetchNotifs = () => {
    axios.get(`${API}/notifications`, { headers }).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifs(); }, []);

  const markRead = async (id) => {
    await axios.post(`${API}/notifications/${id}/read`, {}, { headers });
    fetchNotifs();
  };

  const markAllRead = async () => {
    await axios.post(`${API}/notifications/read-all`, {}, { headers });
    toast.success('Tum bildirimler okundu');
    fetchNotifs();
  };

  const typeColors = {
    welcome: 'bg-emerald-500/10 text-emerald-600',
    kyc_approved: 'bg-emerald-500/10 text-emerald-600',
    kyc_rejected: 'bg-red-500/10 text-red-600',
    investment: 'bg-sky-500/10 text-sky-600',
    sale: 'bg-amber-500/10 text-amber-600',
    deposit_approved: 'bg-emerald-500/10 text-emerald-600',
    withdrawal: 'bg-violet-500/10 text-violet-600',
    withdrawal_approved: 'bg-emerald-500/10 text-emerald-600',
    withdrawal_rejected: 'bg-red-500/10 text-red-600',
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="notifications-page">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-24 pb-12">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Panele Don
        </Link>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-[Sora]">Bildirimler</h1>
            <p className="text-slate-500 text-sm mt-1">{data.unread_count} okunmamis bildirim</p>
          </div>
          {data.unread_count > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} data-testid="mark-all-read-btn">
              <CheckCircle2 className="w-4 h-4 mr-1" /> Tumunu Oku
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : data.notifications.length > 0 ? (
          <div className="space-y-3">
            {data.notifications.map(n => (
              <Card key={n.notification_id} className={`border-0 shadow-sm rounded-xl transition-colors ${!n.is_read ? 'bg-white ring-1 ring-emerald-200' : 'bg-white'}`} data-testid={`notification-${n.notification_id}`}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${typeColors[n.type] || 'bg-slate-100 text-slate-600'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-slate-900">{n.title}</p>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString('tr-TR')}</p>
                  </div>
                  {!n.is_read && (
                    <Button variant="ghost" size="sm" onClick={() => markRead(n.notification_id)} data-testid={`mark-read-${n.notification_id}`}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            <Bell className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>Bildiriminiz yok</p>
          </div>
        )}
      </div>
    </div>
  );
}
