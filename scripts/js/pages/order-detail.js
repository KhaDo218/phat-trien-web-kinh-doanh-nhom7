/* =====================================================================
   ROOMCRAFT - Chi tiết đơn hàng (order-detail.html)
   Người phụ trách: Phương Anh
   Việc cần làm: Theo dõi trạng thái, hủy đơn, viết đánh giá khi đơn Delivered.
   ===================================================================== */

var currentOrder = null;        // đơn đang xem

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    if(requireLogin() == false)
        return;
    renderHeader("");
    renderFooter();
    renderChatbot();
    showOrder();
}

function showOrder(){
    var box = document.getElementById("orderContent");
    currentOrder = findById("orders", getParam("id"));
    var user = getCurrentUser();

    // Không có đơn, hoặc đơn của người khác thì không cho xem
    if(currentOrder == null || currentOrder.user_id != user.id){
        box.innerHTML = "<div class='empty'><p>Không tìm thấy đơn hàng.</p><br><a class='btn' href='orders.html'>Quay lại danh sách đơn</a></div>";
        return;
    }
    var o = currentOrder;
    var html = "";

    // Dòng đầu: mã đơn + trạng thái
    html += "<div class='detail-top'>";
    html += "  <div><p class='overline'>Mã đơn hàng</p><p class='headline-section'>#" + o.id + "</p>";
    html += "       <p class='text-secondary'>Đặt ngày " + formatDate(o.created_at) + "</p></div>";
    html += "  <span class='status status-" + o.status + "'>" + getStatusText(o.status) + "</span>";
    html += "</div>";

    // Thanh theo dõi trạng thái
    if(o.status == "Cancelled"){
        var hoan = Number(o.refund_amount) > 0 ? " RoomCraft hoàn lại " + formatVND(o.refund_amount) + " bạn đã trả trước trong 3–5 ngày làm việc." : "";
        html += "<p class='cancel-note'>Đơn hàng này đã bị hủy." + hoan + "</p>";
    }
    else{
        var viTri = ORDER_FLOW.indexOf(o.status);
        html += "<div class='tracker'>";
        for(var i = 0; i < ORDER_FLOW.length; i++){
            var lop = "step";
            if(i <= viTri)
                lop = "step done";
            html += "<div class='" + lop + "'><span class='dot'>" + (i + 1) + "</span>" + getStatusText(ORDER_FLOW[i]) + "</div>";
        }
        html += "</div>";
    }

    html += "<div class='detail-layout'>";

    // Cột trái: danh sách sản phẩm
    html += "<div>";
    for(var i = 0; i < o.items.length; i++){
        var p = findById("products", o.items[i].product_id);
        var ten = o.items[i].product_name || o.items[i].product_id;
        var anh = o.items[i].product_image ? asset(o.items[i].product_image) : "";
        if(p != null){
            ten = p.name;
            if(p.images != null && p.images.length > 0)
                anh = asset(p.images[0]);
        }
        html += "<div class='detail-row'>";
        html += "  <img src='" + anh + "' alt=''>";
        html += "  <div><p class='title-product'>" + safeText(ten) + "</p>";
        html += "       <p class='text-secondary'>" + formatVND(o.items[i].unit_price) + " x " + o.items[i].quantity + "</p></div>";
        html += "  <div class='price'>" + formatVND(o.items[i].unit_price * o.items[i].quantity) + "</div>";
        html += "</div>";
    }
    html += "</div>";

    // Cột phải: giao hàng + tiền
    html += "<aside class='card detail-side'>";
    html += "  <p class='overline'>Người nhận</p>";
    html += "  <p>" + safeText(o.shipping_name) + ", " + safeText(o.shipping_phone) + "</p>";
    html += "  <p class='overline'>Địa chỉ giao hàng</p>";
    html += "  <p>" + safeText(o.shipping_address) + "</p>";
    if(o.house_type || o.shipping_note)
        html += "  <p class='text-secondary'>" + safeText([o.house_type, o.shipping_note].filter(function(x){ return x; }).join(", ")) + "</p>";
    var ship = findById("shipping_methods", o.shipping_method_id);
    if(ship != null){
        html += "  <p class='overline'>Giao hàng</p>";
        html += "  <p>" + safeText(ship.name) + " (" + safeText(ship.estimated_time) + ")</p>";
    }
    html += "  <p class='overline'>Thanh toán</p>";
    html += "  <p>" + getPaymentText(o.payment_method) + (o.card_last4 ? " ···· " + safeText(o.card_last4) : "") + "</p>";
    html += "  <p class='text-secondary' style='margin-bottom:16px'>" + safeText(getPaymentPlanText(o)) + (getPaymentStatusText(o) ? " (" + getPaymentStatusText(o) + ")" : "") + "</p>";
    html += "  <div class='sum-row'><span>Tạm tính</span><span>" + formatVND(o.subtotal) + "</span></div>";
    html += "  <div class='sum-row'><span>Phí vận chuyển</span><span>" + formatVND(o.shipping_fee) + "</span></div>";
    html += "  <div class='sum-row'><span>Giảm giá</span><span>- " + formatVND(o.discount_amount) + "</span></div>";
    html += "  <div class='sum-row sum-total'><span>Tổng cộng</span><span>" + formatVND(o.total_amount) + "</span></div>";
    if(o.paid_amount != null && o.status != "Cancelled"){
        html += "  <div class='sum-row'><span>Đã thanh toán</span><span>" + formatVND(o.paid_amount) + "</span></div>";
        html += "  <div class='sum-row'><span>Còn phải trả khi nhận</span><span>" + formatVND(o.amount_due) + "</span></div>";
    }
    html += "</aside>";
    html += "</div>";

    // Nút hủy đơn (chỉ khi còn hủy được)
    if(canCancelOrder(o)){
        html += "<div class='detail-actions'>";
        html += "  <input class='btn btn-outline' type='button' value='Hủy đơn hàng' onclick='doCancel()'>";
        html += "</div>";
    }

    // Khu đánh giá khi đã giao
    if(o.status == "Delivered")
        html += buildReviewHtml(o);

    box.innerHTML = html;
    initOrderStarPickers();
}

function doCancel(){
    if(confirm("Bạn chắc chắn muốn hủy đơn hàng này?") == false)
        return;
    var loi = cancelOrder(currentOrder.id);
    if(loi != ""){
        alert(loi);
        return;
    }
    alert("Đã hủy đơn hàng!");
    showOrder();
}

// ---------- Đánh giá ----------
var ORDER_RATING_LABELS = ["", "Rất tệ", "Chưa hài lòng", "Bình thường", "Hài lòng", "Rất hài lòng"];

// Mỗi món: ảnh nhỏ bên trái; bên phải tên, giá, 5 ngôi sao bấm chọn + ô nhận xét
// (món đã đánh giá thì hiện số sao đã chấm và nhận xét)
function buildReviewHtml(o){
    var userId = getCurrentUser().id;
    var reviews = getTable("reviews");
    var html = "<div class='review-section'>";
    html += "<h2 class='headline-section'>Đánh giá sản phẩm</h2>";
    for(var i = 0; i < o.items.length; i++){
        var item = o.items[i];
        var p = findById("products", item.product_id);
        var ten = (p == null) ? (item.product_name || item.product_id) : p.name;
        var anh = item.product_image ? asset(item.product_image) : (p && p.images && p.images.length ? asset(p.images[0]) : "");
        html += "<div class='card review-box'>";
        html += "  <a class='review-thumb' href='product-detail.html?id=" + encodeURIComponent(item.product_id) + "'>"
              + (anh ? "<img src='" + anh + "' alt=''>" : "") + "</a>";
        html += "  <div class='review-body'>";
        html += "    <p class='title-product'>" + safeText(ten) + "</p>";
        html += "    <p class='review-meta text-secondary'>" + formatVND(item.unit_price) + " x " + item.quantity + "</p>";

        if(hasReviewed(userId, item.product_id)){
            var daCham = null;
            for(var k = 0; k < reviews.length; k++)
                if(reviews[k].user_id == userId && reviews[k].product_id == item.product_id)
                    daCham = reviews[k];
            var soSao = daCham ? Number(daCham.rating) : 0;
            html += "<div class='review-done'>";
            html += "  <span class='star-static'>" + "★★★★★".slice(0, soSao) + "<i>" + "★★★★★".slice(soSao) + "</i></span>";
            html += "  <span class='text-secondary'>" + (soSao ? soSao + " sao · " + ORDER_RATING_LABELS[soSao] : "") + "</span>";
            html += "</div>";
            if(daCham && daCham.comment)
                html += "<p class='review-done-comment'>“" + safeText(daCham.comment) + "”</p>";
            html += "<p class='success-text'>Cảm ơn bạn đã đánh giá sản phẩm này!</p>";
        }
        else{
            html += "<div class='star-picker-row'>";
            html += "  <div class='star-picker' data-i='" + i + "' role='radiogroup' aria-label='Chọn số sao cho " + safeText(ten) + "'>";
            for(var s = 1; s <= 5; s++)
                html += "<button type='button' role='radio' aria-checked='false' data-v='" + s + "' aria-label='" + s + " sao'>★</button>";
            html += "  </div>";
            html += "  <span class='star-picker-text' id='starText" + i + "'>Chạm để chọn số sao</span>";
            html += "</div>";
            html += "<input type='hidden' id='cboRating" + i + "' value=''>";
            html += "<textarea class='input' id='txtComment" + i + "' placeholder='Chia sẻ cảm nhận của bạn về sản phẩm...'></textarea>";
            html += "<input class='btn' type='button' value='Gửi đánh giá' onclick='sendReview(" + i + ")'>";
        }
        html += "  </div>";
        html += "</div>";
    }
    html += "</div>";
    return html;
}

// Gắn sự kiện cho các bộ chọn sao: rê chuột xem trước, bấm để chọn, phím mũi tên đổi số sao
function initOrderStarPickers(){
    var pickers = document.querySelectorAll(".review-box .star-picker");
    for(var n = 0; n < pickers.length; n++)
        ganBoChonSao(pickers[n]);
}

function ganBoChonSao(picker){
    var viTri = picker.getAttribute("data-i");
    var nuts = picker.querySelectorAll("button");
    var text = document.getElementById("starText" + viTri);
    var input = document.getElementById("cboRating" + viTri);
    function ve(soSao, laXemTruoc){
        for(var i = 0; i < nuts.length; i++){
            var v = Number(nuts[i].getAttribute("data-v"));
            nuts[i].classList.toggle(laXemTruoc ? "hover" : "on", v <= soSao);
            if(!laXemTruoc)
                nuts[i].setAttribute("aria-checked", v == soSao ? "true" : "false");
        }
        var hien = laXemTruoc && soSao > 0 ? soSao : Number(input.value);
        text.textContent = hien > 0 ? hien + " sao · " + ORDER_RATING_LABELS[hien] : "Chạm để chọn số sao";
    }
    function chon(soSao){
        input.value = soSao;
        ve(soSao, false);
    }
    for(var i = 0; i < nuts.length; i++){
        nuts[i].addEventListener("mouseenter", function(){ ve(Number(this.getAttribute("data-v")), true); });
        nuts[i].addEventListener("click", function(){ chon(Number(this.getAttribute("data-v"))); });
    }
    picker.addEventListener("mouseleave", function(){ ve(0, true); });
    picker.addEventListener("keydown", function(e){
        var hienTai = Number(input.value) || 0;
        if(e.key == "ArrowRight" || e.key == "ArrowUp"){
            chon(Math.min(5, hienTai + 1));
            e.preventDefault();
        }
        else if(e.key == "ArrowLeft" || e.key == "ArrowDown"){
            chon(Math.max(1, hienTai - 1));
            e.preventDefault();
        }
    });
}

function sendReview(viTri){
    var soSao = document.getElementById("cboRating" + viTri).value;
    if(soSao == ""){
        alert("Vui lòng chọn số sao cho sản phẩm!");
        return;
    }
    var nhanXet = document.getElementById("txtComment" + viTri).value.trim();
    if(nhanXet == ""){
        alert("Vui lòng nhập nhận xét của bạn!");
        document.getElementById("txtComment" + viTri).focus();
        return;
    }
    var loi = addReview(getCurrentUser().id, currentOrder.items[viTri].product_id, soSao, nhanXet);
    if(loi != ""){
        alert(loi);
        return;
    }
    alert("Cảm ơn bạn đã đánh giá!");
    showOrder();
}
