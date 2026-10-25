/* =====================================================================
   ROOMCRAFT - services/orders.js (đơn hàng, mã giảm giá, đánh giá)
   Người phụ trách: Phương Anh
   Dữ liệu: getTable("orders") - mỗi đơn gồm các cột bảng orders
            + items: [ {product_id, quantity, unit_price} ]
   Trạng thái: Confirmed -> Packing -> Shipping -> Delivered, hoặc Cancelled
   Quy tắc: chỉ hủy được khi đơn đang Confirmed hoặc Packing (chưa giao cho vận chuyển)

   Các hàm:
     getStatusText(status), getPaymentText(phuongThuc), getNextStatus(status), canCancelOrder(order)
     findCouponByCode(ma), checkCoupon(ma, tamTinh) -> "" nếu dùng được, ngược lại là câu báo lỗi
     calcDiscount(coupon, tamTinh)  -> số tiền được giảm
     checkStockForCart()            -> "" nếu đủ hàng, ngược lại là câu báo lỗi
     createOrder(thongTin)          -> tạo đơn Confirmed, trừ tồn kho, xóa giỏ, trả về id đơn
     cancelOrder(orderId)           -> "" nếu hủy được (hoàn lại tồn kho), ngược lại là câu báo lỗi
     updateOrderStatus(orderId, trangThai) -> "" hoặc câu báo lỗi (dùng cho trang admin)
     getOrdersByUser(userId), getAllOrders()  (đơn mới nhất xếp trước)
     hasReviewed(userId, productId), addReview(userId, productId, soSao, nhanXet)
     safeText(chuoi)                -> đổi < > & " ' để chèn vào innerHTML cho an toàn
   Id đơn mới: getNextId("orders")
   ===================================================================== */

var ORDER_FLOW = ["Confirmed", "Packing", "Shipping", "Delivered"];

function getStatusText(status){
    if(status == "Confirmed")
        return "Đã xác nhận";
    if(status == "Packing")
        return "Đang đóng gói";
    if(status == "Shipping")
        return "Đang giao hàng";
    if(status == "Delivered")
        return "Đã giao";
    if(status == "Cancelled")
        return "Đã hủy";
    return status;
}

function getPaymentText(phuongThuc){
    if(phuongThuc == "COD")
        return "Thanh toán khi nhận hàng (COD)";
    if(phuongThuc == "Bank Transfer")
        return "Chuyển khoản ngân hàng";
    if(phuongThuc == "E-wallet")
        return "Ví điện tử";
    return phuongThuc;
}

// Trạng thái kế tiếp, đơn đã Delivered hoặc Cancelled thì trả về ""
function getNextStatus(status){
    for(var i = 0; i < ORDER_FLOW.length - 1; i++){
        if(ORDER_FLOW[i] == status)
            return ORDER_FLOW[i + 1];
    }
    return "";
}

function canCancelOrder(order){
    return order.status == "Confirmed" || order.status == "Packing";
}

function safeText(chuoi){
    if(chuoi == null)
        return "";
    return String(chuoi).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------
// Mã giảm giá
// ---------------------------------------------------------------------
function findCouponByCode(ma){
    var coupons = getTable("coupons");
    for(var i = 0; i < coupons.length; i++){
        if(coupons[i].code.toUpperCase() == ma.trim().toUpperCase())
            return coupons[i];
    }
    return null;
}

function checkCoupon(ma, tamTinh){
    var c = findCouponByCode(ma);
    if(c == null)
        return "Mã giảm giá không tồn tại!";
    if(c.is_active == false)
        return "Mã giảm giá đã ngừng áp dụng!";
    if(new Date(c.expires_at) < new Date())
        return "Mã giảm giá đã hết hạn!";
    if(tamTinh < c.min_order_value)
        return "Đơn hàng cần tối thiểu " + formatVND(c.min_order_value) + " để dùng mã này!";
    return "";
}

function calcDiscount(coupon, tamTinh){
    if(coupon == null)
        return 0;
    var giam = 0;
    if(coupon.discount_type == "PERCENT")
        giam = Math.round(tamTinh * coupon.discount_value / 100);
    else
        giam = coupon.discount_value;
    if(giam > tamTinh)
        giam = tamTinh;
    return giam;
}

// ---------------------------------------------------------------------
// Tạo đơn / hủy đơn / đổi trạng thái
// ---------------------------------------------------------------------
// Kiểm tra từng món trong giỏ còn đủ hàng không
function checkStockForCart(){
    var items = getCart();
    if(items.length == 0)
        return "Giỏ hàng đang trống!";
    for(var i = 0; i < items.length; i++){
        var p = findById("products", items[i].product_id);
        if(p == null || p.is_active == false)
            return "Có sản phẩm trong giỏ không còn được bán!";
        if(p.stock_quantity < items[i].quantity)
            return "\"" + p.name + "\" chỉ còn " + p.stock_quantity + " sản phẩm trong kho!";
    }
    return "";
}

// thongTin = { shipping_name, shipping_phone, shipping_address, payment_method,
//              shipping_method_id, coupon_code (có thể để "") }
function createOrder(thongTin){
    var user = getCurrentUser();
    var cart = getCart();
    var products = getTable("products");
    var items = [];
    var tamTinh = 0;

    for(var i = 0; i < cart.length; i++){
        for(var j = 0; j < products.length; j++){
            if(products[j].id == cart[i].product_id){
                items.push({ product_id: products[j].id, quantity: cart[i].quantity, unit_price: products[j].price });
                tamTinh = tamTinh + products[j].price * cart[i].quantity;
                products[j].stock_quantity = products[j].stock_quantity - cart[i].quantity;   // trừ tồn kho
            }
        }
    }

    var ship = findById("shipping_methods", thongTin.shipping_method_id);
    var coupon = null;
    if(thongTin.coupon_code != "")
        coupon = findCouponByCode(thongTin.coupon_code);
    var giam = calcDiscount(coupon, tamTinh);
    var bayGio = new Date().toISOString();

    var order = {
        id: getNextId("orders"),
        user_id: user.id,
        shipping_method_id: ship.id,
        coupon_id: (coupon == null) ? null : coupon.id,
        shipping_name: thongTin.shipping_name,
        shipping_phone: thongTin.shipping_phone,
        shipping_address: thongTin.shipping_address,
        payment_method: thongTin.payment_method,
        status: "Confirmed",
        subtotal: tamTinh,
        shipping_fee: ship.fee,
        discount_amount: giam,
        total_amount: tamTinh + ship.fee - giam,
        created_at: bayGio,
        updated_at: bayGio,
        items: items
    };

    var orders = getTable("orders");
    orders.push(order);
    saveTable("orders", orders);
    saveTable("products", products);
    clearCart();
    return order.id;
}

function cancelOrder(orderId){
    var orders = getTable("orders");
    var order = null;
    for(var i = 0; i < orders.length; i++){
        if(orders[i].id == orderId)
            order = orders[i];
    }
    if(order == null)
        return "Không tìm thấy đơn hàng!";
    if(canCancelOrder(order) == false)
        return "Đơn hàng đang ở trạng thái \"" + getStatusText(order.status) + "\" nên không thể hủy!";

    // Hoàn lại tồn kho
    var products = getTable("products");
    for(var i = 0; i < order.items.length; i++){
        for(var j = 0; j < products.length; j++){
            if(products[j].id == order.items[i].product_id)
                products[j].stock_quantity = products[j].stock_quantity + order.items[i].quantity;
        }
    }
    order.status = "Cancelled";
    order.updated_at = new Date().toISOString();
    saveTable("products", products);
    saveTable("orders", orders);
    return "";
}

function updateOrderStatus(orderId, trangThai){
    if(trangThai == "Cancelled")
        return cancelOrder(orderId);
    var orders = getTable("orders");
    for(var i = 0; i < orders.length; i++){
        if(orders[i].id == orderId){
            if(getNextStatus(orders[i].status) != trangThai)
                return "Chỉ được chuyển sang trạng thái kế tiếp: " + getStatusText(getNextStatus(orders[i].status)) + "!";
            orders[i].status = trangThai;
            orders[i].updated_at = new Date().toISOString();
            saveTable("orders", orders);
            return "";
        }
    }
    return "Không tìm thấy đơn hàng!";
}

// Sắp xếp đơn mới nhất lên đầu (id lớn hơn = đơn mới hơn)
function sortOrdersNewest(mang){
    mang.sort(function(a, b){
        return Number(b.id) - Number(a.id);
    });
    return mang;
}

function getAllOrders(){
    return sortOrdersNewest(getTable("orders"));
}

function getOrdersByUser(userId){
    var ketQua = [];
    var orders = getTable("orders");
    for(var i = 0; i < orders.length; i++){
        if(orders[i].user_id == userId)
            ketQua.push(orders[i]);
    }
    return sortOrdersNewest(ketQua);
}

// ---------------------------------------------------------------------
// Đánh giá (bảng reviews: mỗi người chỉ đánh giá 1 lần cho mỗi sản phẩm)
// ---------------------------------------------------------------------
function hasReviewed(userId, productId){
    var reviews = getTable("reviews");
    for(var i = 0; i < reviews.length; i++){
        if(reviews[i].user_id == userId && reviews[i].product_id == productId)
            return true;
    }
    return false;
}

function addReview(userId, productId, soSao, nhanXet){
    if(hasReviewed(userId, productId))
        return "Bạn đã đánh giá sản phẩm này rồi!";
    var reviews = getTable("reviews");
    reviews.push({
        id: getNextId("reviews"),
        user_id: userId,
        product_id: productId,
        rating: Number(soSao),
        comment: nhanXet,
        review_image_url: null,
        is_hidden: false,
        created_at: new Date().toISOString()
    });
    saveTable("reviews", reviews);
    return "";
}
