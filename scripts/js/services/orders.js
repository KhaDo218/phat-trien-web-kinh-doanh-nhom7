/* =====================================================================
   ROOMCRAFT - services/orders.js (đơn hàng)
   Người phụ trách: Phương Anh
   Dữ liệu: getTable("orders") - mỗi đơn gồm các cột bảng orders
            + items: [ {product_id, quantity, unit_price} ]
   Trạng thái: Confirmed -> Packing -> Shipping -> Delivered, hoặc Cancelled
   Gợi ý các hàm: createOrder(...) (trạng thái Confirmed, trừ stock_quantity),
                  cancelOrder(orderId) (hoàn lại stock_quantity), getOrdersByUser(userId),
                  updateOrderStatus(orderId, trangThai)
   Id đơn mới: getNextId("orders")
   ===================================================================== */
