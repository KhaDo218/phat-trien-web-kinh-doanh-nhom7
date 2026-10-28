/* =====================================================================
   ROOMCRAFT - room-card.js (hàm dùng chung cho các trang về phòng)
   Người phụ trách: Bảo Duy
   Dùng ở: index.html, rooms.html, room-detail.html  (CSS: css/components/room.css)

   Hàm có trong file:
     roomEscape(chuoi)              chuỗi an toàn để chèn vào innerHTML
     findProduct(id)                tìm sản phẩm theo id (nhanh, đọc localStorage 1 lần/trang)
     getStyleOfRoom(room)           phong cách của phòng {id, slug, name, description}
     getRoomHotspots(roomId)        mảng hotspot của phòng ở mọi góc chụp (đã bỏ sản phẩm bị ẩn)
     getHotspotImage(h, room)       ảnh (góc chụp) mà hotspot được gắn lên
     getHotspotProductIds(hotspots) các sản phẩm khác nhau trong danh sách hotspot (1 món có thể gắn ở nhiều góc)
     getRoomProducts(room)          mảng sản phẩm đang bán (is_active) có trong phòng
     getRoomTotal(room)             tổng giá các sản phẩm gắn hotspot còn hàng
     sortRoomsForDisplay(mang)      phòng có hotspot (Shop the Room) xếp lên trước
     createRoomCard(room, soThuTu)  tạo thẻ phòng: ảnh, phong cách, tên, mô tả, số sản phẩm
     showRoomToast(noiDung)         hiện thông báo nhỏ ở cuối màn hình 3 giây
   ===================================================================== */

function roomEscape(chuoi){
    if(chuoi == null)
        return "";
    return String(chuoi).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// findById("products", id) đọc + JSON.parse cả bảng 950+ sản phẩm mỗi lần gọi, rất chậm khi
// gọi trong vòng lặp. Hàm này đọc 1 lần rồi tra theo id (bảng chỉ đọc lại khi tải lại trang).
var productCache = null;

function findProduct(id){
    if(productCache == null){
        productCache = {};
        var products = getTable("products");
        for(var i = 0; i < products.length; i++)
            productCache[products[i].id] = products[i];
    }
    if(productCache[id] == null)
        return null;
    return productCache[id];
}

function getStyleOfRoom(room){
    var style = findById("styles", room.style_id);
    if(style == null)
        return { id: room.style_id, slug: "", name: "Khác", description: "" };
    return style;
}

// Hotspot của 1 phòng. Bỏ qua hotspot trỏ tới sản phẩm đã bị xóa hoặc đang ẩn.
function getRoomHotspots(roomId){
    var tatCa = getTable("room_hotspots");
    var kq = [];
    for(var i = 0; i < tatCa.length; i++){
        if(tatCa[i].room_id != roomId)
            continue;
        var sp = findProduct(tatCa[i].product_id);
        if(sp == null || sp.is_active == false)
            continue;
        kq.push(tatCa[i]);
    }
    return kq;
}

// Mỗi hotspot có image_url là ảnh nó được gắn lên. Dữ liệu cũ chưa có image_url thì hiểu là ảnh chính.
function getHotspotImage(h, room){
    if(h.image_url == null || h.image_url == "")
        return room.image_url;
    return h.image_url;
}

function getHotspotProductIds(hotspots){
    var ds = [];
    for(var i = 0; i < hotspots.length; i++){
        if(ds.indexOf(hotspots[i].product_id) < 0)
            ds.push(hotspots[i].product_id);
    }
    return ds;
}

function getRoomProducts(room){
    var kq = [];
    var ds = room.product_ids || [];
    for(var i = 0; i < ds.length; i++){
        var sp = findProduct(ds[i]);
        if(sp != null && sp.is_active != false)
            kq.push(sp);
    }
    return kq;
}

function getRoomTotal(room){
    var dsId = getHotspotProductIds(getRoomHotspots(room.id));
    var tong = 0;
    for(var i = 0; i < dsId.length; i++){
        var sp = findProduct(dsId[i]);
        if(Number(sp.stock_quantity) > 0)
            tong = tong + Number(sp.price);
    }
    return tong;
}

// Đếm số hotspot của từng phòng 1 lần (dùng khi sắp xếp danh sách dài)
function countHotspotsByRoom(){
    var tatCa = getTable("room_hotspots");
    var dem = {};
    for(var i = 0; i < tatCa.length; i++){
        if(dem[tatCa[i].room_id] == null)
            dem[tatCa[i].room_id] = 0;
        dem[tatCa[i].room_id] = dem[tatCa[i].room_id] + 1;
    }
    return dem;
}

// Phòng đã gắn hotspot lên trước, giữ nguyên thứ tự trong từng nhóm
function sortRoomsForDisplay(mang){
    var dem = countHotspotsByRoom();
    var coHotspot = [];
    var chuaCo = [];
    for(var i = 0; i < mang.length; i++){
        if(dem[mang[i].id] > 0)
            coHotspot.push(mang[i]);
        else
            chuaCo.push(mang[i]);
    }
    return coHotspot.concat(chuaCo);
}

function createRoomCard(room, soThuTu){
    var style = getStyleOfRoom(room);
    var dsHotspot = getRoomHotspots(room.id);
    var soSanPham = getHotspotProductIds(dsHotspot).length;   // số món gắn trên ảnh phòng
    var soHotspot = dsHotspot.length;
    var link = "room-detail.html?id=" + encodeURIComponent(room.id);

    var card = document.createElement("article");
    card.className = "room-card card";

    var khungAnh = document.createElement("a");
    khungAnh.className = "room-image";
    khungAnh.href = link;
    var img = document.createElement("img");
    img.src = asset(room.image_url);
    img.alt = room.name;
    img.loading = "lazy";
    khungAnh.appendChild(img);

    var nhan = "<span class='badge'>" + roomEscape(style.name) + "</span>";
    if(soHotspot > 0)
        nhan += "<span class='badge badge-dark'>Shop the Room</span>";
    var khungNhan = document.createElement("div");
    khungNhan.className = "room-tags";
    khungNhan.innerHTML = nhan;
    khungAnh.appendChild(khungNhan);

    var noiDung = document.createElement("div");
    noiDung.className = "room-body";
    var dongTren = "";
    if(soThuTu != null){
        var stt = soThuTu;
        if(stt < 10)
            stt = "0" + stt;
        dongTren = "<p class='overline'>Không gian " + stt + "</p>";
    }
    else{
        dongTren = "<p class='overline'>" + roomEscape(style.name) + "</p>";
    }
    noiDung.innerHTML = dongTren
        + "<h3 class='title-product'><a href='" + link + "'>" + roomEscape(room.name) + "</a></h3>"
        + "<p class='text-secondary room-desc'>" + roomEscape(room.description) + "</p>"
        + "<div class='room-meta'>"
        + "  <span><span class='material-symbols-outlined'>chair</span>" + soSanPham + " sản phẩm</span>"
        + "  <a class='btn-link' href='" + link + "'>Khám phá <span class='material-symbols-outlined'>arrow_forward</span></a>"
        + "</div>";

    card.appendChild(khungAnh);
    card.appendChild(noiDung);
    return card;
}

var roomToastTimer = null;

function showRoomToast(noiDung){
    var o = document.getElementById("roomToast");
    if(o == null){
        o = document.createElement("div");
        o.id = "roomToast";
        o.className = "room-toast";
        o.setAttribute("role", "status");
        o.setAttribute("aria-live", "polite");
        document.body.appendChild(o);
    }
    o.innerHTML = noiDung;
    o.className = "room-toast show";
    clearTimeout(roomToastTimer);
    roomToastTimer = setTimeout(function(){
        o.className = "room-toast";
    }, 3000);
}
