/* =====================================================================
   ROOMCRAFT - Quản lý sản phẩm (admin/products.html)
   Người phụ trách: Nguyên Khôi
   Việc cần làm: Thêm / sửa / ẩn sản phẩm, tồn kho, đường dẫn ảnh và model 3D.
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    if(requireAdmin() == false)
        return;
    renderAdminSidebar("products");
}
