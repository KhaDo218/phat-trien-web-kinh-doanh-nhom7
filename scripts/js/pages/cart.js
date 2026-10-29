/* =====================================================================
   ROOMCRAFT - Giỏ hàng (cart.html)
   Người phụ trách: Phương Anh
   Việc cần làm: Đổi số lượng (không vượt tồn kho), xóa, tạm tính. Sau khi đổi gọi updateCartCount().
   (updateCartCount() đã được gọi sẵn bên trong saveCart() của services/cart.js)
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    renderHeader("");
    renderFooter();
    renderChatbot();
    showCart();
}

// Vẽ lại toàn bộ giỏ hàng (gọi lại mỗi khi đổi số lượng / xóa)
function showCart(){
    cleanCart();
    var items = getCart();
    var box = document.getElementById("cartContent");

    if(items.length == 0){
        box.innerHTML = "<div class='empty cart-empty'>"
                      + "<span class='empty-icon'><span class='material-symbols-outlined'>shopping_bag</span></span>"
                      + "<h2 class='headline-section'>Không gian đẹp bắt đầu từ món đồ đầu tiên</h2>"
                      + "<p class='empty-copy'>Giỏ hàng của bạn đang trống. Khám phá bộ sưu tập nội thất được tuyển chọn cho từng phong cách sống.</p>"
                      + "<a class='btn' href='products.html'>Khám phá sản phẩm</a></div>";
        return;
    }

    var html = "<div class='cart-layout'>";
    html += "<div>";
    html += "  <div class='cart-head overline'><span>Sản phẩm</span><span>Số lượng</span><span>Thành tiền</span><span></span></div>";

    for(var i = 0; i < items.length; i++){
        var p = findById("products", items[i].product_id);
        var anh = "";
        if(p.images != null && p.images.length > 0)
            anh = asset(p.images[0]);

        html += "<div class='cart-row'>";
        html += "  <div class='cart-product'>";
        html += "    <img src='" + anh + "' alt='" + safeText(p.name) + "'>";
        html += "    <div>";
        html += "      <p class='title-product'>" + safeText(p.name) + "</p>";
        html += "      <p class='price'>" + formatVND(p.price) + "</p>";
        if(p.stock_quantity <= 0)
            html += "  <span class='badge badge-out'>Hết hàng</span>";
        else
            html += "  <span class='badge badge-stock'>Còn " + p.stock_quantity + " sản phẩm</span>";
        html += "    </div>";
        html += "  </div>";

        if(p.stock_quantity <= 0){
            html += "<div class='text-secondary'>Không thể đặt</div>";
            html += "<div class='line-total'>0 ₫</div>";
        }
        else{
            html += "<div class='qty-box'>";
            html += "  <button class='btn-icon' onclick='changeQty(" + i + ", -1)'>−</button>";
            html += "  <input class='input qty-input' type='text' id='txtQty" + i + "' value='" + items[i].quantity + "' onchange='setQty(" + i + ")'>";
            html += "  <button class='btn-icon' onclick='changeQty(" + i + ", 1)'>+</button>";
            html += "</div>";
            html += "<div class='line-total'>" + formatVND(p.price * items[i].quantity) + "</div>";
        }
        html += "  <button class='btn-icon' title='Xóa' onclick='removeItem(" + i + ")'><span class='material-symbols-outlined'>delete</span></button>";
        html += "</div>";
    }
    html += "  <p style='margin-top:24px'><a class='btn-link' href='products.html'>← Tiếp tục mua sắm</a></p>";
    html += "</div>";

    // Cột tóm tắt bên phải
    html += "<aside class='card cart-summary'>";
    html += "  <p class='overline'>Tóm tắt đơn hàng</p>";
    html += "  <div class='sum-row'><span>Tạm tính</span><span>" + formatVND(getCartTotal()) + "</span></div>";
    html += "  <div class='sum-row'><span>Phí giao hàng</span><span class='sum-muted'>Tính ở bước thanh toán</span></div>";
    html += "  <div class='sum-row sum-total'><span>Tạm tổng</span><span>" + formatVND(getCartTotal()) + "</span></div>";
    html += getCartShippingNote(getCart(), getCartTotal());
    if(hasOutOfStockItem())
        html += "<p class='error-text'>Giỏ hàng có sản phẩm đã hết hàng, vui lòng xóa trước khi thanh toán.</p>";
    html += "  <input class='btn btn-full' type='button' value='Tiến hành thanh toán' onclick='goCheckout()'>";
    html += "</aside>";
    html += "</div>";

    box.innerHTML = html;
}

// Gợi ý giao hàng / thanh toán dưới phần tổng (lấy mức miễn phí từ bảng shipping_methods)
function getCartShippingNote(items, tamTinh){
    var methods = getTable("shipping_methods");
    var coDoLon = hasBulkyItem(items);
    var mienPhiTu = 0;
    for(var i = 0; i < methods.length; i++){
        if(coDoLon && methods[i].kind == "BULKY") mienPhiTu = methods[i].free_from;
        if(!coDoLon && methods[i].kind == "PARCEL" && methods[i].free_from) mienPhiTu = methods[i].free_from;
    }
    var html = "<ul class='sum-notes'>";
    if(coDoLon){
        html += "<li>Giỏ có nội thất cỡ lớn: giao bằng xe tải và lắp đặt tận nơi.</li>";
        if(tamTinh >= mienPhiTu)
            html += "<li>Đơn đủ điều kiện <b>miễn phí giao và lắp đặt</b> nội thành TP. HCM, Hà Nội, Đà Nẵng.</li>";
        else
            html += "<li>Miễn phí giao và lắp đặt nội thành cho đơn từ " + formatVND(mienPhiTu) + ".</li>";
    }
    else{
        if(tamTinh >= mienPhiTu)
            html += "<li>Đơn đủ điều kiện <b>miễn phí giao tiêu chuẩn</b> toàn quốc.</li>";
        else
            html += "<li>Mua thêm " + formatVND(mienPhiTu - tamTinh) + " để được miễn phí giao tiêu chuẩn.</li>";
    }
    if(!canUseCOD(tamTinh))
        html += "<li>Đơn trên " + formatVND(COD_LIMIT) + " không nhận COD: thanh toán trước hoặc đặt cọc 30%.</li>";
    html += "</ul>";
    return html;
}

// Bấm nút - hoặc +
function changeQty(viTri, tang){
    var items = getCart();
    var loi = updateQuantity(items[viTri].product_id, Number(items[viTri].quantity) + tang);
    if(loi != "")
        alert(loi);
    showCart();
}

// Gõ trực tiếp số lượng vào ô
function setQty(viTri){
    var items = getCart();
    var chuoi = document.getElementById("txtQty" + viTri).value.trim();
    var soLuong = Number(chuoi);
    if(chuoi == "" || isNaN(soLuong) || soLuong != Math.floor(soLuong)){
        alert("Số lượng phải là số nguyên!");
        showCart();
        return;
    }
    var loi = updateQuantity(items[viTri].product_id, soLuong);
    if(loi != "")
        alert(loi);
    showCart();
}

function removeItem(viTri){
    var items = getCart();
    if(confirm("Xóa sản phẩm này khỏi giỏ hàng?") == false)
        return;
    removeFromCart(items[viTri].product_id);
    showCart();
}

function goCheckout(){
    if(hasOutOfStockItem()){
        alert("Giỏ hàng có sản phẩm đã hết hàng, vui lòng xóa trước khi thanh toán!");
        return;
    }
    if(isLoggedIn() == false){
        alert("Vui lòng đăng nhập để thanh toán!");
        window.location.href = "login.html?redirect=" + encodeURIComponent(window.location.href.replace("cart.html", "checkout.html"));
        return;
    }
    window.location.href = "checkout.html";
}
