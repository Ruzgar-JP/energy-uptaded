import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

export default function AdminPortfolios() {
  const { token, API } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API}/admin/portfolios`, { headers }).then(r => setPortfolios(r.data)).catch(() => {});
  }, []);

  return (
    <AdminLayout>
      <div data-testid="admin-portfolios">
        <h1 className="text-2xl font-bold text-slate-900 font-[Poppins] mb-2">Portfolyolar</h1>
        <p className="text-slate-500 mb-6 text-sm">Tum yatirimci portfolyolarini goruntuleyin.</p>

        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Yatirimci</TableHead>
                <TableHead>Proje</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Aylik Getiri</TableHead>
                <TableHead>Tarih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolios.map(p => (
                <TableRow key={p.portfolio_id} data-testid={`portfolio-row-${p.portfolio_id}`}>
                  <TableCell>
                    <div><p className="font-medium text-sm">{p.user_name || '-'}</p><p className="text-xs text-slate-400">{p.user_email || ''}</p></div>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{p.project_name}</TableCell>
                  <TableCell><Badge className={p.project_type === 'GES' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}>{p.project_type}</Badge></TableCell>
                  <TableCell className="font-semibold">{(p.amount || 0).toLocaleString('tr-TR')} TL</TableCell>
                  <TableCell className="text-emerald-600 font-medium">+{(p.monthly_return || 0).toLocaleString('tr-TR')} TL</TableCell>
                  <TableCell className="text-sm text-slate-500">{new Date(p.purchase_date).toLocaleDateString('tr-TR')}</TableCell>
                </TableRow>
              ))}
              {portfolios.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">Portfolyo verisi yok</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AdminLayout>
  );
}
