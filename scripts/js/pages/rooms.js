/* =====================================================================
   ROOMCRAFT - Không gian mẫu (rooms.html)
   Người phụ trách: Bảo Duy
   Việc: danh sách phòng, lọc theo phong cách (rooms.html?style=glam), sắp xếp, phân trang 12 phòng/trang.
   Địa chỉ trang lưu đủ bộ lọc: rooms.html?style=glam&sort=name&page=2 (bấm F5 hoặc gửi link vẫn giữ nguyên).
   Đổi phong cách / cách sắp xếp thì quay về trang 1.
   Thẻ phòng: createRoomCard() trong components/room-card.js
   Nút phân trang: renderFilterPagination() trong components/catalog-filter.js (giống trang Sản phẩm),
   bấm nút sẽ gọi goToFilterPage(trang) ở file này.
   ===================================================================== */

var ROOMS_PAGE_SIZE = 12;
var currentStyle = "";     // slug phong cách đang lọc, "" = tất cả
var currentPage = 1;

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    renderHeader("khong-gian");
    renderFooter();
    renderChatbot();
    currentStyle = getParam("style");
    if(findStyleBySlug(currentStyle) == null)
        currentStyle = "";
    var sort = getParam("sort");
    if(sort == "most" || sort == "name")
        document.getElementById("cboSort").value = sort;
    currentPage = parseInt(getParam("page"), 10);
    if(isNaN(currentPage) || currentPage < 1)
        currentPage = 1;
    showStyleFilter();
    showStyleSlices();
    showRooms();
}

// Ghi bộ lọc + trang hiện tại lên địa chỉ trang (không tải lại trang)
function updateRoomsUrl(){
    var thamSo = [];
    if(currentStyle != "")
        thamSo.push("style=" + currentStyle);
    var sort = document.getElementById("cboSort").value;
    if(sort != "featured")
        thamSo.push("sort=" + sort);
    if(currentPage > 1)
        thamSo.push("page=" + currentPage);
    var url = "rooms.html";
    if(thamSo.length > 0)
        url = url + "?" + thamSo.join("&");
    window.history.replaceState(null, "", url);
}

// Nút phân trang (catalog-filter.js) gọi hàm này
function goToFilterPage(trang){
    currentPage = trang;
    showRooms();
    document.getElementById("styleFilter").scrollIntoView({ behavior: "smooth" });
}

function findStyleBySlug(slug){
    var styles = getTable("styles");
    for(var i = 0; i < styles.length; i++){
        if(styles[i].slug == slug)
            return styles[i];
    }
    return null;
}

// Chip "Tất cả" + 1 chip mỗi phong cách (số phòng đã hiện ở góc phải nên chip không ghi số)
function showStyleFilter(){
    var styles = getTable("styles");
    var html = "<button type='button' class='chip' id='chip-all' onclick=\"filterStyle('')\">Tất cả</button>";
    for(var i = 0; i < styles.length; i++){
        html += "<button type='button' class='chip' id='chip-" + styles[i].slug + "' onclick=\"filterStyle('" + styles[i].slug + "')\">"
              + roomEscape(styles[i].name) + "</button>";
    }
    document.getElementById("styleFilter").innerHTML = html;
}

// Dải lát ảnh ở banner: mỗi phong cách một lát (ảnh phòng đầu tiên của phong cách đó)
function showStyleSlices(){
    var styles = getTable("styles");
    var rooms = sortRoomsForDisplay(getTable("rooms"));
    var html = "";
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
        var so = i + 1 < 10 ? "0" + (i + 1) : i + 1;
        html += "<button type='button' class='rooms-slice' data-style='" + styles[i].slug + "' onclick=\"filterStyle('" + styles[i].slug + "')\""
              + " style=\"background-image:url('" + asset(anh) + "')\" aria-label='Phong cách " + roomEscape(styles[i].name) + "'>"
              + "<span class='rooms-slice-no'>" + so + "</span>"
              + "<span class='rooms-slice-vname'>" + roomEscape(styles[i].name) + "</span>"
              + "<span class='rooms-slice-info'><b>" + roomEscape(styles[i].name) + "</b>" + soPhong + " không gian</span>"
              + "</button>";
    }
    document.getElementById("styleSlices").innerHTML = html;
}

function filterStyle(slug){
    currentStyle = slug;
    currentPage = 1;           // đổi phong cách thì về trang 1
    showRooms();
}

function changeOption(){
    currentPage = 1;           // đổi cách sắp xếp thì về trang 1
    showRooms();
}

function showRooms(){
    var style = findStyleBySlug(currentStyle);

    // trạng thái chip
    var chips = document.getElementById("styleFilter").getElementsByTagName("button");
    for(var i = 0; i < chips.length; i++){
        chips[i].className = "chip";
        chips[i].setAttribute("aria-pressed", "false");
    }
    var chipDangChon = document.getElementById(style == null ? "chip-all" : "chip-" + style.slug);
    chipDangChon.className = "chip active";
    chipDangChon.setAttribute("aria-pressed", "true");

    // lát ảnh của phong cách đang lọc giữ trạng thái mở rộng
    var slices = document.getElementById("styleSlices").getElementsByTagName("button");
    for(var i = 0; i < slices.length; i++)
        slices[i].classList.toggle("active", style != null && slices[i].getAttribute("data-style") == style.slug);

    // tiêu đề theo phong cách
    if(style == null){
        document.getElementById("pageTitle").innerHTML = "Không gian mẫu";
        document.getElementById("pageLead").innerHTML = "Bắt đầu từ cảm hứng thay vì từ danh mục: chạm vào từng món trong những căn phòng đã được bày sẵn, xoay mô hình 3D để nhìn rõ mọi góc và mang cả không gian ấy về nhà chỉ trong vài bước.";
        document.getElementById("crumbStyle").innerHTML = "Không gian mẫu";
        document.title = "Không gian mẫu - RoomCraft";
    }
    else{
        document.getElementById("pageTitle").innerHTML = "Không gian " + roomEscape(style.name);
        document.getElementById("pageLead").innerHTML = roomEscape(style.description);
        document.getElementById("crumbStyle").innerHTML = "<a href='rooms.html'>Không gian mẫu</a><span>/</span>" + roomEscape(style.name);
        document.title = "Không gian " + style.name + " - RoomCraft";
    }

    // lọc
    var rooms = getTable("rooms");
    var ketQua = [];
    for(var i = 0; i < rooms.length; i++){
        if(style != null && rooms[i].style_id != style.id)
            continue;
        ketQua.push(rooms[i]);
    }

    // sắp xếp
    var cachXep = document.getElementById("cboSort").value;
    if(cachXep == "featured"){
        ketQua = sortRoomsForDisplay(ketQua);
    }
    else if(cachXep == "most"){
        ketQua.sort(function(a, b){
            return getHotspotProductIds(getRoomHotspots(b.id)).length - getHotspotProductIds(getRoomHotspots(a.id)).length;
        });
    }
    else if(cachXep == "name"){
        ketQua.sort(function(a, b){
            return a.name.localeCompare(b.name, "vi", { numeric: true });
        });
    }

    document.getElementById("roomCount").innerHTML = "<b>" + ketQua.length + "</b> không gian";

    // phân trang: trang vượt quá số trang (vd. sửa tay ?page=99) thì về trang cuối
    var soTrang = Math.max(1, Math.ceil(ketQua.length / ROOMS_PAGE_SIZE));
    if(currentPage > soTrang)
        currentPage = soTrang;
    updateRoomsUrl();
    renderFilterPagination("roomPagination", currentPage, soTrang);

    var list = document.getElementById("roomList");
    list.innerHTML = "";
    if(ketQua.length == 0){
        list.innerHTML = "<div class='empty rooms-empty'><p class='title-product'>Chưa có không gian phù hợp</p>"
                       + "<p>Hãy bỏ bớt điều kiện lọc hoặc chọn phong cách khác.</p>"
                       + "<button type='button' class='btn btn-outline' onclick='clearFilter()'>Xem tất cả không gian</button></div>";
        return;
    }
    var batDau = (currentPage - 1) * ROOMS_PAGE_SIZE;
    var ketThuc = Math.min(batDau + ROOMS_PAGE_SIZE, ketQua.length);
    for(var i = batDau; i < ketThuc; i++)
        list.appendChild(createRoomCard(ketQua[i]));
}

function clearFilter(){
    filterStyle("");
}
