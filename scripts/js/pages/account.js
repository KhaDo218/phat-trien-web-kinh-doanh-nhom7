/* =====================================================================
   ROOMCRAFT - Tài khoản của tôi (account.html)
   Người phụ trách: Quỳnh Kha
   Việc cần làm: Hồ sơ cá nhân, đổi mật khẩu, liên kết tới Đơn hàng và Wishlist.
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    if(requireLogin() == false)
        return;
    renderHeader("");
    renderFooter();
    renderChatbot();
}
