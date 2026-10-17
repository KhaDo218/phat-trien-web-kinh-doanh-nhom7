/* =====================================================================
   ROOMCRAFT - Đơn hàng của tôi (orders.html)
   Người phụ trách: Phương Anh
   Việc cần làm: Danh sách đơn của người đang đăng nhập.
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    if(requireLogin() == false)
        return;
    renderHeader("");
    renderFooter();
    renderChatbot();
}
