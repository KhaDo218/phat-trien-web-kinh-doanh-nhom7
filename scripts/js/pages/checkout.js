/* =====================================================================
   ROOMCRAFT - Thanh toán (checkout.html)
   Người phụ trách: Phương Anh
   Việc cần làm: Thông tin giao hàng, phương thức vận chuyển, mã giảm giá, thanh toán mô phỏng.
   ===================================================================== */

var appliedCoupon = null;       // mã giảm giá đang áp dụng (null = chưa có)

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    if(requireLogin() == false)
        return;
    renderHeader("");
    renderFooter();
    renderChatbot();

    cleanCart();
    if(getCart().length == 0){
        alert("Giỏ hàng đang trống!");
        window.location.href = "cart.html";
        return;
    }
    if(hasOutOfStockItem()){
        alert("Giỏ hàng có sản phẩm đã hết hàng, vui lòng xóa trước khi thanh toán!");
        window.location.href = "cart.html";
        return;
    }

    // Điền sẵn thông tin của người đang đăng nhập
    var user = getCurrentUser();
    document.getElementById("txtName").value = user.full_name;
    if(user.phone != null)
        document.getElementById("txtPhone").value = user.phone;
    if(user.default_address != null)
        document.getElementById("txtAddress").value = user.default_address;

    showShippingMethods();
    showSummaryItems();
    showPaymentNote();
    updateSummary();
}

// ---------- Phương thức vận chuyển ----------
function showShippingMethods(){
    var list = getTable("shipping_methods");
    var html = "";
    var daChon = false;
    for(var i = 0; i < list.length; i++){
        if(list[i].is_active == false)
            continue;
        var check = "";
        if(daChon == false){
            check = " checked";
            daChon = true;
        }
        html += "<label class='option'>";
        html += "  <input type='radio' name='rdoShipping' value='" + list[i].id + "'" + check + " onclick='updateSummary()'>";
        html += "  <span class='option-info'>" + safeText(list[i].name) + "<small>Dự kiến " + safeText(list[i].estimated_time) + "</small></span>";
        html += "  <span class='price'>" + formatVND(list[i].fee) + "</span>";
        html += "</label>";
    }
    document.getElementById("shippingList").innerHTML = html;
}

function getSelectedShipping(){
    var o = document.getElementsByName("rdoShipping");
    for(var i = 0; i < o.length; i++){
        if(o[i].checked)
            return findById("shipping_methods", o[i].value);
    }
    return null;
}

function getSelectedPayment(){
    var o = document.getElementsByName("rdoPayment");
    for(var i = 0; i < o.length; i++){
        if(o[i].checked)
            return o[i].value;
    }
    return "COD";
}

// ---------- Thanh toán mô phỏng ----------
function showPaymentNote(){
    var pt = getSelectedPayment();
    var chu = "";
    if(pt == "COD")
        chu = "Bạn thanh toán bằng tiền mặt cho nhân viên giao hàng khi nhận sản phẩm.";
    else if(pt == "Bank Transfer")
        chu = "Chuyển khoản tới: Ngân hàng RoomCraft Bank · STK 0123456789 · Chủ tài khoản: CONG TY ROOMCRAFT. "
            + "Nội dung: số điện thoại của bạn. (Thông tin mô phỏng, không có giao dịch thật.)";
    else
        chu = "Hệ thống mô phỏng thanh toán bằng ví điện tử: bấm Đặt hàng là đơn được ghi nhận đã thanh toán. "
            + "(Không có giao dịch thật.)";
    document.getElementById("paymentNote").innerHTML = chu;
}

// ---------- Tóm tắt đơn hàng ----------
function showSummaryItems(){
    var items = getCart();
    var html = "";
    for(var i = 0; i < items.length; i++){
        var p = findById("products", items[i].product_id);
        var anh = "";
        if(p.images != null && p.images.length > 0)
            anh = asset(p.images[0]);
        html += "<div class='summary-item'>";
        html += "  <img src='" + anh + "' alt=''>";
        html += "  <span class='summary-name'>" + safeText(p.name) + "<br><span class='text-secondary'>x" + items[i].quantity + "</span></span>";
        html += "  <span class='price'>" + formatVND(p.price * items[i].quantity) + "</span>";
        html += "</div>";
    }
    document.getElementById("summaryItems").innerHTML = html;
}

// Tính lại tạm tính, phí vận chuyển, giảm giá, tổng cộng
function updateSummary(){
    var tamTinh = getCartTotal();
    var ship = getSelectedShipping();
    var phi = 0;
    if(ship != null)
        phi = ship.fee;

    // Nếu tạm tính không còn đủ điều kiện của mã thì bỏ mã
    if(appliedCoupon != null && checkCoupon(appliedCoupon.code, tamTinh) != "")
        appliedCoupon = null;
    var giam = calcDiscount(appliedCoupon, tamTinh);

    document.getElementById("sumSubtotal").innerHTML = formatVND(tamTinh);
    document.getElementById("sumShipping").innerHTML = formatVND(phi);
    document.getElementById("sumDiscount").innerHTML = "- " + formatVND(giam);
    document.getElementById("sumTotal").innerHTML = formatVND(tamTinh + phi - giam);
}

// ---------- Mã giảm giá ----------
function applyCoupon(){
    var ma = document.getElementById("txtCoupon").value.trim();
    var o = document.getElementById("msgCoupon");
    if(ma == ""){
        alert("Vui lòng nhập mã giảm giá!");
        document.getElementById("txtCoupon").focus();
        return;
    }
    var loi = checkCoupon(ma, getCartTotal());
    if(loi != ""){
        appliedCoupon = null;
        o.className = "error-text";
        o.innerHTML = loi;
    }
    else{
        appliedCoupon = findCouponByCode(ma);
        o.className = "success-text";
        o.innerHTML = "Đã áp dụng mã " + safeText(appliedCoupon.code) + "!";
    }
    updateSummary();
}

// ---------- Kiểm tra form + đặt hàng ----------
function checkOrderForm(){
    var ten = document.getElementById("txtName").value.trim();
    var sdt = document.getElementById("txtPhone").value.trim();
    var diaChi = document.getElementById("txtAddress").value.trim();
    if(ten == ""){
        alert("Họ tên người nhận không được bỏ trống!");
        document.getElementById("txtName").focus();
        return false;
    }
    if(sdt == ""){
        alert("Số điện thoại không được bỏ trống!");
        document.getElementById("txtPhone").focus();
        return false;
    }
    if(checkPhone(sdt) == false){
        alert("Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0!");
        document.getElementById("txtPhone").focus();
        return false;
    }
    if(diaChi == ""){
        alert("Địa chỉ giao hàng không được bỏ trống!");
        document.getElementById("txtAddress").focus();
        return false;
    }
    if(getSelectedShipping() == null){
        alert("Vui lòng chọn phương thức vận chuyển!");
        return false;
    }
    return true;
}

// Trả về false để form không gửi đi (trang tự xử lý bằng JavaScript)
function placeOrder(){
    if(checkOrderForm() == false)
        return false;
    var loi = checkStockForCart();
    if(loi != ""){
        alert(loi);
        window.location.href = "cart.html";
        return false;
    }
    var maGiam = "";
    if(appliedCoupon != null)
        maGiam = appliedCoupon.code;
    var thongTin = {
        shipping_name: document.getElementById("txtName").value.trim(),
        shipping_phone: document.getElementById("txtPhone").value.trim(),
        shipping_address: document.getElementById("txtAddress").value.trim(),
        payment_method: getSelectedPayment(),
        shipping_method_id: getSelectedShipping().id,
        coupon_code: maGiam
    };
    var maDon = createOrder(thongTin);
    window.location.href = "order-success.html?id=" + maDon;
    return false;
}
