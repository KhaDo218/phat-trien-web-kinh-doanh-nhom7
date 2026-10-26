# RoomCraft — Hướng dẫn repo & chia việc (Nhóm 7 · Phát triển Web Kinh Doanh)

Website bán nội thất theo không gian phòng: khám phá phòng mẫu, bấm hotspot để mua sản phẩm trong ảnh (Shop the Room), xem sản phẩm 3D, gợi ý Complete Your Room, mua đồ cũ (Marketplace), chatbot.
Web tĩnh: **HTML/CSS/JavaScript thuần**, dữ liệu đọc từ `data/json/*.json`, khi chạy lưu bằng **localStorage**. CSDL MySQL chỉ là thiết kế trong báo cáo (mục 3.4, file `database/`).

> **Đọc hết file này trước khi code.** Làm đúng tên file, đúng thư mục, đúng tên trường dữ liệu thì ghép lại chạy được luôn, không phải hỏi lại nhau.

---

## 1. Cấu trúc thư mục

```
phat-trien-web-kinh-doanh-nhom7/
├── index.html                  ← chỉ chuyển hướng vào scripts/index.html (để deploy), không sửa
├── scripts/                    ← TOÀN BỘ SOURCE CODE WEB
│   ├── index.html, rooms.html, products.html ...   ← các trang khách hàng
│   ├── admin/                  ← các trang quản trị (admin/index.html = Dashboard)
│   ├── css/
│   │   ├── base.css            ← màu, font, nút, form, header, footer dùng chung (Kha)
│   │   ├── admin.css           ← khung trang quản trị: sidebar, bảng, thẻ số liệu (Kha)
│   │   ├── components/         ← CSS của thành phần dùng chung: product-card.css (Khôi), room.css (Duy), chatbot.css (Huyền)
│   │   └── pages/<trang>.css   ← CSS riêng từng trang (trang admin: pages/admin-<trang>.css)
│   ├── js/
│   │   ├── core/               ← utils.js, store.js, auth.js dùng chung (Kha)
│   │   ├── services/           ← products.js (Khôi), cart.js, orders.js (Phương Anh)
│   │   └── pages/<trang>.js    ← JS riêng từng trang (trang admin: pages/admin-<trang>.js)
│   └── components/             ← header.js, footer.js, admin-sidebar.js (Kha), product-card.js (Khôi), room-card.js (Duy), chatbot.js (Huyền)
├── data/
│   ├── json/                   ← DỮ LIỆU WEB ĐỌC (đã dịch tiếng Việt, giá VND)
│   ├── masterdata_vi.csv       ← cùng dữ liệu, dạng bảng để xem bằng Excel / làm mockup
│   └── source/                 ← dữ liệu gốc tiếng Anh, KHÔNG ai sửa
├── assets/
│   ├── products/<phong-cách>/board-xxx/*.jpg   ← ảnh sản phẩm (không đổi tên, không di chuyển)
│   ├── rooms/<phong-cách>/*.jpg                ← ảnh phòng
│   ├── models/<product-id>.glb                 ← model 3D (mỗi người tự chép vào và commit)
│   └── marketplace/used-xxx-NN.jpg             ← ảnh đồ cũ (Huyền)
├── tools/3d/                   ← notebook Kaggle tạo 3D + danh sách 3D của từng người
├── database/                   ← script MySQL (mục 3.4 báo cáo)
└── docs/                       ← tài liệu cho báo cáo (để trống, bổ sung sau)
```

**Quy tắc bắt buộc:** mỗi người chỉ tạo/sửa **file của mình** (xem mục 4). Cần sửa file dùng chung (`scripts/css/base.css`, `scripts/js/core/*`, `scripts/components/header.js`…) thì nhắn Kha. Không sửa `data/source/`.

---

## 2. Cài đặt & chạy (làm 1 lần)

1. Cài **VS Code** + extension **Live Server**.
2. Clone repo (có ~500 MB ảnh, lần đầu tải hơi lâu):
   ```bash
   git clone https://github.com/KhaDo218/phat-trien-web-kinh-doanh-nhom7.git
   ```
3. Mở **cả thư mục phat-trien-web-kinh-doanh-nhom7** trong VS Code → chuột phải `index.html` ở thư mục gốc → *Open with Live Server*.
   Phải mở qua Live Server (http://127.0.0.1:5500). Mở thẳng file (`file://`) thì trình duyệt chặn đọc JSON và model 3D.

Tài khoản demo (trong `data/json/users.json`): **admin@roomcraft.vn / Admin@123**, **user@roomcraft.vn / User@123**.

---

## 3. Dữ liệu dùng chung (đọc kỹ)

**Tên trường trong JSON = tên cột trong CSDL mục 3.4** (snake_case, tiếng Anh). Không tự đặt tên khác.

| File `data/json/` | Nội dung | Ai cập nhật |
|---|---|---|
| `products.json` | 953 sản phẩm. Trường phụ cho web: `images` (ảnh [0] là ảnh đại diện), `style_ids`, `parent_category_id`, `board_ids` | Mỗi người sửa `model_3d_url` cho sản phẩm 3D của mình (mục 5) |
| `categories.json` | 4 danh mục cha + 23 danh mục con (`parent_id = null` là danh mục cha) | — |
| `styles.json` | 7 phong cách; `slug` dùng trên URL, ví dụ `rooms.html?style=glam` | — |
| `rooms.json` | 49 phòng; `product_ids` = sản phẩm có trong phòng | — |
| `room_hotspots.json` | `{room_id, product_id, position_x, position_y}`, toạ độ theo %, 0–100 | Bảo Duy |
| `used_products.json` | đồ cũ (cùng trường với `products.json` + `condition_grade`, `usage_time`, `condition_note`) | Như Huyền |
| `chatbot_faqs.json` | câu trả lời chatbot `{id, topic, keywords, answer, is_active}` | Như Huyền |
| `users.json`, `roles.json`, `shipping_methods.json`, `coupons.json` | dữ liệu khởi tạo; `password_hash` = SHA-256 của mật khẩu | Kha |

Quy ước:
- Giá đã là **VND** (số nguyên). Hiển thị bằng `formatVND(gia)` → `4.160.000 ₫`.
- `stock_quantity = 0` → hiện "Hết hàng" và **khóa nút Thêm vào giỏ**. Đồ cũ có `stock_quantity = 1`, bán xong về 0 và hiện "Đã bán".
- `model_3d_url` khác `null` → hiện khung **Xem 3D** (mục 5).
- `is_active = false` → không hiển thị cho khách.
- Đường dẫn ảnh/model trong JSON tính từ **thư mục gốc repo** (vd. `assets/products/...`). Trang trong `scripts/` phải thêm `../`, trang trong `scripts/admin/` thêm `../../` → luôn dùng `asset(duongDan)`, không tự ghép.
- Trạng thái đơn hàng chỉ có: `Confirmed` → `Packing` → `Shipping` → `Delivered`, hoặc `Cancelled` (hủy thì **hoàn lại tồn kho**). Không có Pending.

Dữ liệu sinh ra khi dùng web nằm trong **localStorage**, khóa bắt đầu bằng `rc_` (Kha định nghĩa trong `scripts/js/core/store.js`; mọi người gọi hàm của store, không tự đọc/ghi localStorage):

| Khóa | Nội dung |
|---|---|
| `rc_products`, `rc_users`, `rc_rooms`, `rc_room_hotspots`, `rc_coupons`… | bản sao `data/json` (store.js gộp `used_products` vào `rc_products`) để Admin thêm/sửa được |
| `rc_session` | người đang đăng nhập `{user_id, role}` |
| `rc_carts` | `{ user_id: [{product_id, quantity}] }` |
| `rc_wishlists` | `{ user_id: [product_id] }` |
| `rc_orders` | mảng đơn hàng (cột bảng `orders` + `items: [{product_id, quantity, unit_price}]`) |
| `rc_reviews` | mảng đánh giá (cột bảng `reviews`) |
| `rc_verification_codes` | mã OTP / link đặt lại mật khẩu (mô phỏng) |

---

## 4. Phân công tuần 1 (19/10 – 25/10/2026)

Mỗi người có 3 phần: **trang web**, **3D cho phong cách được giao**, **dữ liệu nhập tay** (nếu có).
Tuần 1 làm **HTML + CSS tĩnh theo mockup** và phần dữ liệu; tuần 2 mới gắn JavaScript. Mọi file trang đặt trong `scripts/`.

### Quỳnh Kha — nền tảng chung + tài khoản

**Input:** mockup (Stitch), `data/json/*`, sitemap
**Việc làm:**
- **Trước Thứ 3 (20/10):** tạo khung chung: `scripts/css/base.css` (màu, font, nút, form theo mockup), `scripts/components/header.js`, `footer.js`, `scripts/js/core/utils.js` (formatVND, asset, lấy tham số URL), `scripts/js/core/store.js` (nạp `data/json` vào localStorage lần đầu + hàm đọc/ghi), trang mẫu `scripts/index.html` có header/footer để các bạn copy.
- Trang: `login.html` (email + Google), `register.html` (kèm bước OTP mô phỏng), `forgot-password.html` (kèm bước đặt lại), `account.html` (hồ sơ).
- `scripts/js/core/auth.js`: đăng nhập, đăng xuất, kiểm tra quyền (trang admin chỉ cho Admin), tài khoản bị khóa không đăng nhập được.
- 3D **Farmhouse** (46 món). Duyệt Pull Request, merge vào `main`.

**Ghi chú:** Google Client ID đã tạo (project RoomCraft trên Google Cloud, đặt trong `auth.js`). Đăng nhập Google chỉ chạy khi mở bằng Live Server ở `http://127.0.0.1:5500` hoặc `http://localhost:5500`, và Gmail phải nằm trong danh sách Test users (nhắn Kha thêm).

### Bảo Duy — Trang chủ & Khám phá phòng 

**Input:** `rooms.json`, `styles.json`, `products.json`, ảnh `assets/rooms/`
**Việc làm:**
- `index.html` (trang chủ, sau khi Kha có trang mẫu), `rooms.html` (danh sách phòng, lọc theo phong cách), `room-detail.html?id=...` (ảnh phòng + hotspot, bấm hotspot hiện thẻ sản phẩm, nút Thêm vào giỏ).
- `admin/rooms.html`: thêm/sửa phòng, **gắn sản phẩm vào phòng bằng cách bấm lên ảnh** (lấy toạ độ %).
- Dữ liệu: điền `data/json/room_hotspots.json` cho **2–3 phòng mỗi phong cách** (sản phẩm lấy trong `product_ids` của phòng).
- 3D **Bohemian + Mid-century Modern** (69 món).

### Nguyên Khôi — Sản phẩm 

**Input:** `products.json`, `categories.json`, `styles.json`
**Việc làm:**
- `products.html`: tìm kiếm, lọc **phong cách + danh mục** (+ giá), sắp xếp; không có kết quả thì gợi ý sản phẩm tương tự.
- `product-detail.html?id=...`: ảnh nhiều góc, giá, tồn kho, thông số, **Xem 3D** (nếu có), **Complete Your Room** (cùng phong cách / cùng tông màu / khác danh mục để bổ trợ), đánh giá, sản phẩm tương tự. Trang dùng chung cho đồ cũ (phần thông tin đồ cũ do Huyền làm).
- `wishlist.html`, `scripts/components/product-card.js`, `scripts/js/services/products.js`.
- `admin/products.html` (thêm/sửa/ẩn sản phẩm, tồn kho, khai báo đường dẫn ảnh và model 3D), `admin/categories.html`.
- 3D **Scandinavian** (29 món).

**Ghi chú:** `product-card.js` cần xong **trước Thứ 5 (22/10)** vì Duy, Huyền, Phương Anh đều dùng.

### Phương Anh — Giỏ hàng, thanh toán, đơn hàng, Dashboard 

**Input:** `products.json`, `shipping_methods.json`, `coupons.json`
**Việc làm:**
- `cart.html` (đổi số lượng, không vượt tồn kho), `checkout.html` (thông tin giao hàng, phương thức vận chuyển, mã giảm giá, thanh toán mô phỏng COD / chuyển khoản / ví), `order-success.html`.
- `orders.html` (đơn hàng của tôi) + `order-detail.html?id=...` (theo dõi trạng thái, hủy đơn, viết đánh giá khi đơn Delivered).
- `scripts/js/services/cart.js`, `orders.js` (tạo đơn Confirmed → trừ tồn kho; hủy → hoàn tồn kho).
- `admin/orders.html` (đổi trạng thái đơn), `admin/index.html` (Dashboard: doanh thu, số đơn, sản phẩm bán chạy, số người dùng — biểu đồ bằng Chart.js).
- 3D **Glam + Traditional** (62 món).

### Như Huyền — Đồ cũ, Chatbot, quản lý người dùng & đánh giá 

**Input:** ảnh đồ cũ đã chọn, `products.json`
**Việc làm:**
- Dữ liệu: điền `data/json/used_products.json` gồm **15–20 món đồ cũ** (mẫu ở mục 6). Ảnh đồ cũ đã chọn ở bước xử lý ảnh chép vào `assets/marketplace/`, đặt tên `used-001-01.jpg`, `used-001-02.jpg`… (số món 3 chữ số, số ảnh 2 chữ số, trùng với `id` và `images` trong JSON); ảnh `.jpg`, cạnh dài khoảng 1200 px, mỗi ảnh dưới 500 KB.
- `marketplace.html`: danh sách đồ cũ, lọc tình trạng (Like New / Good / Fair), giá, thương hiệu, danh mục. Phần hiển thị tình trạng + thời gian sử dụng trong `product-detail.html` (phối hợp Khôi).
- `scripts/components/chatbot.js` + `data/json/chatbot_faqs.json` (hỏi về sản phẩm, phong cách, chính sách, vận chuyển, đổi trả).
- `admin/marketplace.html`, `admin/users.html` (khóa/mở tài khoản), `admin/reviews.html` (ẩn/xóa đánh giá).
- 3D **Coastal** (25 món).

---

## 5. Làm model 3D và đưa lên web (Trước 19/10)

Làm 3D cho **toàn bộ 235 món nội thất** (sofa, ghế, bàn, tủ, kệ, giường, đôn), chia theo phong cách; danh sách ở `tools/3d/danh-sach-3d.csv`. Đồ trang trí (thảm, tranh, gối, đèn…) không làm 3D. Mỗi người mở `tools/3d/product-ids/<tên-bạn>.txt`, copy đoạn `PRODUCT_IDS = [...]`, làm theo **hướng dẫn từng bước trong `tools/3d/README.md`** (có cả cách tạo tài khoản Kaggle, xác minh số điện thoại, tự tải ảnh phong cách của mình lên Kaggle). Tóm tắt:

1. Tạo tài khoản Kaggle, xác minh số điện thoại, nén thư mục ảnh phong cách của mình tải lên thành Dataset riêng.
2. Kaggle chạy notebook `tools/3d/RoomCraft3D_Kaggle.ipynb` → tải `roomcraft3d_models.zip`.
3. Kiểm tra từng `.glb` (kéo vào https://gltf-viewer.donmccurdy.com), hỏng thì chạy lại.
4. Chép các file `.glb` (giữ nguyên tên = product-id) vào **`assets/models/`**.
5. Mở `data/json/products.json`, Ctrl+F theo product-id, sửa `"model_3d_url": null` thành `"model_3d_url": "assets/models/<product-id>.glb"`.
6. Commit cả file `.glb` và `products.json` lên nhánh của mình, tạo Pull Request.

Hiển thị trên trang chi tiết sản phẩm (Khôi làm) chỉ cần thẻ `<model-viewer>` của Google, kéo chuột để xoay, cuộn để phóng to:
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js"></script>

<model-viewer src="../assets/models/product-farmhouse-julius-swivel-chair-nubuck-cognac-06.glb"
              camera-controls auto-rotate shadow-intensity="1" ar
              style="width:100%; height:480px; background:#f6f4f1"></model-viewer>
```
(`src` lấy từ `asset(product.model_3d_url)`; chỉ hiện khi `model_3d_url` khác `null`.)

---

## 6. Mẫu dữ liệu nhập tay

`data/json/used_products.json` (mỗi món đồ cũ một object):
```json
{
  "id": "used-001",
  "category_id": 7,
  "style_id": 6,
  "name": "Ghế ăn gỗ sồi (đã qua sử dụng)",
  "brand": "IKEA",
  "price": 450000,
  "original_price": 1200000,
  "dimensions": "R 45 x S 50 x C 80 cm",
  "material": "Gỗ sồi",
  "color": "Gỗ tự nhiên",
  "description": "Ghế còn chắc chắn, mặt ngồi có vài vết xước nhỏ.",
  "model_3d_url": null,
  "stock_quantity": 1,
  "product_type": "USED",
  "is_active": true,
  "images": ["assets/marketplace/used-001-01.jpg"],
  "style_ids": [6],
  "parent_category_id": 1,
  "condition_grade": "Good",
  "usage_time": "1 năm",
  "condition_note": "Xước nhẹ ở chân ghế"
}
```
`condition_grade` chỉ nhận `Like New`, `Good`, `Fair`. `category_id`/`style_id` tra trong `categories.json`, `styles.json`.

`data/json/room_hotspots.json`:
```json
[{ "room_id": "room-glam-4190768", "product_id": "product-glam-....-01", "position_x": 42.5, "position_y": 63 }]
```
Sửa JSON xong, mở bằng https://jsonlint.com (hoặc VS Code báo đỏ) để chắc chắn không sai dấu phẩy, ngoặc.

---

## 7. Thứ tự làm việc

1. **Thứ 2–3 (19–20/10):** Kha xong khung chung (`base.css`, header/footer, `store.js`, `utils.js`, trang mẫu). Cùng lúc mọi người chạy Kaggle 3D (chạy nền) và làm dữ liệu nhập tay.
2. **Thứ 3–CN (20–25/10):** mọi người dựng HTML/CSS tĩnh các trang của mình theo mockup. Khôi xong `product-card.js` trước Thứ 5 (22/10).
3. **CN (25/10):** mỗi người tạo Pull Request phần HTML/CSS. Kha duyệt, merge.
4. **Tuần 2 (26/10–29/10):** gắn JavaScript + dữ liệu cho các trang khách hàng.
5. (29/10–1/11):** trang admin, kiểm thử chéo (mỗi người test trang của người khác), sửa lỗi, deploy, chụp màn hình cho Chương 5.
6. (2/11-8/11): Hoàn thành báo cáo

---

## 8. Quy trình Git

```bash
git checkout main && git pull                 # lấy code mới nhất
git checkout -b duy/rooms                     # mỗi việc một nhánh: <tên>/<việc>
# ... code ...
git add scripts/rooms.html scripts/css/pages/rooms.css scripts/js/pages/rooms.js
git commit -m "[Duy] rooms.html: lọc phòng theo phong cách"
git push -u origin duy/rooms                  # rồi lên GitHub tạo Pull Request vào main
```
- Không push thẳng vào `main`. Kha duyệt và merge Pull Request.
- Chỉ `git add` file của mình (xem `git status` trước, không dùng `git add .` bừa).
- Không đẩy file zip, `node_modules/`, file Word/PDF báo cáo.

## 9. Quy ước code

- Tên file và thư mục: chữ thường, nối bằng gạch ngang (`room-detail.html`). Biến/hàm JS: camelCase. Tên trường dữ liệu: snake_case như JSON.
- Giao diện tiếng Việt. Màu, font, khoảng cách lấy từ `base.css`, không tự đặt mã màu mới.
- Mỗi trang có 3 file: `scripts/<trang>.html`, `scripts/css/pages/<trang>.css`, `scripts/js/pages/<trang>.js`. **Khung các trang đã tạo sẵn**: mở đúng file tên mình, tìm dòng `TODO (tên bạn)` để làm tiếp, không đổi tên/di chuyển file.
- Viết theo cách thầy dạy: nạp CSS bằng `@import` trong thẻ `<style>`, JS dùng `var` + `function`, lấy phần tử bằng `document.getElementById`, tạo phần tử bằng `createElement` / `appendChild` hoặc `innerHTML`, sự kiện bằng `onclick="tenHam()"`, kiểm tra form bằng `alert` + `focus()` + `return false`. Id ô nhập đặt `txtXxx`, id `<tbody>` đặt `tbXxx`.
- Khung một trang (xem mẫu đầy đủ ở `scripts/index.html`, `scripts/login.html`):
  ```html
  <style type="text/css">
      @import url(css/base.css);
      @import url(css/pages/rooms.css);
  </style>
  <script src="js/core/utils.js"></script>
  <script src="js/core/store.js"></script>
  <script src="js/core/auth.js"></script>
  <script src="components/header.js"></script>
  <script src="components/footer.js"></script>
  <script src="components/chatbot.js"></script>
  <script src="js/pages/rooms.js"></script>
  ...
  <body>
      <div id="header"></div>
      <main class="container"> ... </main>
      <div id="footer"></div>
      <script>
          loadData(initPage);     // nạp dữ liệu xong mới gọi initPage() trong js/pages/rooms.js
      </script>
  </body>
  ```
  `initPage()` của trang luôn gọi `renderHeader("muc-menu")`, `renderFooter()`, `renderChatbot()` rồi mới tới phần riêng. Trang cần đăng nhập gọi `requireLogin()` đầu tiên; trang admin gọi `requireAdmin()` + `renderAdminSidebar("muc")` (trang admin thêm `../` trước các đường dẫn, xem `scripts/admin/products.html`).
- Hàm dùng chung có sẵn (đọc chú thích đầu mỗi file để biết cách gọi):
  - `utils.js`: `asset()`, `formatVND()`, `getParam()`, `formatDate()`, `checkEmail()`, `checkPhone()`, `checkPasswordRule()`, `sha256()`
  - `store.js`: `getTable()`, `saveTable()`, `findById()`, `getNextId()`, `getObject()`, `saveObject()`, `resetData()`
  - `auth.js`: `login()`, `loginWithGoogle()`, `logout()`, `getCurrentUser()`, `isLoggedIn()`, `isAdmin()`, `requireLogin()`, `requireAdmin()`, `findUserByEmail()`, `findUserByPhone()`, `createVerificationCode()`, `checkVerificationCode()`
  - `header.js`: `updateCartCount()` (gọi sau khi sửa giỏ hàng)
- Class giao diện có sẵn trong `base.css`: `.container`, `.section`, `.grid-3`, `.grid-4`, `.headline-page`, `.headline-section`, `.title-product`, `.overline`, `.lead`, `.price`, `.price-old`, `.btn`, `.btn-outline`, `.btn-light`, `.btn-link`, `.input`, `.form-group`, `.card`, `.chip`, `.badge`, `.badge-stock`, `.breadcrumb`, `.error-text`. Trang admin thêm `.table`, `.toolbar`, `.stat-card` trong `admin.css`.
- Phải mở trang bằng **Live Server** (mở thẳng file thì không đọc được `data/json`). Sửa file JSON xong muốn web nạp lại: mở Console gõ `resetData()`.
- Không dùng framework (React, Vue…). Thư viện ngoài chỉ dùng: model-viewer (3D), Chart.js (Dashboard), Google Identity Services (đăng nhập Google).
