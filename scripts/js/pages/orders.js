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
    showOrders();
}

function showOrders(){
    var box = document.getElementById("ordersContent");
    var orders = getOrdersByUser(getCurrentUser().id);

    if(orders.length == 0){
        box.innerHTML = "<div class='empty orders-empty'>"
                      + "<span class='empty-icon'><span class='material-symbols-outlined'>receipt_long</span></span>"
                      + "<h2 class='headline-section'>Chưa có đơn hàng nào</h2>"
                      + "<p class='empty-copy'>Khi bạn hoàn tất một đơn hàng, thông tin sản phẩm và trạng thái giao hàng sẽ xuất hiện tại đây.</p>"
                      + "<a class='btn' href='products.html'>Bắt đầu khám phá</a></div>";
        return;
    }

    var html = "<table class='orders-table'>";
    html += "<thead><tr><th>Mã đơn</th><th>Ngày đặt</th><th>Số sản phẩm</th><th>Tổng tiền</th><th>Trạng thái</th><th></th></tr></thead>";
    html += "<tbody id='tbOrders'>";
    for(var i = 0; i < orders.length; i++){
        var soSp = 0;
        for(var j = 0; j < orders[i].items.length; j++)
            soSp = soSp + Number(orders[i].items[j].quantity);
        html += "<tr>";
        html += "  <td>#" + orders[i].id + "</td>";
        html += "  <td>" + formatDate(orders[i].created_at) + "</td>";
        html += "  <td>" + soSp + "</td>";
        html += "  <td>" + formatVND(orders[i].total_amount) + "</td>";
        html += "  <td><span class='status status-" + orders[i].status + "'>" + getStatusText(orders[i].status) + "</span></td>";
        html += "  <td><a class='btn-link' href='order-detail.html?id=" + orders[i].id + "'>Xem chi tiết</a></td>";
        html += "</tr>";
    }
    html += "</tbody></table>";
    box.innerHTML = html;
}
