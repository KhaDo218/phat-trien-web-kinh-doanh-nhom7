/* =====================================================================
   ROOMCRAFT - Dashboard (admin/index.html)
   Người phụ trách: Phương Anh
   Việc cần làm: Doanh thu, số đơn, sản phẩm bán chạy, số người dùng (Chart.js).
   Quy ước: doanh thu chỉ tính đơn ĐÃ GIAO (Delivered) - tiền đã thu về thật.
            Đơn mới đặt / đang đóng gói / đang giao chưa tính, hiện riêng là "đang chờ giao".
            Đơn bị hủy không tính. Biểu đồ doanh thu xếp theo tháng giao thành công (updated_at).
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

// Các đơn đã giao thành công
function getDeliveredOrders(){
    var ketQua = [];
    var orders = getTable("orders");
    for(var i = 0; i < orders.length; i++){
        if(orders[i].status == "Delivered")
            ketQua.push(orders[i]);
    }
    return ketQua;
}

function showStats(){
    var orders = getTable("orders");
    var doanhThu = 0, choGiao = 0, soChoGiao = 0, soDaGiao = 0, soHuy = 0, choXuLy = 0, soDangGiao = 0;
    for(var i = 0; i < orders.length; i++){
        var st = orders[i].status;
        if(st == "Delivered"){
            doanhThu = doanhThu + Number(orders[i].total_amount);
            soDaGiao = soDaGiao + 1;
        } else if(st == "Cancelled"){
            soHuy = soHuy + 1;
        } else {
            choGiao = choGiao + Number(orders[i].total_amount);
            soChoGiao = soChoGiao + 1;
            if(st == "Confirmed" || st == "Packing")
                choXuLy = choXuLy + 1;
            else
                soDangGiao = soDangGiao + 1;
        }
    }

    // Người dùng thường (role_id = 1), không đếm Admin
    var soUser = 0, soKhoa = 0;
    var users = getTable("users");
    for(var i = 0; i < users.length; i++){
        if(users[i].role_id == 1){
            soUser = soUser + 1;
            if(users[i].is_active == false)
                soKhoa = soKhoa + 1;
        }
    }

    document.getElementById("statRevenue").innerHTML = formatVND(doanhThu);
    document.getElementById("statRevenueNote").innerHTML = "+ " + formatVND(choGiao) + " đang chờ giao (" + soChoGiao + " đơn)";
    document.getElementById("statOrders").innerHTML = orders.length;
    document.getElementById("statOrdersNote").innerHTML = soDaGiao + " đã giao · " + soChoGiao + " đang xử lý · " + soHuy + " đã hủy";
    document.getElementById("statUsers").innerHTML = soUser;
    document.getElementById("statUsersNote").innerHTML = soKhoa > 0 ? soKhoa + " tài khoản đang bị khóa" : "Khách hàng đã đăng ký";
    document.getElementById("statPending").innerHTML = choXuLy;
    document.getElementById("statPendingNote").innerHTML = "Chờ xác nhận / đóng gói · " + soDangGiao + " đơn đang giao";
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
    var daGiao = getDeliveredOrders();
    for(var i = 0; i < daGiao.length; i++){
        var ngay = new Date(daGiao[i].updated_at || daGiao[i].created_at);   // ngày giao thành công
        var nhanDon = (ngay.getMonth() + 1) + "/" + ngay.getFullYear();
        for(var k = 0; k < nhan.length; k++){
            if(nhan[k] == nhanDon)
                giaTri[k] = giaTri[k] + Number(daGiao[i].total_amount);
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
