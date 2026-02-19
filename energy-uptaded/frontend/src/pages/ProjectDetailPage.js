import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sun, Wind, MapPin, Users, TrendingUp, Zap, ArrowLeft, Wallet, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user, token, API, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shares, setShares] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [investing, setInvesting] = useState(false);
  const [usdRate, setUsdRate] = useState(38);

  useEffect(() => {
    axios.get(`${API}/projects/${id}`).then(r => setProject(r.data)).catch(() => toast.error('Proje bulunamadi')).finally(() => setLoading(false));
    axios.get(`${API}/usd-rate`).then(r => setUsdRate(r.data.rate)).catch(() => {});
  }, [id]);

  const SHARE_PRICE = 25000;
  const investAmount = shares * SHARE_PRICE;
  const rate = shares >= 10 ? 8 : 7;
  const isUsdBased = shares >= 5;
  const monthlyReturn = investAmount * rate / 100;

  const handleInvest = async () => {
    if (!user) { navigate('/login'); return; }
    setInvesting(true);
    try {
      await axios.post(`${API}/portfolio/invest`, { project_id: id, amount: investAmount }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Yatirim basarili!');
      setDialogOpen(false);
      refreshUser();
      const r = await axios.get(`${API}/projects/${id}`);
      setProject(r.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Yatirim basarisiz');
    } finally {
      setInvesting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!project) return <div className="min-h-screen flex items-center justify-center text-slate-500">Proje bulunamadi</div>;

  const progress = Math.round((project.funded_amount / project.total_target) * 100);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="project-detail-page">
      <Navbar />
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img src={project.image_url} alt={project.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 md:px-8">
          <Link to="/projects" className="inline-flex items-center gap-1 text-white/60 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Projelere Don
          </Link>
          <Badge className={`${project.type === 'GES' ? 'bg-amber-500' : 'bg-sky-500'} text-white border-0 mb-2`}>
            {project.type === 'GES' ? <Sun className="w-3 h-3 mr-1" /> : <Wind className="w-3 h-3 mr-1" />} {project.type}
          </Badge>
          <h1 className="text-2xl md:text-4xl font-bold text-white font-[Poppins]">{project.name}</h1>
          <div className="flex items-center gap-1 text-white/70 text-sm mt-1"><MapPin className="w-4 h-4" /> {project.location}</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-xl font-bold text-slate-900 font-[Poppins] mb-4">Proje Hakkinda</h2>
                <p className="text-slate-600 leading-relaxed mb-6">{project.description}</p>
                {project.details && <p className="text-slate-500 leading-relaxed">{project.details}</p>}
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Zap, label: 'Kapasite', value: project.capacity },
                { icon: TrendingUp, label: 'Aylik Getiri', value: `%${project.return_rate}` },
                { icon: Users, label: 'Yatirimci', value: project.investors_count },
                { icon: Wallet, label: 'Hedef', value: `${(project.total_target / 1000000).toFixed(1)}M TL` },
              ].map((s, i) => (
                <Card key={i} className="border-0 shadow-sm rounded-xl">
                  <CardContent className="p-4 text-center">
                    <s.icon className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">{s.label}</p>
                    <p className="font-bold text-slate-900 font-[Poppins]">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <Card className="border-0 shadow-sm rounded-2xl sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-bold text-slate-900 font-[Poppins] mb-4">Yatirim Yap</h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-slate-500 mb-1"><span>Fonlama Durumu</span><span>{progress}%</span></div>
                  <Progress value={progress} className="h-3" />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{(project.funded_amount / 1000000).toFixed(1)}M TL</span>
                    <span>{(project.total_target / 1000000).toFixed(1)}M TL</span>
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-emerald-700">Aylik Getiri Orani</p>
                  <p className="text-3xl font-bold text-emerald-700 font-[Poppins]">%{project.return_rate}</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12" data-testid="invest-project-btn">Yatirim Yap</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle className="font-[Poppins]">Yatirim Yap - {project.name}</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      {user && <p className="text-sm text-slate-500">Mevcut Bakiye: <span className="font-semibold text-slate-900">{(user.balance || 0).toLocaleString('tr-TR')} TL</span></p>}
                      <div>
                        <label className="text-sm font-medium text-slate-700">Hisse Adedi</label>
                        <div className="flex items-center gap-3 mt-1">
                          <Button size="sm" variant="outline" onClick={() => setShares(Math.max(1, shares - 1))} data-testid="shares-minus">-</Button>
                          <span className="text-2xl font-bold text-[#0F3935] font-[Poppins] w-12 text-center">{shares}</span>
                          <Button size="sm" variant="outline" onClick={() => setShares(shares + 1)} data-testid="shares-plus">+</Button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">1 Hisse = 25.000 TL</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">Toplam Tutar</span><span className="font-semibold">{investAmount.toLocaleString('tr-TR')} TL</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Getiri Orani</span><span className="font-semibold text-emerald-600">%{rate}/ay</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Tahmini Aylik Getiri</span><span className="font-semibold text-emerald-600">{monthlyReturn.toLocaleString('tr-TR')} TL</span></div>
                        {isUsdBased && (
                          <div className="flex justify-between items-center pt-1 border-t">
                            <span className="text-sky-600 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Dolar Bazli</span>
                            <span className="font-semibold text-sky-600">${(investAmount / usdRate).toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
                          </div>
                        )}
                      </div>
                      <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleInvest} disabled={investing} data-testid="confirm-invest-btn">
                        {investing ? 'Islem yapiliyor...' : `${shares} Hisse Satin Al`}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
