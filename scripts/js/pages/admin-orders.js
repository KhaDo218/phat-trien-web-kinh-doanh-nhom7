/* =====================================================================
   ROOMCRAFT - Quản lý đơn hàng (admin/orders.html)
   Người phụ trách: Phương Anh
   Việc cần làm: Đổi trạng thái đơn: Confirmed -> Packing -> Shipping -> Delivered, hoặc Cancelled (hoàn tồn kho).
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    if(requireAdmin() == false)
        return;
    renderAdminSidebar("orders");
    showOrders();
}

// Vẽ bảng đơn hàng theo ô tìm kiếm + bộ lọc trạng thái
function showOrders(){
    var tuKhoa = document.getElementById("txtSearch").value.trim().toLowerCase();
    var trangThai = document.getElementById("cboStatus").value;
    var orders = getAllOrders();
    var html = "";
    var dem = 0;

    for(var i = 0; i < orders.length; i++){
        var o = orders[i];
        if(trangThai != "" && o.status != trangThai)
            continue;
        var khach = findById("users", o.user_id);
        var tenKhach = (khach == null) ? "Không rõ" : khach.full_name;
        if(tuKhoa != ""){
            var chuoi = (o.id + " " + tenKhach + " " + o.shipping_name).toLowerCase();
            if(chuoi.indexOf(tuKhoa) < 0)
                continue;
        }
        dem = dem + 1;

        html += "<tr>";
        html += "  <td>#" + o.id + "</td>";
        html += "  <td>" + safeText(tenKhach) + "<br><span class='text-secondary'>" + safeText(o.shipping_phone) + "</span></td>";
        html += "  <td class='items-text'>" + buildItemsText(o) + "</td>";
        html += "  <td>" + formatDate(o.created_at) + "</td>";
        html += "  <td>" + formatVND(o.total_amount) + "</td>";
        html += "  <td>" + getPaymentText(o.payment_method) + "</td>";
        html += "  <td><span class='status status-" + o.status + "'>" + getStatusText(o.status) + "</span></td>";
        html += "  <td><div class='action-cell'>";
        var tiep = getNextStatus(o.status);
        if(tiep != "")
            html += "<input class='btn' type='button' value='→ " + getStatusText(tiep) + "' onclick='changeStatus(" + o.id + ", \"" + tiep + "\")'>";
        if(canCancelOrder(o))
            html += "<input class='btn btn-outline' type='button' value='Hủy đơn' onclick='changeStatus(" + o.id + ", \"Cancelled\")'>";
        if(tiep == "" && canCancelOrder(o) == false)
            html += "<span class='text-secondary'>Đã kết thúc</span>";
        html += "  </div></td>";
        html += "</tr>";
    }
    if(dem == 0)
        html = "<tr><td colspan='8' class='empty'>Không có đơn hàng nào.</td></tr>";
    document.getElementById("tbOrders").innerHTML = html;
}

// Ghép tên sản phẩm của đơn: "Ghế A x2, Bàn B x1"
function buildItemsText(order){
    var chuoi = "";
    for(var i = 0; i < order.items.length; i++){
        var p = findById("products", order.items[i].product_id);
        var ten = (p == null) ? order.items[i].product_id : p.name;
        if(i > 0)
            chuoi = chuoi + ", ";
        chuoi = chuoi + safeText(ten) + " x" + order.items[i].quantity;
    }
    return chuoi;
}

function changeStatus(orderId, trangThai){
    var cauHoi = "Chuyển đơn #" + orderId + " sang \"" + getStatusText(trangThai) + "\"?";
    if(trangThai == "Cancelled")
        cauHoi = "Hủy đơn #" + orderId + "? Số lượng sản phẩm sẽ được hoàn lại kho.";
    if(confirm(cauHoi) == false)
        return;
    var loi = updateOrderStatus(orderId, trangThai);
    if(loi != ""){
        alert(loi);
        return;
    }
    showOrders();
}
