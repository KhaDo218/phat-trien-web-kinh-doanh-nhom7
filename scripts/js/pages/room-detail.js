/* =====================================================================
   ROOMCRAFT - Chi tiết không gian (room-detail.html?id=...)
   Người phụ trách: Bảo Duy
   Việc: ảnh phòng + hotspot (Shop the Room), popup sản phẩm, xem 3D, thêm vào giỏ,
         thêm trọn bộ, các món khác trong phòng, gợi ý hoàn thiện, phòng tương tự.
   URL: room-detail.html?id=room-glam-4190768            mở phòng
        room-detail.html?id=room-glam-4190768&sp=<id>    mở phòng và bật sẵn popup sản phẩm <id>
   Đặc tả: UC3.2 Xem chi tiết phòng, UC3.3 Tương tác Hotspot, UC3.4 Xem 3D, UC3.5 Complete Your Room
   ===================================================================== */

var room = null;             // phòng đang xem
var hotspots = [];           // [{room_id, product_id, position_x, position_y}] đã bỏ sản phẩm bị ẩn
var activeIndex = -1;        // hotspot đang mở popup (-1 = chưa mở)
var otherProducts = [];      // các món trong phòng chưa gắn hotspot
var otherShown = 8;          // số món khác đang hiển thị
var viewerProduct = null;    // sản phẩm đang xem 3D

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    renderHeader("khong-gian");
    renderFooter();
    renderChatbot();

    room = findById("rooms", getParam("id"));
    if(room == null){
        document.getElementById("roomNotFound").className = "empty";
        document.title = "Không tìm thấy không gian - RoomCraft";
        return;
    }
    document.getElementById("roomContent").className = "";
    hotspots = getRoomHotspots(room.id);

    showRoomInfo();
    showStage();
    showThumbs();
    showHotspotProducts();
    showOtherProducts();
    showSuggestions();
    showRelatedRooms();

    document.addEventListener("keydown", pageKeyDown);
    window.addEventListener("resize", function(){
        if(activeIndex >= 0)
            placePopup();
    });

    // mở sẵn popup khi đến từ trang chủ (…&sp=<product_id>)
    var sp = getParam("sp");
    for(var i = 0; i < hotspots.length; i++){
        if(hotspots[i].product_id == sp){
            openHotspot(i);
            document.getElementById("stage").scrollIntoView({ block: "center" });
        }
    }
}

// ===================== 1. Thông tin phòng =====================
function showRoomInfo(){
    var style = getStyleOfRoom(room);
    document.title = room.name + " - RoomCraft";
    document.getElementById("breadcrumb").innerHTML = "<a href='index.html'>Trang chủ</a><span>/</span>"
        + "<a href='rooms.html'>Không gian mẫu</a><span>/</span>"
        + "<a href='rooms.html?style=" + style.slug + "'>" + roomEscape(style.name) + "</a><span>/</span>"
        + roomEscape(room.name);
    document.getElementById("roomTags").innerHTML = "<a class='badge rd-style' href='rooms.html?style=" + style.slug + "'>Phong cách: "
        + roomEscape(style.name) + "</a><span class='overline'>" + getRoomProducts(room).length + " sản phẩm trong bộ sưu tập</span>";
    document.getElementById("roomName").innerHTML = roomEscape(room.name);
    document.getElementById("roomDesc").innerHTML = roomEscape(room.description);
    showTotals();
}

// Tổng giá các món gắn hotspot còn hàng (dùng cho ô tóm tắt và dải "mua trọn bộ")
function showTotals(){
    var soConHang = 0;
    for(var i = 0; i < hotspots.length; i++){
        if(Number(findProduct(hotspots[i].product_id).stock_quantity) > 0)
            soConHang = soConHang + 1;
    }
    if(hotspots.length == 0){
        document.getElementById("roomSummary").className = "rd-summary hidden";
        document.getElementById("bundleBar").className = "rd-bundle hidden";
        return;
    }
    var tong = formatVND(getRoomTotal(room));
    document.getElementById("roomTotal").innerHTML = tong;
    document.getElementById("bundleTotal").innerHTML = tong;
    var ghiChu = soConHang + " / " + hotspots.length + " món còn hàng";
    document.getElementById("roomTotalNote").innerHTML = ghiChu;
    document.getElementById("bundleTitle").innerHTML = "Đặt mua trọn bộ " + roomEscape(room.name);
    document.getElementById("bundleNote").innerHTML = "Gồm " + soConHang + " món còn hàng được đánh dấu trên ảnh phòng"
        + (soConHang < hotspots.length ? " (bỏ qua món đã hết hàng)." : ".");
    document.getElementById("btnAddAllText").innerHTML = "Thêm cả " + soConHang + " món vào giỏ";
    var khoa = soConHang == 0;
    document.getElementById("btnAddAll").disabled = khoa;
    document.getElementById("btnAddAllTop").disabled = khoa;
}

// ===================== 2. Ảnh phòng + chấm hotspot =====================
function showStage(){
    var img = document.getElementById("roomImage");
    img.src = asset(room.image_url);
    img.alt = room.name;

    var stage = document.getElementById("stage");
    for(var i = 0; i < hotspots.length; i++){
        var sp = findProduct(hotspots[i].product_id);
        var nut = document.createElement("button");
        nut.type = "button";
        nut.className = "hotspot";
        nut.id = "hotspot-" + i;
        nut.style.left = hotspots[i].position_x + "%";
        nut.style.top = hotspots[i].position_y + "%";
        nut.setAttribute("aria-label", "Điểm " + (i + 1) + ": " + sp.name);
        nut.setAttribute("aria-expanded", "false");
        nut.setAttribute("onclick", "toggleHotspot(" + i + ")");
        nut.innerHTML = "<span class='hotspot-number'>" + (i + 1) + "</span>";
        stage.appendChild(nut);
    }
    if(hotspots.length == 0){
        document.getElementById("stageHintText").innerHTML = "Phòng này chưa được gắn sản phẩm lên ảnh, xem danh sách món đồ bên dưới";
        document.getElementById("stageCounter").className = "rd-counter hidden";
    }
    else{
        document.getElementById("stageCounter").innerHTML = hotspots.length + " sản phẩm được đánh dấu";
    }
    // bấm ra ngoài popup và ngoài chấm thì đóng popup
    stage.addEventListener("click", function(e){
        if(e.target.id == "roomImage")
            closePopup();
    });
}

// Ảnh nhỏ các góc chụp khác của phòng. Hotspot chỉ gắn trên ảnh chính (image_url).
function showThumbs(){
    var anh = room.images || [];
    var list = document.getElementById("thumbList");
    if(anh.length <= 1){
        list.className = "rd-thumbs hidden";
        return;
    }
    var html = "";
    for(var i = 0; i < anh.length; i++){
        var lop = "rd-thumb";
        if(anh[i] == room.image_url)
            lop += " active";
        html += "<button type='button' class='" + lop + "' onclick='changeImage(" + i + ")' aria-label='Góc nhìn " + (i + 1) + "'>"
              + "<img src='" + asset(anh[i]) + "' alt='' loading='lazy'></button>";
    }
    list.innerHTML = html;
}

function changeImage(viTri){
    var anh = room.images[viTri];
    document.getElementById("roomImage").src = asset(anh);
    var nuts = document.getElementById("thumbList").getElementsByTagName("button");
    for(var i = 0; i < nuts.length; i++)
        nuts[i].className = (i == viTri) ? "rd-thumb active" : "rd-thumb";

    var laAnhChinh = (anh == room.image_url);
    closePopup();
    for(var i = 0; i < hotspots.length; i++)
        document.getElementById("hotspot-" + i).style.display = laAnhChinh ? "" : "none";
    if(hotspots.length > 0){
        document.getElementById("stageHintText").innerHTML = laAnhChinh ? "Chạm vào điểm tròn để khám phá sản phẩm"
            : "Góc nhìn khác của phòng. Chọn ảnh đầu tiên để mua sắm theo điểm đánh dấu";
    }
}

// ===================== 3. Popup sản phẩm (UC3.3) =====================
function toggleHotspot(viTri){
    if(activeIndex == viTri)
        closePopup();
    else
        openHotspot(viTri);
}

function openHotspot(viTri){
    if(viTri < 0 || viTri >= hotspots.length)
        return;
    if(activeIndex >= 0)
        setHotspotActive(activeIndex, false);
    activeIndex = viTri;
    setHotspotActive(viTri, true);

    var sp = findProduct(hotspots[viTri].product_id);
    var danhMuc = findById("categories", sp.category_id);
    var conHang = Number(sp.stock_quantity) > 0;
    var link = "product-detail.html?id=" + encodeURIComponent(sp.id);

    var html = "";
    html += "<button type='button' class='btn-icon rd-popup-close' onclick='closePopup()' aria-label='Đóng'><span class='material-symbols-outlined'>close</span></button>";
    html += "<div class='rd-popup-main'>";
    html += "  <a class='rd-popup-img' href='" + link + "'><img src='" + asset(sp.images[0]) + "' alt='" + roomEscape(sp.name) + "'></a>";
    html += "  <div class='rd-popup-info'>";
    html += "    <p class='overline'>" + roomEscape(sp.brand || "") + (danhMuc != null ? " · " + roomEscape(danhMuc.name) : "") + "</p>";
    html += "    <h3 class='title-product' id='popupName'><a href='" + link + "'>" + roomEscape(sp.name) + "</a></h3>";
    html += "    <p class='rd-popup-price'><span class='price'>" + formatVND(sp.price) + "</span>";
    if(sp.original_price != null && Number(sp.original_price) > Number(sp.price))
        html += "<span class='price-old'>" + formatVND(sp.original_price) + "</span>";
    html += "    </p>";
    html += conHang ? "<span class='badge badge-stock'>Còn hàng</span>" : "<span class='badge badge-out'>Hết hàng</span>";
    html += "  </div>";
    html += "</div>";
    html += "<p class='rd-popup-spec'>";
    if(sp.dimensions)
        html += "<span>Kích thước: " + roomEscape(sp.dimensions) + "</span>";
    if(sp.material)
        html += "<span>Chất liệu: " + roomEscape(sp.material) + "</span>";
    if(sp.color)
        html += "<span>Màu: " + roomEscape(sp.color) + "</span>";
    html += "</p>";
    html += "<div class='rd-popup-actions'>";
    html += "  <a class='btn btn-light' href='" + link + "'>Chi tiết</a>";
    if(conHang)
        html += "  <button type='button' class='btn' onclick=\"addOneToCart('" + sp.id + "')\">Thêm vào giỏ</button>";
    else
        html += "  <button type='button' class='btn' disabled>Hết hàng</button>";
    if(sp.model_3d_url != null)   // UC3.3 A1: không có model 3D thì không hiện nút 3D
        html += "  <button type='button' class='btn btn-outline' onclick=\"openViewer('" + sp.id + "')\"><span class='material-symbols-outlined'>view_in_ar</span>3D</button>";
    html += "</div>";
    html += "<div class='rd-popup-nav'>";
    html += "  <button type='button' class='btn-icon' onclick='stepHotspot(-1)' aria-label='Sản phẩm trước'><span class='material-symbols-outlined'>chevron_left</span></button>";
    html += "  <span>" + (viTri + 1) + " / " + hotspots.length + "</span>";
    html += "  <button type='button' class='btn-icon' onclick='stepHotspot(1)' aria-label='Sản phẩm tiếp theo'><span class='material-symbols-outlined'>chevron_right</span></button>";
    html += "</div>";

    var popup = document.getElementById("hotspotPopup");
    popup.innerHTML = html;
    popup.className = "rd-popup";
    placePopup();
}

// Đặt popup cạnh chấm: chấm ở nửa trái ảnh -> popup bên phải và ngược lại. Màn hình nhỏ: CSS đưa popup xuống đáy.
function placePopup(){
    var popup = document.getElementById("hotspotPopup");
    var stage = document.getElementById("stage");
    if(window.innerWidth <= 768){
        popup.style.left = "";
        popup.style.top = "";
        return;
    }
    var h = hotspots[activeIndex];
    var rongAnh = stage.offsetWidth;
    var caoAnh = stage.offsetHeight;
    var x = h.position_x * rongAnh / 100;
    var y = h.position_y * caoAnh / 100;
    var rong = popup.offsetWidth;
    var cao = popup.offsetHeight;

    var trai = x + 32;
    if(h.position_x > 50 || trai + rong > rongAnh - 12)
        trai = x - 32 - rong;
    if(trai < 12)
        trai = 12;
    var tren = y - cao / 2;
    if(tren < 12)
        tren = 12;
    if(tren + cao > caoAnh - 12)
        tren = caoAnh - 12 - cao;
    popup.style.left = trai + "px";
    popup.style.top = tren + "px";
}

function closePopup(){
    if(activeIndex >= 0)
        setHotspotActive(activeIndex, false);
    activeIndex = -1;
    document.getElementById("hotspotPopup").className = "rd-popup hidden";
}

function stepHotspot(buoc){
    var tiep = (activeIndex + buoc + hotspots.length) % hotspots.length;
    openHotspot(tiep);
}

function setHotspotActive(viTri, dangMo){
    var nut = document.getElementById("hotspot-" + viTri);
    if(nut == null)
        return;
    nut.className = dangMo ? "hotspot active" : "hotspot";
    nut.setAttribute("aria-expanded", dangMo ? "true" : "false");
}

function pageKeyDown(e){
    if(e.key == "Escape"){
        if(document.getElementById("modal3d").className.indexOf("hidden") < 0)
            closeViewer();
        else
            closePopup();
    }
    if(activeIndex >= 0 && document.getElementById("modal3d").className.indexOf("hidden") >= 0){
        if(e.key == "ArrowRight")
            stepHotspot(1);
        if(e.key == "ArrowLeft")
            stepHotspot(-1);
    }
}

// ===================== 4. Các danh sách sản phẩm =====================
// Thẻ sản phẩm của Khôi + hàng nút "Chi tiết / Thêm vào giỏ"; soDiem != null thì gắn nhãn số điểm trên ảnh
function createRoomProductCard(sp, soDiem){
    var card = createProductCard(sp);
    var noiDung = card.getElementsByClassName("product-card-body")[0];
    var khungNut = card.getElementsByClassName("product-card-actions")[0];
    var nutChiTiet = khungNut.getElementsByTagName("a")[0];
    nutChiTiet.className = "btn btn-light product-card-detail";
    nutChiTiet.innerHTML = "Chi tiết";

    var hang = document.createElement("div");
    hang.className = "rd-card-actions";
    noiDung.removeChild(khungNut);
    hang.appendChild(nutChiTiet);

    var nutMua = document.createElement("button");
    nutMua.type = "button";
    nutMua.className = "btn";
    if(Number(sp.stock_quantity) > 0){
        nutMua.innerHTML = "Thêm vào giỏ";
        nutMua.setAttribute("onclick", "addOneToCart('" + sp.id + "')");
    }
    else{
        nutMua.innerHTML = "Hết hàng";
        nutMua.disabled = true;
    }
    hang.appendChild(nutMua);
    noiDung.appendChild(hang);

    if(soDiem != null){
        var nhan = document.createElement("button");
        nhan.type = "button";
        nhan.className = "rd-point";
        nhan.innerHTML = "<span class='material-symbols-outlined'>location_on</span>Điểm " + (soDiem + 1);
        nhan.setAttribute("onclick", "showOnImage(" + soDiem + ")");
        nhan.setAttribute("aria-label", "Xem vị trí trên ảnh phòng");
        card.getElementsByClassName("product-card-img")[0].appendChild(nhan);
        card.setAttribute("onmouseenter", "highlightHotspot(" + soDiem + ", true)");
        card.setAttribute("onmouseleave", "highlightHotspot(" + soDiem + ", false)");
    }
    return card;
}

function showHotspotProducts(){
    var list = document.getElementById("hotspotProducts");
    list.innerHTML = "";
    if(hotspots.length == 0){
        document.getElementById("hotspotSection").className = "rd-section hidden";
        return;
    }
    document.getElementById("hotspotCount").innerHTML = "(" + hotspots.length + " món)";
    for(var i = 0; i < hotspots.length; i++)
        list.appendChild(createRoomProductCard(findProduct(hotspots[i].product_id), i));
}

function highlightHotspot(viTri, bat){
    var nut = document.getElementById("hotspot-" + viTri);
    if(nut == null || viTri == activeIndex)
        return;
    if(bat)
        nut.className = "hotspot glow";
    else
        nut.className = "hotspot";
}

// Bấm nhãn "Điểm n" trên thẻ: cuộn lên ảnh và mở popup
function showOnImage(viTri){
    if(room.images && room.images.length > 1)
        changeImage(room.images.indexOf(room.image_url) >= 0 ? room.images.indexOf(room.image_url) : 0);
    document.getElementById("stage").scrollIntoView({ behavior: "smooth", block: "center" });
    openHotspot(viTri);
}

function showOtherProducts(){
    var daGan = [];
    for(var i = 0; i < hotspots.length; i++)
        daGan.push(hotspots[i].product_id);
    var tatCa = getRoomProducts(room);
    otherProducts = [];
    for(var i = 0; i < tatCa.length; i++){
        if(daGan.indexOf(tatCa[i].id) < 0)
            otherProducts.push(tatCa[i]);
    }
    if(otherProducts.length == 0){
        document.getElementById("otherSection").className = "rd-section hidden";
        return;
    }
    // phòng chưa có hotspot: đây là danh sách chính của phòng
    if(hotspots.length == 0)
        document.getElementById("otherTitle").innerHTML = "Sản phẩm trong không gian <span class='rd-count'>(" + otherProducts.length + " món)</span>";
    else
        document.getElementById("otherTitle").innerHTML = "Các món khác trong phòng <span class='rd-count'>(" + otherProducts.length + " món)</span>";
    renderOtherProducts();
}

function renderOtherProducts(){
    var list = document.getElementById("otherProducts");
    list.innerHTML = "";
    for(var i = 0; i < otherProducts.length && i < otherShown; i++)
        list.appendChild(createRoomProductCard(otherProducts[i], null));
    var nut = document.getElementById("btnMore");
    var conLai = otherProducts.length - otherShown;
    if(conLai > 0){
        nut.innerHTML = "Xem thêm " + conLai + " món";
        nut.parentNode.className = "rd-more";
    }
    else{
        nut.parentNode.className = "rd-more hidden";
    }
}

function showMoreOther(){
    otherShown = otherProducts.length;
    renderOtherProducts();
}

// Gợi ý theo quy tắc (UC3.5): cùng phong cách, còn hàng, chưa có trong phòng,
// ưu tiên danh mục mà phòng chưa có món nào; mỗi danh mục 1 món, tối đa 4 món.
function showSuggestions(){
    var style = getStyleOfRoom(room);
    var trongPhong = room.product_ids || [];
    var danhMucDaCo = [];
    var spTrongPhong = getRoomProducts(room);
    for(var i = 0; i < spTrongPhong.length; i++){
        if(danhMucDaCo.indexOf(spTrongPhong[i].category_id) < 0)
            danhMucDaCo.push(spTrongPhong[i].category_id);
    }

    var ungVien = [];
    var products = getTable("products");
    for(var i = 0; i < products.length; i++){
        var sp = products[i];
        if(sp.is_active == false || sp.product_type == "USED" || Number(sp.stock_quantity) <= 0)
            continue;
        if(trongPhong.indexOf(sp.id) >= 0)
            continue;
        var cungPhongCach = sp.style_id == room.style_id || (sp.style_ids != null && sp.style_ids.indexOf(room.style_id) >= 0);
        if(!cungPhongCach)
            continue;
        ungVien.push(sp);
    }

    var chon = [];
    var danhMucDaChon = [];
    // lượt 1: danh mục phòng chưa có; lượt 2: danh mục bất kỳ (khác các món đã chọn)
    for(var luot = 1; luot <= 2; luot++){
        for(var i = 0; i < ungVien.length && chon.length < 4; i++){
            var sp = ungVien[i];
            if(chon.indexOf(sp) >= 0 || danhMucDaChon.indexOf(sp.category_id) >= 0)
                continue;
            if(luot == 1 && danhMucDaCo.indexOf(sp.category_id) >= 0)
                continue;
            chon.push(sp);
            danhMucDaChon.push(sp.category_id);
        }
    }
    if(chon.length == 0){
        document.getElementById("suggestSection").className = "rd-section hidden";
        return;
    }
    document.getElementById("suggestNote").innerHTML = "Những món cùng phong cách " + roomEscape(style.name)
        + " thuộc nhóm mà căn phòng chưa có, giúp không gian đầy đủ và hài hòa hơn.";
    var list = document.getElementById("suggestProducts");
    list.innerHTML = "";
    for(var i = 0; i < chon.length; i++)
        list.appendChild(createRoomProductCard(chon[i], null));
}

function showRelatedRooms(){
    var style = getStyleOfRoom(room);
    var rooms = sortRoomsForDisplay(getTable("rooms"));
    var list = document.getElementById("relatedRooms");
    list.innerHTML = "";
    var dem = 0;
    for(var i = 0; i < rooms.length && dem < 3; i++){
        if(rooms[i].style_id != room.style_id || rooms[i].id == room.id)
            continue;
        list.appendChild(createRoomCard(rooms[i]));
        dem = dem + 1;
    }
    if(dem == 0){
        document.getElementById("relatedSection").className = "rd-section hidden";
        return;
    }
    document.getElementById("relatedLink").href = "rooms.html?style=" + style.slug;
}

// ===================== 5. Giỏ hàng =====================
// Thêm 1 sản phẩm bằng addToCart() trong services/cart.js (đã kiểm tra còn bán, tồn kho).
// Trả về "" nếu thêm được, ngược lại trả về câu báo lỗi.
function putProductInCart(productId){
    return addToCart(productId, 1);
}

// UC3.3 A3: khách chưa đăng nhập bấm Thêm vào giỏ -> chuyển sang trang đăng nhập
function addOneToCart(productId){
    if(requireLogin() == false)
        return;
    var loi = putProductInCart(productId);
    if(loi != ""){
        alert(loi);
        return;
    }
    updateCartCount();
    var sp = findProduct(productId);
    showRoomToast("<span class='material-symbols-outlined'>check_circle</span>Đã thêm \"" + roomEscape(sp.name)
        + "\" vào giỏ hàng <a href='cart.html'>Xem giỏ hàng</a>");
}

// Thêm tất cả món gắn hotspot còn hàng
function addAllToCart(){
    if(requireLogin() == false)
        return;
    var soThem = 0;
    var cacLoi = [];
    for(var i = 0; i < hotspots.length; i++){
        var sp = findProduct(hotspots[i].product_id);
        if(Number(sp.stock_quantity) <= 0)
            continue;
        var loi = putProductInCart(sp.id);
        if(loi == "")
            soThem = soThem + 1;
        else
            cacLoi.push(loi);
    }
    updateCartCount();
    if(soThem == 0){
        alert("Chưa thêm được món nào vào giỏ:\n" + cacLoi.join("\n"));
        return;
    }
    var thongBao = "<span class='material-symbols-outlined'>check_circle</span>Đã thêm " + soThem + " món của "
        + roomEscape(room.name) + " vào giỏ";
    if(cacLoi.length > 0)
        thongBao += " (" + cacLoi.length + " món đã đủ số lượng)";
    showRoomToast(thongBao + " <a href='cart.html'>Xem giỏ hàng</a>");
}

// ===================== 6. Xem 3D (UC3.4) =====================
function openViewer(productId){
    var sp = findProduct(productId);
    if(sp == null || sp.model_3d_url == null)
        return;
    viewerProduct = sp;
    document.getElementById("viewerTitle").innerHTML = roomEscape(sp.name);
    var vung = document.getElementById("viewerArea");
    vung.innerHTML = "<p class='rd-viewer-loading' id='viewerLoading'>Đang tải mô hình 3D...</p>";

    var mv = document.createElement("model-viewer");
    mv.id = "modelViewer";
    mv.setAttribute("src", asset(sp.model_3d_url));
    mv.setAttribute("alt", "Mô hình 3D của " + sp.name);
    mv.setAttribute("camera-controls", "");
    mv.setAttribute("auto-rotate", "");
    mv.setAttribute("shadow-intensity", "1");
    mv.setAttribute("environment-image", "neutral");     // ánh sáng mô phỏng ánh sáng tự nhiên
    mv.setAttribute("ar", "");
    mv.addEventListener("load", function(){
        var o = document.getElementById("viewerLoading");
        if(o != null)
            o.style.display = "none";
    });
    mv.addEventListener("error", showViewerError);
    vung.appendChild(mv);

    // không tải được thư viện model-viewer (mất mạng) thì sau 8 giây báo lỗi
    setTimeout(function(){
        if(viewerProduct == sp && window.customElements != null && window.customElements.get("model-viewer") == null)
            showViewerError();
    }, 8000);

    document.getElementById("modal3d").className = "modal";
    document.body.style.overflow = "hidden";
}

// UC3.4 A1: lỗi tải model -> thông báo và gợi ý xem ảnh sản phẩm
function showViewerError(){
    if(viewerProduct == null)
        return;
    var sp = viewerProduct;
    document.getElementById("viewerArea").innerHTML = "<div class='rd-viewer-error'>"
        + "<img src='" + asset(sp.images[0]) + "' alt='" + roomEscape(sp.name) + "'>"
        + "<p><b>Không tải được mô hình 3D.</b> Bạn có thể xem ảnh thật của sản phẩm ở trang chi tiết.</p>"
        + "<a class='btn btn-outline' href='product-detail.html?id=" + encodeURIComponent(sp.id) + "'>Xem ảnh sản phẩm</a></div>";
}

function closeViewer(){
    viewerProduct = null;
    document.getElementById("modal3d").className = "modal hidden";
    document.getElementById("viewerArea").innerHTML = "";
    document.body.style.overflow = "";
    if(document.fullscreenElement != null)
        document.exitFullscreen();
}

function closeViewerOutside(e){
    if(e.target.id == "modal3d")
        closeViewer();
}

function resetViewer(){
    var mv = document.getElementById("modelViewer");
    if(mv == null || mv.jumpCameraToGoal == null)
        return;
    mv.cameraOrbit = "auto auto auto";
    mv.cameraTarget = "auto auto auto";
    mv.fieldOfView = "auto";
    mv.jumpCameraToGoal();
}

function fullscreenViewer(){
    var box = document.getElementById("viewerBox");
    if(document.fullscreenElement != null)
        document.exitFullscreen();
    else if(box.requestFullscreen != null)
        box.requestFullscreen();
}
