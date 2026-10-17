/* =====================================================================
   ROOMCRAFT - Quản lý đánh giá (admin/reviews.html)
   Người phụ trách: Như Huyền
   Việc cần làm: Ẩn / xóa đánh giá.
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    if(requireAdmin() == false)
        return;
    renderAdminSidebar("reviews");
}
