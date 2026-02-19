# Alarko Enerji - Teknik Dokumantasyon ve Deployment Rehberi

## 1. PROJE YAPISI

```
alarko-enerji/
├── backend/
│   ├── server.py          # Ana backend uygulamasi (FastAPI)
│   ├── requirements.txt   # Python bagimliliklari
│   ├── .env               # Backend ortam degiskenleri
│   └── uploads/           # KYC belge yukleme klasoru
├── frontend/
│   ├── src/
│   │   ├── components/    # UI bilesenleri (Navbar, Footer, AdminLayout, shadcn/ui)
│   │   ├── context/       # AuthContext.js (auth state management)
│   │   ├── pages/         # Tum sayfalar + admin alt sayfalari
│   │   └── App.js         # Ana router
│   ├── public/
│   │   └── videos/        # Hero arkaplan videolari (4 adet mp4)
│   ├── package.json       # Node bagimliliklari
│   └── .env               # Frontend ortam degiskenleri
└── memory/
    └── PRD.md             # Proje gereksinimleri dokumani
```

---

## 2. DATABASE (MongoDB)

### Nasil Calisiyor?
- **MongoDB** NoSQL veritabani kullaniliyor
- Backend `motor` kutuphanesi ile async olarak baglanir
- Baglanti URL'si `.env` dosyasindan alinir: `MONGO_URL`
- Veritabani adi: `DB_NAME` ortam degiskeninden gelir

### Koleksiyonlar (Tablolar):
| Koleksiyon | Aciklama |
|---|---|
| `users` | Kullanici bilgileri, sifre hash, bakiye, KYC durumu |
| `projects` | GES/RES projeleri, fonlanma durumu |
| `portfolios` | Yatirimci portfolyoleri, hisse bilgileri |
| `banks` | Banka IBAN bilgileri |
| `transactions` | Para yatirma/cekme islemleri |
| `kyc_documents` | Kimlik dogrulama belgeleri |
| `notifications` | Bildirimler |

### Seed Data (Baslangic Verileri):
Backend ilk calistirildiginda otomatik olusturulur (`startup_db_client` fonksiyonu):
- 1 Admin kullanici: `admin@alarkoenerji.com` / `admin123`
- 4 Ornek proje (2 GES + 2 RES)
- 4 Banka bilgisi

### Disari Aktarma Icin:
```bash
# MongoDB veritabanini disa aktar
mongodump --uri="mongodb://localhost:27017" --db=test_database --out=./backup

# Geri yukle
mongorestore --uri="mongodb://YENI_MONGO_URL" --db=production_db ./backup/test_database
```

---

## 3. BACKEND (FastAPI)

### Teknolojiler:
| Kutuphane | Versiyon | Amac |
|---|---|---|
| FastAPI | 0.110.1 | Web framework |
| Motor | 3.3.1 | Async MongoDB driver |
| PyJWT | 2.11.0 | JWT token uretimi/dogrulama |
| bcrypt | 4.1.3 | Sifre hashleme |
| requests | 2.32.5 | Canli dolar kuru API cagrisi |
| python-dotenv | 1.2.1 | .env dosyasi okuma |
| uvicorn | 0.25.0 | ASGI server |
| python-multipart | 0.0.22 | Dosya yukleme destegi |

### Ortam Degiskenleri (backend/.env):
```
MONGO_URL=mongodb://localhost:27017    # MongoDB baglanti adresi
DB_NAME=test_database                  # Veritabani adi
CORS_ORIGINS=*                         # CORS izinleri (prod'da kisitla!)
JWT_SECRET=alarko-enerji-jwt-secret    # JWT token sifresi (prod'da degistir!)
```

### API Endpoint'leri:
| Endpoint | Method | Aciklama |
|---|---|---|
| `/api/auth/register` | POST | Yeni kullanici kaydi |
| `/api/auth/login` | POST | E-posta/sifre ile giris |
| `/api/auth/me` | GET | Mevcut kullanici bilgisi (token gerekli) |
| `/api/auth/change-password` | POST | Sifre degistirme |
| `/api/auth/google` | GET | Google OAuth baslatma |
| `/api/auth/google-callback` | POST | Google OAuth donus |
| `/api/usd-rate` | GET | Canli USD/TRY kuru |
| `/api/projects` | GET | Proje listesi |
| `/api/projects/{id}` | GET | Proje detayi |
| `/api/portfolio` | GET | Kullanici portfolyosu |
| `/api/portfolio/invest` | POST | Yatirim yap (hisse bazli) |
| `/api/portfolio/sell` | POST | Yatirim sat |
| `/api/transactions` | GET/POST | Islem listele/olustur |
| `/api/banks` | GET | Banka listesi |
| `/api/kyc/upload` | POST | KYC belge yukle |
| `/api/kyc/status` | GET | KYC durumu |
| `/api/notifications` | GET | Bildirimler |
| `/api/admin/*` | - | Admin islemleri (kullanici, KYC, banka, islem yonetimi) |

### Canli Dolar Kuru:
- API: `https://open.er-api.com/v6/latest/USD` (ucretsiz, API key gerekmez)
- 1 saat cache suresi
- Fallback: Cache'deki son deger veya 38.0 TL

### Yatirim Mantigi:
```
1 Hisse = 25.000 TL
1-4 Hisse  → %7/ay (TL bazli)
5-9 Hisse  → %7/ay (USD bazli)
10+ Hisse  → %8/ay (USD bazli)
```

---

## 4. FRONTEND (React)

### Teknolojiler:
| Kutuphane | Amac |
|---|---|
| React 18 | UI framework |
| React Router DOM | Sayfa yonlendirme |
| TailwindCSS | CSS framework |
| shadcn/ui | UI bilesenler (Button, Card, Dialog, vs.) |
| Radix UI | shadcn'nin altyapisi |
| Axios | HTTP istekleri |
| Recharts | Grafik/chart bilesenleri |
| Lucide React | Ikon kutuphanesi |
| Sonner | Toast bildirimleri |

### Ortam Degiskenleri (frontend/.env):
```
REACT_APP_BACKEND_URL=https://your-domain.com   # Backend API adresi
```

### Sayfa Yapisi:
| Sayfa | Yol | Aciklama |
|---|---|---|
| LandingPage | `/` | Ana sayfa (hero video, projeler, planlar, FAQ) |
| LoginPage | `/login` | Giris yapma |
| RegisterPage | `/register` | Kayit olma |
| DashboardPage | `/dashboard` | Yatirimci paneli (grafik, portfolyo) |
| ProjectsPage | `/projects` | Proje listesi |
| ProjectDetailPage | `/projects/:id` | Proje detay + yatirim |
| AccountPage | `/account` | Hesap bilgileri + sifre degistirme |
| DepositPage | `/deposit` | Para yatirma |
| WithdrawalPage | `/withdraw` | Para cekme |
| KYCPage | `/kyc` | Kimlik dogrulama |
| NotificationsPage | `/notifications` | Bildirimler |
| Admin/* | `/admin/*` | Admin paneli (6 alt sayfa) |

### Google Auth (Emergent Auth):
- Giris/kayit sayfalarinda "Google ile Giris" butonu
- Emergent Auth servisi uzerinden calisiyor
- Redirect URL: `https://auth.emergentagent.com/`
- Callback: `window.location.origin + '/dashboard'`

---

## 5. DISARI AKTARMA VE YAYINLAMA REHBERI

### A. Oncelikle Degistirilmesi Gerekenler:

#### 1. JWT Secret (KRITIK!)
```bash
# backend/.env
JWT_SECRET=GUCLU-BENZERSIZ-SIFRE-URETINIZ-BURAYA
```
Ornek: `openssl rand -hex 64` komutuyla uretebilirsiniz.

#### 2. MongoDB URL
```bash
# backend/.env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/alarkoenerji
DB_NAME=alarkoenerji_prod
```
Onerilen servisler: MongoDB Atlas (ucretsiz tier mevcut), AWS DocumentDB, DigitalOcean

#### 3. CORS Ayarlari
```bash
# backend/.env
CORS_ORIGINS=https://www.alarkoenerji.com
```
Prod'da `*` KULLANMAYIN! Sadece kendi domain'inizi yazin.

#### 4. Frontend API URL
```bash
# frontend/.env
REACT_APP_BACKEND_URL=https://api.alarkoenerji.com
```

#### 5. Google Auth
Simdi Emergent Auth kullaniliyor. Kendi sunucunuzda:
- Google Cloud Console'dan OAuth 2.0 credentials olusturun
- `backend/server.py` icindeki Google auth endpoint'lerini guncelleyin
- Veya Firebase Auth, Auth0 gibi servisler kullanabilirsiniz

### B. Kurulum Adimlari:

#### Backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate       # Linux/Mac
pip install -r requirements.txt
# .env dosyasini yapilandirin
uvicorn server:app --host 0.0.0.0 --port 8001
```

#### Frontend:
```bash
cd frontend
yarn install                    # veya npm install
# .env dosyasini yapilandirin
yarn build                      # Production build
```
Build ciktisi `frontend/build/` klasorunde olusur.

### C. Hosting Secenekleri:

| Secenek | Backend | Frontend | Database |
|---|---|---|---|
| **VPS (Hetzner, DigitalOcean)** | Uvicorn + Nginx | Nginx static | MongoDB kurulu |
| **AWS** | EC2/ECS + ALB | S3 + CloudFront | MongoDB Atlas |
| **Railway** | FastAPI container | Static deploy | MongoDB Atlas |
| **Vercel + Railway** | Railway | Vercel | MongoDB Atlas |
| **Docker** | Docker container | Docker container | Docker container |

### D. Docker ile Deploy:

#### Backend Dockerfile:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8001
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

#### Frontend Dockerfile:
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### E. Kontrol Listesi (Deployment Checklist):

- [ ] JWT_SECRET degistirildi (guclu, benzersiz)
- [ ] MONGO_URL prod veritabanina yonlendirildi
- [ ] CORS_ORIGINS sadece kendi domain'iniz
- [ ] REACT_APP_BACKEND_URL prod API adresine ayarlandi
- [ ] Google Auth kendi credentials'larinizla yapilandirdi
- [ ] SSL/HTTPS aktif (Let's Encrypt veya Cloudflare)
- [ ] MongoDB index'leri olusturuldu (email unique, user_id index)
- [ ] Video dosyalari CDN'e yuklendi (buyuk dosyalar icin)
- [ ] Admin sifresi degistirildi (ilk giristen sonra)
- [ ] KYC upload klasoru yazma izinleri ayarlandi
- [ ] Backup stratejisi belirlendi (MongoDB otomatik backup)
- [ ] Error logging yapilandirildi (Sentry, CloudWatch vs.)
- [ ] Rate limiting eklendi (guvenlik icin)

---

## 6. ONEMLI NOTLAR

### Guvenlik:
- Sifreler bcrypt ile hashleniyor (guvende)
- JWT token'lar 24 saat gecerli (server.py icinde `timedelta(hours=24)`)
- KYC belgeleri sunucuda saklanir, dosya yolu DB'de tutulur
- Para cekme islemleri admin onayi gerektirir

### Performans:
- USD kuru 1 saat cache'leniyor (gereksiz API cagrisi onleniyor)
- MongoDB async driver (motor) kullaniliyor
- Frontend lazy loading yok (gerekirse eklenebilir)

### Mock/Simule Edilen Ozellikler:
- Para yatirma: Gercek odeme entegrasyonu yok, IBAN gosteriliyor
- Para cekme: Admin onayi var ama gercek banka transferi yok
- Getiri hesaplama: Otomatik aylik odeme sistemi yok (manuel admin islemi)

### Prod'da Eklenmesi Gerekenler:
1. Rate limiting (brute force koruması)
2. Email dogrulama (kayit sirasinda)
3. Otomatik aylik getiri hesaplama (cron job)
4. Odeme gateway entegrasyonu (Stripe, iyzico vs.)
5. Log yonetimi (dosya/servis bazli)
6. Health check endpoint'i
7. API versiyonlama
