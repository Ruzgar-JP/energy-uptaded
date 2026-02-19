import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Landmark, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function AdminBanks() {
  const { token, API } = useAuth();
  const [banks, setBanks] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBank, setEditBank] = useState(null);
  const [form, setForm] = useState({ name: '', iban: '', account_holder: '', logo_url: '' });
  const [loading, setLoading] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  const fetchBanks = () => axios.get(`${API}/banks`, { headers }).then(r => setBanks(r.data));
  useEffect(() => { fetchBanks(); }, []);

  const openNew = () => { setEditBank(null); setForm({ name: '', iban: '', account_holder: '', logo_url: '' }); setDialogOpen(true); };
  const openEdit = (b) => { setEditBank(b); setForm({ name: b.name, iban: b.iban, account_holder: b.account_holder, logo_url: b.logo_url || '' }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.iban || !form.account_holder) { toast.error('Tum alanlari doldurun'); return; }
    setLoading(true);
    try {
      if (editBank) {
        await axios.put(`${API}/admin/banks/${editBank.bank_id}`, form, { headers });
        toast.success('Banka guncellendi');
      } else {
        await axios.post(`${API}/admin/banks`, form, { headers });
        toast.success('Banka eklendi');
      }
      setDialogOpen(false);
      fetchBanks();
    } catch (err) {
      toast.error('Hata');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bankId) => {
    try {
      await axios.delete(`${API}/admin/banks/${bankId}`, { headers });
      toast.success('Banka silindi');
      fetchBanks();
    } catch (err) {
      toast.error('Hata');
    }
  };

  return (
    <AdminLayout>
      <div data-testid="admin-banks">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-[Poppins]">Bankalar</h1>
            <p className="text-slate-500 text-sm">Yatirim icin banka ve IBAN bilgilerini yonetin.</p>
          </div>
          <Button onClick={openNew} className="bg-emerald-500 hover:bg-emerald-600 text-white" data-testid="add-bank-btn">
            <Plus className="w-4 h-4 mr-2" /> Banka Ekle
          </Button>
        </div>

        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Banka</TableHead>
                <TableHead>IBAN</TableHead>
                <TableHead>Alici Adi</TableHead>
                <TableHead>Islemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banks.map(b => (
                <TableRow key={b.bank_id} data-testid={`bank-row-${b.bank_id}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Landmark className="w-4 h-4 text-emerald-600" /></div>
                      <span className="font-medium">{b.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{b.iban}</TableCell>
                  <TableCell>{b.account_holder}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(b)} data-testid={`edit-bank-${b.bank_id}`}><Pencil className="w-3 h-3" /></Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(b.bank_id)} data-testid={`delete-bank-${b.bank_id}`}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-[Poppins]">{editBank ? 'Banka Duzenle' : 'Yeni Banka Ekle'}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Banka Adi</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Banka Adi" data-testid="bank-name-input" /></div>
              <div><Label>IBAN</Label><Input value={form.iban} onChange={e => setForm(p => ({ ...p, iban: e.target.value }))} placeholder="TR00 0000 0000 0000 0000 0000 00" data-testid="bank-iban-input" /></div>
              <div><Label>Alici Adi</Label><Input value={form.account_holder} onChange={e => setForm(p => ({ ...p, account_holder: e.target.value }))} placeholder="Sirket Adi" data-testid="bank-holder-input" /></div>
              <Button className="w-full bg-[#0F3935] text-white" onClick={handleSave} disabled={loading} data-testid="bank-save-btn">
                {loading ? 'Kaydediliyor...' : editBank ? 'Guncelle' : 'Ekle'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
