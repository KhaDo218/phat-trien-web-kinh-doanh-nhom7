/* =====================================================================
   ROOMCRAFT - Không gian mẫu (rooms.html)
   Người phụ trách: Bảo Duy
   Việc: danh sách phòng, lọc theo phong cách (rooms.html?style=glam), sắp xếp.
   Thẻ phòng: createRoomCard() trong components/room-card.js
   ===================================================================== */

var currentStyle = "";     // slug phong cách đang lọc, "" = tất cả

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    renderHeader("khong-gian");
    renderFooter();
    renderChatbot();
    currentStyle = getParam("style");
    if(findStyleBySlug(currentStyle) == null)
        currentStyle = "";
    showStyleFilter();
    showRooms();
}

function findStyleBySlug(slug){
    var styles = getTable("styles");
    for(var i = 0; i < styles.length; i++){
        if(styles[i].slug == slug)
            return styles[i];
    }
    return null;
}

// Chip "Tất cả" + 1 chip mỗi phong cách, kèm số phòng
function showStyleFilter(){
    var styles = getTable("styles");
    var rooms = getTable("rooms");
    var html = "<button type='button' class='chip' id='chip-all' onclick=\"filterStyle('')\">Tất cả <span>" + rooms.length + "</span></button>";
    for(var i = 0; i < styles.length; i++){
        var dem = 0;
        for(var j = 0; j < rooms.length; j++){
            if(rooms[j].style_id == styles[i].id)
                dem = dem + 1;
        }
        html += "<button type='button' class='chip' id='chip-" + styles[i].slug + "' onclick=\"filterStyle('" + styles[i].slug + "')\">"
              + roomEscape(styles[i].name) + " <span>" + dem + "</span></button>";
    }
    document.getElementById("styleFilter").innerHTML = html;
}

function filterStyle(slug){
    currentStyle = slug;
    // cập nhật URL để bấm F5 hoặc gửi link vẫn giữ bộ lọc
    var url = "rooms.html";
    if(slug != "")
        url = url + "?style=" + slug;
    window.history.replaceState(null, "", url);
    showRooms();
}

function changeOption(){
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

    // tiêu đề theo phong cách
    if(style == null){
        document.getElementById("pageTitle").innerHTML = "Không gian mẫu";
        document.getElementById("pageLead").innerHTML = "Chọn một căn phòng để xem từng món nội thất trong ảnh, xoay mô hình 3D và mua ngay.";
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
    var chiCoHotspot = document.getElementById("chkShopTheRoom").checked;
    var demHotspot = countHotspotsByRoom();
    var rooms = getTable("rooms");
    var ketQua = [];
    for(var i = 0; i < rooms.length; i++){
        if(style != null && rooms[i].style_id != style.id)
            continue;
        if(chiCoHotspot && !(demHotspot[rooms[i].id] > 0))
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
            return getRoomProducts(b).length - getRoomProducts(a).length;
        });
    }
    else if(cachXep == "name"){
        ketQua.sort(function(a, b){
            return a.name.localeCompare(b.name, "vi", { numeric: true });
        });
    }

    document.getElementById("roomCount").innerHTML = "<b>" + ketQua.length + "</b> không gian";

    var list = document.getElementById("roomList");
    list.innerHTML = "";
    if(ketQua.length == 0){
        list.innerHTML = "<div class='empty rooms-empty'><p class='title-product'>Chưa có không gian phù hợp</p>"
                       + "<p>Hãy bỏ bớt điều kiện lọc hoặc chọn phong cách khác.</p>"
                       + "<button type='button' class='btn btn-outline' onclick='clearFilter()'>Xem tất cả không gian</button></div>";
        return;
    }
    for(var i = 0; i < ketQua.length; i++)
        list.appendChild(createRoomCard(ketQua[i]));
}

function clearFilter(){
    document.getElementById("chkShopTheRoom").checked = false;
    filterStyle("");
}
