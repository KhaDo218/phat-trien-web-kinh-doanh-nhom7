/* =====================================================================
   ROOMCRAFT - Đặt hàng thành công (order-success.html)
   Người phụ trách: Phương Anh
   Việc cần làm: Thông báo đặt hàng thành công, mã đơn lấy theo getParam("id").
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    if(requireLogin() == false)
        return;
    renderHeader("");
    renderFooter();
    renderChatbot();
}
