/* =====================================================================
   ROOMCRAFT - Quản lý phòng (admin/rooms.html)
   Người phụ trách: Bảo Duy
   Việc: thêm / sửa / xóa phòng (UC7.2), gắn sản phẩm vào phòng bằng cách bấm lên ảnh,
         tọa độ lưu theo % (UC7.3). Dữ liệu: rc_rooms, rc_room_hotspots (store.js).
   Bảng rooms: {id, style_id, name, image_url, description, images[], product_ids[]}
   Bảng room_hotspots: {room_id, product_id, position_x, position_y}  (khóa: room_id + product_id)
   ===================================================================== */

var productMap = {};          // id -> sản phẩm (đọc 1 lần cho nhanh)
var editingRoomId = "";       // "" = đang thêm phòng mới
var hotspotRoomId = "";       // phòng đang gắn hotspot
var editingProductId = "";    // hotspot đang sửa ("" = thêm mới)
var imageCheckId = 0;         // chống kết quả kiểm tra ảnh cũ ghi đè kết quả mới

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    if(requireAdmin() == false)
        return;
    renderAdminSidebar("rooms");

    var products = getTable("products");
    for(var i = 0; i < products.length; i++)
        productMap[products[i].id] = products[i];

    fillStyleSelects();
    showStats();
    showRoomTable();
    document.addEventListener("keydown", function(e){
        if(e.key == "Escape")
            closeExport();
    });
    // mở thẳng trình gắn hotspot: admin/rooms.html?hotspot=<room_id>
    if(getParam("hotspot") != "")
        openHotspotEditor(getParam("hotspot"));
}

function adminEscape(chuoi){
    if(chuoi == null)
        return "";
    return String(chuoi).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function getStyleName(styleId){
    var style = findById("styles", styleId);
    return style == null ? "—" : style.name;
}

function getHotspotsOf(roomId){
    var tatCa = getTable("room_hotspots");
    var kq = [];
    for(var i = 0; i < tatCa.length; i++){
        if(tatCa[i].room_id == roomId)
            kq.push(tatCa[i]);
    }
    return kq;
}

function fillStyleSelects(){
    var styles = getTable("styles");
    var loc = "<option value=''>Tất cả phong cách</option>";
    var chon = "<option value=''>-- Chọn phong cách --</option>";
    for(var i = 0; i < styles.length; i++){
        loc += "<option value='" + styles[i].id + "'>" + adminEscape(styles[i].name) + "</option>";
        chon += "<option value='" + styles[i].id + "'>" + adminEscape(styles[i].name) + "</option>";
    }
    document.getElementById("cboStyleFilter").innerHTML = loc;
    document.getElementById("cboRoomStyle").innerHTML = chon;
}

// ===================== 1. Số liệu + bảng phòng =====================
function showStats(){
    var rooms = getTable("rooms");
    var hotspots = getTable("room_hotspots");
    var coHotspot = {};
    for(var i = 0; i < hotspots.length; i++)
        coHotspot[hotspots[i].room_id] = true;
    var soPhongCo = 0;
    for(var i = 0; i < rooms.length; i++){
        if(coHotspot[rooms[i].id])
            soPhongCo = soPhongCo + 1;
    }
    document.getElementById("statRooms").innerHTML = rooms.length;
    document.getElementById("statReady").innerHTML = soPhongCo;
    document.getElementById("statHotspots").innerHTML = hotspots.length;
}

function showRoomTable(){
    var tuKhoa = document.getElementById("txtRoomSearch").value.trim().toLowerCase();
    var styleId = document.getElementById("cboStyleFilter").value;
    var locHotspot = document.getElementById("cboHotspotFilter").value;
    var rooms = getTable("rooms");
    var hotspots = getTable("room_hotspots");
    var demHotspot = {};
    for(var i = 0; i < hotspots.length; i++)
        demHotspot[hotspots[i].room_id] = (demHotspot[hotspots[i].room_id] || 0) + 1;

    var html = "";
    var dem = 0;
    for(var i = 0; i < rooms.length; i++){
        var r = rooms[i];
        var soDiem = demHotspot[r.id] || 0;
        if(tuKhoa != "" && r.name.toLowerCase().indexOf(tuKhoa) < 0 && r.id.toLowerCase().indexOf(tuKhoa) < 0)
            continue;
        if(styleId != "" && r.style_id != styleId)
            continue;
        if(locHotspot == "yes" && soDiem == 0)
            continue;
        if(locHotspot == "no" && soDiem > 0)
            continue;
        dem = dem + 1;
        var nhanDiem = soDiem == 0 ? "<span class='badge badge-out'>Chưa gắn</span>"
                                   : "<span class='badge badge-stock'>" + soDiem + " điểm</span>";
        html += "<tr>";
        html += "<td><img src='" + asset(r.image_url) + "' alt='' loading='lazy'></td>";
        html += "<td><p class='ar-room-name'>" + adminEscape(r.name) + "</p><p class='ar-room-id'>" + adminEscape(r.id) + "</p></td>";
        html += "<td>" + adminEscape(getStyleName(r.style_id)) + "</td>";
        html += "<td>" + (r.product_ids ? r.product_ids.length : 0) + "</td>";
        html += "<td>" + nhanDiem + "</td>";
        html += "<td class='ar-actions'>";
        html += "  <button type='button' class='btn btn-light' onclick=\"openHotspotEditor('" + r.id + "')\"><span class='material-symbols-outlined'>ads_click</span>Gắn hotspot</button>";
        html += "  <button type='button' class='btn-icon' title='Sửa phòng' aria-label='Sửa phòng' onclick=\"openRoomForm('" + r.id + "')\"><span class='material-symbols-outlined'>edit</span></button>";
        html += "  <button type='button' class='btn-icon ar-danger' title='Xóa phòng' aria-label='Xóa phòng' onclick=\"deleteRoom('" + r.id + "')\"><span class='material-symbols-outlined'>delete</span></button>";
        html += "</td>";
        html += "</tr>";
    }
    if(dem == 0)
        html = "<tr><td colspan='6' class='ar-empty'>Không có phòng nào phù hợp.</td></tr>";
    document.getElementById("tbRooms").innerHTML = html;
    document.getElementById("roomResult").innerHTML = dem + " / " + rooms.length + " phòng";
}

// ===================== 2. Thêm / sửa / xóa phòng (UC7.2) =====================
function openRoomForm(roomId){
    closeHotspotEditor();
    editingRoomId = roomId;
    var r = roomId == "" ? null : findById("rooms", roomId);
    document.getElementById("roomFormMode").innerHTML = r == null ? "Thêm phòng mới" : "Sửa phòng";
    document.getElementById("roomFormTitle").innerHTML = r == null ? "Thông tin phòng" : adminEscape(r.name);
    document.getElementById("txtRoomId").value = r == null ? "" : r.id;
    document.getElementById("txtRoomName").value = r == null ? "" : r.name;
    document.getElementById("cboRoomStyle").value = r == null ? "" : r.style_id;
    document.getElementById("txtRoomImage").value = r == null ? "" : r.image_url;
    document.getElementById("txtRoomDesc").value = r == null ? "" : (r.description || "");
    var anhKhac = [];
    if(r != null && r.images != null){
        for(var i = 0; i < r.images.length; i++){
            if(r.images[i] != r.image_url)
                anhKhac.push(r.images[i]);
        }
    }
    document.getElementById("txtRoomImages").value = anhKhac.join("\n");
    document.getElementById("roomFormPanel").className = "card ar-panel";
    previewRoomImage();
    document.getElementById("roomFormPanel").scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("txtRoomName").focus({ preventScroll: true });
}

function closeRoomForm(){
    document.getElementById("roomFormPanel").className = "card ar-panel hidden";
    editingRoomId = "";
}

function checkImagePath(duongDan){
    var mau = /\.(jpg|jpeg|png|webp)$/i;
    return mau.test(duongDan);
}

function previewRoomImage(){
    var duongDan = document.getElementById("txtRoomImage").value.trim();
    var img = document.getElementById("imgPreview");
    var chu = document.getElementById("previewText");
    if(duongDan == ""){
        img.className = "hidden";
        chu.innerHTML = "Nhập đường dẫn ảnh rồi bấm \"Xem ảnh\"";
        return;
    }
    imageCheckId = imageCheckId + 1;
    var maKiemTra = imageCheckId;
    chu.innerHTML = "Đang tải ảnh...";
    img.className = "hidden";
    img.onload = function(){
        if(maKiemTra != imageCheckId)
            return;
        img.className = "";
        chu.innerHTML = "";
    };
    img.onerror = function(){
        if(maKiemTra != imageCheckId)
            return;
        img.className = "hidden";
        chu.innerHTML = "<span class='error-text'>Không tìm thấy ảnh theo đường dẫn này.</span>";
    };
    img.src = asset(duongDan);
}

// Kiểm tra form (alert + focus + return false theo cách thầy dạy); ảnh phải tải được mới lưu
function saveRoom(){
    var ten = document.getElementById("txtRoomName");
    var style = document.getElementById("cboRoomStyle");
    var anh = document.getElementById("txtRoomImage");
    if(ten.value.trim() == ""){
        alert("Vui lòng nhập tên phòng!");
        ten.focus();
        return false;
    }
    if(style.value == ""){
        alert("Vui lòng chọn phong cách của phòng!");
        style.focus();
        return false;
    }
    if(anh.value.trim() == ""){
        alert("Vui lòng nhập đường dẫn ảnh phòng!");
        anh.focus();
        return false;
    }
    if(checkImagePath(anh.value.trim()) == false){
        alert("Ảnh phòng phải là file .jpg, .jpeg, .png hoặc .webp!");
        anh.focus();
        return false;
    }
    var dsAnhKhac = splitLines(document.getElementById("txtRoomImages").value);
    for(var i = 0; i < dsAnhKhac.length; i++){
        if(checkImagePath(dsAnhKhac[i]) == false){
            alert("Đường dẫn ảnh góc nhìn khác không hợp lệ: " + dsAnhKhac[i]);
            document.getElementById("txtRoomImages").focus();
            return false;
        }
    }
    // thử tải ảnh chính, tải được mới lưu
    var thu = new Image();
    thu.onload = function(){
        writeRoom();
    };
    thu.onerror = function(){
        alert("Không tìm thấy ảnh \"" + anh.value.trim() + "\". Hãy kiểm tra lại đường dẫn (tính từ thư mục gốc, ví dụ assets/rooms/glam/...).");
        anh.focus();
    };
    thu.src = asset(anh.value.trim());
    return false;
}

function splitLines(chuoi){
    var dong = chuoi.split("\n");
    var kq = [];
    for(var i = 0; i < dong.length; i++){
        if(dong[i].trim() != "")
            kq.push(dong[i].trim());
    }
    return kq;
}

function writeRoom(){
    var rooms = getTable("rooms");
    var styleId = Number(document.getElementById("cboRoomStyle").value);
    var anhChinh = document.getElementById("txtRoomImage").value.trim();
    var anh = [anhChinh].concat(splitLines(document.getElementById("txtRoomImages").value));

    var r = null;
    for(var i = 0; i < rooms.length; i++){
        if(rooms[i].id == editingRoomId)
            r = rooms[i];
    }
    var laThemMoi = (r == null);
    if(laThemMoi){
        var style = findById("styles", styleId);
        var ma = "";
        do{
            ma = "room-" + style.slug + "-" + String(Date.now()).slice(-7);
        } while(findById("rooms", ma) != null);
        r = { id: ma, style_id: styleId, name: "", image_url: "", description: "", images: [], product_ids: [] };
        rooms.push(r);
    }
    else if(r.image_url != anhChinh && getHotspotsOf(r.id).length > 0){
        if(confirm("Bạn đổi ảnh chính của phòng. Các hotspot cũ có thể không còn đúng vị trí trên ảnh mới. Vẫn lưu?") == false)
            return;
    }
    r.name = document.getElementById("txtRoomName").value.trim();
    r.style_id = styleId;
    r.image_url = anhChinh;
    r.images = anh;
    r.description = document.getElementById("txtRoomDesc").value.trim();
    saveTable("rooms", rooms);

    closeRoomForm();
    showStats();
    showRoomTable();
    if(laThemMoi){
        alert("Đã thêm phòng \"" + r.name + "\". Tiếp theo hãy gắn sản phẩm lên ảnh phòng.");
        openHotspotEditor(r.id);
    }
    else{
        alert("Đã lưu thay đổi của phòng \"" + r.name + "\".");
    }
}

function deleteRoom(roomId){
    var r = findById("rooms", roomId);
    if(r == null)
        return;
    var soDiem = getHotspotsOf(roomId).length;
    if(confirm("Xóa phòng \"" + r.name + "\" và " + soDiem + " hotspot của phòng? Thao tác này không hoàn tác được.") == false)
        return;
    var rooms = getTable("rooms");
    var conLai = [];
    for(var i = 0; i < rooms.length; i++){
        if(rooms[i].id != roomId)
            conLai.push(rooms[i]);
    }
    saveTable("rooms", conLai);
    var hotspots = getTable("room_hotspots");
    var hsConLai = [];
    for(var i = 0; i < hotspots.length; i++){
        if(hotspots[i].room_id != roomId)
            hsConLai.push(hotspots[i]);
    }
    saveTable("room_hotspots", hsConLai);
    if(hotspotRoomId == roomId)
        closeHotspotEditor();
    if(editingRoomId == roomId)
        closeRoomForm();
    showStats();
    showRoomTable();
}

// ===================== 3. Gắn hotspot (UC7.3) =====================
function openHotspotEditor(roomId){
    var r = findById("rooms", roomId);
    if(r == null){
        alert("Không tìm thấy phòng " + roomId);
        return;
    }
    closeRoomForm();
    hotspotRoomId = roomId;
    document.getElementById("hotspotTitle").innerHTML = adminEscape(r.name) + " <span class='ar-title-style'>" + adminEscape(getStyleName(r.style_id)) + "</span>";
    document.getElementById("lnkViewRoom").href = "../room-detail.html?id=" + encodeURIComponent(r.id);
    var img = document.getElementById("editorImage");
    img.src = asset(r.image_url);
    img.alt = r.name;
    document.getElementById("hotspotPanel").className = "card ar-panel";
    resetHotspotForm();
    showHotspotList();
    document.getElementById("hotspotPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeHotspotEditor(){
    document.getElementById("hotspotPanel").className = "card ar-panel hidden";
    hotspotRoomId = "";
    editingProductId = "";
}

// Danh sách chọn sản phẩm: món trong phòng chưa gắn + món khác cùng phong cách
function fillProductSelect(){
    var r = findById("rooms", hotspotRoomId);
    var daGan = [];
    var hs = getHotspotsOf(hotspotRoomId);
    for(var i = 0; i < hs.length; i++){
        if(hs[i].product_id != editingProductId)
            daGan.push(hs[i].product_id);
    }
    var trongPhong = "";
    var dsTrongPhong = r.product_ids || [];
    for(var i = 0; i < dsTrongPhong.length; i++){
        var sp = productMap[dsTrongPhong[i]];
        if(sp == null || sp.is_active == false || daGan.indexOf(sp.id) >= 0)
            continue;
        trongPhong += "<option value='" + sp.id + "'>" + adminEscape(sp.name) + " - " + formatVND(sp.price) + "</option>";
    }
    var khac = "";
    for(var id in productMap){
        var sp = productMap[id];
        if(sp.is_active == false || sp.product_type == "USED" || sp.style_id != r.style_id)
            continue;
        if(dsTrongPhong.indexOf(sp.id) >= 0 || daGan.indexOf(sp.id) >= 0)
            continue;
        khac += "<option value='" + sp.id + "'>" + adminEscape(sp.name) + " - " + formatVND(sp.price) + "</option>";
    }
    var html = "<option value=''>-- Chọn sản phẩm cần gắn --</option>";
    if(trongPhong != "")
        html += "<optgroup label='Sản phẩm có trong phòng'>" + trongPhong + "</optgroup>";
    if(khac != "")
        html += "<optgroup label='Sản phẩm khác cùng phong cách " + adminEscape(getStyleName(r.style_id)) + "'>" + khac + "</optgroup>";
    document.getElementById("cboHotspotProduct").innerHTML = html;
}

function showPickedProduct(){
    var id = document.getElementById("cboHotspotProduct").value;
    var o = document.getElementById("pickedProduct");
    var sp = productMap[id];
    if(sp == null){
        o.className = "ar-picked hidden";
        return;
    }
    o.innerHTML = "<img src='" + asset(sp.images[0]) + "' alt=''><div><p>" + adminEscape(sp.name) + "</p><p class='text-secondary'>"
        + formatVND(sp.price) + " · Tồn kho: " + sp.stock_quantity + (sp.model_3d_url != null ? " · Có 3D" : "") + "</p></div>";
    o.className = "ar-picked";
}

function showHotspotList(){
    var hs = getHotspotsOf(hotspotRoomId);
    var stage = document.getElementById("editorStage");
    // xóa chấm cũ (giữ ảnh và chấm tạm)
    var cu = stage.getElementsByClassName("hotspot");
    while(cu.length > 0)
        stage.removeChild(cu[0]);

    var html = "";
    for(var i = 0; i < hs.length; i++){
        var sp = productMap[hs[i].product_id];
        var ten = sp == null ? hs[i].product_id + " (không tìm thấy)" : sp.name;
        var dangSua = hs[i].product_id == editingProductId;

        var nut = document.createElement("button");
        nut.type = "button";
        nut.className = dangSua ? "hotspot active" : "hotspot";
        nut.style.left = hs[i].position_x + "%";
        nut.style.top = hs[i].position_y + "%";
        nut.title = ten;
        nut.setAttribute("aria-label", "Sửa hotspot " + (i + 1) + ": " + ten);
        nut.setAttribute("onclick", "event.stopPropagation(); editHotspot('" + hs[i].product_id + "')");
        nut.innerHTML = "<span class='hotspot-number'>" + (i + 1) + "</span>";
        if(dangSua)
            nut.style.display = "none";      // đang sửa thì chỉ hiện chấm tạm
        stage.appendChild(nut);

        html += "<tr" + (dangSua ? " class='ar-row-active'" : "") + ">";
        html += "<td>" + (i + 1) + "</td>";
        html += "<td class='ar-hs-name'>" + adminEscape(ten) + (sp != null && sp.is_active == false ? " <span class='badge badge-out'>Đang ẩn</span>" : "") + "</td>";
        html += "<td>" + hs[i].position_x + "</td>";
        html += "<td>" + hs[i].position_y + "</td>";
        html += "<td class='ar-actions'>";
        html += "<button type='button' class='btn-icon' title='Sửa vị trí' aria-label='Sửa' onclick=\"editHotspot('" + hs[i].product_id + "')\"><span class='material-symbols-outlined'>edit_location_alt</span></button>";
        html += "<button type='button' class='btn-icon ar-danger' title='Xóa' aria-label='Xóa' onclick=\"deleteHotspot('" + hs[i].product_id + "')\"><span class='material-symbols-outlined'>delete</span></button>";
        html += "</td></tr>";
    }
    if(hs.length == 0)
        html = "<tr><td colspan='5' class='ar-empty'>Phòng chưa có hotspot. Bấm lên ảnh để bắt đầu.</td></tr>";
    document.getElementById("tbHotspots").innerHTML = html;
    document.getElementById("hotspotCount").innerHTML = hs.length;
}

// Bấm lên ảnh -> tọa độ % so với kích thước ảnh, làm tròn 1 chữ số thập phân
function pickPosition(e){
    if(hotspotRoomId == "")
        return;
    var img = document.getElementById("editorImage");
    var khung = img.getBoundingClientRect();
    var x = (e.clientX - khung.left) / khung.width * 100;
    var y = (e.clientY - khung.top) / khung.height * 100;
    if(x < 0 || x > 100 || y < 0 || y > 100)
        return;
    document.getElementById("txtPosX").value = Math.round(x * 10) / 10;
    document.getElementById("txtPosY").value = Math.round(y * 10) / 10;
    movePendingMarker();
    if(document.getElementById("cboHotspotProduct").value == "")
        document.getElementById("cboHotspotProduct").focus();
}

function movePendingMarker(){
    var x = parseFloat(document.getElementById("txtPosX").value);
    var y = parseFloat(document.getElementById("txtPosY").value);
    var m = document.getElementById("pendingMarker");
    if(isNaN(x) || isNaN(y) || x < 0 || x > 100 || y < 0 || y > 100){
        m.className = "ar-marker hidden";
        return;
    }
    m.style.left = x + "%";
    m.style.top = y + "%";
    m.className = "ar-marker";
}

function editHotspot(productId){
    var hs = getHotspotsOf(hotspotRoomId);
    for(var i = 0; i < hs.length; i++){
        if(hs[i].product_id != productId)
            continue;
        editingProductId = productId;
        fillProductSelect();
        document.getElementById("cboHotspotProduct").value = productId;
        document.getElementById("txtPosX").value = hs[i].position_x;
        document.getElementById("txtPosY").value = hs[i].position_y;
        document.getElementById("hotspotFormMode").innerHTML = "Sửa hotspot #" + (i + 1) + " · bấm lên ảnh để đổi vị trí";
        showPickedProduct();
        movePendingMarker();
        showHotspotList();
    }
}

function resetHotspotForm(){
    editingProductId = "";
    fillProductSelect();
    document.getElementById("txtPosX").value = "";
    document.getElementById("txtPosY").value = "";
    document.getElementById("hotspotFormMode").innerHTML = "Thêm hotspot";
    document.getElementById("pendingMarker").className = "ar-marker hidden";
    showPickedProduct();
    if(hotspotRoomId != "")
        showHotspotList();
}

// Kiểm tra rồi lưu (BPMN 13: Validate thông tin phòng và hotspot)
function saveHotspot(){
    var cbo = document.getElementById("cboHotspotProduct");
    var txtX = document.getElementById("txtPosX");
    var txtY = document.getElementById("txtPosY");
    if(cbo.value == ""){
        alert("Vui lòng chọn sản phẩm cần gắn!");
        cbo.focus();
        return false;
    }
    if(txtX.value == "" || txtY.value == ""){
        alert("Vui lòng bấm lên ảnh phòng để lấy tọa độ hotspot!");
        txtX.focus();
        return false;
    }
    var x = Number(txtX.value);
    var y = Number(txtY.value);
    if(isNaN(x) || x < 0 || x > 100){
        alert("Tọa độ X phải từ 0 đến 100!");
        txtX.focus();
        return false;
    }
    if(isNaN(y) || y < 0 || y > 100){
        alert("Tọa độ Y phải từ 0 đến 100!");
        txtY.focus();
        return false;
    }
    x = Math.round(x * 10) / 10;
    y = Math.round(y * 10) / 10;

    var tatCa = getTable("room_hotspots");
    var soDiemPhong = 0;
    // (room_id, product_id) là khóa chính: 1 sản phẩm chỉ gắn 1 lần trong 1 phòng
    for(var i = 0; i < tatCa.length; i++){
        if(tatCa[i].room_id != hotspotRoomId)
            continue;
        soDiemPhong = soDiemPhong + 1;
        if(tatCa[i].product_id == cbo.value && cbo.value != editingProductId){
            alert("Sản phẩm này đã được gắn trong phòng, hãy chọn sản phẩm khác hoặc sửa hotspot có sẵn!");
            cbo.focus();
            return false;
        }
    }
    if(editingProductId == "" && soDiemPhong >= 7){
        if(confirm("Phòng đã có " + soDiemPhong + " hotspot (khuyến nghị 3 - 7 điểm để ảnh không bị rối). Vẫn thêm?") == false)
            return false;
    }

    if(editingProductId == ""){
        tatCa.push({ room_id: hotspotRoomId, product_id: cbo.value, position_x: x, position_y: y });
    }
    else{
        for(var i = 0; i < tatCa.length; i++){
            if(tatCa[i].room_id == hotspotRoomId && tatCa[i].product_id == editingProductId){
                tatCa[i].product_id = cbo.value;
                tatCa[i].position_x = x;
                tatCa[i].position_y = y;
            }
        }
    }
    saveTable("room_hotspots", tatCa);

    // sản phẩm chưa có trong danh sách của phòng thì thêm vào product_ids
    var rooms = getTable("rooms");
    for(var i = 0; i < rooms.length; i++){
        if(rooms[i].id == hotspotRoomId){
            if(rooms[i].product_ids == null)
                rooms[i].product_ids = [];
            if(rooms[i].product_ids.indexOf(cbo.value) < 0)
                rooms[i].product_ids.push(cbo.value);
        }
    }
    saveTable("rooms", rooms);

    resetHotspotForm();
    showStats();
    showRoomTable();
    return false;
}

function deleteHotspot(productId){
    var sp = productMap[productId];
    var ten = sp == null ? productId : sp.name;
    if(confirm("Gỡ hotspot \"" + ten + "\" khỏi ảnh phòng?") == false)
        return;
    var tatCa = getTable("room_hotspots");
    var conLai = [];
    for(var i = 0; i < tatCa.length; i++){
        if(!(tatCa[i].room_id == hotspotRoomId && tatCa[i].product_id == productId))
            conLai.push(tatCa[i]);
    }
    saveTable("room_hotspots", conLai);
    resetHotspotForm();
    showStats();
    showRoomTable();
}

// ===================== 4. Xuất JSON =====================
function openExport(){
    document.getElementById("exportModal").className = "modal";
    fillExport();
}

function fillExport(){
    var bang = document.getElementById("cboExport").value;
    document.getElementById("txtExport").value = JSON.stringify(getTable(bang), null, 2);
}

function copyExport(){
    var o = document.getElementById("txtExport");
    o.select();
    if(navigator.clipboard != null){
        navigator.clipboard.writeText(o.value).then(function(){
            alert("Đã sao chép " + document.getElementById("cboExport").value + ".json");
        }, function(){
            document.execCommand("copy");
        });
    }
    else{
        document.execCommand("copy");
        alert("Đã sao chép.");
    }
}

function closeExport(){
    document.getElementById("exportModal").className = "modal hidden";
}

function closeExportOutside(e){
    if(e.target.id == "exportModal")
        closeExport();
}
