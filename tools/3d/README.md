# Hướng dẫn làm model 3D trên Kaggle (từng bước, cho người chưa dùng Kaggle)

Mỗi người tự tạo model 3D cho các món **nội thất** thuộc phong cách mình phụ trách, bằng notebook có sẵn chạy trên GPU miễn phí của Kaggle. Làm xong chép file `.glb` vào repo và tạo Pull Request.

```
tools/3d/
├── RoomCraft3D_Kaggle.ipynb   ← notebook tạo 3D (import lên Kaggle)
├── danh-sach-3d.csv           ← danh sách 3D của cả nhóm (cột trang_thai: Đã có / Chưa làm)
└── product-ids/<tên>.txt      ← danh sách sản phẩm của từng người, dán vào notebook
assets/models/                 ← nơi chép file .glb để web dùng
```

Chỉ làm 3D cho **235 món nội thất** (sofa, ghế, bàn, tủ, kệ, giường, đôn). Đồ trang trí (thảm, tranh, gối, rèm, bình, cây) không làm: dạng phẳng hoặc trong suốt, AI dựng ra không đẹp và không thêm gì so với ảnh.

| Người | Phong cách | Thư mục ảnh cần nén | File danh sách | Số món | Kaggle chạy khoảng |
|---|---|---|---|---|---|
| Quỳnh Kha | Farmhouse | `farmhouse` (82 MB) | `quynh-kha.txt` | 46 | 2 giờ |
| Bảo Duy | Bohemian, Mid-century Modern | `bohemian` + `mid-century-modern` (96 MB) | `bao-duy.txt` | 69 | 3 giờ |
| Nguyên Khôi | Scandinavian | `scandinavian` (75 MB) | `nguyen-khoi.txt` | 29 | 1,3 giờ |
| Phương Anh | Glam, Traditional | `glam` + `traditional` (116 MB) | `phuong-anh.txt` | 62 | 2,7 giờ |
| Như Huyền | Coastal | `coastal` (65 MB) | `nhu-huyen.txt` | 25 | 1,1 giờ |

**Hạn: Chủ nhật 25/10.** Tổng thời gian ngồi máy khoảng 30–45 phút (tạo tài khoản, tải ảnh, bấm chạy, kiểm tra); phần chạy Kaggle tự chạy nền, tắt máy được.

---

## Phần A — Cài đặt Kaggle (làm 1 lần)

### A1. Tạo tài khoản
1. Vào https://www.kaggle.com → **Register** → **Sign in with Google** (dùng Gmail nào cũng được).
2. Đặt username, đồng ý điều khoản là xong.

### A2. Xác minh số điện thoại (bắt buộc)
Chưa xác minh thì Kaggle **không cho bật GPU và Internet**, notebook sẽ không chạy được.
1. Bấm ảnh đại diện góc trên bên phải → **Settings**.
2. Kéo tới mục **Phone Verification** → **Not verified** → nhập số điện thoại (chọn mã +84) → nhập mã SMS.
3. Thấy chữ **Verified** là xong.

### A3. Tải notebook về máy
Cách 1 (đã clone repo): file nằm ở `tools/3d/RoomCraft3D_Kaggle.ipynb`.
Cách 2: mở https://github.com/KhaDo218/WBD_NHOM7/blob/main/tools/3d/RoomCraft3D_Kaggle.ipynb → bấm nút **Download raw file** (biểu tượng mũi tên tải xuống, góc phải phía trên nội dung file).

---

## Phần B — Đưa ảnh sản phẩm lên Kaggle (làm 1 lần)

Notebook cần ảnh sản phẩm để dựng 3D. Mỗi người chỉ tải lên **thư mục phong cách của mình** (xem cột "Thư mục ảnh cần nén" ở bảng trên).

### B1. Nén ảnh thành file zip
1. Mở thư mục repo trên máy → `assets` → `products`.
2. Chọn thư mục phong cách của mình (2 phong cách thì giữ **Ctrl** và bấm chọn cả 2).
3. Chuột phải → **Compress to ZIP file** (Windows 11) hoặc **Send to → Compressed (zipped) folder** (Windows 10).
4. Đặt tên file, ví dụ `roomcraft-duy.zip`. Để file zip **ra ngoài thư mục repo** (vd. Desktop) để không lỡ đẩy lên GitHub.

> Phải nén thành zip, đừng kéo cả thư mục lên: có hàng trăm ảnh trong nhiều thư mục con, tải trực tiếp rất dễ treo hoặc thiếu file. Kaggle tự giải nén file zip.

### B2. Tạo Dataset
1. Trên Kaggle, menu bên trái → **Datasets** → nút **+ New Dataset**.
2. Kéo file zip vào ô tải lên, chờ thanh tiến độ chạy hết (vài phút tùy mạng).
3. **Dataset title**: `roomcraft-<tên>` (vd. `roomcraft-duy`).
4. Chọn **Private** → bấm **Create**. Chờ Kaggle xử lý xong (trang dataset hiện danh sách thư mục ảnh) là được.

---

## Phần C — Chạy notebook tạo 3D

### C1. Mở notebook trên Kaggle
1. Menu bên trái → **Code** → **+ New Notebook**.
2. Trong notebook mới: menu **File → Import Notebook** → kéo file `RoomCraft3D_Kaggle.ipynb` vào → **Import**.
3. Đổi tên notebook ở góc trên bên trái (vd. `RoomCraft 3D - Duy`) cho dễ tìm.

### C2. Bật GPU, Internet và gắn dataset ảnh
Ở khung bên phải (nếu không thấy, bấm biểu tượng **>|** để mở):
1. **Session options → Accelerator** → chọn **GPU T4 x2**. (Không chọn P100.)
2. **Session options → Internet** → bật **On**.
3. **Input → + Add Input** → tab **Your Work** → chọn dataset `roomcraft-<tên>` vừa tạo → bấm dấu **+**.

> Nếu ô GPU hoặc Internet bị mờ, không chọn được: tài khoản chưa xác minh số điện thoại (quay lại bước A2).

### C3. Sửa ô ⚙️ CẤU HÌNH
Đây là ô code duy nhất cần sửa (ô đầu tiên có chữ `PRODUCT_IDS`).
1. Mở file `tools/3d/product-ids/<tên-bạn>.txt`, copy **từ dòng `PRODUCT_IDS = [` tới dấu `]` cuối cùng**.
2. Trong ô CẤU HÌNH, bôi đen đoạn `PRODUCT_IDS = [ ... ]` mẫu và dán đè lên.
3. Kiểm tra các dòng còn lại trong ô:
   ```python
   MY_SHARE = "1/1"
   PRESET = "best"
   MAX_FACES = 40000
   ```
   Ô ghi `PRESET = "balanced"` thì đổi thành `"best"`. Các dòng khác giữ nguyên.

### C4. Chạy nền (không cần ngồi canh)
1. Góc trên bên phải → **Save Version**.
2. Chọn **Save & Run All (Commit)** → **Save**.
3. Kaggle bắt đầu chạy. Có thể đóng trình duyệt, tắt máy.
4. Xem tiến độ: menu **Code → Your Work** → mở notebook → mục **Versions** (hoặc **Logs**). Trạng thái **Running** là đang chạy, **Successful** là xong.

Thời gian: khoảng 8 phút cài đặt + 2,5 phút mỗi món (2 GPU chạy song song). Mỗi phiên Kaggle chạy tối đa 12 giờ, mỗi tuần được ~30 giờ GPU — dư cho phần của mỗi người. Xem số giờ còn lại ở **Settings → Quotas**.

### C5. Tải kết quả
1. Mở version đã chạy xong → tab **Output**.
2. Tải file **`roomcraft3d_models.zip`** → giải nén ra máy.
3. Bên trong có thư mục `models/` chứa các file `<product-id>.glb`.

### C6. Kiểm tra từng model
Mở https://gltf-viewer.donmccurdy.com → kéo từng file `.glb` vào → xoay xem đủ các mặt.

| Model bị lỗi | Cách sửa |
|---|---|
| Hình dạng đúng nhưng màu/texture sai, mặt sau có hình lạ | Thêm vào `REDO_TEXTURE`, vd. `{"product-...-01": 7}` (số bất kỳ) |
| Hình dạng méo, thiếu chân, dính nền | Chọn ảnh khác bằng `IMAGE_OVERRIDE`, vd. `{"product-...-01": 3}` = dùng ảnh `...-03.jpg` (xem ảnh trong dataset) |
| Thử 2–3 lần vẫn hỏng | Bỏ qua món đó, ghi chú lại để báo nhóm |

Chạy lại các món lỗi: trong ô CẤU HÌNH, sửa `PRODUCT_IDS` **chỉ còn các món cần làm lại** (không để cả danh sách, vì version mới chạy lại từ đầu), điền `REDO_TEXTURE`/`IMAGE_OVERRIDE`, rồi **Save Version → Save & Run All** như bước C4.

### Lỗi thường gặp

| Hiện tượng | Nguyên nhân / cách sửa |
|---|---|
| Ô GPU, Internet bị mờ | Chưa xác minh số điện thoại (A2) |
| Báo `Chưa bật GPU!` | Chưa chọn **GPU T4 x2** ở C2 |
| Báo `Không có sản phẩm nào để chạy` | Chưa **Add Input** dataset ảnh, hoặc dán sai `PRODUCT_IDS` |
| Báo `Không tìm thấy ảnh cho ... sản phẩm` | Dataset thiếu thư mục phong cách đó → nén lại đúng thư mục, tạo lại dataset |
| Báo `CUDA out of memory` | Đổi `PRESET = "balanced"` rồi chạy lại |
| Worker bị kill / hết RAM | Kiểm tra đã chọn **T4 x2**, chạy lại (món đã xong không mất trong cùng phiên) |
| Hết quota GPU | Chờ sang tuần (quota reset thứ Bảy) hoặc nhờ bạn khác chạy giúp |

---

## Phần D — Đưa model lên repo

1. `git checkout main && git pull`, rồi tạo nhánh: `git checkout -b <tên>/3d` (vd. `duy/3d`).
2. Chép các file `.glb` đạt (trong thư mục `models/` vừa giải nén, **giữ nguyên tên file**) vào `assets/models/` của repo.
3. Mở `data/json/products.json` bằng VS Code → **Ctrl+F** tìm từng product-id → sửa
   `"model_3d_url": null` thành `"model_3d_url": "assets/models/<product-id>.glb"`.
   Sửa xong, VS Code không báo đỏ là đúng cú pháp.
4. Mở `tools/3d/danh-sach-3d.csv`, đổi cột `trang_thai` của các món đã xong thành `Đã có`.
5. Commit và push:
   ```bash
   git add assets/models data/json/products.json tools/3d/danh-sach-3d.csv
   git commit -m "[Duy] 3D: 20 model Bohemian"
   git push -u origin duy/3d
   ```
   Rồi lên GitHub tạo **Pull Request** vào `main`. Nên đẩy theo đợt 10–20 model, đừng gom hết một lần.

Không đẩy file zip lên GitHub. Mỗi file `.glb` khoảng 1,5–2 MB.

---

## Hiển thị trên web (cho người làm trang Chi tiết sản phẩm)

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js"></script>
<model-viewer src="../assets/models/<product-id>.glb" camera-controls auto-rotate shadow-intensity="1" ar
              style="width:100%; height:480px"></model-viewer>
```
`camera-controls` = kéo chuột để xoay, cuộn để phóng to. Phải mở trang qua Live Server; mở thẳng file (`file://`) thì trình duyệt chặn tải `.glb` nên khung 3D trống.
