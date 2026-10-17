/* =====================================================================
   ROOMCRAFT - Thanh toán (checkout.html)
   Người phụ trách: Phương Anh
   Việc cần làm: Thông tin giao hàng, phương thức vận chuyển, mã giảm giá, thanh toán mô phỏng.
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    if(requireLogin() == false)
        return;
    renderHeader("");
    renderFooter();
    renderChatbot();
}
