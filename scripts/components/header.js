/* =====================================================================
   ROOMCRAFT - header.js (thanh đầu trang dùng chung)
   Người phụ trách: Quỳnh Kha
   Cách dùng: trong trang có <div id="header"></div>, cuối trang gọi
       renderHeader("san-pham");
   Tham số là mục menu đang mở: "san-pham", "khong-gian", "do-cu", "gioi-thieu"
   hoặc "" nếu không thuộc mục nào.
   ===================================================================== */

var MENU_ITEMS = [
    { ma: "san-pham",   ten: "Sản phẩm",       trang: "products.html" },
    { ma: "khong-gian", ten: "Không gian mẫu", trang: "rooms.html" },
    { ma: "do-cu",      ten: "Đồ cũ",          trang: "marketplace.html" },
    { ma: "gioi-thieu", ten: "Về RoomCraft",   trang: "index.html#ve-roomcraft" }
];

function renderHeader(mucDangMo){
    var goc = getRoot() + "scripts/";
    var user = getCurrentUser();

    var html = "";
    html += "<div class='container'>";
    html += "  <div class='header-top'>";
    html += "    <a class='logo' href='" + goc + "index.html'>ROOMCRAFT</a>";
    html += "    <div class='search'>";
    html += "      <span class='material-symbols-outlined'>search</span>";
    html += "      <input type='text' id='txtSearch' placeholder='Tìm kiếm sản phẩm, không gian sống...' onkeydown='searchKeyDown(event)'>";
    html += "    </div>";
    html += "    <div class='icons'>";
    html += "      <a href='" + goc + "wishlist.html' title='Yêu thích'><span class='material-symbols-outlined'>favorite</span></a>";
    if(user == null){
        html += "  <a href='" + goc + "login.html' title='Đăng nhập'><span class='material-symbols-outlined'>person</span></a>";
    }
    else{
        if(isAdmin())
            html += "  <a href='" + goc + "admin/index.html' title='Trang quản trị'><span class='material-symbols-outlined'>dashboard</span></a>";
        html += "  <a href='" + goc + "account.html' title='Tài khoản'><span class='material-symbols-outlined'>person</span></a>";
    }
    html += "      <a href='" + goc + "cart.html' title='Giỏ hàng'><span class='material-symbols-outlined'>shopping_bag</span>";
    html += "        <span class='cart-count' id='cartCount'>0</span></a>";
    if(user != null){
        html += "  <span class='user-name'>" + user.full_name + "</span>";
        html += "  <a href='javascript:logout()' title='Đăng xuất'><span class='material-symbols-outlined'>logout</span></a>";
    }
    html += "    </div>";
    html += "  </div>";
    html += "  <nav class='menu'>";
    for(var i = 0; i < MENU_ITEMS.length; i++){
        var lop = "";
        if(MENU_ITEMS[i].ma == mucDangMo)
            lop = " class='active'";
        html += "<a" + lop + " href='" + goc + MENU_ITEMS[i].trang + "'>" + MENU_ITEMS[i].ten + "</a>";
    }
    html += "  </nav>";
    html += "</div>";

    document.getElementById("header").innerHTML = html;
    document.getElementById("txtSearch").value = getParam("q");
    updateCartCount();
}

// Nhấn Enter trong ô tìm kiếm -> sang trang Sản phẩm kèm từ khóa
function searchKeyDown(e){
    if(e.keyCode == 13){
        var tuKhoa = document.getElementById("txtSearch").value.trim();
        window.location.href = getRoot() + "scripts/products.html?q=" + encodeURIComponent(tuKhoa);
    }
}

// Đếm tổng số lượng trong giỏ của người đang đăng nhập (khách chưa đăng nhập dùng khóa "guest").
// Trang giỏ hàng gọi lại hàm này sau khi thêm/xóa để cập nhật số trên icon.
function updateCartCount(){
    var session = getSession();
    var maGio = "guest";
    if(session != null)
        maGio = session.user_id;
    var carts = getObject("carts");
    var tong = 0;
    if(carts != null && carts[maGio] != null){
        for(var i = 0; i < carts[maGio].length; i++)
            tong = tong + Number(carts[maGio][i].quantity);
    }
    var o = document.getElementById("cartCount");
    if(o == null)
        return;
    o.innerHTML = tong;
    if(tong == 0)
        o.style.display = "none";
    else
        o.style.display = "block";
}
