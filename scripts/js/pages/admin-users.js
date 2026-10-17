/* =====================================================================
   ROOMCRAFT - Quản lý người dùng (admin/users.html)
   Người phụ trách: Như Huyền
   Việc cần làm: Khóa / mở tài khoản (is_active).
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    if(requireAdmin() == false)
        return;
    renderAdminSidebar("users");
}
