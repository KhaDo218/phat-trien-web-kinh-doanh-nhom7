/* =====================================================================
   ROOMCRAFT - product-card.js (thẻ sản phẩm dùng chung)
   Người phụ trách: Nguyên Khôi  (cần xong trước Thứ 5, 22/10)
   Dùng ở: products, wishlist, marketplace, room-detail, product-detail
   Mẫu thẻ theo mockup: ảnh nền #EEEEEC + nút tim góc phải, dòng "THƯƠNG HIỆU • DANH MỤC",
   tên (font Garamond, class title-product), giá + giá gốc gạch ngang (price, price-old),
   nhãn "Còn hàng" (badge badge-stock), nút "Xem chi tiết" (btn btn-full).
   Ảnh: asset(product.images[0]); giá: formatVND(product.price)

   Gợi ý: function createProductCard(product) { ... }
   trả về 1 thẻ <div> tạo bằng document.createElement để trang gọi appendChild.
   ===================================================================== */
