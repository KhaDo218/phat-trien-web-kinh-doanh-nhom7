/* =====================================================================
   ROOMCRAFT - Chi tiết đơn hàng (order-detail.html)
   Người phụ trách: Phương Anh
   Việc cần làm: Theo dõi trạng thái, hủy đơn, viết đánh giá khi đơn Delivered.
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    if(requireLogin() == false)
        return;
    renderHeader("");
    renderFooter();
    renderChatbot();
}
