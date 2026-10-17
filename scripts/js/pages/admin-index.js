/* =====================================================================
   ROOMCRAFT - Dashboard (admin/index.html)
   Người phụ trách: Phương Anh
   Việc cần làm: Doanh thu, số đơn, sản phẩm bán chạy, số người dùng (Chart.js).
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    if(requireAdmin() == false)
        return;
    renderAdminSidebar("dashboard");
}
