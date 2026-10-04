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

export interface InvoiceItem {
  id: string | number;
  month: string;
  stt: number;
  date: string;
  invoiceNo: string;
  symbol?: string;
  taxCode: string;
  supplier: string;
  preTaxAmount: number;
  vatAmount: number;
  totalAmount: number;
  folderName?: string;
  drivePath?: string;
  driveLink?: string;
  status?: string;
  files?: string[];
}

export interface NonInvoiceExpenseItem {
  id: string | number;
  month: string;
  stt: number;
  date: string;
  transactionName: string;
  attachedDocs: string;
  recordedAmount: number;
  folderName?: string;
  drivePath?: string;
  driveLink?: string;
}

export interface InvoiceSummaryMonth {
  month: string;
  monthKey?: string;
  monthLabel?: string;
  invoiceCount: number;
  preTax?: number;
  preTaxAmount?: number;
  vat?: number;
  vatAmount?: number;
  total?: number;
  totalPaymentAmount?: number;
  nonInvoiceCount: number;
  nonInvoiceTotal?: number;
  nonInvoiceAmount?: number;
}

export interface InvoiceSettings {
  driveFolderUrl: string;
  driveRemotePath: string;
  localFolderPath: string;
  reportFileName: string;
  emailUser: string;
  emailPass?: string;
  searchKeywords: string;
  scanLimit: number;
  notificationEmail: string;
  autoMarkSeen: boolean;
}

export interface AppState {
  tasks: TaskItem[];
  legal: LegalItem[];
  docs: DocItem[];
  capex: CapexItem[];
  invoices?: InvoiceItem[];
  nonInvoices?: NonInvoiceExpenseItem[];
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
  resendApiKey?: string;
  invoiceSettings?: InvoiceSettings;
}
