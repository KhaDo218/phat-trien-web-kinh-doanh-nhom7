/* =====================================================================
   ROOMCRAFT - services/cart.js (giỏ hàng)
   Người phụ trách: Phương Anh
   Dữ liệu: getObject("carts") = { user_id: [ {product_id, quantity} ] }
            khách chưa đăng nhập dùng khóa "guest" (header.js đang đếm theo cách này)
   Gợi ý các hàm: getCart(), addToCart(productId, soLuong), updateQuantity(productId, soLuong),
                  removeFromCart(productId), clearCart(), getCartTotal()
   Số lượng không vượt stock_quantity. Sửa giỏ xong gọi updateCartCount() để cập nhật icon.
   ===================================================================== */
