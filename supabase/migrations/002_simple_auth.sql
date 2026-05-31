-- ============================================================
-- 002: 切換為簡易帳號系統（無密碼，管理員建立帳號）
-- ============================================================

-- 移除原本的 Supabase Auth trigger（這是造成「Database error」的根源）
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

-- ============================================================
-- 帳號資料表（與 Supabase Auth 無關）
-- ============================================================
create table if not exists app_users (
  id           uuid default gen_random_uuid() primary key,
  created_at   timestamptz default now(),
  username     text unique not null,          -- 文字+數字，登入用
  display_name text,                          -- 顯示名稱
  role         text default 'viewer'
                 check (role in ('admin','manager','supervisor','viewer')),
  is_active    boolean default true
);

alter table app_users enable row level security;
create policy "app_users_all" on app_users for all using (true) with check (true);

-- 預設管理員帳號
insert into app_users (username, display_name, role)
values ('goodmask77', '系統管理員', 'admin')
on conflict (username) do nothing;

-- ============================================================
-- 移除各 table 對 auth.users 的 FK，改為寬鬆 RLS
-- ============================================================

-- contractors
alter table contractors drop constraint if exists contractors_owner_id_fkey;
drop policy if exists "登入可讀" on contractors;
drop policy if exists "登入可寫" on contractors;
drop policy if exists "登入可改" on contractors;
create policy "contractors_all" on contractors for all using (true) with check (true);

-- projects
alter table projects drop constraint if exists projects_owner_id_fkey;
drop policy if exists "登入可讀專案" on projects;
drop policy if exists "登入可建專案" on projects;
drop policy if exists "擁有人可改" on projects;
create policy "projects_all" on projects for all using (true) with check (true);

-- tasks
drop policy if exists "登入可讀任務" on tasks;
drop policy if exists "登入可建任務" on tasks;
drop policy if exists "登入可改任務" on tasks;
create policy "tasks_all" on tasks for all using (true) with check (true);

-- budget_items
drop policy if exists "登入可讀預算" on budget_items;
drop policy if exists "登入可建預算" on budget_items;
drop policy if exists "登入可改預算" on budget_items;
create policy "budget_all" on budget_items for all using (true) with check (true);

-- issues
drop policy if exists "登入可讀問題" on issues;
drop policy if exists "登入可建問題" on issues;
drop policy if exists "登入可改問題" on issues;
create policy "issues_all" on issues for all using (true) with check (true);

-- daily_reports
drop policy if exists "登入可讀日報" on daily_reports;
drop policy if exists "登入可建日報" on daily_reports;
drop policy if exists "登入可改日報" on daily_reports;
create policy "reports_all" on daily_reports for all using (true) with check (true);

-- profiles（若存在）
drop policy if exists "使用者可讀自己的 profile" on profiles;
drop policy if exists "使用者可更新自己的 profile" on profiles;
