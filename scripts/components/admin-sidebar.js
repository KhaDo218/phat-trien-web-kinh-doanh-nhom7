/* =====================================================================
   ROOMCRAFT - admin-sidebar.js (menu bên trái của các trang quản trị)
   Người phụ trách: Quỳnh Kha
   Cách dùng: trang admin có <div id="sidebar"></div>, trong initPage() gọi
       renderAdminSidebar("products");
   ===================================================================== */

var ADMIN_MENU = [
    { ma: "dashboard",   ten: "Dashboard",          icon: "dashboard",      trang: "index.html" },
    { ma: "products",    ten: "Sản phẩm",           icon: "chair",          trang: "products.html" },
    { ma: "categories",  ten: "Danh mục",           icon: "category",       trang: "categories.html" },
    { ma: "rooms",       ten: "Phòng mẫu",          icon: "living",         trang: "rooms.html" },
    { ma: "marketplace", ten: "Đồ cũ",              icon: "recycling",      trang: "marketplace.html" },
    { ma: "orders",      ten: "Đơn hàng",           icon: "receipt_long",   trang: "orders.html" },
    { ma: "users",       ten: "Người dùng",         icon: "group",          trang: "users.html" },
    { ma: "reviews",     ten: "Đánh giá",           icon: "reviews",        trang: "reviews.html" }
];

function renderAdminSidebar(mucDangMo){
    var user = getCurrentUser();
    var html = "";
    html += "<a class='logo' href='index.html'>ROOMCRAFT</a>";
    html += "<p class='overline'>Trang quản trị</p>";
    html += "<ul>";
    for(var i = 0; i < ADMIN_MENU.length; i++){
        var lop = "";
        if(ADMIN_MENU[i].ma == mucDangMo)
            lop = " class='active'";
        html += "<li><a" + lop + " href='" + ADMIN_MENU[i].trang + "'>"
              + "<span class='material-symbols-outlined'>" + ADMIN_MENU[i].icon + "</span>"
              + ADMIN_MENU[i].ten + "</a></li>";
    }
    html += "</ul>";
    html += "<div class='sidebar-bottom'>";
    html += "  <p>" + user.full_name + "</p>";
    html += "  <a href='../index.html'><span class='material-symbols-outlined'>storefront</span>Xem trang web</a>";
    html += "  <a href='javascript:logout()'><span class='material-symbols-outlined'>logout</span>Đăng xuất</a>";
    html += "</div>";
    document.getElementById("sidebar").innerHTML = html;
}

// ---------------------------------------------------------------------
// Phân trang dùng chung cho các bảng admin (đơn hàng, người dùng, đánh giá...)
//   renderAdminPager("pgOrders", trang, tongSoDong, "goOrderPage")
//   -> vẽ "Hiển thị 1–20 / 150" + các nút trang; bấm nút gọi goOrderPage(soTrang)
// ---------------------------------------------------------------------
var ADMIN_PAGE_SIZE = 20;

function renderAdminPager(containerId, trang, tongSoDong, tenHam){
    var box = document.getElementById(containerId);
    if(box == null)
        return;
    var soTrang = Math.max(1, Math.ceil(tongSoDong / ADMIN_PAGE_SIZE));
    if(tongSoDong == 0){
        box.innerHTML = "";
        return;
    }
    var tu = (trang - 1) * ADMIN_PAGE_SIZE + 1;
    var den = Math.min(trang * ADMIN_PAGE_SIZE, tongSoDong);
    var html = "<span>Hiển thị " + tu + "–" + den + " / " + tongSoDong + "</span>";
    if(soTrang > 1){
        html += "<div class='pager-links'>";
        if(trang > 1)
            html += "<button type='button' class='catalog-page-link' onclick='" + tenHam + "(" + (trang - 1) + ")'>Trước</button>";
        for(var i = 1; i <= soTrang; i++){
            if(i == 1 || i == soTrang || Math.abs(i - trang) <= 1)
                html += "<button type='button' class='catalog-page-link" + (i == trang ? " active" : "") + "' onclick='" + tenHam + "(" + i + ")'>" + i + "</button>";
            else if(i == trang - 2 || i == trang + 2)
                html += "<span class='catalog-page-dots'>...</span>";
        }
        if(trang < soTrang)
            html += "<button type='button' class='catalog-page-link' onclick='" + tenHam + "(" + (trang + 1) + ")'>Tiếp</button>";
        html += "</div>";
    }
    box.innerHTML = html;
}

// Trang hợp lệ (1..số trang) sau khi lọc làm danh sách ngắn lại
function fixAdminPage(trang, tongSoDong){
    var soTrang = Math.max(1, Math.ceil(tongSoDong / ADMIN_PAGE_SIZE));
    if(trang > soTrang) return soTrang;
    if(trang < 1) return 1;
    return trang;
}
