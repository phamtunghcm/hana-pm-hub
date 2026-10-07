import type { EmployeeProfile } from '../types/hr';

// Helper format VNĐ
export function formatCurrencyVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

function getBaseWordHtml(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${title}</title>
<style>
  @page {
    size: 21.0cm 29.7cm;
    margin: 2.0cm 2.0cm 2.0cm 2.5cm;
    mso-page-orientation: portrait;
  }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 13pt;
    line-height: 1.35;
    color: #000000;
  }
  h1, h2, h3, h4 {
    font-family: 'Times New Roman', Times, serif;
    margin: 0;
    padding: 0;
  }
  p {
    margin: 4pt 0;
    text-align: justify;
  }
  .header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16pt;
    border: none;
  }
  .header-table td {
    border: none;
    vertical-align: top;
    padding: 2pt 4pt;
  }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .font-bold { font-weight: bold; }
  .italic { font-style: italic; }
  .uppercase { text-transform: uppercase; }
  
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 10pt 0;
  }
  table.data-table th, table.data-table td {
    border: 1pt solid #000000;
    padding: 6pt 8pt;
    font-size: 12pt;
  }
  table.data-table th {
    background-color: #f2f2f2;
    text-align: center;
    font-weight: bold;
  }
  .sign-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 24pt;
    border: none;
  }
  .sign-table td {
    border: none;
    text-align: center;
    vertical-align: top;
    padding: 4pt;
  }
</style>
</head>
<body>
${bodyContent}
</body>
</html>`;
}

// 1. MẪU HỢP ĐỒNG LAO ĐỘNG
export function generateLaborContractDoc(emp: EmployeeProfile): string {
  const luongCoBan = formatCurrencyVND(emp.luongDongBHXH || 5500000);
  const camKet = formatCurrencyVND(emp.mucLuongCamKet || 10000000);
  const ngayVao = emp.ngayVaoLam || '01/10/2026';

  const body = `
<table class="header-table">
  <tr>
    <td class="text-center" style="width: 45%;">
      <span class="font-bold">CÔNG TY TNHH HANA WELLNESS</span><br/>
      <span>Số: ${emp.soHopDong || `${emp.maNV}/2026/HĐLĐ-HNW`}</span><br/>
      <span>---o0o---</span>
    </td>
    <td class="text-center" style="width: 55%;">
      <span class="font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br/>
      <span class="font-bold italic">Độc lập – Tự do – Hạnh phúc</span><br/>
      <span class="italic">TP. Hồ Chí Minh, ngày ${ngayVao.split('/')[0]} tháng ${ngayVao.split('/')[1]} năm ${ngayVao.split('/')[2]}</span>
    </td>
  </tr>
</table>

<div class="text-center" style="margin-bottom: 14pt;">
  <h2 class="font-bold uppercase" style="font-size: 16pt;">HỢP ĐỒNG LAO ĐỘNG</h2>
  <p class="italic text-center">(Ban hành theo Bộ luật Lao động số 45/2019/QH14 và Quy chế số 06/2026/QC-LT-HNW)</p>
</div>

<p>Chúng tôi, một bên là <strong>NGƯỜI SỬ DỤNG LAO ĐỘNG</strong>:</p>
<p><strong>CÔNG TY TNHH HANA WELLNESS</strong></p>
<p>- Đại diện bởi: <strong>Ông PHẠM VŨ TÙNG</strong> &nbsp;&nbsp;&nbsp;&nbsp; Chức vụ: <strong>Giám đốc</strong></p>
<p>- Trụ sở hoạt động: Chi nhánh Quận 3 (Trụ sở) & Chi nhánh 1 - Quận 1, TP. Hồ Chí Minh</p>
<p>- Điện thoại liên hệ: 0908 123 456 &nbsp;&nbsp;&nbsp;&nbsp; Email: contact@hanawellness.vn</p>

<p style="margin-top: 8pt;">Và một bên là <strong>NGƯỜI LAO ĐỘNG</strong>:</p>
<p>- Họ và tên: <strong class="uppercase">${emp.hoTen}</strong> &nbsp;&nbsp;&nbsp;&nbsp; Giới tính: ${emp.gioiTinh || 'Nữ'}</p>
<p>- Sinh ngày: ${emp.ngaySinh || '...'} &nbsp;&nbsp;&nbsp;&nbsp; Quốc tịch: Việt Nam</p>
<p>- Số CCCD: <strong>${emp.soCCCD || '...'}</strong> &nbsp;&nbsp;&nbsp;&nbsp; Cấp ngày: ${emp.ngayCapCCCD || '...'} &nbsp;&nbsp;&nbsp;&nbsp; Nơi cấp: ${emp.noiCapCCCD || 'Cục Cảnh sát QLHC về TTXH'}</p>
<p>- Quê quán: ${emp.queQuan || '...'}</p>
<p>- Nơi đăng ký HKTT: ${emp.diaChiThuongTru || '...'}</p>
<p>- Chỗ ở hiện nay: ${emp.choOHienNay || '...'}</p>
<p>- Số điện thoại: <strong>${emp.soDienThoai || '...'}</strong> &nbsp;&nbsp;&nbsp;&nbsp; Email: ${emp.email || '...'}</p>
<p>- Số tài khoản ngân hàng: <strong>${emp.soTaiKhoan || '...'}</strong> tại ${emp.nganHang || 'Ngân hàng TMCP'}</p>

<p>Thỏa thuận ký kết Hợp đồng lao động và cam kết làm đúng những điều khoản sau đây:</p>

<p class="font-bold">ĐIỀU 1: THỜI HẠN VÀ CÔNG VIỆC HỢP ĐỒNG</p>
<p>1. Loại hợp đồng lao động: ${emp.loaiHopDong || 'Hợp đồng lao động xác định thời hạn 12 tháng'}.</p>
<p>2. Từ ngày: <strong>${ngayVao}</strong>.</p>
<p>3. Địa điểm làm việc: <strong>${emp.chiNhanhTen || 'Cơ sở Hana Wellness'}</strong>.</p>
<p>4. Chức danh chuyên môn: <strong>${emp.chucVuLabel}</strong> (Ngạch: <strong>${emp.ngach}</strong> - Bậc: <strong>${emp.bac}</strong>).</p>
<p>5. Nhiệm vụ công việc: Trực tiếp thực hiện các quy trình dịch vụ chăm sóc sức khỏe, phục vụ khách theo chuẩn phác đồ trị liệu Hana Care Passport và phân công của Ban Quản lý.</p>

<p class="font-bold">ĐIỀU 2: CHẾ ĐỘ LÀM VIỆC VÀ NGHỈ NGƠI</p>
<p>1. Thời giờ làm việc: Theo ca vận hành chuẩn của cơ sở (09:00 - 19:00 hàng ngày), đảm bảo 26 công chuẩn/tháng.</p>
<p>2. Chế độ nghỉ ngơi: Được nghỉ từ 3 - 4 ngày/tháng có hưởng nguyên lương theo lịch phân ca được duyệt.</p>

<p class="font-bold">ĐIỀU 3: TIỀN LƯƠNG, PHỤ CẤP VÀ CHẾ ĐỘ ĐÃI NGỘ</p>
<p>1. <strong>Lương cơ bản đóng BHXH: ${luongCoBan}/tháng</strong> (căn cứ tính trích nộp bảo hiểm bắt buộc và chế độ thai sản, ốm đau).</p>
<p>2. <strong>Mức thu nhập cam kết theo hiệu suất: ${camKet}/tháng</strong> (nếu làm đủ 26 công chuẩn và đạt KPI đánh giá).</p>
<p>3. <strong>Phụ cấp ăn trưa:</strong> Hỗ trợ 40.000 VNĐ/bữa (ngày 2 bữa theo ca thực tế, tối đa 800.000 VNĐ/tháng).</p>
<p>4. <strong>Phụ cấp xăng xe:</strong> Tính theo ngày công thực tế, định mức chuẩn tối đa 500.000 VNĐ/tháng.</p>
<p>5. <strong>Phụ cấp gửi xe:</strong> Hỗ trợ tối đa 200.000 VNĐ/tháng.</p>
<p>6. <strong>Đồng phục:</strong> Công ty cấp phát 02 bộ đồng phục/năm theo quy chuẩn nhận diện thương hiệu.</p>
<p>7. <strong>Chế độ BHXH:</strong> Trích nộp 10.5% từ lương người lao động (BHXH 8%, BHYT 1.5%, BHTN 1%) và Công ty đóng 21.5% theo luật định.</p>
<p>8. <strong>Kỳ trả lương:</strong> Chi trả vào ngày 05 đến ngày 10 hàng tháng qua tài khoản ngân hàng của Người lao động.</p>

<p class="font-bold">ĐIỀU 4: NGHĨA VỤ VÀ ĐIỀU KHOẢN THI HÀNH</p>
<p>1. Người lao động cam kết chấp hành nghiêm Nội quy lao động, Quy chế 06/2026/QC-LT-HNW và Bản thỏa thuận bảo mật thông tin (NDA).</p>
<p>2. Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, Người sử dụng lao động giữ 01 bản, Người lao động giữ 01 bản.</p>

<table class="sign-table">
  <tr>
    <td style="width: 50%;">
      <span class="font-bold">NGƯỜI LAO ĐỘNG</span><br/>
      <span class="italic">(Ký và ghi rõ họ tên)</span>
      <br/><br/><br/><br/><br/>
      <span class="font-bold uppercase">${emp.hoTen}</span>
    </td>
    <td style="width: 50%;">
      <span class="font-bold">ĐẠI DIỆN NGƯỜI SỬ DỤNG LAO ĐỘNG</span><br/>
      <span class="font-bold">GIÁM ĐỐC</span><br/>
      <span class="italic">(Ký tên và đóng dấu)</span>
      <br/><br/><br/><br/>
      <span class="font-bold uppercase">PHẠM VŨ TÙNG</span>
    </td>
  </tr>
</table>
`;
  return getBaseWordHtml(`Hop_Dong_Lao_Dong_${emp.maNV}`, body);
}

// 2. MẪU QUYẾT ĐỊNH TIẾP NHẬN & BỔ NHIỆM
export function generateAppointmentDoc(emp: EmployeeProfile): string {
  const luongCoBan = formatCurrencyVND(emp.luongDongBHXH || 5500000);
  const ngayVao = emp.ngayVaoLam || '01/10/2026';

  const body = `
<table class="header-table">
  <tr>
    <td class="text-center" style="width: 45%;">
      <span class="font-bold">CÔNG TY TNHH HANA WELLNESS</span><br/>
      <span>Số: ${emp.maNV}/2026/QĐ-HNW</span><br/>
      <span>---o0o---</span>
    </td>
    <td class="text-center" style="width: 55%;">
      <span class="font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br/>
      <span class="font-bold italic">Độc lập – Tự do – Hạnh phúc</span><br/>
      <span class="italic">TP. Hồ Chí Minh, ngày ${ngayVao.split('/')[0]} tháng ${ngayVao.split('/')[1]} năm ${ngayVao.split('/')[2]}</span>
    </td>
  </tr>
</table>

<div class="text-center" style="margin-bottom: 14pt;">
  <h2 class="font-bold uppercase" style="font-size: 15pt;">QUYẾT ĐỊNH</h2>
  <h3 class="font-bold" style="font-size: 13pt;">V/v Tiếp nhận nhân sự và xếp ngạch bậc lương</h3>
  <p class="italic text-center">GIÁM ĐỐC CÔNG TY TNHH HANA WELLNESS</p>
</div>

<p>- Căn cứ Điều lệ tổ chức và hoạt động của Công ty TNHH Hana Wellness;</p>
<p>- Căn cứ Quy chế Lương, Thưởng, Phúc lợi số 06/2026/QC-LT-HNW ban hành ngày 20/09/2026;</p>
<p>- Căn cứ yêu cầu công tác và năng lực chuyên môn của Người lao động;</p>

<p class="text-center font-bold" style="margin: 12pt 0; font-size: 14pt;">QUYẾT ĐỊNH:</p>

<p><strong>Điều 1:</strong> Tiếp nhận và bố trí công tác đối với:</p>
<p>- Ông/Bà: <strong class="uppercase">${emp.hoTen}</strong> &nbsp;&nbsp;&nbsp;&nbsp; Mã nhân viên: <strong>${emp.maNV}</strong></p>
<p>- Ngày sinh: ${emp.ngaySinh} &nbsp;&nbsp;&nbsp;&nbsp; Số CCCD: ${emp.soCCCD}</p>
<p>- Chức vụ / Vị trí việc làm: <strong>${emp.chucVuLabel}</strong></p>
<p>- Đơn vị công tác: <strong>${emp.chiNhanhTen}</strong></p>

<p><strong>Điều 2:</strong> Xếp ngạch bậc và chế độ đãi ngộ:</p>
<p>- Ngạch chức danh: <strong>${emp.ngach}</strong> &nbsp;&nbsp;&nbsp;&nbsp; Bậc lương: <strong>Bậc ${emp.bac}</strong></p>
<p>- Mức lương cơ bản thỏa thuận: <strong>${luongCoBan}/tháng</strong></p>
<p>- Các khoản phụ cấp ăn trưa, xăng xe, tiền gửi xe và thưởng hiệu suất theo đúng quy định tại Quy chế 06/2026/QC-LT-HNW.</p>

<p><strong>Điều 3:</strong> Quyết định này có hiệu lực kể từ ngày <strong>${ngayVao}</strong>. Phòng Hành chính - Nhân sự, Bộ phận Kế toán và Ông/Bà <strong>${emp.hoTen}</strong> có trách nhiệm thi hành quyết định này.</p>

<table class="sign-table">
  <tr>
    <td style="width: 50%; text-align: left;">
      <span class="font-bold italic">Nơi nhận:</span><br/>
      <span style="font-size: 11pt;">- Như Điều 3;</span><br/>
      <span style="font-size: 11pt;">- Lưu: Hồ sơ nhân sự Drive.</span>
    </td>
    <td style="width: 50%;">
      <span class="font-bold">GIÁM ĐỐC CÔNG TY</span><br/>
      <span class="italic">(Ký tên và đóng dấu)</span>
      <br/><br/><br/><br/>
      <span class="font-bold uppercase">PHẠM VŨ TÙNG</span>
    </td>
  </tr>
</table>
`;
  return getBaseWordHtml(`Quyet_Dinh_Tiep_Nhan_${emp.maNV}`, body);
}

// 3. MẪU BẢN CAM KẾT ĐÀO TẠO & THỎA THUẬN BẢO MẬT (NDA)
export function generateNDATrainingDoc(emp: EmployeeProfile): string {
  const ngayVao = emp.ngayVaoLam || '01/10/2026';

  const body = `
<table class="header-table">
  <tr>
    <td class="text-center" style="width: 45%;">
      <span class="font-bold">CÔNG TY TNHH HANA WELLNESS</span><br/>
      <span>Mã NV: ${emp.maNV}</span><br/>
      <span>---o0o---</span>
    </td>
    <td class="text-center" style="width: 55%;">
      <span class="font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br/>
      <span class="font-bold italic">Độc lập – Tự do – Hạnh phúc</span><br/>
      <span class="italic">TP. Hồ Chí Minh, ngày ${ngayVao.split('/')[0]} tháng ${ngayVao.split('/')[1]} năm ${ngayVao.split('/')[2]}</span>
    </td>
  </tr>
</table>

<div class="text-center" style="margin-bottom: 14pt;">
  <h2 class="font-bold uppercase" style="font-size: 15pt;">BẢN CAM KẾT ĐÀO TẠO NGHỀ</h2>
  <h3 class="font-bold uppercase" style="font-size: 13pt;">VÀ THỎA THUẬN BẢO MẬT THÔNG TIN (NDA)</h3>
  <p class="italic text-center">(Căn cứ Điều 62 Bộ luật Lao động 2019 và Quy chế Quản trị nội bộ Hana Wellness)</p>
</div>

<p>Tôi tên là: <strong class="uppercase">${emp.hoTen}</strong></p>
<p>Sinh ngày: ${emp.ngaySinh} &nbsp;&nbsp;&nbsp;&nbsp; Số CCCD: <strong>${emp.soCCCD}</strong></p>
<p>Vị trí công tác: <strong>${emp.chucVuLabel}</strong> tại <strong>${emp.chiNhanhTen}</strong></p>

<p>Nay tôi tự nguyện làm bản cam kết với Công ty TNHH Hana Wellness những nội dung sau:</p>

<p class="font-bold">I. CAM KẾT ĐÀO TẠO NGHỀ VÀ THỜI GIAN LÀM VIỆC:</p>
<p>1. Tôi được Công ty tạo điều kiện đào tạo nâng cao tay nghề về vận hành máy điện sinh học DDS, kỹ thuật xoa bóp bấm huyệt trị liệu và quy trình phục vụ chuẩn Hana Care Passport.</p>
<p>2. Tôi cam kết làm việc phục vụ tại Công ty tối thiểu <strong>12 tháng</strong> kể từ ngày hoàn thành khóa đào tạo.</p>
<p>3. Trường hợp tôi tự ý bỏ việc hoặc đơn phương chấm dứt HĐLĐ trái pháp luật trước thời hạn, tôi cam kết hoàn trả toàn bộ chi phí đào tạo theo quy định tại Điều 62 Bộ luật Lao động 2019.</p>

<p class="font-bold">II. CAM KẾT BẢO MẬT THÔNG TIN (NDA):</p>
<p>1. <strong>Bảo mật hồ sơ khách hàng:</strong> Không sao chép, trích xuất dữ liệu thẻ liệu trình, bản đồ đau cơ thể (Bodymap), số điện thoại hoặc thông tin y tế của khách hàng ra ngoài hệ thống.</p>
<p>2. <strong>Bảo mật bí quyết kinh doanh:</strong> Không chia sẻ phác đồ trị liệu độc quyền, công thức thảo dược dưỡng sinh và quy trình vận hành cho bất kỳ cá nhân, đơn vị nào ngoài Hana Wellness.</p>
<p>3. <strong>Bảo mật thông tin lương:</strong> Cam kết tuyệt đối không tiết lộ thông tin lương và thu nhập của bản thân và đồng nghiệp.</p>
<p>4. Nếu vi phạm, tôi hoàn toàn chịu trách nhiệm bồi thường thiệt hại trước pháp luật và chịu các hình thức kỷ luật lao động của Công ty.</p>

<table class="sign-table">
  <tr>
    <td style="width: 50%;">
      <span class="font-bold">XÁC NHẬN CỦA CÔNG TY</span><br/>
      <span class="font-bold">GIÁM ĐỐC</span><br/>
      <br/><br/><br/><br/>
      <span class="font-bold uppercase">PHẠM VŨ TÙNG</span>
    </td>
    <td style="width: 50%;">
      <span class="font-bold">NGƯỜI CAM KẾT</span><br/>
      <span class="italic">(Ký và ghi rõ họ tên)</span><br/>
      <br/><br/><br/><br/>
      <span class="font-bold uppercase">${emp.hoTen}</span>
    </td>
  </tr>
</table>
`;
  return getBaseWordHtml(`Cam_Ket_NDA_${emp.maNV}`, body);
}

// 4. MẪU PHIẾU BÁO LƯƠNG & ĐÃI NGỘ CBNV CHUẨN
export function generateSalaryNoticeDoc(emp: EmployeeProfile): string {
  const luongCoBan = emp.luongDongBHXH || 5500000;
  const camKet = emp.mucLuongCamKet || 10000000;
  const luongHieuSuat = Math.max(0, camKet - luongCoBan);
  const phuCapCom = 800000;
  const phuCapXe = 200000;
  const tongThuNhapA = luongCoBan + luongHieuSuat + phuCapCom + phuCapXe;
  const bhxhNld = Math.round(luongCoBan * 0.105);
  const thucLinh = tongThuNhapA - bhxhNld;

  const body = `
<table class="header-table">
  <tr>
    <td class="text-center" style="width: 45%;">
      <span class="font-bold">CÔNG TY TNHH HANA WELLNESS</span><br/>
      <span>Kỳ lương: Tháng 10/2026</span><br/>
    </td>
    <td class="text-center" style="width: 55%;">
      <span class="font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br/>
      <span class="font-bold italic">Độc lập – Tự do – Hạnh phúc</span><br/>
    </td>
  </tr>
</table>

<div class="text-center" style="margin-bottom: 12pt;">
  <h2 class="font-bold uppercase" style="font-size: 15pt; color: #1a365d;">PHIẾU BÁO LƯƠNG & ĐÃI NGỘ CBNV</h2>
  <p class="italic text-center">Căn cứ Quy chế số 06/2026/QC-LT-HNW và Bảng chấm công thực tế</p>
</div>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 10pt;">
  <tr>
    <td style="border: none; padding: 2pt;">Họ và tên: <strong class="uppercase">${emp.hoTen}</strong></td>
    <td style="border: none; padding: 2pt;">Mã nhân viên: <strong>${emp.maNV}</strong></td>
  </tr>
  <tr>
    <td style="border: none; padding: 2pt;">Vị trí: <strong>${emp.chucVuLabel}</strong></td>
    <td style="border: none; padding: 2pt;">Công chuẩn: <strong>26 công</strong></td>
  </tr>
  <tr>
    <td style="border: none; padding: 2pt;">Chi nhánh: ${emp.chiNhanhTen}</td>
    <td style="border: none; padding: 2pt;">Tài khoản nhận: ${emp.soTaiKhoan} (${emp.nganHang})</td>
  </tr>
</table>

<table class="data-table">
  <tr>
    <th style="width: 50%;">I. THU NHẬP & PHỤ CẤP</th>
    <th style="width: 25%;">Mức hưởng</th>
    <th style="width: 25%;">Thành tiền (VNĐ)</th>
  </tr>
  <tr>
    <td>1. Lương cơ bản (đóng BHXH)</td>
    <td class="text-right">${formatCurrencyVND(luongCoBan)}</td>
    <td class="text-right font-bold">${formatCurrencyVND(luongCoBan)}</td>
  </tr>
  <tr>
    <td>2. Lương hiệu suất (Bù đủ gói 10tr)</td>
    <td class="text-right">${formatCurrencyVND(luongHieuSuat)}</td>
    <td class="text-right font-bold">${formatCurrencyVND(luongHieuSuat)}</td>
  </tr>
  <tr>
    <td>3. Phụ cấp tiền cơm (40k x 2 bữa)</td>
    <td class="text-right">40.000 đ/bữa</td>
    <td class="text-right font-bold">${formatCurrencyVND(phuCapCom)}</td>
  </tr>
  <tr>
    <td>4. Phụ cấp gửi xe hàng tháng</td>
    <td class="text-right">200.000 đ/tháng</td>
    <td class="text-right font-bold">${formatCurrencyVND(phuCapXe)}</td>
  </tr>
  <tr style="background-color: #f7fafc;">
    <td class="font-bold">TỔNG THU NHẬP TRƯỚC TRÍCH TRỪ (A)</td>
    <td></td>
    <td class="text-right font-bold" style="color: #2b6cb0;">${formatCurrencyVND(tongThuNhapA)}</td>
  </tr>
  <tr>
    <th colspan="3" style="text-align: left; background-color: #edf2f7;">II. CÁC KHOẢN TRÍCH TRỪ BẢO HIỂM (10.5%)</th>
  </tr>
  <tr>
    <td>1. BHXH (Hưu trí, thai sản - 8.0%)</td>
    <td class="text-center">8.0%</td>
    <td class="text-right">${formatCurrencyVND(Math.round(luongCoBan * 0.08))}</td>
  </tr>
  <tr>
    <td>2. BHYT (Khám chữa bệnh - 1.5%)</td>
    <td class="text-center">1.5%</td>
    <td class="text-right">${formatCurrencyVND(Math.round(luongCoBan * 0.015))}</td>
  </tr>
  <tr>
    <td>3. BHTN (Bảo hiểm thất nghiệp - 1.0%)</td>
    <td class="text-center">1.0%</td>
    <td class="text-right">${formatCurrencyVND(Math.round(luongCoBan * 0.01))}</td>
  </tr>
  <tr style="background-color: #fff5f5;">
    <td class="font-bold">TỔNG CÁC KHOẢN TRÍCH TRỪ (B)</td>
    <td class="text-center font-bold">10.5%</td>
    <td class="text-right font-bold" style="color: #c53030;">-${formatCurrencyVND(bhxhNld)}</td>
  </tr>
  <tr style="background-color: #f0fff4;">
    <td class="font-bold" style="font-size: 13pt;">THỰC LĨNH CHUYỂN KHOẢN (A - B)</td>
    <td></td>
    <td class="text-right font-bold" style="font-size: 14pt; color: #22543d;">${formatCurrencyVND(thucLinh)}</td>
  </tr>
</table>

<table class="sign-table">
  <tr>
    <td style="width: 50%;">
      <span class="font-bold">NGƯỜI LẬP BIỂU</span><br/>
      <span class="italic">(Ký, họ tên)</span>
      <br/><br/><br/><br/>
      <span>Kế toán Hana</span>
    </td>
    <td style="width: 50%;">
      <span class="font-bold">GIÁM ĐỐC DUYỆT CHI</span><br/>
      <span class="italic">(Ký tên và đóng dấu)</span>
      <br/><br/><br/><br/>
      <span class="font-bold uppercase">PHẠM VŨ TÙNG</span>
    </td>
  </tr>
</table>
`;
  return getBaseWordHtml(`Phieu_Luong_${emp.maNV}`, body);
}

// Hàm tải file Word (.doc) về máy
export function downloadWordDocument(filename: string, htmlContent: string) {
  const blob = new Blob(['\ufeff' + htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helper loại bỏ dấu tiếng Việt để đặt tên file gọn đẹp
export function toNonAccentVietnamese(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}
