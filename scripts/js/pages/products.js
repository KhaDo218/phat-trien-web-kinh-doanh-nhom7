/* =====================================================================
   ROOMCRAFT - Nội thất cho không gian của bạn (products.html)
   Người phụ trách: Nguyên Khôi
   Việc cần làm: Tìm kiếm (getParam("q")), lọc phong cách (getParam("style")) + danh mục + giá, sắp xếp, phân trang.
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    renderHeader("san-pham");
    renderFooter();
    renderChatbot();
}
