/* =====================================================================
   ROOMCRAFT - Sản phẩm yêu thích (wishlist.html)
   Người phụ trách: Nguyên Khôi
   Việc cần làm: Danh sách sản phẩm trong rc_wishlists của người đang đăng nhập.
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    if(requireLogin() == false)
        return;
    renderHeader("");
    renderFooter();
    renderChatbot();
}
