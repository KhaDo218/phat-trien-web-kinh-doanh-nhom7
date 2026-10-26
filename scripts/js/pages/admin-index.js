/* =====================================================================
   ROOMCRAFT - Dashboard (admin/index.html)
   Người phụ trách: Phương Anh
   Việc cần làm: Doanh thu, số đơn, sản phẩm bán chạy, số người dùng (Chart.js).
   Quy ước: doanh thu = tổng total_amount của các đơn KHÔNG bị hủy.
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    if(requireAdmin() == false)
        return;
    renderAdminSidebar("dashboard");
    showStats();
    showTopProducts();
    if(typeof Chart == "undefined"){
        alert("Không tải được thư viện Chart.js (cần có mạng Internet) nên chưa vẽ được biểu đồ!");
        return;
    }
    drawRevenueChart();
    drawStatusChart();
}

// Các đơn không bị hủy
function getValidOrders(){
    var ketQua = [];
    var orders = getTable("orders");
    for(var i = 0; i < orders.length; i++){
        if(orders[i].status != "Cancelled")
            ketQua.push(orders[i]);
    }
    return ketQua;
}

function showStats(){
    var hopLe = getValidOrders();
    var doanhThu = 0;
    for(var i = 0; i < hopLe.length; i++)
        doanhThu = doanhThu + Number(hopLe[i].total_amount);

    var choXuLy = 0;
    var orders = getTable("orders");
    for(var i = 0; i < orders.length; i++){
        if(orders[i].status == "Confirmed")
            choXuLy = choXuLy + 1;
    }

    // Người dùng thường (role_id = 1), không đếm Admin
    var soUser = 0;
    var users = getTable("users");
    for(var i = 0; i < users.length; i++){
        if(users[i].role_id == 1)
            soUser = soUser + 1;
    }

    document.getElementById("statRevenue").innerHTML = formatVND(doanhThu);
    document.getElementById("statOrders").innerHTML = orders.length;
    document.getElementById("statUsers").innerHTML = soUser;
    document.getElementById("statPending").innerHTML = choXuLy;
}

// ---------- Sản phẩm bán chạy: gộp số lượng theo product_id rồi lấy 5 món cao nhất ----------
function showTopProducts(){
    var hopLe = getValidOrders();
    var ds = [];        // [{product_id, quantity, revenue}]
    for(var i = 0; i < hopLe.length; i++){
        for(var j = 0; j < hopLe[i].items.length; j++){
            var it = hopLe[i].items[j];
            var viTri = -1;
            for(var k = 0; k < ds.length; k++){
                if(ds[k].product_id == it.product_id)
                    viTri = k;
            }
            if(viTri < 0){
                ds.push({ product_id: it.product_id, quantity: 0, revenue: 0 });
                viTri = ds.length - 1;
            }
            ds[viTri].quantity = ds[viTri].quantity + Number(it.quantity);
            ds[viTri].revenue = ds[viTri].revenue + Number(it.quantity) * Number(it.unit_price);
        }
    }
    ds.sort(function(a, b){
        return b.quantity - a.quantity;
    });

    var html = "";
    for(var i = 0; i < ds.length && i < 5; i++){
        var p = findById("products", ds[i].product_id);
        var ten = (p == null) ? ds[i].product_id : p.name;
        var anh = "";
        if(p != null && p.images != null && p.images.length > 0)
            anh = "<img src='" + asset(p.images[0]) + "' alt=''>";
        html += "<tr><td>" + anh + "</td><td>" + safeText(ten) + "</td><td>" + ds[i].quantity + "</td><td>" + formatVND(ds[i].revenue) + "</td></tr>";
    }
    if(html == "")
        html = "<tr><td colspan='4' class='empty'>Chưa có đơn hàng nào.</td></tr>";
    document.getElementById("tbTopProducts").innerHTML = html;
}

// ---------- Biểu đồ doanh thu 6 tháng gần nhất (cột) ----------
function drawRevenueChart(){
    var nhan = [];
    var giaTri = [];
    var homNay = new Date();
    for(var i = 5; i >= 0; i--){
        var d = new Date(homNay.getFullYear(), homNay.getMonth() - i, 1);
        nhan.push((d.getMonth() + 1) + "/" + d.getFullYear());
        giaTri.push(0);
    }
    var hopLe = getValidOrders();
    for(var i = 0; i < hopLe.length; i++){
        var ngay = new Date(hopLe[i].created_at);
        var nhanDon = (ngay.getMonth() + 1) + "/" + ngay.getFullYear();
        for(var k = 0; k < nhan.length; k++){
            if(nhan[k] == nhanDon)
                giaTri[k] = giaTri[k] + Number(hopLe[i].total_amount);
        }
    }
    new Chart(document.getElementById("chartRevenue"), {
        type: "bar",
        data: {
            labels: nhan,
            datasets: [{ label: "Doanh thu (VND)", data: giaTri, backgroundColor: "#202020" }]
        },
        options: { plugins: { legend: { display: false } } }
    });
}

// ---------- Biểu đồ số đơn theo trạng thái (tròn) ----------
function drawStatusChart(){
    var cacTrangThai = ["Confirmed", "Packing", "Shipping", "Delivered", "Cancelled"];
    var nhan = [];
    var giaTri = [];
    var orders = getTable("orders");
    for(var i = 0; i < cacTrangThai.length; i++){
        var dem = 0;
        for(var j = 0; j < orders.length; j++){
            if(orders[j].status == cacTrangThai[i])
                dem = dem + 1;
        }
        nhan.push(getStatusText(cacTrangThai[i]));
        giaTri.push(dem);
    }
    new Chart(document.getElementById("chartStatus"), {
        type: "doughnut",
        data: {
            labels: nhan,
            datasets: [{ data: giaTri, backgroundColor: ["#202020", "#686868", "#DADAD7", "#2C6B3F", "#8C3B2D"] }]
        }
    });
}
