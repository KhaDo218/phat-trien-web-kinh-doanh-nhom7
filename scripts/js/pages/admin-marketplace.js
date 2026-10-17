/* =====================================================================
   ROOMCRAFT - Quản lý đồ cũ (admin/marketplace.html)
   Người phụ trách: Như Huyền
   Việc cần làm: Thêm / sửa / ẩn đồ cũ.
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    if(requireAdmin() == false)
        return;
    renderAdminSidebar("marketplace");
}
