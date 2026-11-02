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
    showLowStock();
    drawOrderFunnel();
    if(typeof Chart == "undefined"){
        alert("Không tải được thư viện Chart.js (scripts/libs/chart.umd.min.js) nên chưa vẽ được biểu đồ!");
        return;
    }
    drawRevenueChart();
    drawStatusChart();
    drawCategorySalesChart();
    drawRevenueShareChart();
    drawPaymentMethodsChart();
    drawDailyOrdersChart();
    drawNewUsersChart();
    drawReviewRatingsChart();
    updateCustomerReviewSectionVisibility();
    drawMonthlyOrderStatusChart();
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

    document.getElementById("statRevenue").innerHTML = formatVND(doanhThu).replace(" ₫", " <span class='stat-currency'>₫</span>");
    document.getElementById("statRevenueNote").innerHTML = "+ " + formatVND(choGiao) + " đang chờ giao (" + soChoGiao + " đơn)";
    document.getElementById("statOrders").innerHTML = orders.length;
    document.getElementById("statOrdersNote").innerHTML = soDaGiao + " đã giao · " + soChoGiao + " đang xử lý · " + soHuy + " đã hủy";
    document.getElementById("statUsers").innerHTML = soUser;
    document.getElementById("statUsersNote").innerHTML = soKhoa > 0 ? soKhoa + " tài khoản đang bị khóa" : "Khách hàng đã đăng ký";
    document.getElementById("statPending").innerHTML = choXuLy;
    document.getElementById("statPendingNote").innerHTML = "Chờ xác nhận / đóng gói · " + soDangGiao + " đơn đang giao";

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var currentStart = new Date(today);
    currentStart.setDate(currentStart.getDate() - 29);
    var previousStart = new Date(today);
    previousStart.setDate(previousStart.getDate() - 59);

    var doanhThuKyNay = 0, doanhThuKyTruoc = 0;
    var donKyNay = 0, donKyTruoc = 0;
    var choXuLyKyNay = 0, choXuLyKyTruoc = 0;
    for(var i = 0; i < orders.length; i++){
        var ngayTaoDon = orders[i].created_at;
        if(isDateInPeriod(ngayTaoDon, currentStart, today, true)){
            donKyNay++;
            if(orders[i].status == "Confirmed" || orders[i].status == "Packing")
                choXuLyKyNay++;
        } else if(isDateInPeriod(ngayTaoDon, previousStart, currentStart, false)){
            donKyTruoc++;
            if(orders[i].status == "Confirmed" || orders[i].status == "Packing")
                choXuLyKyTruoc++;
        }

        if(orders[i].status == "Delivered"){
            var ngayGiao = orders[i].updated_at || orders[i].created_at;
            if(isDateInPeriod(ngayGiao, currentStart, today, true))
                doanhThuKyNay = doanhThuKyNay + Number(orders[i].total_amount);
            else if(isDateInPeriod(ngayGiao, previousStart, currentStart, false))
                doanhThuKyTruoc = doanhThuKyTruoc + Number(orders[i].total_amount);
        }
    }

    var usersKyNay = 0, usersKyTruoc = 0;
    for(var j = 0; j < users.length; j++){
        if(users[j].role_id != 1) continue;
        if(isDateInPeriod(users[j].created_at, currentStart, today, true))
            usersKyNay++;
        else if(isDateInPeriod(users[j].created_at, previousStart, currentStart, false))
            usersKyTruoc++;
    }

    renderStatComparison("statRevenueComparison", doanhThuKyNay, doanhThuKyTruoc, "currency", false);
    renderStatComparison("statOrdersComparison", donKyNay, donKyTruoc, "count", false);
    renderStatComparison("statUsersComparison", usersKyNay, usersKyTruoc, "count", false);
    renderStatComparison("statPendingComparison", choXuLyKyNay, choXuLyKyTruoc, "count", true);
}

function isDateInPeriod(value, start, end, includeEnd){
    if(!value) return false;
    var date = new Date(value);
    if(isNaN(date.getTime())) return false;
    date.setHours(0, 0, 0, 0);
    return date >= start && (includeEnd ? date <= end : date < end);
}

function renderStatComparison(elementId, currentValue, previousValue, valueType, lowerIsBetter){
    var element = document.getElementById(elementId);
    var previousText = valueType == "currency" ? formatVND(previousValue) : String(previousValue);
    var trend = "";
    var trendClass = "stat-comparison-neutral";

    if(previousValue == 0){
        trend = "<span class='stat-comparison-change'>—</span>";
        previousText = "—";
    } else {
        var change = (currentValue - previousValue) / previousValue * 100;
        var changeText = Math.abs(change).toFixed(1) + "%";
        if(change > 0){
            trendClass = lowerIsBetter ? "stat-comparison-bad" : "stat-comparison-good";
            trend = "<span class='material-symbols-outlined' aria-hidden='true'>arrow_upward</span>";
            changeText = "+" + changeText;
        } else if(change < 0){
            trendClass = lowerIsBetter ? "stat-comparison-good" : "stat-comparison-bad";
            trend = "<span class='material-symbols-outlined' aria-hidden='true'>arrow_downward</span>";
            changeText = "-" + changeText;
        } else {
            trend = "<span class='material-symbols-outlined' aria-hidden='true'>remove</span>";
        }
        trend += "<span class='stat-comparison-change'>" + changeText + "</span>";
    }

    element.innerHTML = "<span class='stat-comparison-trend " + trendClass + "'>" + trend + "</span>"
        + "<span class='stat-comparison-period'>so với kỳ trước: " + previousText + "</span>";
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
    var maxSold = ds.length > 0 ? ds[0].quantity : 0;
    var anhMacDinh = "data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' fill='#eeeeec'/><path d='M8 29l8-9 5 5 4-4 7 8H8z' fill='#a6a6a0'/><circle cx='14' cy='13' r='3' fill='#a6a6a0'/></svg>").replace(/'/g, "%27");
    for(var i = 0; i < ds.length && i < 5; i++){
        var p = findById("products", ds[i].product_id);
        var ten = (p == null) ? ds[i].product_id : p.name;
        var imageUrl = anhMacDinh;
        if(p != null && p.images != null && p.images.length > 0)
            imageUrl = asset(p.images[0]);
        var anh = "<img class='top-product-thumbnail' src='" + imageUrl + "' alt='' onerror=\"this.onerror=null;this.src='" + anhMacDinh + "';\">";
        var tiLeBan = maxSold > 0 ? Math.min(ds[i].quantity / maxSold * 100, 100) : 0;
        html += "<tr>"
             + "<td class='top-products-rank'>" + (i + 1) + "</td>"
             + "<td class='top-products-image'>" + anh + "</td>"
             + "<td><span class='top-product-name'>" + safeText(ten) + "</span></td>"
             + "<td class='top-products-number'><div class='top-product-sales'><span>" + ds[i].quantity + "</span><span class='top-product-progress' aria-hidden='true'><span style='width:" + tiLeBan + "%'></span></span></div></td>"
             + "<td class='top-products-number'>" + formatVND(ds[i].revenue) + "</td>"
             + "</tr>";
    }
    if(html == "")
        html = "<tr><td colspan='5' class='empty'>Chưa có đơn hàng nào.</td></tr>";
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
    var mauDoanhThu = [];
    for(var i = 0; i < giaTri.length; i++)
        mauDoanhThu.push(i == giaTri.length - 1 ? "#202020" : "#686868");

    new Chart(document.getElementById("chartRevenue"), {
        type: "bar",
        data: {
            labels: nhan,
            datasets: [{
                label: "Doanh thu (VND)",
                data: giaTri,
                backgroundColor: mauDoanhThu,
                borderRadius: 4,
                borderSkipped: "bottom",
                categoryPercentage: 0.68,
                barPercentage: 0.76
            }]
        },
        options: {
            maintainAspectRatio: false,
            layout: { padding: { top: 4, right: 8, bottom: 0, left: 0 } },
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: function(ctx){ return formatVND(ctx.parsed.y); } } }
            },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: "#EEEEEC", lineWidth: 1, drawTicks: false },
                    border: { display: false },
                    ticks: { callback: function(giaTri){ return (giaTri / 1000000) + " tr"; } }
                }
            }
        }
    });
}

function getCategorySalesData(){
    var categories = getTable("categories");
    var products = getTable("products");
    var daGiao = getDeliveredOrders();
    var productById = {};
    var categoryById = {};
    var salesByCategory = {};

    for(var i = 0; i < products.length; i++)
        productById[products[i].id] = products[i];
    for(var i = 0; i < categories.length; i++)
        categoryById[categories[i].id] = categories[i];

    for(var i = 0; i < daGiao.length; i++){
        var items = daGiao[i].items || [];
        var categoriesInOrder = {};
        for(var j = 0; j < items.length; j++){
            var product = productById[items[j].product_id];
            if(product == null || categoryById[product.category_id] == null)
                continue;
            var categoryId = product.category_id;
            if(salesByCategory[categoryId] == null)
                salesByCategory[categoryId] = { orderCount: 0, revenue: 0 };
            salesByCategory[categoryId].revenue += Number(items[j].quantity) * Number(items[j].unit_price);
            categoriesInOrder[categoryId] = true;
        }
        for(var categoryId in categoriesInOrder)
            salesByCategory[categoryId].orderCount++;
    }

    var rows = [];
    for(var categoryId in salesByCategory){
        if(salesByCategory[categoryId].revenue <= 0)
            continue;
        rows.push({
            id: categoryId,
            name: categoryById[categoryId].name,
            orderCount: salesByCategory[categoryId].orderCount,
            revenue: salesByCategory[categoryId].revenue
        });
    }
    rows.sort(function(a, b){
        return b.revenue - a.revenue;
    });
    return rows;
}

function drawCategorySalesChart(){
    var rows = getCategorySalesData();
    if(rows.length == 0){
        document.getElementById("categorySalesCard").classList.add("hidden");
        return;
    }

    var labels = [];
    var orderCounts = [];
    var revenues = [];
    for(var i = 0; i < rows.length; i++){
        labels.push(rows[i].name);
        orderCounts.push(rows[i].orderCount);
        revenues.push(rows[i].revenue);
    }

    new Chart(document.getElementById("chartCategorySales"), {
        type: "bar",
        data: { labels: labels, datasets: [
            {
                label: "Số đơn",
                data: orderCounts,
                yAxisID: "yOrders",
                backgroundColor: "#686868",
                borderRadius: 4,
                categoryPercentage: 0.72,
                barPercentage: 0.78
            },
            {
                label: "Doanh thu (tr)",
                data: revenues,
                yAxisID: "yRevenue",
                backgroundColor: "#2C6B3F",
                borderRadius: 4,
                categoryPercentage: 0.72,
                barPercentage: 0.78
            }
        ] },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: "top", align: "start" },
                tooltip: { callbacks: {
                    label: function(ctx){
                        if(ctx.dataset.yAxisID == "yRevenue")
                            return "Doanh thu: " + formatVND(ctx.parsed.y);
                        return "Số đơn: " + ctx.parsed.y;
                    }
                } }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { display: false },
                    border: { display: false },
                    ticks: { autoSkip: true, maxTicksLimit: 12, maxRotation: 45, minRotation: 0 }
                },
                yOrders: {
                    type: "linear",
                    position: "left",
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    grid: { color: "#EEEEEC", lineWidth: 1, drawTicks: false },
                    border: { display: false }
                },
                yRevenue: {
                    type: "linear",
                    position: "right",
                    beginAtZero: true,
                    grid: { drawOnChartArea: false },
                    border: { display: false },
                    ticks: { callback: function(value){ return (value / 1000000) + " tr"; } }
                }
            }
        }
    });
}

function drawRevenueShareChart(){
    var rows = getCategorySalesData();
    if(rows.length == 0){
        document.getElementById("revenueShareCard").classList.add("hidden");
        return;
    }

    var labels = [];
    var values = [];
    var colors = ["#202020", "#686868", "#2C6B3F", "#8C3B2D", "#485238"];
    var otherRevenue = 0;
    var visibleCount = Math.min(4, rows.length);
    for(var i = 0; i < visibleCount; i++){
        labels.push(rows[i].name);
        values.push(rows[i].revenue);
    }
    for(var j = visibleCount; j < rows.length; j++)
        otherRevenue += rows[j].revenue;
    if(otherRevenue > 0){
        labels.push("Khác");
        values.push(otherRevenue);
    }

    var totalRevenue = 0;
    for(var k = 0; k < values.length; k++)
        totalRevenue += values[k];

    var legend = document.getElementById("revenueShareLegend");
    legend.innerHTML = "";
    for(var m = 0; m < labels.length; m++){
        var legendItem = document.createElement("div");
        legendItem.className = "chart-status-legend-item";
        var dot = document.createElement("span");
        dot.className = "chart-status-legend-dot";
        dot.style.backgroundColor = colors[m];
        var name = document.createElement("span");
        name.className = "revenue-share-legend-name";
        name.textContent = labels[m];
        var percent = document.createElement("span");
        percent.className = "revenue-share-legend-percent";
        percent.textContent = (values[m] / totalRevenue * 100).toFixed(1) + "%";
        legendItem.appendChild(dot);
        legendItem.appendChild(name);
        legendItem.appendChild(percent);
        legend.appendChild(legendItem);
    }

    new Chart(document.getElementById("chartRevenueShare"), {
        type: "pie",
        data: { labels: labels, datasets: [{
            data: values,
            backgroundColor: colors.slice(0, labels.length),
            borderColor: "#FFFFFF",
            borderWidth: 2,
            spacing: 2
        }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        },
        plugins: [{
            id: "revenueSharePercentLabels",
            afterDatasetsDraw: function(chart){
                var chartTotal = chart.data.datasets[0].data.reduce(function(sum, value){
                    return sum + Number(value);
                }, 0);
                if(chartTotal <= 0) return;
                var context = chart.ctx;
                var arcs = chart.getDatasetMeta(0).data;
                context.save();
                context.font = "600 11px Inter, Arial, sans-serif";
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.fillStyle = "#FFFFFF";
                for(var i = 0; i < arcs.length; i++){
                    var percentValue = Number(chart.data.datasets[0].data[i]) / chartTotal * 100;
                    var text = (percentValue < 10 ? percentValue.toFixed(1) : Math.round(percentValue)) + "%";
                    var angle = (arcs[i].startAngle + arcs[i].endAngle) / 2;
                    var radius = (arcs[i].innerRadius + arcs[i].outerRadius) / 2;
                    var x = arcs[i].x + Math.cos(angle) * radius;
                    var y = arcs[i].y + Math.sin(angle) * radius;
                    context.fillText(text, x, y);
                }
                context.restore();
            }
        }]
    });
}

function drawPaymentMethodsChart(){
    var orders = getTable("orders");
    var soDonTheoPhuongThuc = {};
    var nhan = [];
    var giaTri = [];
    var mauSac = [];
    var bangMau = ["#202020", "#686868", "#2C6B3F", "#8C3B2D"];
    var tongSoDon = 0;

    for(var i = 0; i < orders.length; i++){
        var phuongThuc = orders[i].payment_method;
        if(typeof phuongThuc != "string" || phuongThuc.trim() == "")
            continue;
        if(soDonTheoPhuongThuc[phuongThuc] == null){
            soDonTheoPhuongThuc[phuongThuc] = 0;
            nhan.push(phuongThuc);
        }
        soDonTheoPhuongThuc[phuongThuc] = soDonTheoPhuongThuc[phuongThuc] + 1;
        tongSoDon = tongSoDon + 1;
    }
    if(tongSoDon == 0){
        document.getElementById("paymentMethodsCard").classList.add("hidden");
        return;
    }

    var legend = document.getElementById("chartPaymentLegend");
    legend.innerHTML = "";
    for(var i = 0; i < nhan.length; i++){
        var soDon = soDonTheoPhuongThuc[nhan[i]];
        var tiLe = soDon / tongSoDon * 100;
        giaTri.push(soDon);
        mauSac.push(bangMau[i % bangMau.length]);

        var legendItem = document.createElement("div");
        legendItem.className = "chart-status-legend-item";
        var colorDot = document.createElement("span");
        colorDot.className = "chart-status-legend-dot";
        colorDot.style.backgroundColor = mauSac[i];
        var legendText = document.createElement("span");
        legendText.textContent = nhan[i] + ": " + soDon + " (" + tiLe.toFixed(1) + "%)";
        legendItem.appendChild(colorDot);
        legendItem.appendChild(legendText);
        legend.appendChild(legendItem);
    }

    new Chart(document.getElementById("chartPaymentMethods"), {
        type: "doughnut",
        data: {
            labels: nhan,
            datasets: [{
                data: giaTri,
                backgroundColor: mauSac,
                spacing: 3,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "62%",
            plugins: { legend: { display: false } }
        }
    });
}

function drawDailyOrdersChart(){
    var orders = getTable("orders");
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 29);
    var countsByDate = {};
    var labels = [];
    var ordersWithDates = 0;

    for(var i = 0; i < orders.length; i++){
        if(!orders[i].created_at) continue;
        var createdAt = new Date(orders[i].created_at);
        if(isNaN(createdAt.getTime())) continue;
        ordersWithDates++;
        createdAt.setHours(0, 0, 0, 0);
        var dateKey = createdAt.getFullYear() + "-" + createdAt.getMonth() + "-" + createdAt.getDate();
        countsByDate[dateKey] = (countsByDate[dateKey] || 0) + 1;
    }

    if(ordersWithDates == 0){
        document.getElementById("dailyOrdersCard").classList.add("hidden");
        return;
    }

    var values = [];
    for(var i = 0; i < 30; i++){
        var date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        var key = date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
        var day = String(date.getDate()).padStart(2, "0");
        var month = String(date.getMonth() + 1).padStart(2, "0");
        labels.push(day + "/" + month);
        values.push(countsByDate[key] || 0);
    }

    new Chart(document.getElementById("chartDailyOrders"), {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                data: values,
                borderColor: "#202020",
                backgroundColor: "rgba(32, 32, 32, 0.08)",
                fill: true,
                tension: 0.3,
                pointRadius: 2,
                pointHoverRadius: 4,
                pointBackgroundColor: "#202020",
                pointBorderWidth: 0
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: function(items){ return items.length ? "Ngày: " + items[0].label : ""; },
                        label: function(ctx){ return "Số đơn: " + ctx.parsed.y; }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { autoSkip: true, maxTicksLimit: 10 }
                },
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    grid: { color: "#EEEEEC", lineWidth: 1, drawTicks: false },
                    border: { display: false }
                }
            }
        }
    });
}

function drawNewUsersChart(){
    var users = getTable("users");
    var today = new Date();
    var months = [];
    var labels = [];
    var counts = [];

    for(var i = 5; i >= 0; i--){
        var monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push(monthDate.getFullYear() + "-" + monthDate.getMonth());
        labels.push("Tháng " + String(monthDate.getMonth() + 1).padStart(2, "0"));
        counts.push(0);
    }

    var usersInPeriod = 0;
    for(var j = 0; j < users.length; j++){
        if(users[j].role_id != 1 || !users[j].created_at) continue;
        var createdAt = new Date(users[j].created_at);
        if(isNaN(createdAt.getTime())) continue;
        var monthIndex = months.indexOf(createdAt.getFullYear() + "-" + createdAt.getMonth());
        if(monthIndex < 0) continue;
        counts[monthIndex]++;
        usersInPeriod++;
    }
    if(usersInPeriod == 0){
        document.getElementById("newUsersCard").classList.add("hidden");
        return;
    }

    new Chart(document.getElementById("chartNewUsers"), {
        type: "line",
        data: { labels: labels, datasets: [{
            label: "Người dùng mới",
            data: counts,
            borderColor: "#2C6B3F",
            backgroundColor: "rgba(44, 107, 63, 0.10)",
            fill: true,
            tension: 0.28,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: "#2C6B3F",
            pointBorderColor: "#FFFFFF",
            pointBorderWidth: 1
        }] },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: {
                    title: function(items){ return items.length ? items[0].label : ""; },
                    label: function(ctx){ return "Người dùng mới: " + ctx.parsed.y; }
                } }
            },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    grid: { color: "#EEEEEC", lineWidth: 1, drawTicks: false },
                    border: { display: false }
                }
            }
        }
    });
}

function updateCustomerReviewSectionVisibility(){
    var newUsersCard = document.getElementById("newUsersCard");
    var reviewsCard = document.getElementById("reviewRatingsCard");
    if(newUsersCard.classList.contains("hidden") && reviewsCard.classList.contains("hidden"))
        document.getElementById("customerReviewSection").classList.add("hidden");
}

function drawReviewRatingsChart(){
    var reviews = getTable("reviews");
    var counts = [0, 0, 0, 0, 0];
    var visibleReviewCount = 0;
    var totalRating = 0;
    for(var i = 0; i < reviews.length; i++){
        if(reviews[i].is_hidden == true) continue;
        var rating = Number(reviews[i].rating);
        if(rating < 1 || rating > 5 || rating % 1 != 0) continue;
        counts[rating - 1]++;
        visibleReviewCount++;
        totalRating += rating;
    }
    if(visibleReviewCount == 0){
        document.getElementById("reviewRatingsCard").classList.add("hidden");
        return;
    }

    var average = totalRating / visibleReviewCount;
    document.getElementById("reviewAverage").innerHTML =
        "<span class='review-average-score'>" + average.toFixed(1) + "</span>"
        + "<span class='review-average-caption'>điểm TB · " + visibleReviewCount + " lượt</span>";

    var labels = [];
    var descendingCounts = [];
    for(var i = 5; i >= 1; i--){
        labels.push(i + " sao");
        descendingCounts.push(counts[i - 1]);
    }
    new Chart(document.getElementById("chartReviewRatings"), {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                data: descendingCounts,
                backgroundColor: ["#2C6B3F", "#485238", "#686868", "#8C3B2D", "#8C3B2D"],
                borderRadius: 4,
                categoryPercentage: 0.68,
                barPercentage: 0.76
            }]
        },
        options: {
            indexAxis: "y",
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: function(ctx){ return ctx.parsed.x + " lượt"; } } }
            },
            layout: { padding: { right: 28 } },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    grid: { color: "#EEEEEC", lineWidth: 1, drawTicks: false },
                    border: { display: false }
                },
                y: {
                    grid: { display: false },
                    border: { display: false }
                }
            }
        },
        plugins: [{
            id: "reviewRatingCountLabels",
            afterDatasetsDraw: function(chart){
                var context = chart.ctx;
                var bars = chart.getDatasetMeta(0).data;
                context.save();
                context.fillStyle = "#202020";
                context.font = "600 12px Inter, Arial, sans-serif";
                context.textAlign = "left";
                context.textBaseline = "middle";
                for(var i = 0; i < bars.length; i++){
                    var value = chart.data.datasets[0].data[i];
                    var x = value > 0 ? bars[i].x + 7 : chart.scales.x.left + 7;
                    context.fillText(String(value), x, bars[i].y);
                }
                context.restore();
            }
        }]
    });
}

// ---------- Biểu đồ số đơn theo trạng thái (tròn) ----------
function drawStatusChart(){
    var cacTrangThai = ["Confirmed", "Packing", "Shipping", "Delivered", "Cancelled"];
    var nhan = [];
    var giaTri = [];
    var mauTrangThai = ["#202020", "#686868", "#DADAD7", "#2C6B3F", "#8C3B2D"];
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

    var legend = document.getElementById("chartStatusLegend");
    legend.innerHTML = "";
    for(var i = 0; i < nhan.length; i++){
        var legendItem = document.createElement("div");
        legendItem.className = "chart-status-legend-item";
        var colorDot = document.createElement("span");
        colorDot.className = "chart-status-legend-dot";
        colorDot.style.backgroundColor = mauTrangThai[i];
        var legendText = document.createElement("span");
        legendText.textContent = nhan[i] + ": " + giaTri[i];
        legendItem.appendChild(colorDot);
        legendItem.appendChild(legendText);
        legend.appendChild(legendItem);
    }

    new Chart(document.getElementById("chartStatus"), {
        type: "doughnut",
        data: {
            labels: nhan,
            datasets: [{
                data: giaTri,
                backgroundColor: mauTrangThai,
                spacing: 3,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%",
            plugins: { legend: { display: false } }
        },
        plugins: [{
            id: "centerTotal",
            afterDraw: function(chart){
                var chartArea = chart.chartArea;
                if(!chartArea) return;
                var total = chart.data.datasets[0].data.reduce(function(sum, count){
                    return sum + Number(count);
                }, 0);
                var ctx = chart.ctx;
                ctx.save();
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#202020";
                var centerX = (chartArea.left + chartArea.right) / 2;
                var centerY = (chartArea.top + chartArea.bottom) / 2;
                ctx.font = "600 21px 'EB Garamond', Georgia, serif";
                ctx.fillText(String(total), centerX, centerY - 5);
                ctx.font = "400 12px Inter, Arial, sans-serif";
                ctx.fillText("đơn", centerX, centerY + 13);
                ctx.restore();
            }
        }]
    });
}

function drawOrderFunnel(){
    var orders = getTable("orders");
    var counts = {
        start: orders.length,
        confirmed: 0,
        packing: 0,
        shipping: 0,
        delivered: 0
    };

    for(var i = 0; i < orders.length; i++){
        var status = orders[i].status;
        if(status == "Confirmed" || status == "Packing" || status == "Shipping" || status == "Delivered")
            counts.confirmed++;
        if(status == "Packing" || status == "Shipping" || status == "Delivered")
            counts.packing++;
        if(status == "Shipping" || status == "Delivered")
            counts.shipping++;
        if(status == "Delivered")
            counts.delivered++;
    }

    var stages = [
        { label: "Chờ xác nhận", count: counts.start, color: "#202020" },
        { label: "Đã xác nhận", count: counts.confirmed, color: "#686868" },
        { label: "Đang đóng gói", count: counts.packing, color: "#485238" },
        { label: "Đang giao", count: counts.shipping, color: "#2C6B3F" },
        { label: "Đã giao", count: counts.delivered, color: "#2C6B3F" }
    ];
    var maxCount = counts.start;
    var html = "";

    for(var j = 0; j < stages.length; j++){
        var percent = maxCount > 0 ? stages[j].count / maxCount * 100 : 0;
        var width = maxCount > 0 ? percent : 0;
        html += "<div class='order-funnel-row'>"
            + "<div class='order-funnel-stage' aria-hidden='true' style='width:" + width.toFixed(1) + "%;background-color:" + stages[j].color + "'></div>"
            + "<div class='order-funnel-caption'><span class='order-funnel-label'>" + stages[j].label + "</span>"
            + "<span class='order-funnel-value'>" + stages[j].count + " đơn · " + percent.toFixed(1) + "%</span></div></div>";
    }
    document.getElementById("orderFunnel").innerHTML = html;
}

function drawMonthlyOrderStatusChart(){
    var statuses = ["Confirmed", "Packing", "Shipping", "Delivered", "Cancelled"];
    var colors = ["#202020", "#686868", "#485238", "#2C6B3F", "#8C3B2D"];
    var today = new Date();
    var months = [];
    var labels = [];
    var counts = [];

    for(var i = 5; i >= 0; i--){
        var monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push(monthDate.getFullYear() + "-" + monthDate.getMonth());
        labels.push("Tháng " + String(monthDate.getMonth() + 1).padStart(2, "0") + "/" + monthDate.getFullYear());
    }
    for(var j = 0; j < statuses.length; j++)
        counts.push([0, 0, 0, 0, 0, 0]);

    var orders = getTable("orders");
    for(var k = 0; k < orders.length; k++){
        if(!orders[k].created_at) continue;
        var createdAt = new Date(orders[k].created_at);
        if(isNaN(createdAt.getTime())) continue;
        var monthKey = createdAt.getFullYear() + "-" + createdAt.getMonth();
        var monthIndex = months.indexOf(monthKey);
        var statusIndex = statuses.indexOf(orders[k].status);
        if(monthIndex >= 0 && statusIndex >= 0)
            counts[statusIndex][monthIndex]++;
    }

    var datasets = [];
    for(var m = 0; m < statuses.length; m++){
        datasets.push({
            label: getStatusText(statuses[m]),
            data: counts[m],
            borderColor: colors[m],
            backgroundColor: colors[m],
            tension: 0.25,
            fill: false,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: colors[m],
            pointBorderColor: "#FFFFFF",
            pointBorderWidth: 1
        });
    }

    new Chart(document.getElementById("chartMonthlyOrderStatus"), {
        type: "line",
        data: { labels: labels, datasets: datasets },
        options: {
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: { display: true, position: "top", align: "start" },
                tooltip: {
                    callbacks: {
                        title: function(items){ return items.length ? items[0].label : ""; },
                        label: function(ctx){ return ctx.dataset.label + ": " + ctx.parsed.y + " đơn"; }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    grid: { color: "#EEEEEC", lineWidth: 1, drawTicks: false },
                    border: { display: false }
                }
            }
        }
    });
}

// ---------- Sắp hết hàng: sản phẩm mới đang bán còn từ 1 đến 3 món, món bán chạy xếp trước ----------
function showLowStock(){
    var products = getTable("products");
    var daBan = getSoldMap();
    var ds = [];
    for(var i = 0; i < products.length; i++){
        var p = products[i];
        if(p.product_type == "USED" || p.is_active == false)
            continue;
        if(p.stock_quantity > 0 && p.stock_quantity <= 3)
            ds.push(p);
    }
    ds.sort(function(a, b){
        return (daBan[b.id] || 0) - (daBan[a.id] || 0) || a.stock_quantity - b.stock_quantity;
    });
    document.getElementById("lblLowStock").innerHTML = "(" + ds.length + " sản phẩm còn ≤ 3 món)";
    var html = "";
    for(var j = 0; j < ds.length && j < 8; j++){
        var anh = (ds[j].images && ds[j].images.length > 0) ? "<img src='" + asset(ds[j].images[0]) + "' alt=''>" : "";
        html += "<tr><td>" + anh + "</td><td>" + safeText(ds[j].name) + "</td><td><span class='badge badge-out'>Còn " + ds[j].stock_quantity + "</span></td><td>" + (daBan[ds[j].id] || 0) + "</td></tr>";
    }
    if(html == "")
        html = "<tr><td colspan='4' class='empty'>Không có sản phẩm nào sắp hết hàng.</td></tr>";
    document.getElementById("tbLowStock").innerHTML = html;
}
