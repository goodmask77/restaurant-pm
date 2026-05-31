# 餐廳工程統包監工專案管理系統

> Restaurant Construction Project Management System

一套專為餐廳裝修工程設計的全端管理系統，整合 Supabase、GitHub、Vercel，快速部署上線。

---

## 功能模組

| 模組 | 功能 |
|------|------|
| 🏗️ 專案管理 | 建立/追蹤多個餐廳工程專案，含狀態、進度、預算、人員 |
| ✅ 工程項目 | 任務分配、類別管理（土建/水電/空調/裝修…）、進度滑桿 |
| 👥 承包商管理 | 廠商資料、專業類別標籤、評分記錄 |
| 💰 預算追蹤 | 各類別預算 vs 實際支出、付款狀態、視覺化圖表 |
| ⚠️ 工程問題 | 缺失單管理、嚴重程度分級、指派追蹤 |
| 📋 工地日報 | 每日天氣/工人數/工作摘要/問題/明日計畫 |

---

## 技術架構

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend / DB**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Hosting**: Vercel
- **Version Control**: GitHub

---

## 快速上手

### 1. 取得程式碼

```bash
git clone https://github.com/YOUR_ORG/restaurant-pm.git
cd restaurant-pm
npm install
```

### 2. 設定 Supabase

1. 前往 [supabase.com](https://supabase.com) 建立新專案
2. 在 **SQL Editor** 貼上並執行 `supabase/migrations/001_initial.sql`
3. 至 **Settings → API** 複製：
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. 設定環境變數

```bash
cp .env.example .env.local
# 編輯 .env.local，填入上方兩個值
```

### 4. 本地開發

```bash
npm run dev
# 開啟 http://localhost:3000
```

---

## 部署到 Vercel（公開網址）

### 方法 A：GitHub 自動整合（推薦）

1. 將專案 push 到 GitHub：
   ```bash
   git init
   git add .
   git commit -m "init: restaurant pm system"
   git remote add origin https://github.com/YOUR_USER/restaurant-pm.git
   git push -u origin main
   ```

2. 前往 [vercel.com](https://vercel.com) → **Add New Project** → 選擇此 GitHub repo

3. 在 **Environment Variables** 加入：
   ```
   NEXT_PUBLIC_SUPABASE_URL     = https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJxxxx...
   ```

4. 點 **Deploy** — 約 1 分鐘即可取得公開網址（如 `https://restaurant-pm-xxx.vercel.app`）

5. 日後 push 到 `main` branch 自動觸發重新部署

### 方法 B：Vercel CLI

```bash
npm i -g vercel
vercel
# 依提示設定環境變數
vercel --prod
```

---

## Supabase Auth 設定

1. **Authentication → URL Configuration**：
   - Site URL：`https://your-app.vercel.app`
   - Redirect URLs：`https://your-app.vercel.app/**`

2. 本地開發額外加入：
   - `http://localhost:3000/**`

---

## 目錄結構

```
restaurant-pm/
├── app/
│   ├── (auth)/login          # 登入頁
│   ├── (auth)/register       # 註冊頁
│   └── (dashboard)/
│       ├── page.tsx          # 總覽儀表板
│       ├── projects/         # 專案管理
│       ├── tasks/            # 工程項目
│       ├── contractors/      # 承包商
│       ├── budget/           # 預算追蹤
│       ├── issues/           # 工程問題
│       └── reports/          # 工地日報
├── components/
│   ├── layout/               # Sidebar, Header
│   └── ui/                   # Badge, Button, Card, Modal…
├── lib/
│   ├── supabase/             # client, server, types
│   └── utils.ts              # 工具函式、標籤對應
└── supabase/
    └── migrations/
        └── 001_initial.sql   # 完整 DB Schema
```

---

## 環境變數

| 變數名稱 | 說明 |
|---------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |

> **注意**：anon key 為公開金鑰，資料存取安全由 **Row Level Security (RLS)** 控管，已在 migration SQL 中設定。

---

## 常見問題

**Q：部署後登入後一直跳回登入頁？**
A：確認 Supabase Auth → URL Configuration 有加入 Vercel 的網域。

**Q：資料庫顯示 permission denied？**
A：確認已執行 `001_initial.sql`，RLS policy 已套用。

**Q：如何新增管理員帳號？**
A：在 Supabase Dashboard → Authentication → Users 建立使用者，再至 `profiles` table 修改 `role = 'admin'`。
