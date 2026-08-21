-- SUPABASE DATABASE SCHEMA FOR HANA WELLNESS PM HUB
-- Copy và dán toàn bộ đoạn mã này vào Supabase SQL Editor -> Run

-- 1. Bảng Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    workstream TEXT NOT NULL,
    title TEXT NOT NULL,
    pic TEXT,
    due_date TEXT,
    priority TEXT,
    status TEXT NOT NULL DEFAULT 'Chưa bắt đầu',
    days_left INT DEFAULT 0,
    percent NUMERIC DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Bảng Legal (Hồ sơ Pháp lý)
CREATE TABLE IF NOT EXISTS public.legal (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    agency TEXT,
    time_estimate TEXT,
    status TEXT NOT NULL DEFAULT 'Chưa bắt đầu',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Bảng Docs (Văn bản Nội bộ)
CREATE TABLE IF NOT EXISTS public.docs (
    id TEXT PRIMARY KEY,
    group_name TEXT,
    title TEXT NOT NULL,
    level TEXT,
    content TEXT,
    department TEXT,
    deadline TEXT,
    status TEXT NOT NULL DEFAULT 'Chưa bắt đầu',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Bảng Capex (Ngân sách Mua sắm)
CREATE TABLE IF NOT EXISTS public.capex (
    id TEXT PRIMARY KEY,
    group_name TEXT,
    title TEXT NOT NULL,
    qty INT DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    total_price NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Chưa bắt đầu',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Bảng Settings (Cấu hình dự án)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cho phép truy cập công khai (Read/Write Public RLS Policies for PM Hub demo)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capex ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access tasks" ON public.tasks FOR ALL USING (true);
CREATE POLICY "Allow public access legal" ON public.legal FOR ALL USING (true);
CREATE POLICY "Allow public access docs" ON public.docs FOR ALL USING (true);
CREATE POLICY "Allow public access capex" ON public.capex FOR ALL USING (true);
CREATE POLICY "Allow public access settings" ON public.settings FOR ALL USING (true);
