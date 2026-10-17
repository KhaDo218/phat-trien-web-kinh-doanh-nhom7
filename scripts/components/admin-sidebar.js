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
