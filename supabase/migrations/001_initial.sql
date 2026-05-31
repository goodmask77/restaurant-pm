-- ============================================================
-- 餐廳工程統包監工專案管理系統 — 資料庫 Schema
-- ============================================================

-- 啟用 UUID 擴充
create extension if not exists "pgcrypto";

-- ============================================================
-- 使用者 Profile（對應 auth.users）
-- ============================================================
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  created_at  timestamptz default now(),
  full_name   text,
  avatar_url  text,
  role        text default 'viewer' check (role in ('admin','manager','supervisor','viewer'))
);

alter table profiles enable row level security;
create policy "使用者可讀自己的 profile" on profiles for select using (auth.uid() = id);
create policy "使用者可更新自己的 profile" on profiles for update using (auth.uid() = id);

-- 新使用者自動建立 profile
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- 承包商
-- ============================================================
create table if not exists contractors (
  id             uuid default gen_random_uuid() primary key,
  created_at     timestamptz default now(),
  name           text not null,
  company        text,
  specialty      text[] default '{}',  -- 土建/水電/空調/裝修/設備/消防
  contact_person text,
  phone          text,
  email          text,
  rating         smallint check (rating between 1 and 5),
  status         text default 'active' check (status in ('active','inactive')),
  notes          text,
  owner_id       uuid references auth.users(id)
);
alter table contractors enable row level security;
create policy "登入可讀" on contractors for select using (auth.role() = 'authenticated');
create policy "登入可寫" on contractors for insert with check (auth.role() = 'authenticated');
create policy "登入可改" on contractors for update using (auth.role() = 'authenticated');

-- ============================================================
-- 專案
-- ============================================================
create table if not exists projects (
  id                  uuid default gen_random_uuid() primary key,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  name                text not null,
  description         text,
  location            text,
  restaurant_type     text,               -- 中餐/西餐/日式/火鍋/咖啡廳/其他
  area_sqm            numeric(8,2),       -- 坪數（平方公尺）
  floors              smallint default 1,
  start_date          date,
  end_date            date,
  status              text default 'planning'
                        check (status in ('planning','in_progress','paused','completed','cancelled')),
  budget_total        numeric(14,2) default 0,
  progress_pct        smallint default 0 check (progress_pct between 0 and 100),
  project_manager     text,
  site_supervisor     text,
  owner_id            uuid references auth.users(id)
);
alter table projects enable row level security;
create policy "登入可讀專案" on projects for select using (auth.role() = 'authenticated');
create policy "登入可建專案" on projects for insert with check (auth.uid() = owner_id);
create policy "擁有人可改" on projects for update using (auth.uid() = owner_id);

-- 自動更新 updated_at
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger projects_updated_at
  before update on projects
  for each row execute procedure touch_updated_at();

-- ============================================================
-- 工程項目 / 里程碑
-- ============================================================
create table if not exists tasks (
  id              uuid default gen_random_uuid() primary key,
  created_at      timestamptz default now(),
  project_id      uuid references projects(id) on delete cascade not null,
  contractor_id   uuid references contractors(id),
  title           text not null,
  description     text,
  category        text check (category in ('土建','水電','空調','裝修','設備','消防','驗收','其他')),
  status          text default 'pending'
                    check (status in ('pending','in_progress','completed','blocked')),
  priority        text default 'medium'
                    check (priority in ('low','medium','high','urgent')),
  start_date      date,
  due_date        date,
  completed_date  date,
  assigned_to     text,
  progress        smallint default 0 check (progress between 0 and 100),
  notes           text
);
alter table tasks enable row level security;
create policy "登入可讀任務" on tasks for select using (auth.role() = 'authenticated');
create policy "登入可建任務" on tasks for insert with check (auth.role() = 'authenticated');
create policy "登入可改任務" on tasks for update using (auth.role() = 'authenticated');

-- ============================================================
-- 預算項目
-- ============================================================
create table if not exists budget_items (
  id              uuid default gen_random_uuid() primary key,
  created_at      timestamptz default now(),
  project_id      uuid references projects(id) on delete cascade not null,
  contractor_id   uuid references contractors(id),
  category        text not null check (category in ('土建','水電','空調','裝修','設備','消防','其他')),
  item_name       text not null,
  budgeted_amount numeric(14,2) default 0,
  actual_amount   numeric(14,2) default 0,
  paid_amount     numeric(14,2) default 0,
  payment_status  text default 'pending'
                    check (payment_status in ('pending','partial','paid')),
  invoice_no      text,
  notes           text
);
alter table budget_items enable row level security;
create policy "登入可讀預算" on budget_items for select using (auth.role() = 'authenticated');
create policy "登入可建預算" on budget_items for insert with check (auth.role() = 'authenticated');
create policy "登入可改預算" on budget_items for update using (auth.role() = 'authenticated');

-- ============================================================
-- 工程問題 / 缺失單
-- ============================================================
create table if not exists issues (
  id               uuid default gen_random_uuid() primary key,
  created_at       timestamptz default now(),
  project_id       uuid references projects(id) on delete cascade not null,
  task_id          uuid references tasks(id),
  title            text not null,
  description      text,
  severity         text default 'medium'
                     check (severity in ('low','medium','high','critical')),
  status           text default 'open'
                     check (status in ('open','in_progress','resolved','closed')),
  reported_by      text,
  assigned_to      text,
  resolved_date    date,
  resolution_notes text
);
alter table issues enable row level security;
create policy "登入可讀問題" on issues for select using (auth.role() = 'authenticated');
create policy "登入可建問題" on issues for insert with check (auth.role() = 'authenticated');
create policy "登入可改問題" on issues for update using (auth.role() = 'authenticated');

-- ============================================================
-- 工地日報
-- ============================================================
create table if not exists daily_reports (
  id                  uuid default gen_random_uuid() primary key,
  created_at          timestamptz default now(),
  project_id          uuid references projects(id) on delete cascade not null,
  report_date         date not null,
  weather             text,
  workers_count       smallint default 0,
  work_summary        text,
  progress_update     text,
  issues_encountered  text,
  next_day_plan       text,
  reported_by         text,
  constraint daily_reports_unique unique (project_id, report_date)
);
alter table daily_reports enable row level security;
create policy "登入可讀日報" on daily_reports for select using (auth.role() = 'authenticated');
create policy "登入可建日報" on daily_reports for insert with check (auth.role() = 'authenticated');
create policy "登入可改日報" on daily_reports for update using (auth.role() = 'authenticated');

-- ============================================================
-- 示範資料（可選，方便測試）
-- ============================================================
-- 執行前請先以 Supabase Auth 建立使用者，取得 user_id 後替換下方 YOUR_USER_ID

-- insert into contractors (name, company, specialty, contact_person, phone, rating, owner_id)
-- values
--   ('王師傅', '台北土建有限公司', '{土建,水電}', '王大明', '0912-345-678', 5, 'YOUR_USER_ID'),
--   ('李師傅冷氣行', '李師傅冷氣行', '{空調}', '李小華', '0922-111-222', 4, 'YOUR_USER_ID');
