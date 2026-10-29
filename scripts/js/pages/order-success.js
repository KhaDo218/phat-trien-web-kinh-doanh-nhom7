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
    showSuccess();
}

function showSuccess(){
    var box = document.getElementById("successBox");
    var order = findById("orders", getParam("id"));
    var user = getCurrentUser();

    // Không có đơn, hoặc đơn của người khác thì không cho xem
    if(order == null || order.user_id != user.id){
        box.innerHTML = "<div class='empty'><p>Không tìm thấy đơn hàng.</p><br><a class='btn' href='orders.html'>Xem đơn hàng của tôi</a></div>";
        return;
    }

    var ship = findById("shipping_methods", order.shipping_method_id);
    var html = "";
    html += "<span class='material-symbols-outlined success-icon'>check_circle</span>";
    html += "<h2 class='headline-section'>Cảm ơn bạn đã đặt hàng!</h2>";
    var loiNhan = "Đơn hàng của bạn đã được xác nhận và sẽ sớm được chuẩn bị.";
    if(ship != null && ship.kind == "BULKY")
        loiNhan = "Đơn hàng đã được xác nhận. Nhân viên RoomCraft sẽ gọi cho bạn để hẹn khung giờ giao và lắp đặt.";
    html += "<p class='lead'>" + loiNhan + "</p>";
    html += "<div class='success-info'>";
    html += "  <div class='info-row'><span>Mã đơn hàng</span><span>#" + order.id + "</span></div>";
    html += "  <div class='info-row'><span>Ngày đặt</span><span>" + formatDate(order.created_at) + "</span></div>";
    html += "  <div class='info-row'><span>Người nhận</span><span>" + safeText(order.shipping_name) + " · " + safeText(order.shipping_phone) + "</span></div>";
    html += "  <div class='info-row'><span>Giao đến</span><span>" + safeText(order.shipping_address) + "</span></div>";
    if(ship != null)
        html += "  <div class='info-row'><span>Giao hàng</span><span>" + safeText(ship.name) + " · dự kiến " + getDeliveryRange(ship) + "</span></div>";
    html += "  <div class='info-row'><span>Thanh toán</span><span>" + getPaymentText(order.payment_method) + (order.card_last4 ? " ···· " + safeText(order.card_last4) : "") + "</span></div>";
    html += "  <div class='info-row'><span>Tổng đơn hàng</span><span class='price'>" + formatVND(order.total_amount) + "</span></div>";
    if(order.paid_amount != null){
        html += "  <div class='info-row'><span>Đã thanh toán</span><span>" + formatVND(order.paid_amount) + "</span></div>";
        html += "  <div class='info-row'><span>Trả khi nhận hàng</span><span class='price'>" + formatVND(order.amount_due) + "</span></div>";
    }
    html += "</div>";
    html += "<div class='success-actions'>";
    html += "  <a class='btn' href='order-detail.html?id=" + order.id + "'>Theo dõi đơn hàng</a>";
    html += "  <a class='btn btn-outline' href='products.html'>Tiếp tục mua sắm</a>";
    html += "</div>";
    box.innerHTML = html;
}
