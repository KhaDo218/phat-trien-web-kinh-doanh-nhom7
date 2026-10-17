/* =====================================================================
   ROOMCRAFT - Quản lý đơn hàng (admin/orders.html)
   Người phụ trách: Phương Anh
   Việc cần làm: Đổi trạng thái đơn: Confirmed -> Packing -> Shipping -> Delivered, hoặc Cancelled (hoàn tồn kho).
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    if(requireAdmin() == false)
        return;
    renderAdminSidebar("orders");
}
