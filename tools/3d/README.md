# Tạo model 3D từ ảnh sản phẩm (Kaggle + Hunyuan3D-2)

```
tools/3d/
├── RoomCraft3D_Kaggle.ipynb   ← notebook duy nhất, import lên Kaggle là chạy
├── danh-sach-3d.csv           ← danh sách 3D của cả nhóm (cột trang_thai: Đã có / Chưa làm)
└── product-ids/<tên>.txt      ← đoạn PRODUCT_IDS của từng người, dán vào notebook
assets/models/                 ← nơi chép file .glb để web dùng
```

## Chia việc theo phong cách

Làm 3D cho toàn bộ **235 món nội thất** (sofa, ghế, bàn, tủ, kệ, giường, đôn). Đồ trang trí (thảm, tranh, gối, rèm, bình, cây) không làm: dạng phẳng hoặc trong suốt, AI dựng ra không đẹp và không thêm gì so với ảnh.

| Phong cách | Người phụ trách | Số món cần làm |
|---|---|---|---|
| Farmhouse | Quỳnh Kha | 46 |
| Bohemian | Bảo Duy | 39 |
| Scandinavian, Mid-century Modern | Nguyên Khôi | 59 |
| Glam, Coastal | Phương Anh | 55 |
| Traditional | Như Huyền | 32 |

## Các bước

**Chuẩn bị (Kha):** tạo Kaggle Dataset riêng tư `roomcraft-products` từ thư mục `assets/products`, vào *Settings → Collaborators* thêm 4 bạn.

1. Kaggle → *New Notebook* → *File → Import Notebook* → chọn `tools/3d/RoomCraft3D_Kaggle.ipynb`.
2. *Settings*: **Accelerator = GPU T4 x2**, **Internet = On**. *Add Input* → `roomcraft-products`.
3. Mở `tools/3d/product-ids/<tên-bạn>.txt`, copy đoạn `PRODUCT_IDS = [...]` dán đè vào ô ⚙️ CẤU HÌNH. Giữ `MY_SHARE = "1/1"`, đặt `PRESET = "best"`, giữ `MAX_FACES = 40000` (file nhẹ ~1,5–2 MB).
4. **Save Version → Save & Run All (Commit)**. Kaggle chạy nền (mỗi món ~5 phút, 2 GPU chạy song song), tắt máy được. Một phiên Kaggle chạy tối đa 12 giờ, dư cho cả danh sách.
5. Xong thì vào tab *Output* của version đó, tải `roomcraft3d_models.zip`, giải nén.
6. Kiểm tra từng `.glb`: kéo vào https://gltf-viewer.donmccurdy.com, xoay xem đủ mặt chưa.
   - Màu/texture bị vẽ sai: thêm vào `REDO_TEXTURE` (vd. `{"product-...-01": 7}`) rồi chạy lại từ ô 3.
   - Hình dạng hỏng hẳn: chọn ảnh khác bằng `IMAGE_OVERRIDE` (vd. `{"product-...-01": 3}` = dùng ảnh `-03.jpg`).
7. Chép các file `.glb` đạt (trong thư mục `models/` của zip, **giữ nguyên tên**) vào `assets/models/` của repo.
8. Mở `data/json/products.json`, Ctrl+F từng product-id, sửa `"model_3d_url": null` → `"model_3d_url": "assets/models/<product-id>.glb"`.
9. Trong `danh-sach-3d.csv` đổi cột `trang_thai` thành `Đã có`.
10. Commit `.glb` + `products.json` + `danh-sach-3d.csv` lên nhánh của mình (vd. `huyen/3d-coastal`), tạo Pull Request.

Nếu notebook bị ngắt giữa chừng, chỉ cần chạy lại: sản phẩm đã xong tự bỏ qua. Mỗi tài khoản Kaggle có ~30 giờ GPU/tuần, dư cho phần của mỗi người.
Mỗi file ~1,5–2 MB. Không đẩy file zip lên Git. Nên commit theo đợt (vd. mỗi lần 10–20 model) để Pull Request không quá nặng.

## Hiển thị trên web

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js"></script>
<model-viewer src="../assets/models/<product-id>.glb" camera-controls auto-rotate shadow-intensity="1" ar
              style="width:100%; height:480px"></model-viewer>
```
`camera-controls` = kéo chuột để xoay, cuộn để phóng to. Phải mở trang qua Live Server; mở thẳng file (`file://`) thì trình duyệt chặn tải `.glb` nên khung 3D trống, không xoay được.
