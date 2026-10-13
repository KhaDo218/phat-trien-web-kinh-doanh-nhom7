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
│   │   ├── base.css            ← màu, font, nút, form dùng chung (Kha)
│   │   └── pages/<trang>.css   ← CSS riêng của từng trang
│   ├── js/
│   │   ├── core/               ← store.js, auth.js, utils.js dùng chung (Kha)
│   │   ├── services/           ← products.js, cart.js, orders.js ... đọc/ghi dữ liệu theo nghiệp vụ
│   │   └── pages/<trang>.js    ← code riêng của từng trang
│   └── components/             ← header.js, footer.js (Kha), product-card.js (Khôi), chatbot.js (Huyền)
├── data/
│   ├── json/                   ← DỮ LIỆU WEB ĐỌC (đã dịch tiếng Việt, giá VND)
│   ├── masterdata_vi.csv       ← cùng dữ liệu, dạng bảng để xem bằng Excel / làm mockup
│   └── source/                 ← dữ liệu gốc tiếng Anh, KHÔNG ai sửa
├── assets/
│   ├── products/<phong-cách>/board-xxx/*.jpg   ← ảnh sản phẩm (không đổi tên, không di chuyển)
│   ├── rooms/<phong-cách>/*.jpg                ← ảnh phòng
│   └── models/<product-id>.glb                 ← model 3D (mỗi người tự chép vào và commit)
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
- Giá đã là **VND** (số nguyên). Hiển thị bằng `utils.formatVND(gia)` → `4.160.000 ₫`.
- `stock_quantity = 0` → hiện "Hết hàng" và **khóa nút Thêm vào giỏ**. Đồ cũ có `stock_quantity = 1`, bán xong về 0 và hiện "Đã bán".
- `model_3d_url` khác `null` → hiện khung **Xem 3D** (mục 5).
- `is_active = false` → không hiển thị cho khách.
- Đường dẫn ảnh/model trong JSON tính từ **thư mục gốc repo** (vd. `assets/products/...`). Trang trong `scripts/` phải thêm `../`, trang trong `scripts/admin/` thêm `../../` → luôn dùng `utils.asset(duongDan)`, không tự ghép.
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

**Ghi chú:** tạo Google Client ID (Google Cloud Console), thêm `http://127.0.0.1:5500` vào Authorized JavaScript origins.

### Bảo Duy — Trang chủ & Khám phá phòng

**Input:** `rooms.json`, `styles.json`, `products.json`, ảnh `assets/rooms/`
**Việc làm:**
- `index.html` (trang chủ, sau khi Kha có trang mẫu), `rooms.html` (danh sách phòng, lọc theo phong cách), `room-detail.html?id=...` (ảnh phòng + hotspot, bấm hotspot hiện thẻ sản phẩm, nút Thêm vào giỏ).
- `admin/rooms.html`: thêm/sửa phòng, **gắn sản phẩm vào phòng bằng cách bấm lên ảnh** (lấy toạ độ %).
- Dữ liệu: điền `data/json/room_hotspots.json` cho **2–3 phòng mỗi phong cách** (sản phẩm lấy trong `product_ids` của phòng).
- 3D **Bohemian** (39 món).

### Nguyên Khôi — Sản phẩm

**Input:** `products.json`, `categories.json`, `styles.json`
**Việc làm:**
- `products.html`: tìm kiếm, lọc **phong cách + danh mục** (+ giá), sắp xếp; không có kết quả thì gợi ý sản phẩm tương tự.
- `product-detail.html?id=...`: ảnh nhiều góc, giá, tồn kho, thông số, **Xem 3D** (nếu có), **Complete Your Room** (cùng phong cách / cùng tông màu / khác danh mục để bổ trợ), đánh giá, sản phẩm tương tự. Trang dùng chung cho đồ cũ (phần thông tin đồ cũ do Huyền làm).
- `wishlist.html`, `scripts/components/product-card.js`, `scripts/js/services/products.js`.
- `admin/products.html` (thêm/sửa/ẩn sản phẩm, tồn kho, khai báo đường dẫn ảnh và model 3D), `admin/categories.html`.
- 3D **Scandinavian + Mid-century Modern** (59 món).

**Ghi chú:** `product-card.js` cần xong **trước Thứ 5 (22/10)** vì Duy, Huyền, Phương Anh đều dùng.

### Phương Anh — Giỏ hàng, thanh toán, đơn hàng, Dashboard

**Input:** `products.json`, `shipping_methods.json`, `coupons.json`
**Việc làm:**
- `cart.html` (đổi số lượng, không vượt tồn kho), `checkout.html` (thông tin giao hàng, phương thức vận chuyển, mã giảm giá, thanh toán mô phỏng COD / chuyển khoản / ví), `order-success.html`.
- `orders.html` (đơn hàng của tôi) + `order-detail.html?id=...` (theo dõi trạng thái, hủy đơn, viết đánh giá khi đơn Delivered).
- `scripts/js/services/cart.js`, `orders.js` (tạo đơn Confirmed → trừ tồn kho; hủy → hoàn tồn kho).
- `admin/orders.html` (đổi trạng thái đơn), `admin/index.html` (Dashboard: doanh thu, số đơn, sản phẩm bán chạy, số người dùng — biểu đồ bằng Chart.js).
- 3D **Glam + Coastal** (55 món).

### Như Huyền — Đồ cũ, Chatbot, quản lý người dùng & đánh giá

**Input:** ảnh đồ cũ đã chọn, `products.json`
**Việc làm:**
- Dữ liệu: điền `data/json/used_products.json` gồm **15–20 món đồ cũ** (mẫu ở mục 6), ảnh đặt trong `assets/marketplace/`.
- `marketplace.html`: danh sách đồ cũ, lọc tình trạng (Like New / Good / Fair), giá, thương hiệu, danh mục. Phần hiển thị tình trạng + thời gian sử dụng trong `product-detail.html` (phối hợp Khôi).
- `scripts/components/chatbot.js` + `data/json/chatbot_faqs.json` (hỏi về sản phẩm, phong cách, chính sách, vận chuyển, đổi trả).
- `admin/marketplace.html`, `admin/users.html` (khóa/mở tài khoản), `admin/reviews.html` (ẩn/xóa đánh giá).
- 3D **Traditional** (32 món).

### Người làm mockup

**Input:** `data/masterdata_vi.csv` (tên, danh mục, giá VND, màu, chất liệu đã dịch)
**Việc làm:** thay tên/giá tiếng Anh trong mockup Stitch bằng dữ liệu tiếng Việt; xuất ảnh các màn hình chính để đưa vào báo cáo mục 3.6.

---

## 5. Làm model 3D và đưa lên web

Làm 3D cho **toàn bộ 235 món nội thất** (sofa, ghế, bàn, tủ, kệ, giường, đôn), chia theo phong cách; danh sách ở `tools/3d/danh-sach-3d.csv`. Đồ trang trí (thảm, tranh, gối, đèn…) không làm 3D. Mỗi người mở `tools/3d/product-ids/<tên-bạn>.txt`, copy đoạn `PRODUCT_IDS = [...]`, làm theo `tools/3d/README.md`. Tóm tắt:

1. Kaggle chạy notebook `tools/3d/RoomCraft3D_Kaggle.ipynb` → tải `roomcraft3d_models.zip`.
2. Kiểm tra từng `.glb` (kéo vào https://gltf-viewer.donmccurdy.com), hỏng thì chạy lại.
3. Chép các file `.glb` (giữ nguyên tên = product-id) vào **`assets/models/`**.
4. Mở `data/json/products.json`, Ctrl+F theo product-id, sửa `"model_3d_url": null` thành `"model_3d_url": "assets/models/<product-id>.glb"`.
5. Commit cả file `.glb` và `products.json` lên nhánh của mình, tạo Pull Request.

Hiển thị trên trang chi tiết sản phẩm (Khôi làm) chỉ cần thẻ `<model-viewer>` của Google, kéo chuột để xoay, cuộn để phóng to:
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js"></script>

<model-viewer src="../assets/models/product-farmhouse-julius-swivel-chair-nubuck-cognac-06.glb"
              camera-controls auto-rotate shadow-intensity="1" ar
              style="width:100%; height:480px; background:#f6f4f1"></model-viewer>
```
(`src` lấy từ `utils.asset(product.model_3d_url)`; chỉ hiện khi `model_3d_url` khác `null`.)

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
3. **CN (25/10):** mỗi người tạo Pull Request phần HTML/CSS + model 3D. Kha duyệt, merge.
4. **Tuần 2 (26/10–1/11):** gắn JavaScript + dữ liệu cho các trang khách hàng.
5. **Tuần 3 (2–8/11):** trang admin, kiểm thử chéo (mỗi người test trang của người khác), sửa lỗi, deploy, chụp màn hình cho Chương 5.

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
- Mỗi trang có 3 file: `scripts/<trang>.html`, `scripts/css/pages/<trang>.css`, `scripts/js/pages/<trang>.js`. Script dùng chung nạp trước script của trang:
  ```html
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/pages/rooms.css">
  ...
  <script src="js/core/utils.js"></script>
  <script src="js/core/store.js"></script>
  <script src="js/core/auth.js"></script>
  <script src="components/header.js"></script>
  <script src="components/footer.js"></script>
  <script src="js/pages/rooms.js"></script>
  ```
  (Trang trong `scripts/admin/` thì thêm `../` trước các đường dẫn trên.)
- Không dùng framework (React, Vue…). Thư viện ngoài chỉ dùng: model-viewer (3D), Chart.js (Dashboard), Google Identity Services (đăng nhập Google).
