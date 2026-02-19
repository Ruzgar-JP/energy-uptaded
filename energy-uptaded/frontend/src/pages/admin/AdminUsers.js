import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Minus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function AdminUsers() {
  const { token, API } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [balanceUser, setBalanceUser] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceType, setBalanceType] = useState('add');
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  const fetchUsers = () => axios.get(`${API}/admin/users`, { headers }).then(r => setUsers(r.data));
  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  const handleBalance = async () => {
    if (!balanceAmount || parseFloat(balanceAmount) <= 0) { toast.error('Gecerli tutar girin'); return; }
    setLoading(true);
    try {
      await axios.put(`${API}/admin/users/${balanceUser.user_id}/balance`, { amount: parseFloat(balanceAmount), type: balanceType }, { headers });
      toast.success('Bakiye guncellendi');
      setBalanceUser(null);
      setBalanceAmount('');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Hata');
    } finally {
      setLoading(false);
    }
  };

  const handleRole = async (userId, role) => {
    try {
      await axios.put(`${API}/admin/users/${userId}/role`, { role }, { headers });
      toast.success('Rol guncellendi');
      fetchUsers();
    } catch (err) {
      toast.error('Hata');
    }
  };

  const openEditDialog = (u) => {
    setEditUser(u);
    setEditForm({ name: u.name || '', email: u.email || '', phone: u.phone || '' });
  };

  const handleEditUser = async () => {
    if (!editForm.name && !editForm.email) { toast.error('Ad veya e-posta girin'); return; }
    setLoading(true);
    try {
      await axios.put(`${API}/admin/users/${editUser.user_id}/info`, editForm, { headers });
      toast.success('Kullanici bilgileri guncellendi');
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Hata');
    } finally {
      setLoading(false);
    }
  };

  const kycBadge = (status) => {
    const map = { approved: 'bg-emerald-100 text-emerald-700', submitted: 'bg-amber-100 text-amber-700', rejected: 'bg-red-100 text-red-700', pending: 'bg-slate-100 text-slate-700' };
    const labels = { approved: 'Onaylandi', submitted: 'Bekliyor', rejected: 'Reddedildi', pending: 'Belge Yok' };
    return <Badge className={map[status] || map.pending}>{labels[status] || status}</Badge>;
  };

  return (
    <AdminLayout>
      <div data-testid="admin-users">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-[Poppins]">Kullanicilar</h1>
            <p className="text-slate-500 text-sm">{users.length} kayitli kullanici</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Kullanici ara..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" data-testid="admin-user-search" />
          </div>
        </div>

        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Kullanici</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Bakiye</TableHead>
                <TableHead>Kayit</TableHead>
                <TableHead>Islemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.user_id} data-testid={`user-row-${u.user_id}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                      {u.phone && <p className="text-xs text-slate-400">{u.phone}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={u.role} onValueChange={v => handleRole(u.user_id, v)}>
                      <SelectTrigger className="w-28 h-8" data-testid={`role-select-${u.user_id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investor">Yatirimci</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{kycBadge(u.kyc_status)}</TableCell>
                  <TableCell className="font-semibold">{(u.balance || 0).toLocaleString('tr-TR')} TL</TableCell>
                  <TableCell className="text-sm text-slate-500">{new Date(u.created_at).toLocaleDateString('tr-TR')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {/* Edit User Dialog */}
                      <Dialog open={editUser?.user_id === u.user_id} onOpenChange={(open) => !open && setEditUser(null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(u)} data-testid={`edit-btn-${u.user_id}`}>
                            <Pencil className="w-3 h-3 mr-1" /> Duzenle
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle className="font-[Poppins]">Kullanici Duzenle - {u.name}</DialogTitle></DialogHeader>
                          <div className="space-y-4 pt-2">
                            <div>
                              <Label className="text-sm text-slate-700">Ad Soyad</Label>
                              <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder="Ad Soyad" className="mt-1" data-testid="edit-name-input" />
                            </div>
                            <div>
                              <Label className="text-sm text-slate-700">E-posta</Label>
                              <Input value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} placeholder="E-posta" className="mt-1" data-testid="edit-email-input" />
                            </div>
                            <div>
                              <Label className="text-sm text-slate-700">Telefon</Label>
                              <Input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="Telefon" className="mt-1" data-testid="edit-phone-input" />
                            </div>
                            <Button className="w-full bg-[#0F3935] text-white" onClick={handleEditUser} disabled={loading} data-testid="edit-submit-btn">
                              {loading ? 'Kaydediliyor...' : 'Kaydet'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {/* Balance Dialog */}
                      <Dialog open={balanceUser?.user_id === u.user_id} onOpenChange={(open) => !open && setBalanceUser(null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setBalanceUser(u)} data-testid={`balance-btn-${u.user_id}`}>
                            Bakiye
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle className="font-[Poppins]">Bakiye Islemleri - {u.name}</DialogTitle></DialogHeader>
                          <div className="space-y-4 pt-2">
                            <p className="text-sm text-slate-500">Mevcut Bakiye: <span className="font-bold text-slate-900">{(u.balance || 0).toLocaleString('tr-TR')} TL</span></p>
                            <div className="flex gap-2">
                              <Button variant={balanceType === 'add' ? 'default' : 'outline'} size="sm" onClick={() => setBalanceType('add')} className={balanceType === 'add' ? 'bg-emerald-500' : ''} data-testid="balance-add-btn">
                                <Plus className="w-4 h-4 mr-1" /> Ekle
                              </Button>
                              <Button variant={balanceType === 'subtract' ? 'default' : 'outline'} size="sm" onClick={() => setBalanceType('subtract')} className={balanceType === 'subtract' ? 'bg-red-500' : ''} data-testid="balance-subtract-btn">
                                <Minus className="w-4 h-4 mr-1" /> Cikar
                              </Button>
                            </div>
                            <Input type="number" placeholder="Tutar (TL)" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} data-testid="balance-amount-input" />
                            <Button className="w-full bg-[#0F3935] text-white" onClick={handleBalance} disabled={loading} data-testid="balance-submit-btn">
                              {loading ? 'Islem yapiliyor...' : 'Onayla'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AdminLayout>
  );
}
