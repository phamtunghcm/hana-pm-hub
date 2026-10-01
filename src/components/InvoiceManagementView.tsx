import React, { useState, useMemo } from "react";
import { useHana } from "../store/HanaContext";
import { 
  Receipt, 
  ExternalLink, 
  FolderSync, 
  Settings, 
  FileSpreadsheet, 
  Search, 
  CheckCircle2, 
  FileText, 
  Calendar, 
  Mail, 
  ShieldCheck, 
  Save, 
  Copy, 
  Layers, 
  DollarSign, 
  FileCheck2, 
  Info,
  FolderOpen
} from "lucide-react";
import type { InvoiceItem, NonInvoiceExpenseItem, InvoiceSettings } from "../types";

export default function InvoiceManagementView() {
  const { 
    invoices, 
    nonInvoices, 
    invoiceSummary, 
    invoiceSettings, 
    updateInvoiceSettings 
  } = useHana();

  const [activeTab, setActiveTab] = useState<"invoices" | "non_invoices" | "summary" | "settings">("invoices");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showConfigSavedToast, setShowConfigSavedToast] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);

  // Editable settings form state
  const [settingsForm, setSettingsForm] = useState<InvoiceSettings>({ ...invoiceSettings });

  // Format currency VND
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((item: InvoiceItem) => {
      const matchMonth = selectedMonth === "all" || item.month === selectedMonth;
      const term = searchTerm.toLowerCase();
      const matchSearch = 
        !term ||
        item.supplier.toLowerCase().includes(term) ||
        item.invoiceNo.toLowerCase().includes(term) ||
        item.taxCode.toLowerCase().includes(term) ||
        item.date.includes(term);
      return matchMonth && matchSearch;
    });
  }, [invoices, selectedMonth, searchTerm]);

  // Filtered non-invoices
  const filteredNonInvoices = useMemo(() => {
    return nonInvoices.filter((item: NonInvoiceExpenseItem) => {
      const matchMonth = selectedMonth === "all" || item.month === selectedMonth;
      const term = searchTerm.toLowerCase();
      const matchSearch = 
        !term ||
        item.transactionName.toLowerCase().includes(term) ||
        item.attachedDocs.toLowerCase().includes(term) ||
        item.date.includes(term);
      return matchMonth && matchSearch;
    });
  }, [nonInvoices, selectedMonth, searchTerm]);

  // Compute metrics
  const totalInvoicedPayment = useMemo(() => {
    return filteredInvoices.reduce((acc, cur) => acc + (cur.totalAmount || 0), 0);
  }, [filteredInvoices]);

  const totalPreTax = useMemo(() => {
    return filteredInvoices.reduce((acc, cur) => acc + (cur.preTaxAmount || 0), 0);
  }, [filteredInvoices]);

  const totalVAT = useMemo(() => {
    return filteredInvoices.reduce((acc, cur) => acc + (cur.vatAmount || 0), 0);
  }, [filteredInvoices]);

  const totalNonInvoiceExpense = useMemo(() => {
    return filteredNonInvoices.reduce((acc, cur) => acc + (cur.recordedAmount || 0), 0);
  }, [filteredNonInvoices]);

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateInvoiceSettings(settingsForm);
    setShowConfigSavedToast(true);
    setTimeout(() => setShowConfigSavedToast(false), 3500);
  };

  const handleCopyCommand = () => {
    const cmd = `cd "${settingsForm.localFolderPath || '/Users/tungpv/.gemini/antigravity/scratch'}" && python3 process_invoices.py`;
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {showConfigSavedToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-emerald-800 text-white rounded-xl shadow-xl border border-emerald-600 animate-in slide-in-from-top-3">
          <CheckCircle2 size={20} className="text-emerald-300 shrink-0" />
          <div>
            <div className="font-bold text-sm">Đã lưu & đồng bộ cấu hình thành công!</div>
            <div className="text-xs text-emerald-200">Đường dẫn lưu file và các tham số đã cập nhật trên Cloudflare KV.</div>
          </div>
        </div>
      )}

      {/* Top Banner / Header */}
      <div className="bg-[#F5F0E6] border border-[#E7E0D6] rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 bg-[#8D6E63] text-white rounded-xl shadow-sm">
              <Receipt size={22} />
            </div>
            <h1 className="text-2xl font-black text-[#4E342E] tracking-tight">Rà Soát Hóa Đơn & Chứng Từ Chi Phí</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              Circular 78 + Drive Sync
            </span>
          </div>
          <p className="text-sm text-[#7D5A50] max-w-2xl">
            Tự động quét hộp thư Gmail, bóc tách hóa đơn điện tử XML / PDF theo Thông tư 78, phân loại chứng từ theo tháng và nhà cung cấp, cập nhật file Excel tổng hợp và đồng bộ lên Google Drive.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={invoiceSettings.driveFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#8D6E63] hover:bg-[#7D5A50] text-white font-bold rounded-xl text-sm transition-all shadow-sm cursor-pointer"
            title="Mở thư mục Google Drive lưu trữ hóa đơn"
          >
            <FolderOpen size={16} />
            <span>Mở Thư Mục Drive</span>
            <ExternalLink size={14} className="opacity-70" />
          </a>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2.5 border font-bold rounded-xl text-sm transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-[#4E342E] text-white border-[#4E342E] shadow-sm"
                : "bg-white text-[#5D4037] border-[#D7CCC8] hover:bg-[#EFEBE0]"
            }`}
          >
            <Settings size={16} />
            <span>Cấu Hình Tham Số</span>
          </button>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E7E0D6] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#8D6E63] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng Thanh Toán HĐ</span>
            <DollarSign size={18} className="text-emerald-700" />
          </div>
          <div className="text-xl font-black text-[#4E342E]">{formatVND(totalInvoicedPayment)}</div>
          <div className="text-xs text-[#8D6E63] mt-1.5 flex items-center gap-1.5">
            <span className="font-semibold text-emerald-800">{filteredInvoices.length}</span> hóa đơn hợp lệ
          </div>
        </div>

        <div className="bg-white border border-[#E7E0D6] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#8D6E63] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tiền Trước Thuế & VAT</span>
            <FileSpreadsheet size={18} className="text-blue-700" />
          </div>
          <div className="text-lg font-black text-[#4E342E] truncate">{formatVND(totalPreTax)}</div>
          <div className="text-xs text-[#8D6E63] mt-1.5">
            Thuế VAT khấu trừ: <strong className="text-blue-900 font-bold">{formatVND(totalVAT)}</strong>
          </div>
        </div>

        <div className="bg-white border border-[#E7E0D6] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#8D6E63] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Chi Phí Không Hóa Đơn</span>
            <FileText size={18} className="text-amber-700" />
          </div>
          <div className="text-xl font-black text-[#4E342E]">{formatVND(totalNonInvoiceExpense)}</div>
          <div className="text-xs text-[#8D6E63] mt-1.5 flex items-center gap-1.5">
            <span className="font-semibold text-amber-900">{filteredNonInvoices.length}</span> hợp đồng / UNC tạm ứng
          </div>
        </div>

        <div className="bg-white border border-[#E7E0D6] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#8D6E63] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Đường Dẫn Lưu File</span>
            <FolderSync size={18} className="text-[#8D6E63]" />
          </div>
          <a
            href={invoiceSettings.driveFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-[#8D6E63] hover:text-[#4E342E] hover:underline flex items-center gap-1 truncate block"
            title={invoiceSettings.driveFolderUrl}
          >
            <span className="truncate">{invoiceSettings.driveRemotePath || "Google Drive Kế toán"}</span>
            <ExternalLink size={12} className="shrink-0" />
          </a>
          <div className="text-[11px] text-[#A1887F] mt-1.5 truncate">
            Excel: <span className="font-mono text-[#5D4037]">{invoiceSettings.reportFileName || "Báo cáo hoá đơn tổng hợp.xlsx"}</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#E7E0D6] pb-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "invoices"
                ? "bg-[#8D6E63] text-white shadow-sm"
                : "text-[#6D4C41] hover:bg-[#EFEBE0]"
            }`}
          >
            <Receipt size={16} />
            <span>Hóa Đơn Điện Tử ({invoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("non_invoices")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "non_invoices"
                ? "bg-[#8D6E63] text-white shadow-sm"
                : "text-[#6D4C41] hover:bg-[#EFEBE0]"
            }`}
          >
            <FileText size={16} />
            <span>Chứng Từ Không HĐ ({nonInvoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("summary")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "summary"
                ? "bg-[#8D6E63] text-white shadow-sm"
                : "text-[#6D4C41] hover:bg-[#EFEBE0]"
            }`}
          >
            <Layers size={16} />
            <span>Tổng Hợp Lũy Kế</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-[#8D6E63] text-white shadow-sm"
                : "text-[#6D4C41] hover:bg-[#EFEBE0]"
            }`}
          >
            <Settings size={16} />
            <span>Tuỳ Chỉnh Tham Số</span>
          </button>
        </div>

        {/* Filters & Search (Only shown in data tabs) */}
        {activeTab !== "settings" && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1887F]" />
              <input
                type="text"
                placeholder="Tìm NCC, số HĐ, MST..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E7E0D6] rounded-xl outline-none focus:border-[#8D6E63] text-[#4E342E] w-48 sm:w-56"
              />
            </div>

            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="text-xs font-bold bg-white border border-[#E7E0D6] rounded-xl px-3 py-1.5 text-[#5D4037] outline-none focus:border-[#8D6E63] cursor-pointer"
            >
              <option value="all">Tất cả các tháng</option>
              <option value="2026-09">Tháng 09/2026</option>
              <option value="2026-08">Tháng 08/2026</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: INVOICES TABLE */}
      {activeTab === "invoices" && (
        <div className="bg-white border border-[#E7E0D6] rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 bg-[#F5F0E6] border-b border-[#E7E0D6] flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm text-[#4E342E] uppercase tracking-wide">
              <FileCheck2 size={18} className="text-[#8D6E63]" />
              <span>Bảng 1: Danh Sách Có Hóa Đơn Điện Tử ({filteredInvoices.length} bản ghi)</span>
            </div>
            <div className="text-xs text-[#8D6E63]">
              Bóc tách tự động chuẩn Thông tư 78 từ email
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FDFBF7] text-[#5D4037] uppercase font-bold border-b border-[#E7E0D6]">
                <tr>
                  <th className="py-3 px-4 text-center w-12">STT</th>
                  <th className="py-3 px-4">Ngày HĐ</th>
                  <th className="py-3 px-4">Số Hóa Đơn</th>
                  <th className="py-3 px-4">Mã Số Thuế</th>
                  <th className="py-3 px-4 min-w-[240px]">Tên Nhà Cung Cấp</th>
                  <th className="py-3 px-4 text-right">Trước Thuế (VNĐ)</th>
                  <th className="py-3 px-4 text-right">VAT (VNĐ)</th>
                  <th className="py-3 px-4 text-right font-black">Tổng Tiền (VNĐ)</th>
                  <th className="py-3 px-4 text-center">Thư Mục / File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1]">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-[#A1887F]">
                      Không tìm thấy hóa đơn phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3 px-4 text-center text-[#8D6E63] font-medium">{item.stt}</td>
                      <td className="py-3 px-4 font-semibold text-[#4E342E] whitespace-nowrap">{item.date}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#8D6E63]">{item.invoiceNo || "-"}</td>
                      <td className="py-3 px-4 font-mono text-[#5D4037]">{item.taxCode || "-"}</td>
                      <td className="py-3 px-4 font-bold text-[#4E342E]">{item.supplier}</td>
                      <td className="py-3 px-4 text-right font-medium text-[#5D4037]">
                        {formatNumber(item.preTaxAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-blue-900">
                        {item.vatAmount > 0 ? formatNumber(item.vatAmount) : "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-900">
                        {formatNumber(item.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <a
                          href={invoiceSettings.driveFolderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F5F0E6] hover:bg-[#EFEBE0] text-[#6D4C41] hover:text-[#4E342E] font-medium rounded-lg text-[11px] transition-colors"
                          title={`Thư mục: ${item.folderName}`}
                        >
                          <FolderOpen size={13} className="text-[#8D6E63]" />
                          <span className="max-w-[120px] truncate">{item.folderName || "Mở Drive"}</span>
                          <ExternalLink size={11} className="opacity-60" />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredInvoices.length > 0 && (
                <tfoot className="bg-[#F5F0E6] font-bold text-[#4E342E] border-t border-[#E7E0D6]">
                  <tr>
                    <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider">
                      Tổng Cộng ({filteredInvoices.length} hóa đơn):
                    </td>
                    <td className="py-3 px-4 text-right">{formatNumber(totalPreTax)}</td>
                    <td className="py-3 px-4 text-right text-blue-900">{formatNumber(totalVAT)}</td>
                    <td className="py-3 px-4 text-right text-emerald-900 font-black">{formatNumber(totalInvoicedPayment)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: NON-INVOICES TABLE */}
      {activeTab === "non_invoices" && (
        <div className="bg-white border border-[#E7E0D6] rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 bg-[#F5F0E6] border-b border-[#E7E0D6] flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm text-[#4E342E] uppercase tracking-wide">
              <FileText size={18} className="text-amber-800" />
              <span>Bảng 2: Danh Sách Chứng Từ Không Hóa Đơn ({filteredNonInvoices.length} giao dịch)</span>
            </div>
            <div className="text-xs text-[#8D6E63]">
              Hợp đồng thuê nhà, thi công, mua thiết bị cũ, UNC ngân hàng tự upload
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FDFBF7] text-[#5D4037] uppercase font-bold border-b border-[#E7E0D6]">
                <tr>
                  <th className="py-3 px-4 text-center w-12">STT</th>
                  <th className="py-3 px-4">Ngày Giao Dịch</th>
                  <th className="py-3 px-4 min-w-[200px]">Tên Giao Dịch / Hạng Mục</th>
                  <th className="py-3 px-4 min-w-[280px]">Chứng Từ Đi Kèm</th>
                  <th className="py-3 px-4 text-right font-black">Số Tiền Ghi Nhận (VNĐ)</th>
                  <th className="py-3 px-4 text-center">Thư Mục Drive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1]">
                {filteredNonInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[#A1887F]">
                      Không có chứng từ không hóa đơn trong bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredNonInvoices.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3 px-4 text-center text-[#8D6E63] font-medium">{item.stt}</td>
                      <td className="py-3 px-4 font-semibold text-[#4E342E] whitespace-nowrap">{item.date || "-"}</td>
                      <td className="py-3 px-4 font-bold text-[#4E342E]">{item.transactionName}</td>
                      <td className="py-3 px-4 text-[#5D4037] font-sans">
                        <span className="line-clamp-2" title={item.attachedDocs}>{item.attachedDocs || "-"}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-amber-900">
                        {item.recordedAmount > 0 ? formatNumber(item.recordedAmount) : "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <a
                          href={invoiceSettings.driveFolderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F5F0E6] hover:bg-[#EFEBE0] text-[#6D4C41] hover:text-[#4E342E] font-medium rounded-lg text-[11px] transition-colors"
                          title={`Thư mục: ${item.folderName}`}
                        >
                          <FolderOpen size={13} className="text-[#8D6E63]" />
                          <span className="max-w-[130px] truncate">{item.folderName}</span>
                          <ExternalLink size={11} className="opacity-60" />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredNonInvoices.length > 0 && (
                <tfoot className="bg-[#F5F0E6] font-bold text-[#4E342E] border-t border-[#E7E0D6]">
                  <tr>
                    <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider">
                      Tổng Cộng Chứng Từ Chi Phí ({filteredNonInvoices.length} khoản):
                    </td>
                    <td className="py-3 px-4 text-right text-amber-900 font-black">{formatNumber(totalNonInvoiceExpense)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUMMARY MONTHS */}
      {activeTab === "summary" && (
        <div className="bg-white border border-[#E7E0D6] rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 bg-[#F5F0E6] border-b border-[#E7E0D6] flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm text-[#4E342E] uppercase tracking-wide">
              <Layers size={18} className="text-[#8D6E63]" />
              <span>Bảng Tổng Hợp Lũy Kế Theo Tháng (Trích Xuất Từ Excel)</span>
            </div>
            <div className="text-xs text-[#8D6E63]">
              Sheet "Tổng hợp" của file <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#E7E0D6]">{invoiceSettings.reportFileName || "Báo cáo hoá đơn tổng hợp.xlsx"}</code>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FDFBF7] text-[#5D4037] uppercase font-bold border-b border-[#E7E0D6]">
                <tr>
                  <th className="py-3 px-4">Tháng Báo Cáo</th>
                  <th className="py-3 px-4 text-center">Số Lượng HĐ (Bảng 1)</th>
                  <th className="py-3 px-4 text-right">Doanh Số Chưa Thuế (VNĐ)</th>
                  <th className="py-3 px-4 text-right">Thuế VAT (VNĐ)</th>
                  <th className="py-3 px-4 text-right font-black">Tổng Thanh Toán (VNĐ)</th>
                  <th className="py-3 px-4 text-center">Số Giao Dịch Không HĐ (Bảng 2)</th>
                  <th className="py-3 px-4 text-right font-black">Chi Phí Không HĐ (VNĐ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1]">
                {invoiceSummary.map((sumItem, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#4E342E] flex items-center gap-2">
                      <Calendar size={14} className="text-[#8D6E63]" />
                      <span>{sumItem.month}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-[#8D6E63]">{sumItem.invoiceCount}</td>
                    <td className="py-3 px-4 text-right font-medium text-[#5D4037]">{formatNumber(sumItem.preTax)}</td>
                    <td className="py-3 px-4 text-right font-medium text-blue-900">{formatNumber(sumItem.vat)}</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-900">{formatNumber(sumItem.total)}</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-800">{sumItem.nonInvoiceCount}</td>
                    <td className="py-3 px-4 text-right font-black text-amber-900">{formatNumber(sumItem.nonInvoiceTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CONFIGURATION & SETTINGS */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Card 1: Lưu trữ & Đường dẫn Drive (Highlighted) */}
          <div className="bg-white border-2 border-[#8D6E63]/30 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E0D6]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <FolderSync size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#4E342E] uppercase tracking-wide">
                    1. Cấu Hình Đường Dẫn Lưu File & Google Drive
                  </h2>
                  <p className="text-xs text-[#8D6E63]">
                    Quản lý liên kết Google Drive, thư mục cục bộ trên máy và tên file báo cáo Excel
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                Ưu tiên số 1
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#5D4037] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Link Thư Mục Google Drive (Dữ Liệu Kế Toán)</span>
                  <a
                    href={settingsForm.driveFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-[#8D6E63] hover:underline flex items-center gap-1 normal-case"
                  >
                    <span>Mở thử liên kết này</span>
                    <ExternalLink size={12} />
                  </a>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    required
                    value={settingsForm.driveFolderUrl}
                    onChange={e => setSettingsForm({ ...settingsForm, driveFolderUrl: e.target.value })}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="flex-1 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl px-3.5 py-2.5 text-xs text-[#4E342E] font-medium outline-none focus:border-[#8D6E63] focus:bg-white transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setSettingsForm({ 
                      ...settingsForm, 
                      driveFolderUrl: "https://drive.google.com/drive/folders/1sO3ev6apoDAINQRR1d5bQ1WHDaIA09lu" 
                    })}
                    className="px-3 py-2.5 bg-[#F5F0E6] hover:bg-[#EFEBE0] text-[#6D4C41] rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors"
                  >
                    Khôi phục mặc định
                  </button>
                </div>
                <p className="text-[11px] text-[#A1887F] mt-1">
                  Đường dẫn này được gắn vào toàn bộ các nút "Mở Drive", cột thư mục hóa đơn và chứng từ trên hệ thống.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5D4037] uppercase tracking-wider mb-1.5">
                  Tên Remote Rclone / Đám Mây
                </label>
                <input
                  type="text"
                  value={settingsForm.driveRemotePath}
                  onChange={e => setSettingsForm({ ...settingsForm, driveRemotePath: e.target.value })}
                  placeholder="hanawellness:Dữ liệu kế toán"
                  className="w-full bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl px-3.5 py-2.5 text-xs text-[#4E342E] font-mono outline-none focus:border-[#8D6E63] focus:bg-white transition-all"
                />
                <p className="text-[11px] text-[#A1887F] mt-1">
                  Cấu hình rclone remote đồng bộ file từ máy tính lên Google Drive (ví dụ: <code className="font-mono">hanawellness:Dữ liệu kế toán</code>)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5D4037] uppercase tracking-wider mb-1.5">
                  Tên File Báo Cáo Excel
                </label>
                <input
                  type="text"
                  value={settingsForm.reportFileName}
                  onChange={e => setSettingsForm({ ...settingsForm, reportFileName: e.target.value })}
                  placeholder="Báo cáo hoá đơn tổng hợp.xlsx"
                  className="w-full bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl px-3.5 py-2.5 text-xs text-[#4E342E] font-mono outline-none focus:border-[#8D6E63] focus:bg-white transition-all"
                />
                <p className="text-[11px] text-[#A1887F] mt-1">
                  File tổng hợp chứa Bảng 1 (HĐ), Bảng 2 (Không HĐ) và Sheet Tổng hợp lũy kế.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#5D4037] uppercase tracking-wider mb-1.5">
                  Thư Mục Lưu Trữ Cục Bộ (Local Directory)
                </label>
                <input
                  type="text"
                  value={settingsForm.localFolderPath}
                  onChange={e => setSettingsForm({ ...settingsForm, localFolderPath: e.target.value })}
                  placeholder="/Users/tungpv/.gemini/antigravity/scratch/Dữ liệu kế toán"
                  className="w-full bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl px-3.5 py-2.5 text-xs text-[#4E342E] font-mono outline-none focus:border-[#8D6E63] focus:bg-white transition-all"
                />
                <p className="text-[11px] text-[#A1887F] mt-1">
                  Thư mục trên máy chứa các file XML, PDF và file Excel trước khi đồng bộ lên Google Drive.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Quét Gmail IMAP */}
          <div className="bg-white border border-[#E7E0D6] rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#E7E0D6]">
              <div className="p-2 bg-blue-100 text-blue-900 rounded-xl">
                <Mail size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-[#4E342E] uppercase tracking-wide">
                  2. Cấu Hình Rà Soát Hộp Thư Email (Gmail IMAP)
                </h2>
                <p className="text-xs text-[#8D6E63]">
                  Hệ thống tự động kết nối hộp thư và tải các file XML hóa đơn Thông tư 78 & file PDF
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#5D4037] uppercase tracking-wider mb-1.5">
                  Tài Khoản Gmail Nhận Hóa Đơn
                </label>
                <input
                  type="email"
                  value={settingsForm.emailUser}
                  onChange={e => setSettingsForm({ ...settingsForm, emailUser: e.target.value })}
                  placeholder="hanawellness.official@gmail.com"
                  className="w-full bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl px-3.5 py-2.5 text-xs text-[#4E342E] font-medium outline-none focus:border-[#8D6E63] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5D4037] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Mật Khẩu Ứng Dụng Gmail (App Password)</span>
                  <span className="text-[10px] text-[#8D6E63] normal-case">16 ký tự mã ứng dụng</span>
                </label>
                <input
                  type="password"
                  value={settingsForm.emailPass || ""}
                  onChange={e => setSettingsForm({ ...settingsForm, emailPass: e.target.value })}
                  placeholder="•••• •••• •••• •••• (để trống nếu đã có trong file .env)"
                  className="w-full bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl px-3.5 py-2.5 text-xs text-[#4E342E] font-mono outline-none focus:border-[#8D6E63] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5D4037] uppercase tracking-wider mb-1.5">
                  Từ Khóa Nhận Diện Hóa Đơn Trong Tiêu Đề Email
                </label>
                <input
                  type="text"
                  value={settingsForm.searchKeywords}
                  onChange={e => setSettingsForm({ ...settingsForm, searchKeywords: e.target.value })}
                  placeholder="hóa đơn, hoá đơn, invoice, hd"
                  className="w-full bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl px-3.5 py-2.5 text-xs text-[#4E342E] outline-none focus:border-[#8D6E63] focus:bg-white transition-all"
                />
                <p className="text-[11px] text-[#A1887F] mt-1">Phân cách các từ khóa bằng dấu phẩy</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5D4037] uppercase tracking-wider mb-1.5">
                  Giới Hạn Quét Gần Nhất (Số lượng Email)
                </label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={settingsForm.scanLimit}
                  onChange={e => setSettingsForm({ ...settingsForm, scanLimit: parseInt(e.target.value) || 100 })}
                  className="w-full bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl px-3.5 py-2.5 text-xs text-[#4E342E] outline-none focus:border-[#8D6E63] focus:bg-white transition-all"
                />
                <p className="text-[11px] text-[#A1887F] mt-1">Số lượng email được quét ngược từ mới nhất về cũ hơn</p>
              </div>

              <div className="md:col-span-2 flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="autoMarkSeen"
                  checked={settingsForm.autoMarkSeen}
                  onChange={e => setSettingsForm({ ...settingsForm, autoMarkSeen: e.target.checked })}
                  className="w-4 h-4 text-[#8D6E63] rounded border-[#D7CCC8] focus:ring-[#8D6E63]"
                />
                <label htmlFor="autoMarkSeen" className="text-xs text-[#5D4037] font-medium cursor-pointer">
                  Tự động đánh dấu email đã đọc (Mark as Read / \Seen) sau khi trích xuất hóa đơn thành công
                </label>
              </div>
            </div>
          </div>

          {/* Card 3: Thông báo & Báo cáo */}
          <div className="bg-white border border-[#E7E0D6] rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#E7E0D6]">
              <div className="p-2 bg-emerald-100 text-emerald-900 rounded-xl">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-[#4E342E] uppercase tracking-wide">
                  3. Thông Báo & Gửi Báo Cáo Điều Hành
                </h2>
                <p className="text-xs text-[#8D6E63]">
                  Gửi báo cáo số liệu và link kiểm tra cho quản trị viên sau mỗi đợt quét
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#5D4037] uppercase tracking-wider mb-1.5">
                  Email Nhận Báo Cáo Tổng Hợp
                </label>
                <input
                  type="email"
                  value={settingsForm.notificationEmail}
                  onChange={e => setSettingsForm({ ...settingsForm, notificationEmail: e.target.value })}
                  placeholder="phamtunghcm@gmail.com"
                  className="w-full bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl px-3.5 py-2.5 text-xs text-[#4E342E] font-medium outline-none focus:border-[#8D6E63] focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSettingsForm({ ...invoiceSettings })}
              className="px-5 py-2.5 border border-[#D7CCC8] hover:bg-[#F5F0E6] text-[#5D4037] font-bold rounded-xl text-sm transition-colors cursor-pointer"
            >
              Hủy Thay Đổi
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-[#4E342E] hover:bg-[#3E2723] text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer"
            >
              <Save size={16} />
              <span>Lưu Cấu Hình Lên Cloudflare KV</span>
            </button>
          </div>

          {/* Card 4: Hướng dẫn kích hoạt & Trigger lệnh */}
          <div className="bg-[#FAF7F2] border border-[#E7E0D6] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-sm font-black text-[#4E342E] uppercase tracking-wide">
              <Info size={18} className="text-[#8D6E63]" />
              <span>Cách Chạy Rà Soát Tự Động Với Các Tham Số Vừa Lưu</span>
            </div>

            <p className="text-xs text-[#6D4C41] leading-relaxed">
              Bạn có thể kích hoạt quá trình quét email và đồng bộ Google Drive bất kỳ lúc nào bằng 1 trong 2 cách:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-[#E7E0D6] rounded-xl p-4 space-y-2">
                <div className="font-bold text-xs text-[#4E342E] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#8D6E63] text-white text-[11px] flex items-center justify-center font-bold">1</span>
                  <span>Chạy 1-Click bằng file .command trên Mac</span>
                </div>
                <p className="text-[11px] text-[#7D5A50]">
                  Nhấp đúp chuột vào file sau trong Finder để mở terminal và tự động quét:
                </p>
                <code className="text-[11px] font-mono block bg-[#FDFBF7] p-2 rounded-lg border border-[#E7E0D6] text-[#4E342E] break-all">
                  run_invoice_processing.command
                </code>
              </div>

              <div className="bg-white border border-[#E7E0D6] rounded-xl p-4 space-y-2">
                <div className="font-bold text-xs text-[#4E342E] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#8D6E63] text-white text-[11px] flex items-center justify-center font-bold">2</span>
                  <span>Chạy qua dòng lệnh Terminal</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[11px] font-mono bg-[#FDFBF7] p-2 rounded-lg border border-[#E7E0D6] text-[#4E342E] truncate">
                    python3 process_invoices.py
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyCommand}
                    className="flex items-center gap-1 px-3 py-2 bg-[#8D6E63] hover:bg-[#7D5A50] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    <Copy size={13} />
                    <span>{copiedCommand ? "Đã chép!" : "Sao chép"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
