/* =====================================================================
   ROOMCRAFT - Quản lý đơn hàng (admin/orders.html)
   Người phụ trách: Phương Anh
   Việc cần làm: Đổi trạng thái đơn: Confirmed -> Packing -> Shipping -> Delivered, hoặc Cancelled (hoàn tồn kho).
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    if(requireAdmin() == false)
        return;
    renderAdminSidebar("orders");
    showOrders();
}

var orderPage = 1;

function goOrderPage(trang){
    orderPage = trang;
    showOrders();
    window.scrollTo(0, 0);
}

// Vẽ bảng đơn hàng theo ô tìm kiếm + bộ lọc trạng thái (20 đơn mỗi trang)
function showOrders(){
    var tuKhoa = document.getElementById("txtSearch").value.trim().toLowerCase();
    var trangThai = document.getElementById("cboStatus").value;
    var orders = getAllOrders();
    var html = "";
    var dem = 0;

    for(var i = 0; i < orders.length; i++){
        var o = orders[i];
        if(trangThai != "" && o.status != trangThai)
            continue;
        var khach = findById("users", o.user_id);
        var tenKhach = (khach == null) ? "Không rõ" : khach.full_name;
        if(tuKhoa != ""){
            var chuoi = (o.id + " " + tenKhach + " " + o.shipping_name).toLowerCase();
            if(chuoi.indexOf(tuKhoa) < 0)
                continue;
        }
        dem = dem + 1;
        if(dem <= (orderPage - 1) * ADMIN_PAGE_SIZE || dem > orderPage * ADMIN_PAGE_SIZE)
            continue;

        html += "<tr>";
        html += "  <td><button type='button' class='btn-link order-id-link' title='Xem chi tiết đơn' onclick='showOrderInfo(" + o.id + ")'>#" + o.id + "</button></td>";
        html += "  <td>" + safeText(tenKhach) + "<br><span class='text-secondary'>" + safeText(o.shipping_phone) + "</span></td>";
        html += "  <td class='items-text'>" + buildItemsText(o) + "</td>";
        html += "  <td>" + formatDate(o.created_at) + "</td>";
        html += "  <td class='nowrap'>" + formatVND(o.total_amount) + "</td>";
        html += "  <td>" + getPaymentText(o.payment_method) + "<br><span class='text-secondary' style='font-size:12px'>" + safeText(getPaymentStatusText(o)) + "</span></td>";
        html += "  <td><span class='status status-" + o.status + "'>" + getStatusText(o.status) + "</span></td>";
        html += "  <td><div class='action-cell'>";
        var tiep = getNextStatus(o.status);
        if(tiep != "")
            html += "<input class='btn' type='button' value='→ " + getStatusText(tiep) + "' onclick='changeStatus(" + o.id + ", \"" + tiep + "\")'>";
        if(canCancelOrder(o))
            html += "<input class='btn btn-outline' type='button' value='Hủy đơn' onclick='changeStatus(" + o.id + ", \"Cancelled\")'>";
        if(tiep == "" && canCancelOrder(o) == false)
            html += "<span class='text-secondary'>Đã kết thúc</span>";
        html += "  </div></td>";
        html += "</tr>";
    }
    if(dem == 0)
        html = "<tr><td colspan='8' class='empty'>Không có đơn hàng nào.</td></tr>";
    if(html == "" && dem > 0){         // lọc xong danh sách ngắn hơn trang đang xem
        orderPage = fixAdminPage(orderPage, dem);
        showOrders();
        return;
    }
    document.getElementById("tbOrders").innerHTML = html;
    renderAdminPager("pgOrders", orderPage, dem, "goOrderPage");
}

// Ghép tên sản phẩm của đơn: "Ghế A x2, Bàn B x1"
function buildItemsText(order){
    var chuoi = "";
    for(var i = 0; i < order.items.length; i++){
        var p = findById("products", order.items[i].product_id);
        var ten = (p == null) ? (order.items[i].product_name || order.items[i].product_id) : p.name;
        if(i > 0)
            chuoi = chuoi + ", ";
        chuoi = chuoi + safeText(ten) + " x" + order.items[i].quantity;
    }
    return chuoi;
}

function changeStatus(orderId, trangThai){
    var cauHoi = "Chuyển đơn #" + orderId + " sang \"" + getStatusText(trangThai) + "\"?";
    if(trangThai == "Cancelled")
        cauHoi = "Hủy đơn #" + orderId + "? Số lượng sản phẩm sẽ được hoàn lại kho, tiền khách đã trả trước (nếu có) được ghi nhận hoàn lại.";
    var don = findById("orders", orderId);
    if(trangThai == "Delivered" && don != null && Number(don.amount_due) > 0)
        cauHoi = "Xác nhận đơn #" + orderId + " đã giao và đã thu " + formatVND(don.amount_due) + " còn lại?";
    if(confirm(cauHoi) == false)
        return;
    var loi = updateOrderStatus(orderId, trangThai);
    if(loi != ""){
        alert(loi);
        return;
    }
    showOrders();
}

// ---------- Xem chi tiết đơn: người nhận, địa chỉ, loại nhà, ghi chú, giao hàng, tiền ----------
function showOrderInfo(orderId){
    var o = findById("orders", orderId);
    if(o == null)
        return;
    var ship = findById("shipping_methods", o.shipping_method_id);
    var dong = function(nhan, giaTri){
        return "<div class='sum-row'><span>" + nhan + "</span><span>" + giaTri + "</span></div>";
    };
    var html = "";
    html += "<div class='modal-box'>";
    html += "  <div class='modal-head'><div><p class='overline'>Đặt ngày " + formatDate(o.created_at) + " · " + getStatusText(o.status) + "</p>";
    html += "    <h2 class='headline-section'>Đơn hàng #" + o.id + "</h2></div>";
    html += "    <button class='btn-icon' type='button' title='Đóng' onclick='closeOrderInfo()'><span class='material-symbols-outlined'>close</span></button></div>";
    html += "  <div class='modal-body order-info'>";
    html += "    <p class='overline'>Người nhận</p><p>" + safeText(o.shipping_name) + " · " + safeText(o.shipping_phone) + (o.shipping_email ? " · " + safeText(o.shipping_email) : "") + "</p>";
    html += "    <p class='overline'>Địa chỉ giao</p><p>" + safeText(o.shipping_address) + "</p>";
    if(o.house_type || o.shipping_note)
        html += "    <p class='text-secondary'>" + safeText([o.house_type, o.shipping_note].filter(function(x){ return x; }).join(" · ")) + "</p>";
    html += "    <p class='overline'>Giao hàng</p><p>" + (ship ? safeText(ship.name) + " (" + safeText(ship.estimated_time) + ")" : "") + "</p>";
    html += "    <p class='overline'>Sản phẩm</p><p>" + buildItemsText(o) + "</p>";
    html += dong("Tạm tính", formatVND(o.subtotal));
    html += dong("Phí giao hàng", formatVND(o.shipping_fee));
    html += dong("Giảm giá", "- " + formatVND(o.discount_amount));
    html += dong("<b>Tổng cộng</b>", "<b>" + formatVND(o.total_amount) + "</b>");
    html += dong("Thanh toán", getPaymentText(o.payment_method) + (o.card_last4 ? " ···· " + safeText(o.card_last4) : ""));
    html += dong("Tình trạng tiền", safeText(getPaymentStatusText(o)));
    html += "  </div>";
    html += "</div>";

    var nen = document.getElementById("orderModal");
    if(nen == null){
        nen = document.createElement("div");
        nen.id = "orderModal";
        nen.setAttribute("onclick", "if(event.target == this) closeOrderInfo()");
        document.body.appendChild(nen);
    }
    nen.className = "modal";
    nen.innerHTML = html;
    document.onkeydown = function(e){ if(e.keyCode == 27) closeOrderInfo(); };
}

function closeOrderInfo(){
    document.getElementById("orderModal").className = "modal hidden";
    document.onkeydown = null;
}
