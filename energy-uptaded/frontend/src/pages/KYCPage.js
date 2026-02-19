import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Upload, CheckCircle2, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function KYCPage() {
  const { user, token, API, refreshUser } = useAuth();
  const [kycData, setKycData] = useState(null);
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API}/kyc/status`, { headers }).then(r => setKycData(r.data)).catch(() => {});
  }, []);

  const handleUpload = async () => {
    if (!frontFile || !backFile) { toast.error('Lutfen kimlik on ve arka yuzunu yukleyin'); return; }
    const formData = new FormData();
    formData.append('front', frontFile);
    formData.append('back', backFile);
    setLoading(true);
    try {
      await axios.post(`${API}/kyc/upload`, formData, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
      toast.success('Kimlik belgeleri yuklendi. Admin incelemesi bekleniyor.');
      refreshUser();
      const r = await axios.get(`${API}/kyc/status`, { headers });
      setKycData(r.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Yukleme basarisiz');
    } finally {
      setLoading(false);
    }
  };

  const statusMap = {
    approved: { icon: CheckCircle2, text: 'Onaylandi', color: 'text-emerald-600 bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700' },
    submitted: { icon: Clock, text: 'Inceleniyor', color: 'text-amber-600 bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
    rejected: { icon: XCircle, text: 'Reddedildi', color: 'text-red-600 bg-red-50', badge: 'bg-red-100 text-red-700' },
    pending: { icon: Shield, text: 'Belge Bekleniyor', color: 'text-slate-600 bg-slate-50', badge: 'bg-slate-100 text-slate-700' },
  };
  const status = statusMap[kycData?.kyc_status || user?.kyc_status || 'pending'];

  return (
    <div className="min-h-screen bg-slate-50" data-testid="kyc-page">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 md:px-8 pt-24 pb-12">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Panele Don
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-[Sora] mb-2">Kimlik Dogrulama</h1>
        <p className="text-slate-500 mb-8">Yatirim yapabilmek icin kimlik belgenizi dogrulayin.</p>

        <Card className="border-0 shadow-sm rounded-2xl mb-6">
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${status.color}`}>
              <status.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Dogrulama Durumu</p>
              <Badge className={status.badge}>{status.text}</Badge>
            </div>
          </CardContent>
        </Card>

        {(kycData?.kyc_status === 'pending' || kycData?.kyc_status === 'rejected' || !kycData?.kyc_status || user?.kyc_status === 'pending' || user?.kyc_status === 'rejected') && (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-900 font-[Sora] mb-4">Kimlik Belgesi Yukle</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-2">Kimlik On Yuzu</label>
                  <div className="relative">
                    <input type="file" accept="image/*" onChange={e => setFrontFile(e.target.files[0])} className="w-full h-24 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer opacity-0 absolute inset-0 z-10" data-testid="kyc-front-upload" />
                    <div className="w-full h-24 border-2 border-dashed rounded-xl flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors">
                      {frontFile ? (
                        <span className="text-sm text-emerald-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {frontFile.name}</span>
                      ) : (
                        <span className="text-sm text-slate-400 flex items-center gap-2"><Upload className="w-4 h-4" /> Dosya secin</span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-2">Kimlik Arka Yuzu</label>
                  <div className="relative">
                    <input type="file" accept="image/*" onChange={e => setBackFile(e.target.files[0])} className="w-full h-24 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer opacity-0 absolute inset-0 z-10" data-testid="kyc-back-upload" />
                    <div className="w-full h-24 border-2 border-dashed rounded-xl flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors">
                      {backFile ? (
                        <span className="text-sm text-emerald-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {backFile.name}</span>
                      ) : (
                        <span className="text-sm text-slate-400 flex items-center gap-2"><Upload className="w-4 h-4" /> Dosya secin</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button className="w-full h-12 bg-[#0F3935] hover:bg-[#0F3935]/90 text-white" onClick={handleUpload} disabled={loading} data-testid="kyc-submit-btn">
                  {loading ? 'Yukleniyor...' : 'Kimlik Belgelerini Gonder'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {kycData?.kyc_document && kycData.kyc_status === 'approved' && (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 font-[Sora] mb-2">Kimliginiz Onaylandi</h3>
              <p className="text-slate-500 text-sm">Artik yatirim yapabilirsiniz. Projeleri inceleyerek baslayin.</p>
              <Link to="/projects"><Button className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white" data-testid="go-invest-btn">Projeleri Incele</Button></Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
