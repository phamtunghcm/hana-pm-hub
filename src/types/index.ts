export type TaskStatus = 'Chưa bắt đầu' | 'Đang thực hiện' | 'Hoàn thành' | 'Đang soạn thảo' | 'Cần mua' | 'Đã chuẩn bị';
export type TaskPriority = 'Cao' | 'Trung bình' | 'Thấp' | 'Bắt buộc' | 'Cần thiết';

export interface BaseItem {
  id: string | number;
  title: string;
  status: string;
  note?: string;
  type: 'task' | 'legal' | 'doc' | 'capex';
}

export interface TaskItem extends BaseItem {
  type: 'task';
  workstream: string;
  pic: string;
  dueDate: string;
  priority: string;
  daysLeft: number;
  percent: number | string;
}

export interface LegalItem extends BaseItem {
  type: 'legal';
  agency: string;
  timeEstimate: string;
}

export interface DocItem extends BaseItem {
  type: 'doc';
  group: string;
  level: string;
  content: string;
  department: string;
  deadline: string;
}

export interface CapexItem extends BaseItem {
  type: 'capex';
  group: string;
  zone?: string;
  qty: number | string;
  unitPrice: number | string;
  totalPrice: number | string;
}

export type AnyItem = TaskItem | LegalItem | DocItem | CapexItem;

export interface AppState {
  tasks: TaskItem[];
  legal: LegalItem[];
  docs: DocItem[];
  capex: CapexItem[];
}

export interface UserPermission {
  email: string;
  name?: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
}

export interface ProjectSettings {
  logoText: string;
  brandName: string;
  subTitle: string;
  targetDate: string;
  reportEmail?: string;
  zaloWebhook?: string;
}
