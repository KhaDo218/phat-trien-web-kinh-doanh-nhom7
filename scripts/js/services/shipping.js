/* =====================================================================
   ROOMCRAFT - services/shipping.js (địa chỉ, phí giao hàng, quy tắc thanh toán)
   Dùng ở: checkout.html, account.html, order-success.html, order-detail.html, admin/orders.html

   Địa chỉ theo đơn vị hành chính 2 cấp (từ 01/07/2025): Tỉnh/Thành phố -> Phường/Xã.
   Khu vực giao hàng:
     "city" = 3 thành phố có showroom/kho: TP. Hồ Chí Minh, Hà Nội, Đà Nẵng
     "near" = tỉnh lân cận 3 kho
     "far"  = các tỉnh còn lại
   Phí giao (bảng shipping_methods):
     Đồ nhỏ (trang trí, gối, chăn ga, đèn, thảm, rèm...) -> giao tiêu chuẩn / giao nhanh
     Đồ lớn (danh mục Nội thất: sofa, giường, tủ, bàn...) -> giao và lắp đặt tận nơi
     Đơn có cả đồ lớn và nhỏ -> tính theo đồ lớn (giao chung một chuyến)
   Thanh toán:
     Đơn đến 10 triệu: COD, chuyển khoản, ví điện tử, thẻ
     Đơn trên 10 triệu: không nhận COD; trả trước toàn bộ hoặc đặt cọc 30%, phần còn lại trả khi nhận
   ===================================================================== */

var COD_LIMIT = 10000000;       // COD tối đa 10 triệu
var DEPOSIT_RATE = 0.3;         // đặt cọc 30%

var PROVINCES = [
    { name: "TP. Hồ Chí Minh", zone: "city" },
    { name: "TP. Hà Nội",      zone: "city" },
    { name: "TP. Đà Nẵng",     zone: "city" },
    { name: "TP. Hải Phòng",   zone: "near" },
    { name: "TP. Cần Thơ",     zone: "near" },
    { name: "TP. Huế",         zone: "near" },
    { name: "Bắc Ninh",        zone: "near" },
    { name: "Hưng Yên",        zone: "near" },
    { name: "Ninh Bình",       zone: "near" },
    { name: "Phú Thọ",         zone: "near" },
    { name: "Thái Nguyên",     zone: "near" },
    { name: "Quảng Ninh",      zone: "near" },
    { name: "Quảng Ngãi",      zone: "near" },
    { name: "Quảng Trị",       zone: "near" },
    { name: "Đồng Nai",        zone: "near" },
    { name: "Tây Ninh",        zone: "near" },
    { name: "Đồng Tháp",       zone: "near" },
    { name: "Vĩnh Long",       zone: "near" },
    { name: "An Giang",        zone: "far" },
    { name: "Cà Mau",          zone: "far" },
    { name: "Lâm Đồng",        zone: "far" },
    { name: "Khánh Hòa",       zone: "far" },
    { name: "Đắk Lắk",         zone: "far" },
    { name: "Gia Lai",         zone: "far" },
    { name: "Hà Tĩnh",         zone: "far" },
    { name: "Nghệ An",         zone: "far" },
    { name: "Thanh Hóa",       zone: "far" },
    { name: "Sơn La",          zone: "far" },
    { name: "Điện Biên",       zone: "far" },
    { name: "Lai Châu",        zone: "far" },
    { name: "Lào Cai",         zone: "far" },
    { name: "Tuyên Quang",     zone: "far" },
    { name: "Cao Bằng",        zone: "far" },
    { name: "Lạng Sơn",        zone: "far" }
];

var HOUSE_TYPES = ["Chung cư có thang máy", "Nhà phố / nhà riêng", "Văn phòng / cửa hàng"];

function getProvinceZone(tenTinh){
    for(var i = 0; i < PROVINCES.length; i++){
        if(PROVINCES[i].name == tenTinh) return PROVINCES[i].zone;
    }
    return "far";
}

function getZoneText(zone){
    if(zone == "city") return "nội thành";
    if(zone == "near") return "tỉnh lân cận";
    return "tỉnh xa";
}

// Tạo các <option> cho ô chọn Tỉnh/Thành
function getProvinceOptions(daChon){
    var html = "<option value=''>-- Chọn Tỉnh/Thành phố --</option>";
    var nhom = [["city", "Thành phố có showroom"], ["near", "Tỉnh lân cận"], ["far", "Tỉnh khác"]];
    for(var n = 0; n < nhom.length; n++){
        html += "<optgroup label='" + nhom[n][1] + "'>";
        for(var i = 0; i < PROVINCES.length; i++){
            if(PROVINCES[i].zone != nhom[n][0]) continue;
            html += "<option value='" + PROVINCES[i].name + "'" + (PROVINCES[i].name == daChon ? " selected" : "") + ">" + PROVINCES[i].name + "</option>";
        }
        html += "</optgroup>";
    }
    return html;
}

function composeAddress(soNha, phuongXa, tinh){
    var phan = [];
    if(soNha) phan.push(soNha);
    if(phuongXa) phan.push(phuongXa);
    if(tinh) phan.push(tinh);
    return phan.join(", ");
}

// Đồ lớn = danh mục thuộc nhóm Nội thất (sofa, giường, tủ, bàn ghế...) và đồ cũ
function isBulkyProduct(p){
    if(p == null) return false;
    if(p.product_type == "USED") return true;
    var parentId = p.parent_category_id;
    if(parentId == null){
        var cat = findById("categories", p.category_id);
        parentId = cat ? (cat.parent_id || cat.id) : null;
    }
    return String(parentId) == "1";
}

// items: [{product_id, quantity}] (giỏ hàng hoặc món trong đơn)
function hasBulkyItem(items){
    for(var i = 0; i < items.length; i++){
        if(isBulkyProduct(findById("products", items[i].product_id))) return true;
    }
    return false;
}

// Phí của 1 phương thức theo khu vực và tạm tính. Trả về -1 nếu không giao được.
function calcShippingFee(method, zone, tamTinh){
    if(method.kind == "BULKY"){
        if(zone == "city" && tamTinh >= method.free_from) return 0;
        if(zone == "city") return method.fee_city;
        if(zone == "near") return method.fee_near;
        return method.fee_far;
    }
    if(method.city_only && zone != "city") return -1;
    if(method.free_from && tamTinh >= method.free_from) return 0;
    return zone == "city" ? method.fee_city : method.fee_province;
}

// Danh sách phương thức giao cho giỏ hàng hiện tại.
// Mỗi phần tử: {method, fee, available, reason}
function getShippingOptions(items, tamTinh, tinh){
    var methods = getTable("shipping_methods");
    var coDoLon = hasBulkyItem(items);
    var zone = getProvinceZone(tinh);
    var kq = [];
    for(var i = 0; i < methods.length; i++){
        var m = methods[i];
        if(m.is_active == false) continue;
        if(coDoLon && m.kind != "BULKY") continue;
        if(!coDoLon && m.kind == "BULKY") continue;
        var phi = calcShippingFee(m, zone, tamTinh);
        var lyDo = "";
        if(phi < 0) lyDo = "Chỉ áp dụng nội thành TP. Hồ Chí Minh, Hà Nội, Đà Nẵng";
        if(!tinh) lyDo = "Chọn Tỉnh/Thành phố để tính phí";
        kq.push({ method: m, fee: phi < 0 ? 0 : phi, available: phi >= 0 && tinh != "", reason: lyDo });
    }
    return kq;
}

// Ngày giao dự kiến: "2/11 – 4/11"
function getDeliveryRange(method){
    var tu = new Date(), den = new Date();
    tu.setDate(tu.getDate() + method.days_min);
    den.setDate(den.getDate() + method.days_max);
    return tu.getDate() + "/" + (tu.getMonth() + 1) + " – " + den.getDate() + "/" + (den.getMonth() + 1);
}

/* ---------------- Thanh toán ---------------- */

function canUseCOD(tongTien){
    return tongTien <= COD_LIMIT;
}

// Số tiền đặt cọc (làm tròn lên nghìn đồng)
function calcDeposit(tongTien){
    return Math.ceil(tongTien * DEPOSIT_RATE / 1000) * 1000;
}

// plan: "COD" | "FULL" | "DEPOSIT" -> {paid, due}
function calcPaymentSplit(plan, tongTien){
    if(plan == "COD") return { paid: 0, due: tongTien };
    if(plan == "DEPOSIT"){
        var coc = calcDeposit(tongTien);
        return { paid: coc, due: tongTien - coc };
    }
    return { paid: tongTien, due: 0 };
}

function getPaymentPlanText(order){
    if(order.payment_plan == "DEPOSIT") return "Đặt cọc 30%";
    if(order.payment_plan == "FULL") return "Đã thanh toán toàn bộ";
    if(order.payment_plan == "COD") return "Trả khi nhận hàng";
    return "";
}

// Dòng tóm tắt tiền của đơn: "Đã trả 16.700.000 ₫ · Còn thu 38.750.000 ₫"
function getPaymentStatusText(order){
    if(order.status == "Cancelled"){
        if(Number(order.refund_amount) > 0) return "Hoàn tiền " + formatVND(order.refund_amount);
        return "Không thu tiền";
    }
    if(order.paid_amount == null) return "";
    if(Number(order.amount_due) <= 0) return "Đã thu đủ " + formatVND(order.total_amount);
    if(Number(order.paid_amount) <= 0) return "Thu " + formatVND(order.amount_due) + " khi giao";
    return "Đã trả " + formatVND(order.paid_amount) + " · Còn thu " + formatVND(order.amount_due);
}

// Kiểm tra số thẻ bằng thuật toán Luhn (thẻ thật luôn thỏa điều kiện này)
function checkCardNumber(soThe){
    var s = soThe.replace(/\s/g, "");
    if(!/^[0-9]{16}$/.test(s)) return false;
    var tong = 0;
    for(var i = 0; i < s.length; i++){
        var d = Number(s.charAt(s.length - 1 - i));
        if(i % 2 == 1){ d = d * 2; if(d > 9) d = d - 9; }
        tong += d;
    }
    return tong % 10 == 0;
}

// MM/YY, chưa hết hạn
function checkCardExpiry(hetHan){
    var m = /^(0[1-9]|1[0-2])\/([0-9]{2})$/.exec(hetHan);
    if(!m) return false;
    var cuoiThang = new Date(2000 + Number(m[2]), Number(m[1]), 0, 23, 59, 59);
    return cuoiThang >= new Date();
}

// Số điện thoại di động Việt Nam: 10 số, đầu 03, 05, 07, 08, 09
function checkMobilePhone(sdt){
    return /^0(3|5|7|8|9)[0-9]{8}$/.test(sdt);
}

// Họ tên: ít nhất 2 chữ, chỉ gồm chữ cái và khoảng trắng
function checkFullName(ten){
    if(!/^[A-Za-zÀ-ỹĐđ\s]+$/.test(ten)) return false;
    return ten.trim().split(/\s+/).length >= 2;
}

function checkEmailFormat(email){
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
