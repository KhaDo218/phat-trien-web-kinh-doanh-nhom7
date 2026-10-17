/* =====================================================================
   ROOMCRAFT - Đồ cũ tuyển chọn (marketplace.html)
   Người phụ trách: Như Huyền
   Việc cần làm: Danh sách đồ cũ (product_type = "USED"), lọc tình trạng, giá, thương hiệu, danh mục.
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    renderHeader("do-cu");
    renderFooter();
    renderChatbot();
}
