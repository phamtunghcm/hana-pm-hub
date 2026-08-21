-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE task_priority AS ENUM ('Thấp', 'Trung bình', 'Cao', 'Đặc biệt cao');
CREATE TYPE task_status AS ENUM ('Chưa bắt đầu', 'Đang thực hiện', 'Đang soạn thảo', 'Đã chuẩn bị', 'Hoàn thành', 'Bị chậm', 'Có rủi ro');
CREATE TYPE compliance_status AS ENUM ('Chưa nộp', 'Đang thụ lý', 'Đã thẩm duyệt', 'Đã hoàn thành');

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_launch_date DATE NOT NULL,
    capex_budget NUMERIC(15, 2) DEFAULT 0,
    opex_ceiling_monthly NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Workstreams Table (7 Strategic Workstreams)
CREATE TABLE IF NOT EXISTS workstreams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    lead_name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#0F766E',
    sort_order INT DEFAULT 0
);

-- Tasks Table (Consolidated Tasks)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    workstream_id UUID REFERENCES workstreams(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    pic VARCHAR(100) NOT NULL,
    start_date DATE,
    due_date DATE NOT NULL,
    priority task_priority DEFAULT 'Trung bình',
    status task_status DEFAULT 'Chưa bắt đầu',
    completion_percentage INT DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
    source_reference VARCHAR(100),
    action_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Risks Table
CREATE TABLE IF NOT EXISTS risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    likelihood INT CHECK (likelihood BETWEEN 1 AND 5) NOT NULL,
    impact INT CHECK (impact BETWEEN 1 AND 5) NOT NULL,
    risk_score INT GENERATED ALWAYS AS (likelihood * impact) STORED,
    mitigation_plan TEXT NOT NULL,
    pic VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Đang kiểm soát',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Compliance Table
CREATE TABLE IF NOT EXISTS compliance_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    authority VARCHAR(100),
    legal_basis VARCHAR(150),
    template_drive_link TEXT,
    penalty_range VARCHAR(100),
    mitigation_rule TEXT NOT NULL,
    status compliance_status DEFAULT 'Chưa nộp',
    due_date DATE
);

-- Governance Policies Table
CREATE TABLE IF NOT EXISTS governance_docs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    importance VARCHAR(50) NOT NULL,
    scope_details TEXT NOT NULL,
    department VARCHAR(100) NOT NULL,
    deadline DATE,
    status VARCHAR(50) DEFAULT 'Chưa bắt đầu'
);

-- Products Menu Table
CREATE TABLE IF NOT EXISTS products_menu (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    duration_minutes INT,
    price NUMERIC(12, 2) NOT NULL,
    therapist_commission NUMERIC(12, 2) DEFAULT 0,
    consumables_cost NUMERIC(12, 2) DEFAULT 0,
    gross_margin_percent INT DEFAULT 80,
    bonus_value_description TEXT,
    validity_days INT,
    description TEXT
);

-- Care Passport Forms Table
CREATE TABLE IF NOT EXISTS care_passport_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    form_code VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    timing VARCHAR(100) NOT NULL,
    owner_role VARCHAR(100) NOT NULL,
    kpi_sla VARCHAR(255) NOT NULL
);

-- Realtime & Security
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE risks;
ALTER PUBLICATION supabase_realtime ADD TABLE compliance_items;

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE products_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_passport_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access" ON projects FOR SELECT USING (true);
CREATE POLICY "Public Read Tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Public Update Tasks" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Public Insert Tasks" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Risks" ON risks FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON products_menu FOR SELECT USING (true);
CREATE POLICY "Public Read Forms" ON care_passport_forms FOR SELECT USING (true);
