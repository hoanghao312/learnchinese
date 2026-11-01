# Tối ưu hóa Giao diện & Trải nghiệm Di động (Mobile UX Optimization)

Nâng cấp toàn diện khả năng hiển thị và thao tác cảm ứng trên màn hình điện thoại (`360px–430px`) cho toàn bộ các tab chính của **Thảo Mochi**, đảm bảo không có thành phần nào bị tràn mép, chồng chéo hoặc chiếm dụng mất không gian học tập, đồng thời giữ nguyên trải nghiệm màn hình rộng trên máy tính (Desktop).

## User Review & Critical Decisions

> [!IMPORTANT]
> Kế hoạch dưới đây tổng hợp các lựa chọn bạn đã xác nhận để tối ưu hóa toàn diện ứng dụng trên điện thoại mà không làm thay đổi bố cục chuẩn trên máy tính.

- **Quyết định đã xác nhận 1 (Phạm vi tối ưu)**: Tối ưu toàn bộ các tab chính trên mobile (**Học tập / Bàn đọc**, **Phòng luyện nghe**, **Sổ từ vựng**, **Bài học**, **Luyện tập**, **Tạo câu chuyện / Trợ lý AI**, và **Thanh điều hướng dưới cùng**).
- **Quyết định đã xác nhận 2 (Tự động căn bảng tra từ & menu ngữ cảnh)**: Tự động giới hạn tọa độ ngang (`left`) và dọc (`top`/`bottom`) kèm khoảng đệm an toàn `12px` cách mép màn hình cho **Bảng thông tin từ vựng** (`220px–280px`), **Bảng công cụ từ vựng**, và **Thanh công cụ bôi đen câu**, đảm bảo không bao giờ bị tràn hoặc khuất mép trên màn hình điện thoại nhỏ.
- **Quyết định đã xác nhận 3 (Thu gọn thanh công cụ trên màn hình nhỏ)**:
  - Thu gọn thông minh thanh điều khiển **Bàn đọc** và **Phòng luyện nghe** trên mobile.
  - Đặc biệt trong **Phòng luyện nghe**, tự động thu gọn cột **Track Controls** bên trái trên màn hình điện thoại (chuyển thành nút bật/tắt gọn nhẹ trên thanh công cụ) để nhường trọn 100% bề ngang cho dải sóng âm (Waveform).
- **Mặc định khuyến nghị cho Sổ từ vựng trên Mobile**: Hiển thị danh sách từ vựng dưới dạng **Thẻ từ vựng gọn gàng 2 hàng vừa khít chiều ngang điện thoại** (Hàng 1: Số thứ tự, Chữ Hán, Pinyin, Nghĩa tiếng Việt và cụm nút thao tác; Hàng 2: Loại từ màu tím • Cấp HSK màu đỏ • Thư mục • Điểm số), đồng thời chuyển cây Thư mục trên mobile thành thanh chọn nhanh thay vì chiếm nửa trên màn hình.

---

## 1. Overview & Core Concept

- **Mục tiêu**: Mang lại trải nghiệm học tiếng Trung bằng một tay mượt mà, thoáng đãng và chuẩn xác trên điện thoại di động (`360px–430px`) mà vẫn giữ nguyên bố cục đa cột chuyên nghiệp trên máy tính (`sm:` / `md:` / `lg:`).
- **Đối tượng sử dụng**: Người học sử dụng điện thoại để đọc bài khóa, tra từ nhanh một chạm, luyện nghe sóng âm, ôn tập Flashcards và quản lý sổ từ vựng mọi lúc mọi nơi.
- **Giá trị cốt lõi**:
  - **Không tràn mép (Zero Horizontal Overflow)**: Mọi bảng tra từ, thanh điều hướng 6 tab, cửa sổ chat nổi và thẻ từ vựng đều nằm gọn trong khung nhìn.
  - **Tối ưu diện tích nội dung**: Tăng diện tích hiển thị sóng âm và văn bản đọc trên màn hình nhỏ bằng cách gom gọn các thanh công cụ nhiều nút.

---

## 2. User Experience & Visual Design

### A. Thanh Header & Thanh Điều Hướng Đáy (Bottom Navigation Bar)
- **Header thu gọn**: Giảm chiều cao trên mobile xuống `48px` (`h-12 sm:h-[52px]`), căn chỉnh biểu tượng logo và tiêu đề cân đối, đảm bảo tổng diện tích thanh cố định (Header + Bottom Nav) luôn tuân thủ ngưỡng gọn gàng cho nội dung chính.
- **Bottom Navigation Bar 6 tab vừa khít màn hình nhỏ**:
  - Thay chiều rộng cố định (`w-16` / `w-20` gây tràn trên màn hình `360px–375px`) bằng `flex-1 min-w-0 py-1.5` chia đều 6 cột cho **Học tập**, **Bài học**, **Tạo câu chuyện**, **Từ vựng**, **Trợ lý AI**, và **Tài khoản**.
  - Nhãn chữ tự động co gọn (`text-[10px] sm:text-xs truncate`) và vùng chạm đạt chuẩn cảm ứng (`min-h-[48px]`).
- **Cửa sổ Trợ lý AI nổi (Floating Chat Window)**: Tự động co giãn theo khung nhìn mobile (`w-[calc(100vw-1.5rem)] right-3 sm:w-[400px] sm:right-8 max-h-[72dvh]`) để không bị tràn khỏi mép trái điện thoại.

### B. Tab Học tập: Bàn Đọc (Reading Desk) & Tự Động Căn Bảng Tra Từ
- **Chuyển đổi chế độ học (Đọc vs Luyện nghe)**: Chia đều 2 nút chuyển tab trên mobile (`flex-1 sm:flex-initial justify-center`) để thao tác chạm dễ dàng.
- **Thanh điều khiển Bàn đọc (Reading Desk Toolbar)**:
  - Chuyển sang bố cục tự động xuống dòng mượt mà trên mobile (`flex-col sm:flex-row items-stretch sm:items-center gap-2.5`).
  - Hàng trên hiển thị tiêu đề bài đọc và nút sửa tên; hàng dưới xếp gọn bộ chọn giọng đọc (`flex-1 min-w-0`) cùng các nút chức năng (**Đọc toàn bài**, **Lặp**, **Hiện/Ẩn Pinyin**, **Lưu bài**, **Sửa văn bản**, **Nghe đoạn văn**) với kích thước nút chạm tối ưu.
- **Tự động căn chỉnh Bảng thông tin từ vựng (`mode === 'info'`), Bảng công cụ (`mode === 'tools'`) & Thanh bôi đen câu**:
  - Giữ nguyên kích thước bảng thông tin từ vựng (`min-w-[220px] max-w-[280px]`).
  - Tính toán lại tọa độ mở bảng: Luôn kẹp tọa độ ngang `x` trong khoảng `[12px, window.innerWidth - popoverWidth - 12px]` và tự động lật lên trên hoặc xuống dưới tùy theo khoảng trống khung nhìn thực tế (tránh bị che bởi thanh điều hướng đáy trên mobile).
  - Bổ sung thao tác chạm giữ (Long-press `450ms` trên thiết bị cảm ứng) vào từ vựng để mở **Bảng công cụ (Lưu từ / Ghi âm chấm điểm / Chiết tự)** dễ dàng trên điện thoại không có chuột phải.

### C. Phòng Luyện Nghe (Audacity Listening Room) trên Mobile
- **Giải phóng diện tích sóng âm (Waveform)**:
  - Trên màn hình điện thoại (`< md`), ẩn mặc định bảng **Track Controls** rộng `192px` ở cột trái và thay bằng nút bật/tắt **Cài đặt Giọng & Track** ngay trên thanh công cụ, giúp dải sóng âm mở rộng toàn màn hình điện thoại.
- **Thanh điều khiển phát (Transport Toolbar)**:
  - Hỗ trợ cuộn ngang mượt mà với các cụm nút được nhóm gọn (**Phát/Dừng**, **Tua**, **Lặp**, **Tốc độ**, **Chế độ chữ trên sóng âm**), giữ chiều cao thanh công cụ gọn gàng để ưu tiên không gian cho sóng âm và danh sách câu bên dưới.

### D. Tab Sổ Từ Vựng (Vocabulary) & Luyện Tập (Practice)
- **Thanh công cụ & Bộ lọc Từ vựng**:
  - Sắp xếp ô **Tìm kiếm** cùng các nút **Lọc**, **Thêm thư mục**, **Flashcards**, **Nhập/Xuất Excel**, **Thêm từ mới** thành lưới gọn gàng trên mobile, không bị rớt dòng lộn xộn.
  - Khi đang ở trong một thư mục trên điện thoại (`< md`), hiển thị thanh điều hướng thư mục ngang gọn nhẹ ở phía trên thay vì để cột Sidebar thư mục chiếm mất nửa màn hình dọc.
- **Thẻ từ vựng trên Mobile (`< sm`)**:
  - Bỏ ràng buộc `min-w-fit` trên màn hình nhỏ (`w-full sm:min-w-fit`) để thẻ từ vựng không bị tràn ngang khỏi khung nhìn điện thoại.
  - Trình bày thẻ từ vựng trên mobile theo bố cục 2 tầng rõ ràng:
    - **Tầng chính**: Ô chọn + STT + **Chữ Hán (`18px`)** + **Pinyin** + **Nghĩa tiếng Việt** + Cụm 3 nút thao tác nhanh (**Chiết tự**, **Luyện tập**, **Menu `⋮`**).
    - **Tầng thông tin phụ**: **Loại từ (màu tím)** • **Cấp độ HSK (màu đỏ)** • **Tên thư mục** • **Điểm luyện tập**.

---

## 3. Key Product Decisions & Trade-Offs

- **Quyết định 1: Tự động thu gọn cột Track Controls của Phòng luyện nghe trên màn hình điện thoại (`< md`)**
  - *Cách tiếp cận*: Mặc định ẩn cột Track Controls (`w-48`) trên mobile và cung cấp nút mở nhanh khi cần đổi giọng đọc hoặc chỉnh âm lượng/gain.
  - *Lý do*: Trên màn hình điện thoại rộng `375px`, cột Track Controls cố định chiếm hơn 50% chiều ngang khiến dải sóng âm chỉ còn chưa tới `160px`, rất khó quan sát và chạm chọn câu.
- **Quyết định 2: Hỗ trợ chạm giữ (Long-press) bên cạnh chuột phải cho từ vựng trên Mobile**
  - *Cách tiếp cận*: Chạm 1 lần mở Bảng thông tin từ vựng (`mode: 'info'`), chạm giữ `450ms` mở Bảng công cụ từ vựng (`mode: 'tools'`).
  - *Lý do*: Điện thoại không có thao tác nhấp chuột phải độc lập; việc bổ sung cảm ứng chạm giữ giúp người dùng mobile truy cập đầy đủ tính năng Lưu từ, Đánh dấu đã biết, Luyện phát âm AI và Chiết tự.

---

## 4. Technical Architecture & Data Strategy

### Sơ đồ Bố cục Thích ứng (Responsive Mobile vs. Desktop Architecture)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       KHUNG NHÌN ỨNG DỤNG (100dvh)                      │
├─────────────────────────────────────────────────────────────────────────┤
│  HEADER CỐ ĐỊNH (h-12 trên Mobile / h-[52px] trên Desktop)              │
├─────────────────────────────────────────────────────────────────────────┤
│  KHÔNG GIAN NỘI DUNG CHÍNH (Tự động co giãn theo Breakpoint sm / md)    │
│                                                                         │
│  ┌───────────────────────────────┐   ┌───────────────────────────────┐  │
│  │   BÀN ĐỌC & PHÒNG LUYỆN NGHE  │   │      SỔ TỪ VỰNG & BÀI HỌC     │  │
│  │ • Toolbar tự xuống dòng gọn   │   │ • Thanh chọn thư mục gọn (Mb) │  │
│  │ • Popover kẹp biên an toàn    │   │ • Thẻ từ vựng 2 tầng vừa khít │  │
│  │   [12px .. vw - width - 12px] │   │   khung nhìn (w-full)         │  │
│  │ • Ẩn cột Track trái trên Mb   │   │ • Giữ nguyên bảng ngang ở PC  │  │
│  │   để mở rộng 100% Sóng âm     │   │   (sm:min-w-fit)              │  │
│  └───────────────────────────────┘   └───────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│  THANH ĐIỀU HƯỚNG ĐÁY 6 TAB (grid-cols-6 / flex-1 min-w-0, pb-safe)     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Ánh xạ Tương tác & Xử lý Trạng thái (Interactive State Mapping)
- **Bộ định vị Bảng tra từ thông minh (`clampPopoverPosition`)**:
  - Khi người dùng chạm vào một từ ở sát mép phải hoặc mép trái màn hình điện thoại, hàm tính toán sẽ đo chiều rộng bảng (`220px–280px` cho bảng thông tin, `280px–340px` cho bảng công cụ) và giữ khoảng cách tối thiểu `12px` so với hai cạnh màn hình, đồng thời trừ hao chiều cao của Thanh điều hướng đáy (`72px`) để bảng không bao giờ bị che khuất.
- **Trạng thái đóng/mở Cài đặt Track trên Mobile (`showMobileTrackControls`)**:
  - Trong Phòng luyện nghe, trên màn hình `< md`, người dùng có thể nhấn nút **Giọng đọc / Track** trên thanh điều khiển để bật/tắt nhanh bảng chọn giọng đọc (`晓晓` / `云希`) và thanh trượt âm lượng mà không làm hẹp khung sóng âm.
