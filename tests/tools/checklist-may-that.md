| Mã | Hạng mục | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| CL-01 | Cuộn trang chủ mượt | Vuốt dọc liên tục trên trang chủ có video/Pointlight | Cuộn mượt, không giật/khựng, video không tự phát lại gây lag |
| CL-02 | Header trong suốt khi cuộn | Cuộn xuống qua vùng hero rồi cuộn lên | Header chuyển trạng thái trong suốt/đặc đúng, chữ luôn đọc được, không nhấp nháy |
| CL-03 | Hiệu ứng kính mờ | Quan sát header/panel kính mờ khi cuộn nền ảnh phức tạp | Blur hiển thị đúng trên Safari/Chrome, không vỡ hình, không tụt FPS rõ rệt |
| CL-04 | Tham quan 360° bằng ngón tay | Dùng 1 ngón kéo xoay cảnh 360° | Xoay mượt theo ngón, không trôi, không kẹt ở biên |
| CL-05 | Xoay máy khi xem 360° | Đang xem 360° rồi xoay ngang/dọc máy | Cảnh giữ đúng hướng, không reset vị trí, không méo hình |
| CL-06 | Chạm hotspot Không gian mẫu | Chạm chính xác hotspot sản phẩm trên ảnh phòng | Mở đúng sản phẩm, vùng chạm đủ lớn, không mở nhầm hotspot kề bên |
| CL-07 | Xoay sản phẩm 3D | Dùng ngón kéo xoay mô hình 3D sản phẩm | Xoay mượt 360°, không nhảy, không khóa cử chỉ cuộn trang |
| CL-08 | Zoom 2 ngón ảnh sản phẩm | Chụm/mở 2 ngón trên ảnh sản phẩm | Zoom đúng tâm, không zoom cả trang, không vỡ ảnh |
| CL-09 | Nút chạm ≥ 44px | Kiểm tra nút giỏ hàng, hotspot, chatbot, nút Back | Tất cả vùng chạm ≥ 44px, dễ bấm, không chạm nhầm |
| CL-10 | Bàn phím ảo che ô nhập thanh toán | Chạm từng ô nhập ở trang thanh toán | Ô nhập tự cuộn vào vùng nhìn thấy, không bị bàn phím che |
| CL-11 | Chuyển ô nhập bằng bàn phím ảo | Dùng nút Next/Prev trên bàn phím ảo giữa các ô | Focus chuyển đúng thứ tự, không nhảy sai ô, không mất dữ liệu |
| CL-12 | Gõ địa chỉ tiếng Việt có dấu | Nhập địa chỉ có dấu (VD: "123 Lê Lợi, Quận 1") | Hiển thị đúng dấu, không lỗi font, autocomplete không làm sai ký tự |
| CL-13 | Chatbot với bàn phím ảo | Mở chatbot, chạm ô nhập, gõ tin nhắn | Khung chat nâng lên trên bàn phím, nút gửi bấm được, không bị che |
| CL-14 | Chatbot nổi góc phải | Cuộn trang dài, mở/đóng chatbot | Nút nổi cố định đúng góc, không đè nút khác, không chặn nội dung |
| CL-15 | Xoay ngang màn hình thanh toán | Xoay ngang khi đang điền form thanh toán | Layout không vỡ, ô nhập vẫn dùng được, nút thanh toán thấy rõ |
| CL-16 | Xoay ngang trang chủ | Xoay ngang ở trang chủ có video/360° | Video/360° co giãn đúng, không tràn, không cắt nội dung |
| CL-17 | Nút Back trình duyệt | Điều hướng sâu (sản phẩm → 3D → giỏ) rồi bấm Back | Quay lại đúng trang trước, giữ vị trí cuộn hợp lý, không lặp vòng |
| CL-18 | Chia sẻ link sản phẩm | Dùng Share của Safari/Chrome chia sẻ link sản phẩm | Link mở đúng sản phẩm trên máy khác, có preview đúng tiêu đề/ảnh |
| CL-19 | Giữ giỏ hàng sau khi tắt/mở trình duyệt | Đăng nhập, thêm giỏ, đóng hẳn trình duyệt rồi mở lại | Giỏ hàng còn nguyên, đúng số lượng, không mất phiên đăng nhập |
| CL-20 | Tốc độ tải qua 4G | Bật 4G, tải trang chủ lần đầu (cache trống) | Trang hữu ích hiển thị nhanh, video/360° lazy-load, không treo trắng |
| CL-21 | Cuộn mượt trang Đồ cũ | Vuốt dọc danh sách Đồ cũ dài, tải thêm | Cuộn mượt, lazy-load ảnh không giật, không nhảy vị trí khi tải thêm |
| CL-22 | Chạm sản phẩm trong giỏ | Chạm ảnh/tên/nút số lượng trong giỏ hàng | Mở đúng sản phẩm, tăng/giảm số lượng chính xác, không chạm nhầm |
| CL-23 | Trang quản trị trên di động | Đăng nhập admin, xem bảng đơn hàng, cuộn ngang bảng | Bảng cuộn ngang được, nút thao tác ≥ 44px, không tràn layout |
| CL-24 | Đa nhiệm & quay lại tab | Chuyển app/tab khi đang xem 360°/3D rồi quay lại | Trạng thái giữ nguyên, không crash, không tự reload mất dữ liệu form |
| CL-25 | Xoay máy khi mở bàn phím ảo | Đang gõ ở thanh toán rồi xoay ngang/dọc | Bàn phím và ô nhập đồng bộ, không che nút gửi/thanh toán, không mất focus |