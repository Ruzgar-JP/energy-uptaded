import { Link } from 'react-router-dom';
import { Sun, Wind, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden" data-testid="footer">
      {/* Background image + gradient */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1545209575-704d1434f9cd?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1600"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A2724]/95 via-[#0A2724]/90 to-[#0A2724]/98" />
      </div>

      <div className="relative z-10">
        {/* Bouncing icons decorations */}
        <div className="absolute top-8 right-8 md:right-16 opacity-30 hidden md:block">
          <div className="animate-bounce" style={{ animationDuration: '3s' }}>
            <Sun className="w-8 h-8 text-amber-400" />
          </div>
        </div>
        <div className="absolute top-20 right-32 opacity-20 hidden md:block">
          <div className="animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
            <Wind className="w-6 h-6 text-sky-400" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-8">
          {/* Top section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center gap-2.5 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <Sun className="w-5 h-5 text-white" />
                </div>
                <span className="font-[Poppins] font-bold text-xl text-white tracking-tight">Alarko Enerji</span>
              </Link>
              <p className="text-sm text-slate-300/80 leading-relaxed mb-6">
                RES ve GES projelerine profesyonel yatirim yapmanin en guvenilir adresi. Min. 25.000 TL ile yenilenebilir enerjiye yatirim yapin.
              </p>
              <div className="flex gap-3">
                {[
                  { name: 'LinkedIn', letter: 'in' },
                  { name: 'Twitter', letter: 'X' },
                  { name: 'Instagram', letter: 'ig' },
                ].map(s => (
                  <a key={s.name} href="#" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-emerald-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 border border-white/5">
                    <span className="text-xs font-semibold text-slate-300">{s.letter}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Kurumsal */}
            <div>
              <h4 className="font-[Poppins] font-semibold mb-5 text-emerald-400 text-sm uppercase tracking-wider">Kurumsal</h4>
              <ul className="space-y-3">
                {['Hakkimizda', 'Ekibimiz', 'Kariyer', 'Basinda Biz'].map(item => (
                  <li key={item}><a href="#" className="text-sm text-slate-300/70 hover:text-white transition-colors duration-200">{item}</a></li>
                ))}
              </ul>
            </div>

            {/* Yatirim */}
            <div>
              <h4 className="font-[Poppins] font-semibold mb-5 text-emerald-400 text-sm uppercase tracking-wider">Yatirim</h4>
              <ul className="space-y-3">
                {[
                  { l: 'Projeler', h: '/projects' },
                  { l: 'Nasil Calisir', h: '/#steps' },
                  { l: 'Getiri Hesaplama', h: '/#calculator' },
                  { l: 'Risk Bilgilendirme', h: '#' },
                ].map(item => (
                  <li key={item.l}><Link to={item.h} className="text-sm text-slate-300/70 hover:text-white transition-colors duration-200">{item.l}</Link></li>
                ))}
              </ul>
            </div>

            {/* Iletisim */}
            <div>
              <h4 className="font-[Poppins] font-semibold mb-5 text-emerald-400 text-sm uppercase tracking-wider">Iletisim</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-300/80">+90 212 000 00 00</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-300/80">info@alarkoenerji.com</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-300/80">Levent, Istanbul, Turkiye</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-400/60">&copy; 2024 Alarko Enerji. Tum haklari saklidir.</p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {['Gizlilik Politikasi', 'Kullanim Sartlari', 'KVKK'].map(item => (
                <a key={item} href="#" className="text-xs text-slate-400/60 hover:text-white transition-colors duration-200">{item}</a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
