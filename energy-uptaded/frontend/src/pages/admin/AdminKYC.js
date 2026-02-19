import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminKYC() {
  const { token, API } = useAuth();
  const [kycList, setKycList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  const fetchKYC = () => axios.get(`${API}/admin/kyc`, { headers }).then(r => setKycList(r.data));
  useEffect(() => { fetchKYC(); }, []);

  const handleAction = async (kycId, action) => {
    setLoading(true);
    try {
      await axios.post(`${API}/admin/kyc/${kycId}/${action}`, {}, { headers });
      toast.success(action === 'approve' ? 'KYC onaylandi' : 'KYC reddedildi');
      setSelected(null);
      fetchKYC();
    } catch (err) {
      toast.error('Hata');
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status) => {
    const m = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700' };
    const l = { pending: 'Bekliyor', approved: 'Onaylandi', rejected: 'Reddedildi' };
    return <Badge className={m[status]}>{l[status]}</Badge>;
  };

  return (
    <AdminLayout>
      <div data-testid="admin-kyc">
        <h1 className="text-2xl font-bold text-slate-900 font-[Poppins] mb-2">Kimlik Dogrulama</h1>
        <p className="text-slate-500 mb-6 text-sm">Yatirimci kimlik belgelerini inceleyin ve onaylayin.</p>

        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Kullanici</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Islem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kycList.map(k => (
                <TableRow key={k.kyc_id} data-testid={`kyc-row-${k.kyc_id}`}>
                  <TableCell className="font-medium">{k.user_name}</TableCell>
                  <TableCell className="text-sm text-slate-500">{k.user_email}</TableCell>
                  <TableCell>{statusBadge(k.status)}</TableCell>
                  <TableCell className="text-sm text-slate-500">{new Date(k.submitted_at).toLocaleDateString('tr-TR')}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => setSelected(k)} data-testid={`kyc-view-${k.kyc_id}`}>
                      <Eye className="w-4 h-4 mr-1" /> Incele
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {kycList.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">Bekleyen KYC basvurusu yok</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle className="font-[Poppins]">Kimlik Inceleme - {selected?.user_name}</DialogTitle></DialogHeader>
            {selected && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>E-posta: {selected.user_email}</span>
                  <span>|</span>
                  <span>Durum: {statusBadge(selected.status)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Kimlik On Yuzu</p>
                    <img src={`${BACKEND_URL}${selected.front_image}`} alt="On yuz" className="w-full rounded-lg border" data-testid="kyc-front-image" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Kimlik Arka Yuzu</p>
                    <img src={`${BACKEND_URL}${selected.back_image}`} alt="Arka yuz" className="w-full rounded-lg border" data-testid="kyc-back-image" />
                  </div>
                </div>
                {selected.status === 'pending' && (
                  <div className="flex gap-3 pt-2">
                    <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleAction(selected.kyc_id, 'approve')} disabled={loading} data-testid="kyc-approve-btn">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Onayla
                    </Button>
                    <Button className="flex-1" variant="destructive" onClick={() => handleAction(selected.kyc_id, 'reject')} disabled={loading} data-testid="kyc-reject-btn">
                      <XCircle className="w-4 h-4 mr-2" /> Reddet
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
