/* =====================================================================
   ROOMCRAFT - Trang chủ (index.html)
   Người phụ trách: Bảo Duy (Kha làm trang mẫu, Duy làm tiếp)
   Dữ liệu: rc_rooms, rc_room_hotspots, rc_products, rc_styles
   Hàm thẻ phòng createRoomCard() nằm trong components/room-card.js
   ===================================================================== */

// Phòng muốn đưa lên trang chủ (nếu Admin xóa phòng thì tự lấy phòng khác)
var FEATURED_ROOM_IDS = ["room-bohemian-4189649", "room-scandinavian-4237170", "room-mid-century-modern-4229562"];
var DEMO_ROOM_ID = "room-farmhouse-4189945";       // phòng minh họa ở mục Shop the Room
var ABOUT_ROOM_ID = "room-traditional-4240421";    // ảnh ở mục Về RoomCraft

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    renderHeader("");
    renderFooter();
    renderChatbot();
    showStats();
    showRooms();
    showDemoRoom();
    showFeaturedProducts();
    showStyles();
    showAbout();
}

// ----- Dải số liệu dưới banner -----
function showStats(){
    var products = getTable("products");
    var soSanPham = 0;
    var so3D = 0;
    for(var i = 0; i < products.length; i++){
        if(products[i].is_active == false || products[i].product_type == "USED")
            continue;
        soSanPham = soSanPham + 1;
        if(products[i].model_3d_url != null)
            so3D = so3D + 1;
    }
    var cacSo = [
        { so: getTable("rooms").length, chu: "Không gian mẫu" },
        { so: getTable("styles").length, chu: "Phong cách nội thất" },
        { so: soSanPham, chu: "Sản phẩm đang bán" },
        { so: so3D, chu: "Sản phẩm xem được 3D" }
    ];
    var html = "";
    for(var i = 0; i < cacSo.length; i++)
        html += "<li><span class='stat-number'>" + cacSo[i].so + "</span><span class='overline'>" + cacSo[i].chu + "</span></li>";
    document.getElementById("statList").innerHTML = html;
}

// ----- 3 phòng nổi bật: ưu tiên FEATURED_ROOM_IDS, thiếu thì lấy phòng có hotspot khác phong cách -----
function showRooms(){
    var list = document.getElementById("roomList");
    list.innerHTML = "";
    var chon = [];
    var daLayStyle = [];
    for(var i = 0; i < FEATURED_ROOM_IDS.length; i++){
        var room = findById("rooms", FEATURED_ROOM_IDS[i]);
        if(room != null){
            chon.push(room);
            daLayStyle.push(room.style_id);
        }
    }
    var rooms = sortRoomsForDisplay(getTable("rooms"));
    for(var i = 0; i < rooms.length && chon.length < 3; i++){
        if(daLayStyle.indexOf(rooms[i].style_id) >= 0)
            continue;
        chon.push(rooms[i]);
        daLayStyle.push(rooms[i].style_id);
    }
    for(var i = 0; i < chon.length; i++)
        list.appendChild(createRoomCard(chon[i], i + 1));
}

// ----- Phòng minh họa Shop the Room: chấm hotspot dẫn sang trang chi tiết phòng, mở sẵn sản phẩm -----
function showDemoRoom(){
    var room = findById("rooms", DEMO_ROOM_ID);
    if(room == null || getRoomHotspots(room.id).length == 0){
        var rooms = sortRoomsForDisplay(getTable("rooms"));
        room = rooms[0];
    }
    if(room == null){
        document.getElementById("shop-the-room").style.display = "none";
        return;
    }
    var img = document.getElementById("demoImage");
    img.src = asset(room.image_url);
    img.alt = room.name;

    var stage = document.getElementById("demoStage");
    var hotspots = getRoomHotspots(room.id);
    for(var i = 0; i < hotspots.length; i++){
        if(getHotspotImage(hotspots[i], room) != room.image_url)     // chỉ vẽ điểm của ảnh chính
            continue;
        var sp = findProduct(hotspots[i].product_id);
        var a = document.createElement("a");
        a.className = "hotspot";
        a.href = "room-detail.html?id=" + encodeURIComponent(room.id) + "&sp=" + encodeURIComponent(sp.id);
        a.style.left = hotspots[i].position_x + "%";
        a.style.top = hotspots[i].position_y + "%";
        a.setAttribute("aria-label", sp.name + " - " + formatVND(sp.price));
        // nhãn nhỏ hiện khi rê chuột: phía phải chấm, nếu chấm ở nửa phải ảnh thì hiện bên trái
        var lop = "hotspot-tip";
        if(hotspots[i].position_x > 60)
            lop += " tip-left";
        a.innerHTML = "<span class='" + lop + "'><b>" + roomEscape(sp.name) + "</b>" + formatVND(sp.price) + "</span>";
        stage.appendChild(a);
    }
}

// ----- 4 sản phẩm nổi bật: có trong hotspot, còn hàng, có 3D, mỗi phong cách 1 món -----
function showFeaturedProducts(){
    var list = document.getElementById("productList");
    list.innerHTML = "";
    var hotspots = getTable("room_hotspots");
    var chon = [];
    var daLayStyle = [];
    var daLayId = [];
    // Lượt 1: nội thất (danh mục cha 1) có 3D; lượt 2: bất kỳ sản phẩm còn hàng
    for(var luot = 1; luot <= 2; luot++){
        for(var i = 0; i < hotspots.length && chon.length < 4; i++){
            var sp = findProduct(hotspots[i].product_id);
            if(sp == null || sp.is_active == false || Number(sp.stock_quantity) <= 0)
                continue;
            if(daLayId.indexOf(sp.id) >= 0 || daLayStyle.indexOf(sp.style_id) >= 0)
                continue;
            if(luot == 1 && (sp.model_3d_url == null || sp.parent_category_id != 1))
                continue;
            chon.push(sp);
            daLayId.push(sp.id);
            daLayStyle.push(sp.style_id);
        }
    }
    for(var i = 0; i < chon.length; i++)
        list.appendChild(createProductCard(chon[i]));
}

// ----- Ô phong cách: ảnh 1 phòng tiêu biểu + số phòng, bấm vào sang rooms.html đã lọc -----
function showStyles(){
    var styles = getTable("styles");
    var rooms = sortRoomsForDisplay(getTable("rooms"));
    var list = document.getElementById("styleList");
    list.innerHTML = "";
    for(var i = 0; i < styles.length; i++){
        var anh = "";
        var soPhong = 0;
        for(var j = 0; j < rooms.length; j++){
            if(rooms[j].style_id != styles[i].id)
                continue;
            soPhong = soPhong + 1;
            if(anh == "")
                anh = rooms[j].image_url;
        }
        var o = document.createElement("a");
        o.className = "style-tile";
        o.href = "rooms.html?style=" + styles[i].slug;
        o.title = styles[i].description;
        o.innerHTML = "<img src='" + asset(anh) + "' alt='Phong cách " + roomEscape(styles[i].name) + "' loading='lazy'>"
                    + "<span class='style-info'>"
                    + "  <span class='title-product'>" + roomEscape(styles[i].name) + "</span>"
                    + "  <span class='style-count'>" + soPhong + " không gian <span class='material-symbols-outlined'>arrow_forward</span></span>"
                    + "</span>";
        list.appendChild(o);
    }
}

function showAbout(){
    var room = findById("rooms", ABOUT_ROOM_ID);
    if(room == null)
        room = getTable("rooms")[0];
    if(room == null)
        return;
    document.getElementById("aboutImage").src = asset(room.image_url);
    document.getElementById("aboutCaption").innerHTML = "<a href='room-detail.html?id=" + encodeURIComponent(room.id) + "'>"
        + roomEscape(room.name) + "</a>";
}
