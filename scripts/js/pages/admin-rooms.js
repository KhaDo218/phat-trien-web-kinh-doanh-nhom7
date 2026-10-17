/* =====================================================================
   ROOMCRAFT - Quản lý phòng (admin/rooms.html)
   Người phụ trách: Bảo Duy
   Việc cần làm: Thêm / sửa phòng, gắn sản phẩm vào phòng bằng cách bấm lên ảnh (tọa độ %).
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    if(requireAdmin() == false)
        return;
    renderAdminSidebar("rooms");
}
