from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
load_dotenv()
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import requests
import shutil
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'alarko-enerji-jwt-secret-2024-secure')
JWT_ALGORITHM = 'HS256'

UPLOAD_DIR = ROOT_DIR / 'uploads' / 'kyc'
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ===== MODELS =====
class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    phone: str = ""

class UserLogin(BaseModel):
    email: str
    password: str

class GoogleAuthCallback(BaseModel):
    session_id: str

class ProjectCreate(BaseModel):
    name: str
    type: str
    description: str
    location: str
    capacity: str
    return_rate: float
    total_target: float
    image_url: str
    details: str = ""

class InvestRequest(BaseModel):
    project_id: str
    amount: float

class SellRequest(BaseModel):
    portfolio_id: str

class BankCreate(BaseModel):
    name: str
    iban: str
    account_holder: str
    logo_url: str = ""

class TransactionRequest(BaseModel):
    amount: float
    bank_id: str = ""
    type: str

class BalanceUpdate(BaseModel):
    amount: float
    type: str

class RoleUpdate(BaseModel):
    role: str

class TransactionStatusUpdate(BaseModel):
    status: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class UserInfoUpdate(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""

# ===== AUTH HELPERS =====
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request):
    auth_header = request.headers.get('Authorization', '')
    token = auth_header.replace('Bearer ', '') if auth_header.startswith('Bearer ') else ''
    if not token:
        raise HTTPException(status_code=401, detail="Token gerekli")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"user_id": payload['user_id']}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Kullanici bulunamadi")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token suresi dolmus")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Gecersiz token")

async def get_admin_user(request: Request):
    user = await get_current_user(request)
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")
    return user

# ===== AUTH ROUTES =====
@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kayitli")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user = {
        "user_id": user_id, "email": data.email,
        "password_hash": hash_password(data.password),
        "name": data.name, "phone": data.phone,
        "role": "investor", "kyc_status": "pending",
        "balance": 0.0, "picture": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    token = create_token(user_id, "investor")
    await db.notifications.insert_one({
        "notification_id": str(uuid.uuid4()), "user_id": user_id,
        "title": "Hoş Geldiniz!", "message": "Alarko Enerji platformuna hoş geldiniz. Yatırım yapmak için kimlik doğrulamanızı tamamlayın.",
        "type": "welcome", "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"token": token, "user": {"user_id": user_id, "email": data.email, "name": data.name, "role": "investor", "kyc_status": "pending", "balance": 0.0, "phone": data.phone, "picture": ""}}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="E-posta veya sifre hatali")
    if not user.get('password_hash'):
        raise HTTPException(status_code=401, detail="Bu hesap Google ile olusturulmus. Google ile giris yapin.")
    if not verify_password(data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="E-posta veya sifre hatali")
    token = create_token(user['user_id'], user['role'])
    user_data = {k: v for k, v in user.items() if k != 'password_hash'}
    return {"token": token, "user": user_data}

@api_router.post("/auth/google-callback")
async def google_callback(data: GoogleAuthCallback):
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    try:
        resp = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": data.session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Google kimlik dogrulama basarisiz")
        auth_data = resp.json()
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Google kimlik dogrulama hatasi: {str(e)}")
    email = auth_data.get('email')
    name = auth_data.get('name', '')
    picture = auth_data.get('picture', '')
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        await db.users.update_one({"email": email}, {"$set": {"name": name, "picture": picture}})
        user = await db.users.find_one({"email": email}, {"_id": 0})
        token = create_token(user['user_id'], user['role'])
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id, "email": email, "name": name, "picture": picture,
            "role": "investor", "kyc_status": "pending", "balance": 0.0,
            "phone": "", "password_hash": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
        token = create_token(user_id, "investor")
        await db.notifications.insert_one({
            "notification_id": str(uuid.uuid4()), "user_id": user_id,
            "title": "Hos Geldiniz!", "message": "Alarko Enerji platformuna hos geldiniz.",
            "type": "welcome", "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    user_data = {k: v for k, v in user.items() if k != 'password_hash'}
    return {"token": token, "user": user_data}

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return {k: v for k, v in user.items() if k != 'password_hash'}

# ===== PROJECT ROUTES =====
@api_router.get("/projects")
async def get_projects(type: str = None):
    query = {}
    if type and type.lower() != 'all':
        query['type'] = type.upper()
    projects = await db.projects.find(query, {"_id": 0}).to_list(100)
    return projects

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    project = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadi")
    return project

@api_router.post("/admin/projects")
async def create_project(data: ProjectCreate, user=Depends(get_admin_user)):
    project = {
        "project_id": str(uuid.uuid4()), "name": data.name, "type": data.type.upper(),
        "description": data.description, "location": data.location, "capacity": data.capacity,
        "return_rate": data.return_rate, "total_target": data.total_target,
        "funded_amount": 0.0, "investors_count": 0, "image_url": data.image_url,
        "details": data.details, "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.projects.insert_one(project)
    return {k: v for k, v in project.items() if k != '_id'}

@api_router.put("/admin/projects/{project_id}")
async def update_project(project_id: str, data: ProjectCreate, user=Depends(get_admin_user)):
    await db.projects.update_one({"project_id": project_id}, {"$set": data.model_dump()})
    project = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    return project

# ===== USD RATE =====
SHARE_PRICE = 25000
_usd_cache = {"rate": 38.0, "updated_at": None}

def get_usd_rate():
    now = datetime.now(timezone.utc)
    if _usd_cache["updated_at"] and (now - _usd_cache["updated_at"]).total_seconds() < 3600:
        return _usd_cache["rate"]
    try:
        resp = requests.get("https://open.er-api.com/v6/latest/USD", timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            rate = data.get("rates", {}).get("TRY", 38.0)
            _usd_cache["rate"] = round(rate, 4)
            _usd_cache["updated_at"] = now
            logger.info(f"USD/TRY kuru guncellendi: {_usd_cache['rate']}")
    except Exception as e:
        logger.warning(f"USD kuru alinamadi, cache kullaniliyor: {e}")
    return _usd_cache["rate"]

@api_router.get("/usd-rate")
async def get_usd_rate_endpoint():
    rate = get_usd_rate()
    return {"rate": rate, "share_price": SHARE_PRICE}

# ===== PORTFOLIO ROUTES =====
@api_router.get("/portfolio")
async def get_portfolio(user=Depends(get_current_user)):
    investments = await db.portfolios.find({"user_id": user['user_id']}, {"_id": 0}).to_list(100)
    total_invested = sum(i.get('amount', 0) for i in investments)
    total_monthly_return = sum(i.get('monthly_return', 0) for i in investments)
    return {"investments": investments, "total_invested": total_invested, "total_monthly_return": total_monthly_return, "balance": user.get('balance', 0)}

@api_router.post("/portfolio/invest")
async def invest(data: InvestRequest, user=Depends(get_current_user)):
    if user.get('kyc_status') != 'approved':
        raise HTTPException(status_code=400, detail="Yatirim yapabilmek icin kimlik dogrulamanizi tamamlayin")
    if data.amount < SHARE_PRICE:
        raise HTTPException(status_code=400, detail=f"Minimum yatirim tutari {SHARE_PRICE:,.0f} TL (1 hisse)")
    if data.amount % SHARE_PRICE != 0:
        raise HTTPException(status_code=400, detail=f"Yatirim tutari {SHARE_PRICE:,.0f} TL'nin katlari olmalidir")
    if user.get('balance', 0) < data.amount:
        raise HTTPException(status_code=400, detail="Yetersiz bakiye")
    project = await db.projects.find_one({"project_id": data.project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadi")
    shares = int(data.amount / SHARE_PRICE)
    usd_rate = get_usd_rate()
    # Tiered return rates based on share count
    if shares >= 10:
        actual_rate = 8.0
        usd_based = True
    elif shares >= 5:
        actual_rate = 7.0
        usd_based = True
    else:
        actual_rate = 7.0
        usd_based = False
    if usd_based:
        usd_amount = data.amount / usd_rate
        monthly_return_usd = usd_amount * (actual_rate / 100)
        monthly_return = monthly_return_usd * usd_rate
    else:
        monthly_return = data.amount * (actual_rate / 100)
    entry = {
        "portfolio_id": str(uuid.uuid4()), "user_id": user['user_id'],
        "project_id": data.project_id, "project_name": project['name'],
        "project_type": project['type'], "amount": data.amount,
        "shares": shares, "usd_based": usd_based,
        "usd_rate_at_purchase": usd_rate if usd_based else None,
        "monthly_return": round(monthly_return, 2), "return_rate": actual_rate,
        "purchase_date": datetime.now(timezone.utc).isoformat(), "status": "active"
    }
    await db.portfolios.insert_one(entry)
    await db.users.update_one({"user_id": user['user_id']}, {"$inc": {"balance": -data.amount}})
    await db.projects.update_one({"project_id": data.project_id}, {"$inc": {"funded_amount": data.amount, "investors_count": 1}})
    await db.notifications.insert_one({
        "notification_id": str(uuid.uuid4()), "user_id": user['user_id'],
        "title": "Yatirim Basarili", "message": f"{project['name']} projesine {shares} hisse ({data.amount:,.0f} TL) yatirim yaptiniz.",
        "type": "investment", "is_read": False, "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Yatirim basariyla gerceklestirildi", "portfolio": {k: v for k, v in entry.items() if k != '_id'}}

@api_router.post("/portfolio/sell")
async def sell_investment(data: SellRequest, user=Depends(get_current_user)):
    inv = await db.portfolios.find_one({"portfolio_id": data.portfolio_id, "user_id": user['user_id']}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Yatirim bulunamadi")
    await db.users.update_one({"user_id": user['user_id']}, {"$inc": {"balance": inv['amount']}})
    await db.portfolios.delete_one({"portfolio_id": data.portfolio_id})
    await db.notifications.insert_one({
        "notification_id": str(uuid.uuid4()), "user_id": user['user_id'],
        "title": "Yatırım Satıldı", "message": f"{inv['amount']:,.0f} TL tutarındaki yatırımınız satıldı.",
        "type": "sale", "is_read": False, "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Yatirim basariyla satildi"}

# ===== BANK ROUTES =====
@api_router.get("/banks")
async def get_banks():
    return await db.banks.find({"is_active": True}, {"_id": 0}).to_list(100)

@api_router.post("/admin/banks")
async def create_bank(data: BankCreate, user=Depends(get_admin_user)):
    bank = {"bank_id": str(uuid.uuid4()), "name": data.name, "iban": data.iban,
            "account_holder": data.account_holder, "logo_url": data.logo_url,
            "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.banks.insert_one(bank)
    return {k: v for k, v in bank.items() if k != '_id'}

@api_router.put("/admin/banks/{bank_id}")
async def update_bank(bank_id: str, data: BankCreate, user=Depends(get_admin_user)):
    await db.banks.update_one({"bank_id": bank_id}, {"$set": data.model_dump()})
    return await db.banks.find_one({"bank_id": bank_id}, {"_id": 0})

@api_router.delete("/admin/banks/{bank_id}")
async def delete_bank(bank_id: str, user=Depends(get_admin_user)):
    await db.banks.update_one({"bank_id": bank_id}, {"$set": {"is_active": False}})
    return {"message": "Banka silindi"}

# ===== TRANSACTION ROUTES =====
@api_router.post("/transactions")
async def create_transaction(data: TransactionRequest, user=Depends(get_current_user)):
    if data.type == 'withdrawal' and user.get('balance', 0) < data.amount:
        raise HTTPException(status_code=400, detail="Yetersiz bakiye")
    txn = {
        "transaction_id": str(uuid.uuid4()), "user_id": user['user_id'],
        "user_name": user.get('name', ''), "type": data.type,
        "amount": data.amount, "bank_id": data.bank_id,
        "status": "pending", "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.transactions.insert_one(txn)
    return {k: v for k, v in txn.items() if k != '_id'}

@api_router.get("/transactions")
async def get_transactions(user=Depends(get_current_user)):
    return await db.transactions.find({"user_id": user['user_id']}, {"_id": 0}).sort("created_at", -1).to_list(100)

# ===== KYC ROUTES =====
@api_router.post("/kyc/upload")
async def upload_kyc(front: UploadFile = File(...), back: UploadFile = File(...), user=Depends(get_current_user)):
    uid = user['user_id']
    front_fn = f"{uid}_front_{uuid.uuid4().hex[:8]}{Path(front.filename).suffix}"
    back_fn = f"{uid}_back_{uuid.uuid4().hex[:8]}{Path(back.filename).suffix}"
    with open(UPLOAD_DIR / front_fn, 'wb') as f:
        shutil.copyfileobj(front.file, f)
    with open(UPLOAD_DIR / back_fn, 'wb') as f:
        shutil.copyfileobj(back.file, f)
    kyc_doc = {
        "kyc_id": str(uuid.uuid4()), "user_id": uid,
        "user_name": user.get('name', ''), "user_email": user.get('email', ''),
        "front_image": f"/api/uploads/kyc/{front_fn}", "back_image": f"/api/uploads/kyc/{back_fn}",
        "status": "pending", "submitted_at": datetime.now(timezone.utc).isoformat(), "reviewed_at": None
    }
    await db.kyc_documents.delete_many({"user_id": uid})
    await db.kyc_documents.insert_one(kyc_doc)
    await db.users.update_one({"user_id": uid}, {"$set": {"kyc_status": "submitted"}})
    return {"message": "Kimlik belgeleri yuklendi", "status": "submitted"}

@api_router.get("/kyc/status")
async def get_kyc_status(user=Depends(get_current_user)):
    kyc = await db.kyc_documents.find_one({"user_id": user['user_id']}, {"_id": 0})
    return {"kyc_status": user.get('kyc_status', 'pending'), "kyc_document": kyc}

@api_router.get("/admin/kyc")
async def get_all_kyc(user=Depends(get_admin_user)):
    return await db.kyc_documents.find({}, {"_id": 0}).sort("submitted_at", -1).to_list(100)

@api_router.post("/admin/kyc/{kyc_id}/approve")
async def approve_kyc(kyc_id: str, user=Depends(get_admin_user)):
    kyc = await db.kyc_documents.find_one({"kyc_id": kyc_id}, {"_id": 0})
    if not kyc:
        raise HTTPException(status_code=404, detail="KYC bulunamadi")
    await db.kyc_documents.update_one({"kyc_id": kyc_id}, {"$set": {"status": "approved", "reviewed_at": datetime.now(timezone.utc).isoformat()}})
    await db.users.update_one({"user_id": kyc['user_id']}, {"$set": {"kyc_status": "approved"}})
    await db.notifications.insert_one({
        "notification_id": str(uuid.uuid4()), "user_id": kyc['user_id'],
        "title": "Kimlik Doğrulaması Onaylandı",
        "message": "Kimliğiniz başarıyla doğrulandı. Artık yatırım yapabilirsiniz!",
        "type": "kyc_approved", "is_read": False, "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "KYC onaylandi"}

@api_router.post("/admin/kyc/{kyc_id}/reject")
async def reject_kyc(kyc_id: str, user=Depends(get_admin_user)):
    kyc = await db.kyc_documents.find_one({"kyc_id": kyc_id}, {"_id": 0})
    if not kyc:
        raise HTTPException(status_code=404, detail="KYC bulunamadi")
    await db.kyc_documents.update_one({"kyc_id": kyc_id}, {"$set": {"status": "rejected", "reviewed_at": datetime.now(timezone.utc).isoformat()}})
    await db.users.update_one({"user_id": kyc['user_id']}, {"$set": {"kyc_status": "rejected"}})
    await db.notifications.insert_one({
        "notification_id": str(uuid.uuid4()), "user_id": kyc['user_id'],
        "title": "Kimlik Doğrulaması Reddedildi",
        "message": "Kimlik doğrulamanız reddedildi. Lütfen geçerli bir kimlik belgesi yükleyin.",
        "type": "kyc_rejected", "is_read": False, "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "KYC reddedildi"}

# ===== NOTIFICATION ROUTES =====
@api_router.get("/notifications")
async def get_notifications(user=Depends(get_current_user)):
    notifs = await db.notifications.find({"user_id": user['user_id']}, {"_id": 0}).sort("created_at", -1).to_list(50)
    unread = await db.notifications.count_documents({"user_id": user['user_id'], "is_read": False})
    return {"notifications": notifs, "unread_count": unread}

@api_router.post("/notifications/{notification_id}/read")
async def mark_read(notification_id: str, user=Depends(get_current_user)):
    await db.notifications.update_one({"notification_id": notification_id, "user_id": user['user_id']}, {"$set": {"is_read": True}})
    return {"message": "Bildirim okundu"}

@api_router.post("/notifications/read-all")
async def mark_all_read(user=Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user['user_id']}, {"$set": {"is_read": True}})
    return {"message": "Tum bildirimler okundu"}

# ===== ADMIN ROUTES =====
@api_router.get("/admin/stats")
async def get_admin_stats(user=Depends(get_admin_user)):
    total_users = await db.users.count_documents({"role": "investor"})
    pending_kyc = await db.kyc_documents.count_documents({"status": "pending"})
    total_projects = await db.projects.count_documents({})
    users_list = await db.users.find({"role": "investor"}, {"_id": 0, "balance": 1}).to_list(10000)
    total_balance = sum(u.get('balance', 0) for u in users_list)
    portfolios = await db.portfolios.find({}, {"_id": 0, "amount": 1}).to_list(10000)
    total_invested = sum(p.get('amount', 0) for p in portfolios)
    pending_txns = await db.transactions.count_documents({"status": "pending"})
    return {"total_users": total_users, "pending_kyc": pending_kyc, "total_projects": total_projects,
            "total_balance": total_balance, "total_invested": total_invested, "pending_transactions": pending_txns}

@api_router.get("/admin/users")
async def get_admin_users(user=Depends(get_admin_user)):
    return await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)

@api_router.put("/admin/users/{user_id}/balance")
async def update_user_balance(user_id: str, data: BalanceUpdate, admin=Depends(get_admin_user)):
    target = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Kullanici bulunamadi")
    if data.type == 'add':
        await db.users.update_one({"user_id": user_id}, {"$inc": {"balance": data.amount}})
        await db.transactions.insert_one({
            "transaction_id": str(uuid.uuid4()), "user_id": user_id,
            "user_name": target.get('name', ''), "type": "deposit",
            "amount": data.amount, "bank_id": "", "status": "approved",
            "created_at": datetime.now(timezone.utc).isoformat(), "approved_by": admin['user_id']
        })
        await db.notifications.insert_one({
            "notification_id": str(uuid.uuid4()), "user_id": user_id,
            "title": "Para Yatırma Onaylandı", "message": f"Hesabınıza {data.amount:,.0f} TL yatırıldı.",
            "type": "deposit_approved", "is_read": False, "created_at": datetime.now(timezone.utc).isoformat()
        })
    elif data.type == 'subtract':
        if target.get('balance', 0) < data.amount:
            raise HTTPException(status_code=400, detail="Yetersiz bakiye")
        await db.users.update_one({"user_id": user_id}, {"$inc": {"balance": -data.amount}})
        await db.transactions.insert_one({
            "transaction_id": str(uuid.uuid4()), "user_id": user_id,
            "user_name": target.get('name', ''), "type": "withdrawal",
            "amount": data.amount, "bank_id": "", "status": "approved",
            "created_at": datetime.now(timezone.utc).isoformat(), "approved_by": admin['user_id']
        })
        await db.notifications.insert_one({
            "notification_id": str(uuid.uuid4()), "user_id": user_id,
            "title": "Para Çekme Gerçekleşti", "message": f"Hesabınızdan {data.amount:,.0f} TL çekildi.",
            "type": "withdrawal", "is_read": False, "created_at": datetime.now(timezone.utc).isoformat()
        })
    updated = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return updated

@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, data: RoleUpdate, admin=Depends(get_admin_user)):
    await db.users.update_one({"user_id": user_id}, {"$set": {"role": data.role}})
    return {"message": "Rol guncellendi"}

@api_router.get("/admin/transactions")
async def get_admin_transactions(user=Depends(get_admin_user)):
    return await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api_router.put("/admin/transactions/{transaction_id}")
async def update_transaction_status(transaction_id: str, data: TransactionStatusUpdate, admin=Depends(get_admin_user)):
    txn = await db.transactions.find_one({"transaction_id": transaction_id}, {"_id": 0})
    if not txn:
        raise HTTPException(status_code=404, detail="Islem bulunamadi")
    if txn.get('status') != 'pending':
        raise HTTPException(status_code=400, detail="Bu islem zaten islendi")
    await db.transactions.update_one({"transaction_id": transaction_id}, {"$set": {"status": data.status}})
    if data.status == 'approved' and txn['type'] == 'deposit':
        await db.users.update_one({"user_id": txn['user_id']}, {"$inc": {"balance": txn['amount']}})
        await db.notifications.insert_one({
            "notification_id": str(uuid.uuid4()), "user_id": txn['user_id'],
            "title": "Para Yatirma Onaylandi", "message": f"{txn['amount']:,.0f} TL tutarindaki yatirma talebiniz onaylandi.",
            "type": "deposit_approved", "is_read": False, "created_at": datetime.now(timezone.utc).isoformat()
        })
    elif data.status == 'approved' and txn['type'] == 'withdrawal':
        target_user = await db.users.find_one({"user_id": txn['user_id']}, {"_id": 0})
        if not target_user or target_user.get('balance', 0) < txn['amount']:
            await db.transactions.update_one({"transaction_id": transaction_id}, {"$set": {"status": "rejected"}})
            raise HTTPException(status_code=400, detail="Kullanicinin bakiyesi yetersiz")
        await db.users.update_one({"user_id": txn['user_id']}, {"$inc": {"balance": -txn['amount']}})
        await db.notifications.insert_one({
            "notification_id": str(uuid.uuid4()), "user_id": txn['user_id'],
            "title": "Para Cekme Onaylandi", "message": f"{txn['amount']:,.0f} TL tutarindaki cekme talebiniz onaylandi ve hesabinizdan dusuldu.",
            "type": "withdrawal_approved", "is_read": False, "created_at": datetime.now(timezone.utc).isoformat()
        })
    elif data.status == 'rejected' and txn['type'] == 'withdrawal':
        await db.notifications.insert_one({
            "notification_id": str(uuid.uuid4()), "user_id": txn['user_id'],
            "title": "Para Cekme Reddedildi", "message": f"{txn['amount']:,.0f} TL tutarindaki cekme talebiniz reddedildi.",
            "type": "withdrawal_rejected", "is_read": False, "created_at": datetime.now(timezone.utc).isoformat()
        })
    elif data.status == 'rejected' and txn['type'] == 'deposit':
        await db.notifications.insert_one({
            "notification_id": str(uuid.uuid4()), "user_id": txn['user_id'],
            "title": "Para Yatirma Reddedildi", "message": f"{txn['amount']:,.0f} TL tutarindaki yatirma talebiniz reddedildi.",
            "type": "deposit_rejected", "is_read": False, "created_at": datetime.now(timezone.utc).isoformat()
        })
    return {"message": "Islem guncellendi"}

@api_router.get("/admin/portfolios")
async def get_admin_portfolios(user_id: str = None, user=Depends(get_admin_user)):
    query = {"user_id": user_id} if user_id else {}
    portfolios = await db.portfolios.find(query, {"_id": 0}).to_list(1000)
    for p in portfolios:
        u = await db.users.find_one({"user_id": p['user_id']}, {"_id": 0, "name": 1, "email": 1})
        if u:
            p['user_name'] = u.get('name', '')
            p['user_email'] = u.get('email', '')
    return portfolios

# ===== PASSWORD CHANGE =====
@api_router.post("/auth/change-password")
async def change_password(data: PasswordChange, user=Depends(get_current_user)):
    if not user.get('password_hash'):
        raise HTTPException(status_code=400, detail="Bu hesap Google ile olusturulmus. Sifre degistirilemez.")
    if not verify_password(data.current_password, user['password_hash']):
        raise HTTPException(status_code=400, detail="Mevcut sifre hatali")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Yeni sifre en az 6 karakter olmali")
    await db.users.update_one({"user_id": user['user_id']}, {"$set": {"password_hash": hash_password(data.new_password)}})
    return {"message": "Sifre basariyla degistirildi"}

# ===== ADMIN USER INFO UPDATE =====
@api_router.put("/admin/users/{user_id}/info")
async def update_user_info(user_id: str, data: UserInfoUpdate, admin=Depends(get_admin_user)):
    target = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Kullanici bulunamadi")
    update_data = {}
    if data.name:
        update_data['name'] = data.name
    if data.email:
        existing = await db.users.find_one({"email": data.email, "user_id": {"$ne": user_id}}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Bu e-posta adresi baska bir kullanici tarafindan kullaniliyor")
        update_data['email'] = data.email
    if data.phone:
        update_data['phone'] = data.phone
    if not update_data:
        raise HTTPException(status_code=400, detail="Guncellenecek bilgi bulunamadi")
    await db.users.update_one({"user_id": user_id}, {"$set": update_data})
    updated = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return updated

# ===== SEED DATA =====
@app.on_event("startup")
async def seed_data():
    admin = await db.users.find_one({"email": "admin@alarkoenerji.com"})
    if not admin:
        await db.users.insert_one({
            "user_id": f"admin_{uuid.uuid4().hex[:12]}", "email": "admin@alarkoenerji.com",
            "password_hash": hash_password("admin123"), "name": "Admin",
            "phone": "+90 555 000 0000", "role": "admin", "kyc_status": "approved",
            "balance": 0.0, "picture": "", "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Admin kullanicisi olusturuldu")

    if await db.projects.count_documents({}) == 0:
        await db.projects.insert_many([
            {"project_id": str(uuid.uuid4()), "name": "İzmir Güneş Enerjisi Santrali", "type": "GES",
             "description": "İzmir'in Torbalı ilçesinde 175 dönüm arazi üzerinde kurulu güneş enerjisi santrali. Yılda 22.000 MWh enerji üretimi hedeflenmektedir.",
             "location": "İzmir, Torbalı", "capacity": "15 MW", "return_rate": 7.0,
             "total_target": 5000000, "funded_amount": 3250000, "investors_count": 342,
             "image_url": "https://images.unsplash.com/photo-1670519808965-16b9b2f724af?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800",
             "details": "Bu proje, İzmir'in güneş potansiyelinden maksimum faydalanmak amacıyla tasarlanmıştır. Tier-1 güneş panelleri kullanılarak yüksek verimlilik hedeflenmektedir. Proje, 20 yıllık YEKDEM garantisi altındadır.",
             "status": "active", "created_at": datetime.now(timezone.utc).isoformat()},
            {"project_id": str(uuid.uuid4()), "name": "Antalya Güneş Enerjisi Santrali", "type": "GES",
             "description": "Antalya Manavgat'ta 250 dönüm alanda kurulu büyük ölçekli güneş santrali. Türkiye'nin en verimli güneş bölgelerinden birinde yer almaktadır.",
             "location": "Antalya, Manavgat", "capacity": "25 MW", "return_rate": 7.5,
             "total_target": 8000000, "funded_amount": 5600000, "investors_count": 518,
             "image_url": "https://images.unsplash.com/photo-1770068511771-7c146210a55b?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800",
             "details": "Antalya'nın yüksek güneşlenme süresinden faydalanan bu proje, yılda 37.500 MWh enerji üretecektir.",
             "status": "active", "created_at": datetime.now(timezone.utc).isoformat()},
            {"project_id": str(uuid.uuid4()), "name": "İstanbul Rüzgar Enerjisi Santrali", "type": "RES",
             "description": "İstanbul Çatalca bölgesinde yüksek rüzgar potansiyeline sahip tepelerde kurulu rüzgar santrali. 20 adet türbin ile enerji üretimi yapılmaktadır.",
             "location": "İstanbul, Çatalca", "capacity": "50 MW", "return_rate": 7.0,
             "total_target": 12000000, "funded_amount": 8400000, "investors_count": 876,
             "image_url": "https://images.unsplash.com/photo-1631096667365-00844efc3a92?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800",
             "details": "Marmara bölgesinin güçlü rüzgar koridorlarında konumlanan bu santral, son teknoloji Vestas türbinleri ile donatılmıştır.",
             "status": "active", "created_at": datetime.now(timezone.utc).isoformat()},
            {"project_id": str(uuid.uuid4()), "name": "Çanakkale Rüzgar Enerjisi Santrali", "type": "RES",
             "description": "Çanakkale Biga'da Ege Denizi rüzgarlarından faydalanan modern rüzgar santrali.",
             "location": "Çanakkale, Biga", "capacity": "35 MW", "return_rate": 6.5,
             "total_target": 9000000, "funded_amount": 4500000, "investors_count": 423,
             "image_url": "https://images.unsplash.com/photo-1636618732028-7e541a1cb994?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800",
             "details": "Çanakkale'nin güçlü Ege rüzgarlarından faydalanan bu proje, 14 adet 2.5 MW kapasiteli türbin içermektedir.",
             "status": "active", "created_at": datetime.now(timezone.utc).isoformat()}
        ])
        logger.info("Ornek projeler olusturuldu")

    if await db.banks.count_documents({}) == 0:
        await db.banks.insert_many([
            {"bank_id": str(uuid.uuid4()), "name": "Ziraat Bankası", "iban": "TR33 0001 0000 0000 0000 0000 01",
             "account_holder": "Alarko Enerji Yatırım A.Ş.", "logo_url": "", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"bank_id": str(uuid.uuid4()), "name": "İş Bankası", "iban": "TR62 0006 4000 0011 2340 0001 01",
             "account_holder": "Alarko Enerji Yatırım A.Ş.", "logo_url": "", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"bank_id": str(uuid.uuid4()), "name": "Garanti BBVA", "iban": "TR76 0006 2000 0000 0006 2960 01",
             "account_holder": "Alarko Enerji Yatırım A.Ş.", "logo_url": "", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"bank_id": str(uuid.uuid4()), "name": "Yapı Kredi", "iban": "TR86 0006 7010 0000 0012 3456 78",
             "account_holder": "Alarko Enerji Yatırım A.Ş.", "logo_url": "", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()}
        ])
        logger.info("Ornek bankalar olusturuldu")

# Mount static files and include router
app.mount("/api/uploads", StaticFiles(directory=str(ROOT_DIR / 'uploads')), name="uploads")
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
