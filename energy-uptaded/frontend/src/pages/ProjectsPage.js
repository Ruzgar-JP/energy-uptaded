import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sun, Wind, MapPin, ArrowRight } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/projects`).then(r => setProjects(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = tab === 'all' ? projects : projects.filter(p => p.type === tab.toUpperCase());

  return (
    <div className="min-h-screen bg-slate-50" data-testid="projects-page">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-[Poppins]">Enerji Projeleri</h1>
          <p className="text-slate-500 mt-2">Turkiye genelinde aktif yenilenebilir enerji projelerini inceleyin ve yatirim yapin.</p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mb-8">
          <TabsList className="bg-white border">
            <TabsTrigger value="all" data-testid="projects-tab-all">Tumu ({projects.length})</TabsTrigger>
            <TabsTrigger value="ges" data-testid="projects-tab-ges"><Sun className="w-4 h-4 mr-1" /> GES</TabsTrigger>
            <TabsTrigger value="res" data-testid="projects-tab-res"><Wind className="w-4 h-4 mr-1" /> RES</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => {
              const progress = Math.round((p.funded_amount / p.total_target) * 100);
              return (
                <Card key={p.project_id} className="overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all rounded-2xl group" data-testid={`project-card-${p.project_id}`}>
                  <div className="relative h-44 overflow-hidden">
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <Badge className={`absolute top-3 right-3 ${p.type === 'GES' ? 'bg-amber-500' : 'bg-sky-500'} text-white border-0`}>
                      {p.type === 'GES' ? <Sun className="w-3 h-3 mr-1" /> : <Wind className="w-3 h-3 mr-1" />} {p.type}
                    </Badge>
                    <div className="absolute bottom-3 left-3 text-white">
                      <h3 className="font-bold font-[Poppins]">{p.name}</h3>
                      <div className="flex items-center gap-1 text-xs opacity-80"><MapPin className="w-3 h-3" /> {p.location}</div>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">{p.description}</p>
                    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                      <div className="bg-slate-50 rounded-lg p-2"><div className="text-xs text-slate-400">Kapasite</div><div className="font-semibold text-sm">{p.capacity}</div></div>
                      <div className="bg-slate-50 rounded-lg p-2"><div className="text-xs text-slate-400">Getiri</div><div className="font-semibold text-sm text-emerald-600">%{p.return_rate}</div></div>
                      <div className="bg-slate-50 rounded-lg p-2"><div className="text-xs text-slate-400">Yatirimci</div><div className="font-semibold text-sm">{p.investors_count}</div></div>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{(p.funded_amount / 1000000).toFixed(1)}M TL</span><span>{progress}%</span></div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <Link to={`/projects/${p.project_id}`}>
                      <Button className="w-full bg-[#0F3935] hover:bg-[#0F3935]/90 text-white" data-testid={`project-btn-${p.project_id}`}>Detay <ArrowRight className="w-4 h-4 ml-2" /></Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
