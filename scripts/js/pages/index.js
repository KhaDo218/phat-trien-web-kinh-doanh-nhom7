/* =====================================================================
   ROOMCRAFT - Trang chủ (index.html)
   Người phụ trách: Bảo Duy (Kha làm trang mẫu, Duy làm tiếp)
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    renderHeader("");
    renderFooter();
    renderChatbot();
    showRooms();
    showStyles();
}

// Lấy phòng đầu tiên của 3 phong cách khác nhau, tạo thẻ bằng DOM
function showRooms(){
    var rooms = getTable("rooms");
    var list = document.getElementById("roomList");
    list.innerHTML = "";
    var daLay = [];        // các style_id đã lấy
    var dem = 0;
    for(var i = 0; i < rooms.length && dem < 3; i++){
        if(daLay.indexOf(rooms[i].style_id) >= 0)
            continue;
        daLay.push(rooms[i].style_id);
        dem = dem + 1;
        list.appendChild(createRoomCard(rooms[i], dem));
    }
}

function createRoomCard(room, soThuTu){
    var style = findById("styles", room.style_id);

    var card = document.createElement("div");
    card.className = "room-card card";

    var khungAnh = document.createElement("a");
    khungAnh.className = "room-image";
    khungAnh.href = "room-detail.html?id=" + room.id;
    var img = document.createElement("img");
    img.src = asset(room.image_url);
    img.alt = room.name;
    var nhan = document.createElement("span");
    nhan.className = "badge";
    nhan.innerHTML = style.name;
    khungAnh.appendChild(img);
    khungAnh.appendChild(nhan);

    var noiDung = document.createElement("div");
    noiDung.className = "room-body";
    var stt = soThuTu;
    if(stt < 10)
        stt = "0" + stt;
    noiDung.innerHTML = "<p class='overline'>Không gian " + stt + "</p>"
                      + "<h3 class='title-product'>" + room.name + "</h3>"
                      + "<p class='text-secondary room-desc'>" + room.description + "</p>"
                      + "<a class='btn-link' href='room-detail.html?id=" + room.id + "'>Khám phá căn phòng "
                      + "<span class='material-symbols-outlined'>arrow_forward</span></a>";

    card.appendChild(khungAnh);
    card.appendChild(noiDung);
    return card;
}

// Mỗi phong cách là 1 chip, bấm vào sang trang sản phẩm đã lọc sẵn
function showStyles(){
    var styles = getTable("styles");
    var list = document.getElementById("styleList");
    list.innerHTML = "";
    for(var i = 0; i < styles.length; i++){
        var chip = document.createElement("a");
        chip.className = "chip";
        chip.href = "products.html?style=" + styles[i].slug;
        chip.innerHTML = styles[i].name;
        chip.setAttribute("title", styles[i].description);
        list.appendChild(chip);
    }
}
