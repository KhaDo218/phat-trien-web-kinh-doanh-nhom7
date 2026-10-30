/* =====================================================================
   ROOMCRAFT - Thanh toán (checkout.html)
   Người phụ trách: Phương Anh
   Việc cần làm: Thông tin người nhận, địa chỉ (Tỉnh/Thành -> Phường/Xã -> Số nhà),
   phí giao theo loại hàng + khu vực, mã giảm giá, thanh toán mô phỏng
   (COD tối đa 10 triệu; đơn lớn trả trước toàn bộ hoặc đặt cọc 30%).
   Quy tắc phí giao, thanh toán: js/services/shipping.js
   ===================================================================== */

var appliedCoupon = null;       // mã giảm giá đang áp dụng (null = chưa có)

// Gọi sau khi loadData() nạp xong dữ liệu
async function initPage(){
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

    try {
        await loadWardsData();
    } catch(error) {
        console.error("Không thể tải danh sách Phường/Xã:", error);
        alert("Không tải được danh sách Phường/Xã. Vui lòng tải lại trang và thử lại.");
        return;
    }

    fillUserInfo();
    renderHouseTypes();
    showSummaryItems();
    onAddressChange(true);
}

// Điền sẵn thông tin người đang đăng nhập (địa chỉ đã lưu ở lần mua trước / trang Tài khoản)
function fillUserInfo(){
    var user = getCurrentUser();
    var tinh = user.default_province || "";
    if(tinh == "" && user.default_address){
        // địa chỉ cũ dạng 1 dòng: tự nhận ra tỉnh/thành nếu có trong chuỗi
        for(var i = 0; i < PROVINCES.length; i++){
            var ten = PROVINCES[i].name.replace("TP. ", "");
            if(user.default_address.indexOf(ten) >= 0) tinh = PROVINCES[i].name;
        }
    }
    document.getElementById("txtName").value = user.full_name || "";
    document.getElementById("txtPhone").value = user.phone || "";
    document.getElementById("txtEmail").value = user.email || "";
    document.getElementById("cboProvince").innerHTML = getProvinceOptions(tinh);
    renderWardOptions(document.getElementById("txtWard"), tinh, user.default_ward || "");
    document.getElementById("txtStreet").value = user.default_street || "";
}

function renderHouseTypes(){
    var user = getCurrentUser();
    var html = "";
    for(var i = 0; i < HOUSE_TYPES.length; i++){
        html += "<label class='chip-radio'><input type='radio' name='rdoHouse' value='" + HOUSE_TYPES[i] + "'"
             + (user.default_house_type == HOUSE_TYPES[i] ? " checked" : "") + " onclick='showHouseHint()'><span>" + HOUSE_TYPES[i] + "</span></label>";
    }
    document.getElementById("divHouseType").innerHTML = html;
}

function getRadioValue(ten){
    var o = document.getElementsByName(ten);
    for(var i = 0; i < o.length; i++){
        if(o[i].checked && o[i].disabled == false) return o[i].value;
    }
    return "";
}

function showHouseHint(){
    var loai = getRadioValue("rdoHouse");
    var chu = "";
    if(hasBulkyItem(getCart())){
        chu = "Đơn có nội thất cỡ lớn nên cần biết loại nhà để sắp xếp xe và người khiêng.";
        if(loai == "Nhà phố / nhà riêng")
            chu = "Nếu giao lên từ tầng 3 trở lên mà không có thang máy, có thể phát sinh phí khuân vác. Nhân viên sẽ gọi báo trước khi giao.";
        if(loai == "Chung cư có thang máy")
            chu = "Vui lòng đăng ký thang máy chở hàng với ban quản lý tòa nhà trước ngày giao.";
    }
    document.getElementById("lblHouseHint").innerHTML = chu;
}

// Đổi Tỉnh/Thành -> tính lại phí giao, tổng tiền, hình thức thanh toán
function onAddressChange(preserveWard){
    var wardSelect = document.getElementById("txtWard");
    var selectedWard = preserveWard ? wardSelect.value : "";
    renderWardOptions(wardSelect, document.getElementById("cboProvince").value, selectedWard);
    var coDoLon = hasBulkyItem(getCart());
    document.getElementById("reqHouseType").className = coDoLon ? "req" : "req hidden";
    showHouseHint();
    showShippingMethods();
    updateSummary();
}

// ---------- Phương thức giao hàng ----------
function showShippingMethods(){
    var tinh = document.getElementById("cboProvince").value;
    var options = getShippingOptions(getCart(), getCartTotal(), tinh);
    var dangChon = getRadioValue("rdoShipping");
    var coDoLon = hasBulkyItem(getCart());

    var notice = document.getElementById("lblBulkyNotice");
    if(coDoLon){
        notice.className = "ship-notice";
        notice.innerHTML = "<span class='material-symbols-outlined'>local_shipping</span> Đơn có nội thất cỡ lớn nên được giao bằng xe tải và lắp đặt tận nơi. Các món nhỏ trong đơn được giao chung một chuyến.";
    } else {
        notice.className = "ship-notice hidden";
    }

    var html = "";
    var daChon = false;
    for(var i = 0; i < options.length; i++){
        var op = options[i];
        var check = "";
        if(op.available && daChon == false && (dangChon == "" || dangChon == String(op.method.id))){
            check = " checked";
            daChon = true;
        }
        var phi = !tinh ? "—" : (op.available ? (op.fee == 0 ? "Miễn phí" : formatVND(op.fee)) : "Không áp dụng");
        var moTa = op.available ? "Dự kiến giao " + getDeliveryRange(op.method) + " · " + op.method.description : op.reason;
        html += "<label class='option" + (op.available ? "" : " option-disabled") + "'>";
        html += "  <input type='radio' name='rdoShipping' value='" + op.method.id + "'" + check + (op.available ? "" : " disabled") + " onclick='updateSummary()'>";
        html += "  <span class='option-info'>" + safeText(op.method.name) + "<small>" + safeText(moTa) + "</small></span>";
        html += "  <span class='price'>" + phi + "</span>";
        html += "</label>";
    }
    document.getElementById("shippingList").innerHTML = html;
    // chưa chọn được cái đang chọn (vd. đổi sang tỉnh không có giao nhanh) -> chọn cái đầu tiên còn dùng được
    if(getRadioValue("rdoShipping") == ""){
        var radios = document.getElementsByName("rdoShipping");
        for(var j = 0; j < radios.length; j++){
            if(radios[j].disabled == false){ radios[j].checked = true; break; }
        }
    }
}

function getSelectedShipping(){
    var id = getRadioValue("rdoShipping");
    if(id == "") return null;
    return findById("shipping_methods", id);
}

function getShippingFee(){
    var ship = getSelectedShipping();
    var tinh = document.getElementById("cboProvince").value;
    if(ship == null || tinh == "") return 0;
    var phi = calcShippingFee(ship, getProvinceZone(tinh), getCartTotal());
    return phi < 0 ? 0 : phi;
}

// ---------- Hình thức thanh toán: COD / Trả trước toàn bộ / Đặt cọc 30% ----------
function renderPlans(tong){
    var dangChon = getRadioValue("rdoPlan");
    var choCOD = canUseCOD(tong);
    var coc = calcDeposit(tong);
    var ds = [];
    ds.push({ value: "COD", ten: "Thanh toán khi nhận hàng (COD)",
              moTa: choCOD ? "Trả tiền mặt hoặc chuyển khoản cho nhân viên giao hàng" : "Chỉ áp dụng cho đơn từ " + formatVND(COD_LIMIT) + " trở xuống",
              dung: choCOD });
    ds.push({ value: "FULL", ten: "Thanh toán trước toàn bộ", moTa: "Trả ngay " + formatVND(tong) + ", khi nhận hàng không cần trả thêm", dung: true });
    if(!choCOD)
        ds.push({ value: "DEPOSIT", ten: "Đặt cọc 30%", moTa: "Trả ngay " + formatVND(coc) + ", còn " + formatVND(tong - coc) + " trả khi nhận hàng", dung: true });

    if(dangChon == "" || (dangChon == "COD" && !choCOD) || (dangChon == "DEPOSIT" && choCOD))
        dangChon = choCOD ? "COD" : "DEPOSIT";

    var html = "";
    for(var i = 0; i < ds.length; i++){
        html += "<label class='option" + (ds[i].dung ? "" : " option-disabled") + "'>";
        html += "  <input type='radio' name='rdoPlan' value='" + ds[i].value + "'" + (ds[i].value == dangChon ? " checked" : "")
             + (ds[i].dung ? "" : " disabled") + " onclick='onPlanChange()'>";
        html += "  <span class='option-info'>" + ds[i].ten + "<small>" + ds[i].moTa + "</small></span>";
        html += "</label>";
    }
    document.getElementById("planList").innerHTML = html;
    document.getElementById("divPrepay").className = getRadioValue("rdoPlan") == "COD" ? "hidden" : "";
}

function onPlanChange(){
    updateSummary();
}

function getSelectedPayment(){
    if(getRadioValue("rdoPlan") == "COD") return "COD";
    return getRadioValue("rdoPayment") || "Bank Transfer";
}

// Số tiền khách trả ngay khi đặt hàng
function getPayNowAmount(){
    var tong = getOrderTotal();
    return calcPaymentSplit(getRadioValue("rdoPlan"), tong).paid;
}

// Chi tiết của phương thức trả trước: QR chuyển khoản / ví / form thẻ
function showPaymentDetail(){
    var box = document.getElementById("divPaymentDetail");
    var pt = getSelectedPayment();
    var soTien = getPayNowAmount();
    if(pt == "COD"){
        box.innerHTML = "<p class='payment-note'>Bạn thanh toán " + formatVND(getOrderTotal()) + " cho nhân viên giao hàng khi nhận và kiểm tra sản phẩm.</p>";
        return;
    }
    if(pt == "Bank Transfer"){
        var noiDung = "RC" + getNextId("orders") + " " + document.getElementById("txtPhone").value.trim();
        var qr = qrcode(0, "M");
        qr.addData("ROOMCRAFT - THANH TOAN MO PHONG | So tien: " + soTien + " VND | Noi dung: " + noiDung);
        qr.make();
        var html = "<div class='bank-box'>";
        html += "  <div class='bank-qr'>" + qr.createImgTag(4, 8) + "<small>Mã QR mô phỏng</small></div>";
        html += "  <div class='bank-info'>";
        html += "    <div><span>Ngân hàng</span><b>RoomCraft Bank (mô phỏng)</b></div>";
        html += "    <div><span>Số tài khoản</span><b>0000 1234 5678</b></div>";
        html += "    <div><span>Chủ tài khoản</span><b>CONG TY ROOMCRAFT</b></div>";
        html += "    <div><span>Số tiền</span><b>" + formatVND(soTien) + "</b></div>";
        html += "    <div><span>Nội dung</span><b>" + safeText(noiDung) + "</b></div>";
        html += "  </div>";
        html += "</div>";
        html += "<p class='payment-note'>Chuyển đúng số tiền và nội dung để đơn được xác nhận tự động. Đây là thông tin mô phỏng, bấm Đặt hàng là đơn được ghi nhận đã thanh toán.</p>";
        box.innerHTML = html;
        return;
    }
    if(pt == "E-wallet"){
        box.innerHTML = "<p class='payment-note'>Sau khi bấm Đặt hàng, bạn xác nhận thanh toán " + formatVND(soTien) + " trên ứng dụng ví. Hệ thống mô phỏng: đơn được ghi nhận đã thanh toán ngay.</p>";
        return;
    }
    // Thẻ: giữ lại số đã nhập khi vẽ lại
    var cu = {};
    var ids = ["txtCardNumber", "txtCardName", "txtCardExpiry", "txtCardCvv"];
    for(var i = 0; i < ids.length; i++){
        var o = document.getElementById(ids[i]);
        cu[ids[i]] = o ? o.value : "";
    }
    var htmlThe = "<div class='card-form'>";
    htmlThe += "<div class='form-group'><label for='txtCardNumber'>Số thẻ <span class='req'>*</span></label><input class='input' id='txtCardNumber' inputmode='numeric' maxlength='19' placeholder='4111 1111 1111 1111' oninput='formatCardNumber()' value='" + safeText(cu.txtCardNumber) + "'></div>";
    htmlThe += "<div class='form-group'><label for='txtCardName'>Tên in trên thẻ <span class='req'>*</span></label><input class='input' id='txtCardName' placeholder='NGUYEN VAN A' value='" + safeText(cu.txtCardName) + "'></div>";
    htmlThe += "<div class='form-row'><div class='form-group'><label for='txtCardExpiry'>Hết hạn (MM/YY) <span class='req'>*</span></label><input class='input' id='txtCardExpiry' maxlength='5' placeholder='08/28' value='" + safeText(cu.txtCardExpiry) + "'></div>";
    htmlThe += "<div class='form-group'><label for='txtCardCvv'>CVV <span class='req'>*</span></label><input class='input' type='password' id='txtCardCvv' maxlength='3' placeholder='123' value='" + safeText(cu.txtCardCvv) + "'></div></div>";
    htmlThe += "<p class='payment-note'>Thanh toán " + formatVND(soTien) + ". Mô phỏng: RoomCraft không lưu số thẻ, chỉ ghi 4 số cuối vào đơn. Có thể thử bằng số 4111 1111 1111 1111.</p>";
    htmlThe += "</div>";
    box.innerHTML = htmlThe;
}

// Tự thêm khoảng trắng sau mỗi 4 số
function formatCardNumber(){
    var o = document.getElementById("txtCardNumber");
    var so = o.value.replace(/[^0-9]/g, "").substring(0, 16);
    o.value = so.replace(/(.{4})/g, "$1 ").trim();
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

function getOrderTotal(){
    var tamTinh = getCartTotal();
    return tamTinh + getShippingFee() - calcDiscount(appliedCoupon, tamTinh);
}

// Tính lại tạm tính, phí giao, giảm giá, tổng cộng, số tiền trả ngay / trả khi nhận
function updateSummary(){
    var tamTinh = getCartTotal();
    var tinh = document.getElementById("cboProvince").value;

    // Nếu tạm tính không còn đủ điều kiện của mã thì bỏ mã
    if(appliedCoupon != null && checkCoupon(appliedCoupon.code, tamTinh) != "")
        appliedCoupon = null;
    var giam = calcDiscount(appliedCoupon, tamTinh);
    var phi = getShippingFee();
    var tong = tamTinh + phi - giam;

    document.getElementById("sumSubtotal").innerHTML = formatVND(tamTinh);
    document.getElementById("lblShipping").innerHTML = tinh == "" ? "Phí giao hàng" : "Phí giao hàng (" + getZoneText(getProvinceZone(tinh)) + ")";
    document.getElementById("sumShipping").innerHTML = tinh == "" ? "Chọn Tỉnh/Thành" : (phi == 0 ? "Miễn phí" : formatVND(phi));
    document.getElementById("sumDiscount").innerHTML = "- " + formatVND(giam);
    document.getElementById("sumTotal").innerHTML = formatVND(tong);

    renderPlans(tong);
    var chia = calcPaymentSplit(getRadioValue("rdoPlan"), tong);
    var html = "";
    html += "<div class='sum-row'><span>Thanh toán ngay</span><span>" + formatVND(chia.paid) + "</span></div>";
    html += "<div class='sum-row'><span>Trả khi nhận hàng</span><span>" + formatVND(chia.due) + "</span></div>";
    document.getElementById("divPaySplit").innerHTML = html;
    showPaymentDetail();
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
function baoLoi(cau, idO){
    alert(cau);
    if(idO != null && document.getElementById(idO) != null)
        document.getElementById(idO).focus();
    return false;
}

function checkOrderForm(){
    var ten = document.getElementById("txtName").value.trim();
    var sdt = document.getElementById("txtPhone").value.trim();
    var email = document.getElementById("txtEmail").value.trim();
    var tinh = document.getElementById("cboProvince").value;
    var phuong = document.getElementById("txtWard").value.trim();
    var soNha = document.getElementById("txtStreet").value.trim();

    if(ten == "") return baoLoi("Họ tên người nhận không được bỏ trống!", "txtName");
    if(checkFullName(ten) == false) return baoLoi("Họ tên chỉ gồm chữ cái và có ít nhất 2 chữ (vd. Nguyễn An)!", "txtName");
    if(sdt == "") return baoLoi("Số điện thoại không được bỏ trống!", "txtPhone");
    if(checkMobilePhone(sdt) == false) return baoLoi("Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09!", "txtPhone");
    if(email != "" && checkEmailFormat(email) == false) return baoLoi("Email không đúng định dạng!", "txtEmail");
    if(tinh == "") return baoLoi("Vui lòng chọn Tỉnh / Thành phố!", "cboProvince");
    if(phuong.length < 3) return baoLoi("Vui lòng nhập Phường / Xã!", "txtWard");
    if(soNha.length < 5) return baoLoi("Vui lòng nhập số nhà, tên đường (ít nhất 5 ký tự) để shipper tìm được nhà!", "txtStreet");
    if(hasBulkyItem(getCart()) && getRadioValue("rdoHouse") == "")
        return baoLoi("Đơn có nội thất cỡ lớn, vui lòng chọn Loại nhà để RoomCraft sắp xếp xe và người lắp đặt!", null);
    if(getSelectedShipping() == null) return baoLoi("Vui lòng chọn phương thức giao hàng!", null);

    var plan = getRadioValue("rdoPlan");
    if(plan == "") return baoLoi("Vui lòng chọn hình thức thanh toán!", null);
    if(plan == "COD" && canUseCOD(getOrderTotal()) == false)
        return baoLoi("Đơn trên " + formatVND(COD_LIMIT) + " không áp dụng COD, vui lòng trả trước hoặc đặt cọc 30%!", null);
    if(getSelectedPayment() == "Card"){
        var soThe = document.getElementById("txtCardNumber").value;
        if(checkCardNumber(soThe) == false) return baoLoi("Số thẻ không hợp lệ (cần 16 chữ số đúng định dạng thẻ)!", "txtCardNumber");
        if(document.getElementById("txtCardName").value.trim().length < 3) return baoLoi("Vui lòng nhập tên in trên thẻ!", "txtCardName");
        if(checkCardExpiry(document.getElementById("txtCardExpiry").value.trim()) == false) return baoLoi("Ngày hết hạn phải theo dạng MM/YY và thẻ chưa hết hạn!", "txtCardExpiry");
        if(/^[0-9]{3}$/.test(document.getElementById("txtCardCvv").value) == false) return baoLoi("CVV gồm 3 chữ số ở mặt sau thẻ!", "txtCardCvv");
    }
    if(document.getElementById("chkAgree").checked == false)
        return baoLoi("Vui lòng đọc và đồng ý với chính sách thanh toán, giao hàng và đổi trả!", "chkAgree");
    return true;
}

// Lưu địa chỉ vừa nhập làm địa chỉ mặc định của tài khoản
function saveDefaultAddress(){
    var user = getCurrentUser();
    var users = getTable("users");
    for(var i = 0; i < users.length; i++){
        if(users[i].id == user.id){
            users[i].default_province = document.getElementById("cboProvince").value;
            users[i].default_ward = document.getElementById("txtWard").value.trim();
            users[i].default_street = document.getElementById("txtStreet").value.trim();
            users[i].default_house_type = getRadioValue("rdoHouse") || null;
            users[i].default_address = composeAddress(users[i].default_street, users[i].default_ward, users[i].default_province);
            if(!users[i].phone) users[i].phone = document.getElementById("txtPhone").value.trim();
        }
    }
    saveTable("users", users);
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
    var thongTin = {
        shipping_name: document.getElementById("txtName").value.trim(),
        shipping_phone: document.getElementById("txtPhone").value.trim(),
        shipping_email: document.getElementById("txtEmail").value.trim(),
        shipping_province: document.getElementById("cboProvince").value,
        shipping_ward: document.getElementById("txtWard").value.trim(),
        shipping_street: document.getElementById("txtStreet").value.trim(),
        house_type: getRadioValue("rdoHouse"),
        shipping_note: document.getElementById("txtNote").value.trim(),
        payment_method: getSelectedPayment(),
        payment_plan: getRadioValue("rdoPlan"),
        shipping_method_id: getSelectedShipping().id,
        coupon_code: appliedCoupon != null ? appliedCoupon.code : "",
        card_last4: getSelectedPayment() == "Card" ? document.getElementById("txtCardNumber").value.replace(/\s/g, "").slice(-4) : null
    };
    if(document.getElementById("chkSaveAddress").checked)
        saveDefaultAddress();
    var maDon = createOrder(thongTin);
    window.location.href = "order-success.html?id=" + maDon;
    return false;
}
