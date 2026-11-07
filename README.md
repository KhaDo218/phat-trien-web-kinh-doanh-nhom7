# RoomCraft – Website bán nội thất theo không gian phòng

> Đồ án môn **Phát triển Web Kinh doanh** – Nhóm 7

**Bản chạy thử:** https://khado218.github.io/phat-trien-web-kinh-doanh-nhom7/

RoomCraft là website thương mại điện tử bán nội thất. Người mua bắt đầu từ **cả căn phòng** thay vì từng món đồ. Họ xem phòng mẫu theo phong cách, bấm vào món đồ ngay trên ảnh phòng để xem và mua (*Shop the Room*). Họ cũng có thể xoay mô hình 3D trước khi đặt hàng, mua đồ cũ tuyển chọn và hỏi chatbot tư vấn.

---

## Mục lục
1. [Tính năng](#1-tính-năng)
2. [Công nghệ](#2-công-nghệ)
3. [Cài đặt và chạy](#3-cài-đặt-và-chạy)
4. [Cấu trúc thư mục](#4-cấu-trúc-thư-mục)
5. [Dữ liệu](#5-dữ-liệu)
6. [Kiểm thử](#6-kiểm-thử)
7. [Triển khai](#7-triển-khai)
8. [Quy ước phát triển](#8-quy-ước-phát-triển)
9. [Nhóm thực hiện](#9-nhóm-thực-hiện)
10. [Giới hạn đã biết](#10-giới-hạn-đã-biết)

---

## 1. Tính năng

### Khách (chưa đăng nhập)
- **Trang chủ:** video nền, sản phẩm nổi bật, câu chuyện thương hiệu có khung kéo so sánh "Ý tưởng – Hoàn thiện".
- **Không gian mẫu:** 49 phòng thuộc 7 phong cách. Ảnh phòng có các điểm gắn sản phẩm (hotspot); bấm vào là xem nhanh hoặc thêm món đó vào giỏ.
- **Sản phẩm:** tìm kiếm có xử lý tiếng Việt không dấu. Bộ lọc theo giá, danh mục, chất liệu, màu, thương hiệu và tình trạng còn hàng, **lọc ngay khi chọn**. Có sắp xếp và phân trang.
- **Chi tiết sản phẩm:** ảnh nhiều góc, **xem 3D/AR** bằng model-viewer, gợi ý *Complete Your Room*, đánh giá bằng sao.
- **Đồ cũ (Marketplace):** đồ đã qua sử dụng, có tình trạng Like New / Good / Fair, thời gian sử dụng và ghi chú.
- **Về RoomCraft:** trang giới thiệu cách làm của thương hiệu.
- **Chatbot tư vấn:** trả lời sẵn theo câu hỏi thường gặp. Hiểu cả ngân sách ("sofa dưới 10 triệu") để gợi ý sản phẩm. Câu hỏi khó được chuyển sang mô hình ngôn ngữ qua máy chủ riêng (không bắt buộc).

### Người dùng (đã đăng nhập)
- Đăng ký kèm mã OTP (mô phỏng), đăng nhập bằng email hoặc Google, quên và đặt lại mật khẩu.
- Hồ sơ cá nhân, danh sách yêu thích, giỏ hàng (giỏ của khách được gộp vào khi đăng nhập).
- **Thanh toán:**
  - phí giao tính theo loại hàng, khu vực và phương thức giao;
  - mã giảm giá;
  - COD tối đa 10.000.000 ₫, đơn lớn hơn thì trả trước hoặc đặt cọc 30%.
- **Đơn hàng:** theo dõi trạng thái `Confirmed → Packing → Shipping → Delivered`, hủy đơn (tồn kho được hoàn lại), đánh giá sau khi nhận hàng.

### Quản trị viên (Admin)
- **Dashboard:** doanh thu, số đơn, sản phẩm bán chạy, cảnh báo tồn kho (biểu đồ bằng Chart.js).
- Quản lý sản phẩm, danh mục, phòng mẫu (gắn hotspot bằng cách bấm lên ảnh phòng), đồ cũ, đơn hàng, người dùng (khóa và mở tài khoản) và đánh giá.

---

## 2. Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Giao diện | HTML5, CSS3, JavaScript thuần (ES5, không framework) |
| Lưu trữ khi chạy | `localStorage` của trình duyệt, nạp lần đầu từ `data/json/*.json` |
| Mô hình 3D | `.glb` tạo bằng Hunyuan3D-2 trên Kaggle, hiển thị bằng [model-viewer](https://modelviewer.dev) |
| Biểu đồ | Chart.js |
| Đăng nhập Google | Google Identity Services |
| Máy chủ chatbot (không bắt buộc) | Node.js (`server.js`) hoặc Python (`server.py`), gọi API mô hình ngôn ngữ tương thích OpenAI |
| Thiết kế CSDL | MySQL (`database/RoomCraft_database.sql`), là thiết kế để triển khai sau, web hiện chưa dùng |
| Kiểm thử | Node.js + Playwright, axe-core |
| Triển khai | GitHub Pages |

---

## 3. Cài đặt và chạy

**Yêu cầu:** VS Code có extension **Live Server**, hoặc bất kỳ máy chủ web tĩnh nào. Cần Node.js nếu muốn chạy chatbot hoặc kiểm thử.

```bash
git clone https://github.com/KhaDo218/phat-trien-web-kinh-doanh-nhom7.git
```

1. Mở **cả thư mục** dự án trong VS Code.
2. Chuột phải `index.html` ở thư mục gốc → **Open with Live Server**. Trang sẽ tự chuyển vào `scripts/index.html`.

> Phải mở qua máy chủ web (`http://127.0.0.1:5500`). Mở thẳng file (`file://`) thì trình duyệt chặn đọc JSON và mô hình 3D.
> Repo có khoảng 800 MB ảnh, video và mô hình 3D nên lần clone đầu sẽ hơi lâu.

**Tài khoản dùng thử**

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@roomcraft.vn` | `Admin@123` |
| Người dùng | `user@roomcraft.vn` | `User@123` |

**Chatbot dùng mô hình ngôn ngữ (không bắt buộc).** Không bật máy chủ thì chatbot vẫn trả lời bằng bộ câu hỏi thường gặp.

```bash
# tạo file .env ở thư mục gốc, ghi: DEEPSEEK_API_KEY=<khóa API>
node server.js        # hoặc: python server.py — chạy ở http://localhost:3000
```

**Đưa dữ liệu về ban đầu:** mở Console của trình duyệt (F12) và gõ `resetData()`.

---

## 4. Cấu trúc thư mục

```
├── index.html            Chuyển hướng vào scripts/index.html (dùng khi deploy)
├── scripts/              Toàn bộ mã nguồn web
│   ├── *.html            Các trang khách hàng (index, rooms, products, marketplace, about, cart, checkout…)
│   ├── admin/            Các trang quản trị (admin/index.html là Dashboard)
│   ├── css/              base.css, admin.css, components/, pages/<trang>.css
│   ├── js/core/          utils.js, store.js (dữ liệu), auth.js (đăng nhập, phân quyền)
│   ├── js/services/      products.js, cart.js, orders.js
│   ├── js/pages/         JavaScript riêng của từng trang
│   └── components/       header, footer, product-card, room-card, catalog-filter, chatbot…
├── data/json/            Dữ liệu web đọc (tiếng Việt, giá VND)
├── data/source/          Dữ liệu gốc, không sửa
├── assets/               Ảnh sản phẩm, ảnh phòng, đồ cũ, video, font, mô hình 3D (assets/models/*.glb)
├── database/             Script MySQL theo thiết kế CSDL
├── tools/3d/             Notebook Kaggle tạo mô hình 3D từ ảnh
├── tests/                Bộ kiểm thử tự động (xem mục 6)
├── server.js, server.py  Máy chủ chatbot (không bắt buộc)
└── .env.example          Mẫu file cấu hình khóa API
```

Mỗi trang gồm 3 file: `scripts/<trang>.html`, `scripts/css/pages/<trang>.css` và `scripts/js/pages/<trang>.js`.

---

## 5. Dữ liệu

| File `data/json/` | Số bản ghi | Nội dung |
|---|---|---|
| `products.json` | 953 | Sản phẩm mới (giá VND, tồn kho, ảnh, phong cách, `model_3d_url`) |
| `used_products.json` | 18 | Đồ cũ, thêm `condition_grade`, `usage_time`, `condition_note` |
| `rooms.json` | 49 | Phòng mẫu và danh sách sản phẩm trong phòng |
| `room_hotspots.json` | 1.353 | Điểm gắn sản phẩm trên ảnh phòng (tọa độ %) |
| `styles.json` · `categories.json` | 7 · 25 | Phong cách và danh mục (cha – con) |
| `reviews.json` · `chatbot_faqs.json` | 194 · 20 | Đánh giá mẫu, câu trả lời sẵn của chatbot |
| `users.json`, `roles.json`, `coupons.json`, `shipping_methods.json` | | Dữ liệu khởi tạo |

- Có 202 sản phẩm kèm mô hình 3D trong `assets/models/`.
- Tên trường dùng **snake_case**, trùng với tên cột trong thiết kế CSDL.
- Lần đầu mở web, `store.js` chép dữ liệu vào `localStorage` dưới các khóa bắt đầu bằng `rc_`. Từ đó mọi thao tác (giỏ hàng, đơn hàng, chỉnh sửa của Admin…) được ghi vào đây.
- Mật khẩu lưu dạng băm SHA-256.

---

## 6. Kiểm thử

Thư mục `tests/` chứa bộ kiểm thử tự động viết bằng Playwright, gồm 14 phiên:
- 13 phiên chính (`s00`–`s12`, 394 test case), theo nhóm chức năng: tài khoản, phòng mẫu, sản phẩm, đồ cũ, giỏ hàng – thanh toán, đơn hàng, quản trị, chatbot, phi chức năng, nghiệp vụ đầu – cuối, audit;
- 1 phiên bổ sung (`s13`) cho trang Về RoomCraft.

Bộ kiểm thử chạy trên **7 cấu hình**:

| Máy tính | Thiết bị giả lập |
|---|---|
| Edge, Chrome, Firefox, Safari (WebKit) | iPhone 14, Pixel 7, iPad |

```bash
cd tests
npm install
npx playwright install chromium firefox webkit
node phien/s00-khoi-dong.js                                    # chạy một phiên
node tools/chay-cau-hinh.js iphone --song-song 2 --phien s03   # chạy theo cấu hình
```

Mỗi test case để lại ảnh minh chứng và một dòng kết quả (JSON và Excel); có thể ghi thẳng lên Google Sheet qua `tests/apps-script.gs`.

**Kết quả đợt cuối** (tính trên các ca áp dụng): tỉ lệ đạt từ **97,4% đến 98,5%** trên cả 7 cấu hình, không có lỗi nghiêm trọng nào còn mở. Hướng dẫn chi tiết ở `tests/HUONG-DAN.md`.

---

## 7. Triển khai

Website được triển khai bằng **GitHub Pages** từ nhánh `main`. Mỗi lần merge vào `main`, GitHub tự build và đăng lại trang.

Nếu bước *Deploy to GitHub Pages* báo hết thời gian chờ (trang khá nặng), vào tab **Actions** và chọn **Re-run failed jobs**.

---

## 8. Quy ước phát triển

- **Mã nguồn:**
  - JavaScript ES5 (`var`, `function`), lấy phần tử bằng `document.getElementById`;
  - CSS nạp bằng `@import` trong thẻ `<style>`;
  - không dùng framework.
- **Đặt tên:** file và thư mục viết thường, nối bằng gạch ngang (`room-detail.html`); hàm và biến dùng camelCase; trường dữ liệu dùng snake_case.
- **Đường dẫn ảnh và mô hình:** trong JSON tính từ thư mục gốc repo; khi hiển thị luôn gọi `asset(duongDan)`.
- **Git:** mỗi việc một nhánh `<tên>/<việc>`, tạo Pull Request vào `main`, không push thẳng vào `main`.

```bash
git checkout main && git pull
git checkout -b ten/viec
git add <các file của mình>
git commit -m "Mô tả ngắn thay đổi"
git push -u origin ten/viec        # rồi tạo Pull Request trên GitHub
```

---

## 9. Nhóm thực hiện

| Thành viên | Phụ trách chính |
|---|---|
| Quỳnh Kha | Khung chung (CSS nền, header/footer, dữ liệu, đăng nhập – phân quyền), tài khoản, tích hợp và duyệt mã, kiểm thử |
| Bảo Duy | Trang chủ, không gian mẫu, hotspot, quản lý phòng |
| Nguyên Khôi | Sản phẩm, chi tiết sản phẩm, 3D, yêu thích, quản lý sản phẩm và danh mục |
| Phương Anh | Giỏ hàng, thanh toán, đơn hàng, Dashboard |
| Như Huyền | Đồ cũ, chatbot, trang Về RoomCraft, quản lý người dùng và đánh giá |

Mỗi thành viên còn tạo mô hình 3D cho các phong cách được giao.

---

## 10. Giới hạn đã biết

- **Không có máy chủ ứng dụng.** Dữ liệu và phân quyền chạy hoàn toàn trên trình duyệt, nên người có kiến thức kỹ thuật có thể sửa `localStorage`. Khi triển khai thật cần backend xác thực và kiểm tra quyền ở máy chủ.
- **Ảnh phòng giữ độ phân giải cao** để đảm bảo chất lượng hình ảnh. Trang chủ tải chậm hơn trên Safari và iOS; đã bật tải lười để bù.
- **Thanh toán và OTP chỉ là mô phỏng**, chưa kết nối cổng thanh toán hay dịch vụ gửi mã.
