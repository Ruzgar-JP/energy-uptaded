import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Sun, Wind, TrendingUp, ShieldCheck, Users, Wallet, ArrowRight, Star, MapPin, Zap, BarChart3, Eye, CheckCircle2, FileText, UserPlus, Calculator, Clock, Award, Target, Leaf, Globe, Building2, DollarSign } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LandingPage() {
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [calcShares, setCalcShares] = useState([4]);
  const [usdRate, setUsdRate] = useState(38);
  const [videoIndex, setVideoIndex] = useState(0);

useEffect(() => {
  axios.get(`${API}/projects`)
    .then(r => {
      console.log("PROJECT RESPONSE:", r.data);
      setProjects(r.data.projects || r.data);
    })
    .catch(() => {});

  axios.get(`${API}/usd-rate`)
    .then(r => setUsdRate(r.data.rate))
    .catch(() => {});
}, []);

  // Auto-rotate videos every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => setVideoIndex(prev => (prev + 1) % 4), 8000);
    return () => clearInterval(timer);
  }, []);

  const filtered = activeTab === 'all' ? projects : projects.filter(p => p.type === activeTab.toUpperCase());

  const SHARE_PRICE = 25000;
  const calcAmount = calcShares[0] * SHARE_PRICE;
  const calcRate = calcShares[0] >= 10 ? 8 : 7;
  const isUsdBased = calcShares[0] >= 5;
  const monthlyReturn = calcAmount * calcRate / 100;
  const yearlyReturn = monthlyReturn * 12;
  const usdEquivalent = isUsdBased ? calcAmount / usdRate : null;

  return (
    <div className="min-h-screen" data-testid="landing-page">
      <Navbar transparent />

      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center bg-[#0A2220] overflow-hidden" data-testid="hero-section">
        {/* Video Background Carousel */}
        <div className="absolute inset-0">
          {[
            '/videos/video1.mp4',
            '/videos/video2.mp4',
            '/videos/video3.mp4',
            '/videos/video4.mp4',
          ].map((src, i) => (
            <video
              key={i}
              src={src}
              autoPlay muted loop playsInline
              preload="auto"
              poster="https://images.unsplash.com/photo-1545209575-704d1434f9cd?w=1600&q=80"
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out"
              style={{ opacity: videoIndex === i ? 1 : 0 }}
            />
          ))}
          {/* Gradient overlay - subtle to show video clearly */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A2220]/80 via-[#0A2220]/45 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A2220]/50 via-transparent to-[#0A2220]/20" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-32 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 mb-6 px-4 py-1.5 text-sm backdrop-blur-sm">Yenilenebilir Enerji Yatirim Platformu</Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-6 animate-fade-in-up font-[Poppins] drop-shadow-lg">
                Gelecege Guc Veren <span className="text-emerald-400">Yatirimlar</span>
              </h1>
              <p className="text-lg md:text-xl text-emerald-100/90 mb-3 font-semibold drop-shadow-md">RES & GES Projelerinde Aylik %8'e Varan Getiri</p>
              <p className="text-base md:text-lg text-slate-200/70 mb-8 leading-relaxed max-w-lg drop-shadow-sm">
                Turkiye'nin oncu yenilenebilir enerji projelerine yatirim yapin. Profesyonel yatirim danismanligi ve seffaf portfolyo yonetimiyle geleceginizi guvence altina alin.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link to="/register">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 h-13 text-base rounded-xl shadow-lg shadow-emerald-500/25" data-testid="hero-cta-register">
                    Yatirima Basla <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/projects">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/15 px-8 h-13 text-base rounded-xl backdrop-blur-sm" data-testid="hero-cta-projects">
                    <Eye className="w-5 h-5 mr-2" /> Projeleri Incele
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 text-sm text-emerald-200/60">
                <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> SPK Lisansli</span>
                <span className="flex items-center gap-1"><Award className="w-4 h-4" /> YEKDEM Garantili</span>
                <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> Uluslararasi Standart</span>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Wallet, value: '₺2.8B+', label: 'Toplam Yatirim Hacmi', color: 'from-emerald-500/20 to-teal-500/20' },
                  { icon: Zap, value: '47+', label: 'Aktif Enerji Projesi', color: 'from-sky-500/20 to-blue-500/20' },
                  { icon: Users, value: '1,200+', label: 'Kurumsal Yatirimci', color: 'from-violet-500/20 to-purple-500/20' },
                  { icon: TrendingUp, value: '%8', label: 'Maks. Aylik Getiri', color: 'from-amber-500/20 to-orange-500/20' },
                ].map((stat, i) => (
                  <div key={i} className={`bg-gradient-to-br ${stat.color} backdrop-blur-md rounded-2xl p-6 border border-white/15 animate-fade-in-up stagger-${i + 1}`}>
                    <stat.icon className="w-6 h-6 text-emerald-400 mb-3" />
                    <div className="text-3xl font-bold text-white font-[Poppins]">{stat.value}</div>
                    <div className="text-xs text-slate-300 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Video indicator dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {[0, 1, 2, 3].map(i => (
            <button key={i} onClick={() => setVideoIndex(i)} className={`w-2 h-2 rounded-full transition-all duration-300 ${videoIndex === i ? 'bg-emerald-400 w-6' : 'bg-white/30 hover:bg-white/50'}`} data-testid={`video-dot-${i}`} />
          ))}
        </div>
      </section>

      {/* Partners / Trust Bar */}
      <section className="py-8 bg-white border-b" data-testid="trust-bar">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-wrap items-center justify-center gap-8 md:gap-16 text-slate-400 text-sm">
          {['SPK Onayli Platform', 'YEKDEM Garantili Projeler', '₺500M+ Odenen Getiri', 'ISO 27001 Sertifikali', 'Yatirimci Koruma Fonu'].map((t, i) => (
            <span key={i} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" />{t}</span>
          ))}
        </div>
      </section>

      {/* How It Works - Expanded */}
      <section className="py-20 md:py-28 bg-white" data-testid="steps-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 mb-4">NASIL CALISIR</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-[Poppins]">4 Adimda Yatirima Baslayin</h2>
            <p className="text-base md:text-lg text-slate-500 mt-3 max-w-2xl mx-auto">Basit ve seffaf surecimiz ile dusuk riskle yuksek getirili yenilenebilir enerji yatirimlarinda ortak olun.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: UserPlus, title: 'Kayit & Profil Olusturun', desc: 'Hizli kayit islemiyle yatirim hesabinizi olusturun. E-posta veya Google hesabinizla aninda kayit olabilirsiniz. Ardindan kimlik dogrulamanizi tamamlayarak yatirima hazir hale gelin.', time: '2 dakika' },
              { icon: Eye, title: 'Projeleri Inceleyin', desc: 'GES ve RES projelerinin detaylarini, getiri oranlarini, konum bilgilerini ve risk analizlerini detayli sekilde inceleyin. Her projenin fonlanma durumunu ve yatirimci sayisini takip edin.', time: '5 dakika' },
              { icon: Wallet, title: 'Yatirim Portfolyonuzu Kurun', desc: 'Banka hesabinizdan havale/EFT ile bakiye yukleyin. Size uygun yatirim planini secin: 25.000 TL ile baslayin, hisse adetinizi artirdikca getiri oraniniz da artsin.', time: '10 dakika' },
              { icon: TrendingUp, title: 'Getiri Kazanin', desc: 'Aylik duzenli getiri kazanin ve yatirimlarinizi gercek zamanli takip edin. Getirilerinizi yeniden yatirima donusturerek bilesik getiri avantajindan yararlanin.', time: 'Her ay' },
            ].map((step, i) => (
              <Card key={i} className="relative border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-slate-50 rounded-2xl group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                <CardContent className="p-6 md:p-8">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    <step.icon className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="absolute top-5 right-5 text-5xl font-bold text-slate-200/40 font-[Poppins]">0{i + 1}</div>
                  <h3 className="font-semibold text-slate-900 mb-3 font-[Poppins] text-lg">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">{step.desc}</p>
                  <div className="flex items-center gap-1 text-xs text-emerald-600"><Clock className="w-3 h-3" /> {step.time}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="py-20 md:py-28 bg-slate-50" data-testid="projects-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 mb-4">AKTIF PROJELER</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-[Poppins]">Aktif Enerji Projeleri</h2>
            <p className="text-base md:text-lg text-slate-500 mt-3">Turkiye genelinde yatirima acik yenilenebilir enerji projelerini kesfet.</p>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="bg-white border mx-auto w-fit">
              <TabsTrigger value="all" data-testid="tab-all">Tumu</TabsTrigger>
              <TabsTrigger value="ges" data-testid="tab-ges"><Sun className="w-4 h-4 mr-1" /> GES</TabsTrigger>
              <TabsTrigger value="res" data-testid="tab-res"><Wind className="w-4 h-4 mr-1" /> RES</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="grid md:grid-cols-2 gap-6">
            {filtered.map(p => {
              const progress = Math.round((p.funded_amount / p.total_target) * 100);
              return (
                <Card key={p.project_id} className="overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl group" data-testid={`project-card-${p.project_id}`}>
                  <div className="relative h-52 overflow-hidden">
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <Badge className={`absolute top-3 right-3 ${p.type === 'GES' ? 'bg-amber-500' : 'bg-sky-500'} text-white border-0`}>
                      {p.type === 'GES' ? <Sun className="w-3 h-3 mr-1" /> : <Wind className="w-3 h-3 mr-1" />} {p.type}
                    </Badge>
                    <div className="absolute bottom-3 left-4 text-white">
                      <h3 className="font-bold text-lg font-[Poppins]">{p.name}</h3>
                      <div className="flex items-center gap-1 text-xs opacity-80"><MapPin className="w-3 h-3" /> {p.location}</div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">{p.description}</p>
                    <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                      <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-400">Kapasite</div><div className="font-semibold text-sm mt-0.5">{p.capacity}</div></div>
                      <div className="bg-emerald-50 rounded-xl p-3"><div className="text-xs text-emerald-600">Getiri</div><div className="font-bold text-sm text-emerald-700 mt-0.5">%{p.return_rate}</div></div>
                      <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-400">Yatirimci</div><div className="font-semibold text-sm mt-0.5">{p.investors_count}</div></div>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-slate-500 mb-1.5"><span>{(p.funded_amount / 1000000).toFixed(1)}M ₺</span><span className="font-semibold">{progress}%</span></div>
                      <Progress value={progress} className="h-2.5" />
                    </div>
                    <Link to={`/projects/${p.project_id}`}>
                      <Button className="w-full bg-[#0F3935] hover:bg-[#0F3935]/90 text-white rounded-xl h-11" data-testid={`project-detail-btn-${p.project_id}`}>
                        Detayli Incele <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="text-center mt-10">
            <Link to="/projects"><Button variant="outline" size="lg" className="rounded-xl" data-testid="view-all-projects">Tum Projeleri Gor <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
          </div>
        </div>
      </section>

      {/* Return Calculator */}
      <section id="calculator" className="py-20 md:py-28 bg-white" data-testid="calculator-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 mb-4">GETiRi HESAPLAMA</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-[Poppins] mb-4">Yatiriminizin Getirisini Hesaplayin</h2>
              <p className="text-base md:text-lg text-slate-500 mb-8 leading-relaxed">Hisse adetinize gore aylik ve yillik getiri oranlarinizi gorun. 5 ve uzeri hisselerde dolar kuru avantaji!</p>
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-2xl p-6 border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700">Hisse Adedi</span>
                    <span className="text-2xl font-bold text-[#0F3935] font-[Poppins]">{calcShares[0]} Hisse</span>
                  </div>
                  <div className="text-right text-sm text-slate-500 mb-4">= {calcAmount.toLocaleString('tr-TR')} TL</div>
                  <Slider value={calcShares} onValueChange={setCalcShares} min={1} max={20} step={1} className="mb-4" data-testid="calc-slider" />
                  <div className="flex justify-between text-xs text-slate-400"><span>1 Hisse</span><span>20 Hisse</span></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Getiri Orani', value: `%${calcRate}`, sub: 'aylik' },
                    { label: 'Aylik Getiri', value: `${monthlyReturn.toLocaleString('tr-TR')} TL`, sub: 'her ay' },
                    { label: 'Yillik Getiri', value: `${yearlyReturn.toLocaleString('tr-TR')} TL`, sub: '12 ay' },
                    { label: 'Dolar Bazli', value: isUsdBased ? 'Evet' : 'Hayir', sub: isUsdBased ? `$${usdEquivalent?.toLocaleString('en-US', {maximumFractionDigits: 0})}` : 'TL bazli' },
                  ].map((item, i) => (
                    <div key={i} className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                      <p className="text-xs text-emerald-600 mb-1">{item.label}</p>
                      <p className="text-lg font-bold text-emerald-700 font-[Poppins]">{item.value}</p>
                      <p className="text-[10px] text-emerald-500 mt-0.5">{item.sub}</p>
                    </div>
                  ))}
                </div>
                {isUsdBased && (
                  <div className="bg-sky-50 rounded-xl p-4 border border-sky-100 flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-sky-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-sky-800">Dolar Kuru Avantaji</p>
                      <p className="text-xs text-sky-600 mt-1">Yatiriminiz dolar kuru uzerinden hesaplanir. Guncel kur: 1$ = {usdRate.toLocaleString('tr-TR', {minimumFractionDigits: 2})} TL</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 font-[Poppins] mb-6">Kademeli Getiri Sistemi</h3>
              {[
                { shares: '1 - 4 Hisse', amount: '25.000 - 100.000', rate: '%7', color: 'border-l-emerald-400 bg-emerald-50/50', desc: 'Baslangic seviyesi yatirimcilar icin ideal. TL bazli aylik %7 getiri orani.', usd: false },
                { shares: '5 - 9 Hisse', amount: '125.000 - 225.000', rate: '%7 + $', color: 'border-l-sky-500 bg-sky-50/50', desc: 'Dolar kuru avantaji ile aylik %7 getiri. Yatiriminiz USD bazinda korunur.', usd: true },
                { shares: '10+ Hisse', amount: '250.000+', rate: '%8 + $', color: 'border-l-violet-500 bg-violet-50/50', desc: 'En yuksek getiri orani + dolar kuru avantaji. VIP danismanlik dahil.', usd: true },
              ].map((tier, i) => (
                <Card key={i} className={`border-0 shadow-sm rounded-xl border-l-4 ${tier.color}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-semibold text-slate-800">{tier.shares}</span>
                        <span className="text-xs text-slate-400 ml-2">({tier.amount} TL)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xl font-bold text-[#0F3935] font-[Poppins]">{tier.rate}</span>
                        {tier.usd && <DollarSign className="w-4 h-4 text-sky-500" />}
                      </div>
                    </div>
                    <p className="text-sm text-slate-500">{tier.desc}</p>
                  </CardContent>
                </Card>
              ))}
              <div className="bg-slate-50 rounded-xl p-4 text-center border">
                <p className="text-xs text-slate-500">1 Hisse = <span className="font-bold text-slate-900">25.000 TL</span></p>
                <p className="text-xs text-slate-400 mt-1">Guncel USD/TRY: {usdRate.toLocaleString('tr-TR', {minimumFractionDigits: 2})} TL</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Plans */}
      <section id="plans" className="py-20 md:py-28 bg-slate-50" data-testid="plans-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 mb-4">YATIRIM PLANLARI</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-[Poppins]">Size Uygun Plani Secin</h2>
            <p className="text-base md:text-lg text-slate-500 mt-3">Her biri yatirimci profiline uygun cesitlendirilmis yatirim planlariyla getiri elde edin.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { name: 'Preminium ', rate: '7', min: '25.000 TL (1 Hisse)', shares: '1-4 Hisse', features: ['Temel proje erisimi', 'Aylik getiri raporu', 'E-posta destegi', 'Portfolyo takip paneli', 'Yatirim bildirimleri'], popular: false, icon: Target, usdTag: '' },
              { name: 'Platin', rate: '7', min: '125.000 TL (5 Hisse)', shares: '5-9 Hisse', features: ['Tum projelere erisim', 'Haftalik detayli rapor', 'Oncelikli destek hatti', 'Dolar kuru avantaji', 'Ozel yatirim danismani', 'Portfolyo cesitlendirme onerileri'], popular: true, icon: Award, usdTag: '+ Dolar Kuru' },
              { name: 'Kurumsal', rate: '8', min: '250.000 TL (10 Hisse)', shares: '10+ Hisse', features: ['Premium proje erisimi', 'Gunluk performans raporu', '7/24 VIP destek', 'Dolar kuru avantaji', 'Ozel portfolyo yonetimi', 'Vergi danismanligi', 'Yatirim komitesi uyeligi'], popular: false, icon: Building2, usdTag: '+ Dolar Kuru' },
            ].map((plan, i) => (
              <Card key={i} className={`relative rounded-2xl transition-all duration-300 hover:shadow-xl ${plan.popular ? 'border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 scale-[1.03]' : 'border shadow-sm hover:shadow-md'}`}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge className="bg-emerald-500 text-white border-0 px-4 py-1">En Popular</Badge></div>}
                <CardContent className="p-7 md:p-9">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.popular ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <plan.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-xl font-[Poppins] text-slate-900">{plan.name}</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-2">Aylik getiri orani</p>
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-[#0F3935] font-[Poppins]">%{plan.rate}</span>
                    {plan.usdTag && <span className="text-sm font-medium text-sky-600">{plan.usdTag}</span>}
                  </div>
                  <p className="text-sm text-slate-500 mb-1">{plan.shares}</p>
                  <p className="text-sm text-slate-500 mb-6">Min. yatirim: <span className="font-bold text-slate-800">{plan.min}</span></p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register">
                    <Button className={`w-full h-12 rounded-xl text-base ${plan.popular ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-[#0F3935] hover:bg-[#0F3935]/90 text-white'}`}
                      data-testid={`plan-btn-${plan.name.toLowerCase()}`}>
                      Yatirima Basla <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 md:py-28 bg-white" data-testid="benefits-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 mb-4">NEDEN BIZ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-[Poppins]">Alarko Enerji Avantajlari</h2>
            <p className="text-base md:text-lg text-slate-500 mt-3">Yenilenebilir enerji yatirimlarinizda neden bizi tercih etmelisiniz?</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: 'Garantili Getiri', desc: 'Aylik %8\'e varan garantili getiri oranlari ile yatiriminizi guvence altina alin. YEKDEM devlet garantisi altinda projeler.' },
              { icon: Eye, title: 'Seffaf Yonetim', desc: 'Tum yatirim sureclerinizi gercek zamanli takip edin. Detayli raporlama, analiz ve portfolyo performans grafikleri.' },
              { icon: BarChart3, title: 'Cesitlendirilmis Portfolyo', desc: 'RES ve GES projelerinden olusan cesitlendirilmis portfolyo ile riskinizi minimize edin.' },
              { icon: Users, title: 'Uzman Kadro', desc: 'Alaninda 10+ yillik deneyime sahip enerji muhendisleri ve yatirim danismanlari ile profesyonel rehberlik.' },
              { icon: FileText, title: 'Devlet Tesvikleri', desc: 'YEKDEM garantisi ve devlet tesviklerinden faydalanan projelerle guvenceli ve duzenli getiri elde edin.' },
              { icon: Leaf, title: 'Surdurulebilir Gelecek', desc: 'Yatiriminizla hem kazanc elde edin hem de surdurulebilir bir gelecek ve temiz enerji uretimine katki saglayin.' },
            ].map((b, i) => (
              <Card key={i} className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl bg-slate-50 group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                <CardContent className="p-7">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5 group-hover:bg-emerald-500 transition-all duration-300">
                    <b.icon className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-3 font-[Poppins] text-lg">{b.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers / Stats */}
      <section className="py-16 bg-[#0F3935]" data-testid="numbers-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '₺2.8 Milyar', label: 'Toplam Yatirim Hacmi' },
              { value: '15.000+', label: 'Aktif Yatirimci' },
              { value: '₺500M+', label: 'Odenen Toplam Getiri' },
              { value: '350 MW', label: 'Toplam Kurulu Guc' },
            ].map((s, i) => (
              <div key={i} className="py-4">
                <div className="text-3xl md:text-4xl font-bold text-white font-[Poppins] mb-2">{s.value}</div>
                <div className="text-sm text-emerald-300/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 bg-slate-50" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 mb-4">REFERANSLAR</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-[Poppins]">Yatirimcilarimiz Ne Diyor?</h2>
            <p className="text-base md:text-lg text-slate-500 mt-3">Binlerce memnun yatirimcimizin deneyimlerinden bazilari.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Ahmet Yilmaz', role: 'Kurumsal Yatirimci', text: 'Alarko Enerji ile 2 yildir yatirim yapiyorum. Aylik getiriler duzenli ve seffaf bir sekilde hesabima yatiriliyor. Portfolyo yonetim paneli harika, tum yatirimlarimi anlik takip edebiliyorum.', stars: 5, investment: '500.000 TL' },
              { name: 'Elif Demir', role: 'Profesyonel Yatirimci', text: 'Yenilenebilir enerji sektorune giris icin mukemmel bir platform. Uzman kadro ve detayli raporlama ile kendimi guvende hissediyorum. Musteri hizmetleri de son derece ilgili.', stars: 5, investment: '200.000 TL' },
              { name: 'Mehmet Kaya', role: 'Bireysel Yatirimci', text: 'Baslangic plani ile 25.000 TL yatirarak basladim, simdi profesyonel plana gectim. Getiri oranlari soz verilenden bile yuksek. Hem kazaniyorum hem de temiz enerjiye katki sagliyorum.', stars: 5, investment: '125.000 TL' },
            ].map((t, i) => (
              <Card key={i} className="border-0 shadow-sm hover:shadow-lg rounded-2xl transition-all duration-300 bg-white">
                <CardContent className="p-7">
                  <div className="flex gap-1 mb-4">{Array(t.stars).fill(0).map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}</div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">"{t.text}"</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{t.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-900">{t.name}</div>
                        <div className="text-xs text-slate-500">{t.role}</div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">{t.investment}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28 bg-white" data-testid="faq-section">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 mb-4">SSS</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-[Poppins]">Sikca Sorulan Sorular</h2>
            <p className="text-base md:text-lg text-slate-500 mt-3">Yatirim sureciniz hakkinda merak ettiginiz her sey.</p>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {[
              { q: 'Minimum yatirim tutari nedir?', a: 'Minimum yatirim tutari 25.000 TL (1 hisse) olarak belirlenmistir. Her hisse 25.000 TL degerindedir ve katlari seklinde yatirim yapabilirsiniz.' },
              { q: 'Getiri oranlari nasil belirleniyor?', a: '1-4 hisse icin aylik %7, 5-9 hisse icin aylik %7 + dolar kuru avantaji, 10 ve uzeri hisse icin aylik %8 + dolar kuru avantaji uygulanir.' },
              { q: 'Dolar kuru avantaji ne anlama gelir?', a: '5 ve uzeri hisse alimlarinda yatiriminiz dolar kuru uzerinden hesaplanir. Dolar yukseldikce TL bazinda getiriniz de artar, boylece yatiriminiz kur riskine karsi korunmus olur.' },
              { q: 'Yatirimlarimi geri cekebilir miyim?', a: 'Evet, yatirimlarinizi istediginiz zaman satabilir ve bakiyenizi cekim talebinde bulunabilirsiniz. Cekim talepleri admin onayi sonrasi bakiyenizden dusulur ve 1-3 is gunu icerisinde hesabiniza aktarilir.' },
              { q: 'Kimlik dogrulamasi zorunlu mu?', a: 'Evet, SPK duzenlemeleri geregi kimlik dogrulamasi zorunludur. Kimlik belgenizi yukledikten sonra en gec 24 saat icerisinde onay verilmektedir.' },
              { q: 'Para nasil yatirilir?', a: 'Havale veya EFT yontemiyle para yatirabilirsiniz. "Para Yatir" bolumunden banka secimi yaparak IBAN bilgilerini goruntuleyebilirsiniz. Yatirma talebiniz admin onayi sonrasi bakiyenize eklenir.' },
              { q: 'Hangi tur projeler goruntuleyebilirim?', a: 'Platformumuzda Gunes Enerjisi Santralleri (GES) ve Ruzgar Enerjisi Santralleri (RES) projelerini inceleyebilirsiniz. Her projenin detayli bilgileri, konum, kapasite ve fonlanma durumu goruntulenir.' },
              { q: 'Yatirimlarim guvende mi?', a: 'Tum projelerimiz YEKDEM devlet garantisi altindadir. Ayrica SPK denetiminde faaliyet gosteriyor, ISO 27001 bilgi guvenligi sertifikasina sahibiz ve yatirimci koruma fonu kapsamindayiz.' },
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="bg-slate-50 rounded-xl border px-6" data-testid={`faq-item-${i}`}>
                <AccordionTrigger className="text-left font-medium text-slate-900 hover:no-underline py-5">{item.q}</AccordionTrigger>
                <AccordionContent className="text-slate-500 text-sm leading-relaxed pb-5">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-[#0F3935] relative overflow-hidden" data-testid="cta-section">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white font-[Poppins] mb-4">Yatirima Baslamaya Hazir Misiniz?</h2>
          <p className="text-emerald-100/60 mb-8 text-lg">Uzman danismanlarimiz sizinle iletisime gecerek en uygun yatirim planini belirlesin.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 h-13 rounded-xl text-base" data-testid="cta-register-btn">
                Hemen Basvurun <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-8 text-sm text-emerald-200/40">
            <span>Ucretsiz kayit</span>
            <span>Hizli onay sureci</span>
            <span>7/24 destek</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
