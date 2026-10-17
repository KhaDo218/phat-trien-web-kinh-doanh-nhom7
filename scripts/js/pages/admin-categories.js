/* =====================================================================
   ROOMCRAFT - Quản lý danh mục (admin/categories.html)
   Người phụ trách: Nguyên Khôi
   Việc cần làm: Thêm / sửa danh mục cha - con.
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    if(requireAdmin() == false)
        return;
    renderAdminSidebar("categories");
}
