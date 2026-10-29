/* =====================================================================
   ROOMCRAFT - store.js (đọc / ghi dữ liệu)
   Người phụ trách: Quỳnh Kha
   - Lần đầu mở web: đọc các file data/json/*.json rồi lưu vào localStorage
     với khóa "rc_<tên bảng>" (vd. rc_products). Các lần sau đọc từ localStorage,
     nhờ vậy trang Admin thêm/sửa/xóa được.
   - Mọi người dùng các hàm dưới đây, KHÔNG tự gọi localStorage.

   Hàm có trong file:
     loadData(hamTiepTheo)       nạp dữ liệu xong thì gọi hamTiepTheo()
     getTable(ten)               lấy mảng, vd. getTable("products")
     saveTable(ten, mang)        lưu lại mảng sau khi sửa
     findById(ten, id)           tìm 1 dòng theo id, không có trả về null
     getNextId(ten)              id số tiếp theo khi thêm mới (orders, reviews...)
     getObject(ten), saveObject(ten, doiTuong)   cho rc_carts, rc_wishlists, rc_session
     resetData()                 xóa hết dữ liệu localStorage, nạp lại từ JSON
   ===================================================================== */

var DATA_VERSION = "12";     // tăng số này khi data/json thay đổi để mọi máy nạp lại
var DATA_FILES = ["products", "used_products", "categories", "styles", "rooms", "room_hotspots",
                  "users", "roles", "shipping_methods", "coupons", "chatbot_faqs",
                  "orders", "reviews"];

// Đọc 1 file JSON bằng XMLHttpRequest
function readJsonFile(ten, hamXuLy){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", getRoot() + "data/json/" + ten + ".json", true);
    xhr.onreadystatechange = function(){
        if(xhr.readyState == 4){
            if(xhr.status == 200 || (xhr.status == 0 && xhr.responseText != ""))
                hamXuLy(JSON.parse(xhr.responseText));
            else
                hamXuLy(null);
        }
    };
    xhr.send();
}

function loadData(hamTiepTheo){
    if(localStorage.getItem("rc_version") == DATA_VERSION){
        hamTiepTheo();
        return;
    }
    readFileAt(0, {}, hamTiepTheo);
}

// Đọc lần lượt từng file trong DATA_FILES, đọc xong file cuối thì lưu tất cả
function readFileAt(viTri, duLieu, hamTiepTheo){
    if(viTri == DATA_FILES.length){
        saveAllData(duLieu);
        hamTiepTheo();
        return;
    }
    var ten = DATA_FILES[viTri];
    readJsonFile(ten, function(mang){
        if(mang == null){
            alert("Không đọc được data/json/" + ten + ".json. Hãy mở trang bằng Live Server (không mở trực tiếp file .html).");
            return;
        }
        duLieu[ten] = mang;
        readFileAt(viTri + 1, duLieu, hamTiepTheo);
    });
}

function saveAllData(duLieu){
    // Giữ lại tài khoản, đơn hàng, đánh giá đã tạo trên máy này (không bị JSON ghi đè)
    keepLocalData(duLieu);

    // Đồ cũ (used_products) được gộp chung vào bảng products, phân biệt bằng product_type = "USED"
    var products = duLieu["products"];
    var usedProducts = duLieu["used_products"];
    for(var i = 0; i < usedProducts.length; i++)
        products.push(usedProducts[i]);

    for(var i = 0; i < DATA_FILES.length; i++){
        var ten = DATA_FILES[i];
        if(ten != "used_products")
            saveTable(ten, duLieu[ten]);
    }
    // Các bảng sinh ra khi dùng web
    if(localStorage.getItem("rc_verification_codes") == null)
        saveTable("verification_codes", []);
    if(localStorage.getItem("rc_carts") == null)
        saveObject("carts", {});
    if(localStorage.getItem("rc_wishlists") == null)
        saveObject("wishlists", {});
    localStorage.setItem("rc_version", DATA_VERSION);
}

// ---------------------------------------------------------------------
// Khi tăng DATA_VERSION: gộp dữ liệu đang có trên máy vào dữ liệu JSON mới
//   - users: tài khoản đã có trong JSON (cùng email) thì giữ bản trên máy,
//            tài khoản đăng ký thêm thì thêm vào (trùng id thì cấp id mới)
//   - orders, reviews: dòng trùng id và trùng created_at là cùng 1 dòng -> giữ bản trên máy,
//            dòng tạo trên máy mà trùng id với JSON thì cấp id mới
// ---------------------------------------------------------------------
function keepLocalData(duLieu){
    var usersCu = getTable("users");
    var ordersCu = getTable("orders");
    var reviewsCu = getTable("reviews");
    var users = duLieu["users"];

    for(var i = 0; i < usersCu.length; i++){
        var viTri = -1;
        for(var j = 0; j < users.length; j++){
            if(users[j].email.toLowerCase() == usersCu[i].email.toLowerCase())
                viTri = j;
        }
        if(viTri >= 0){
            changeUserId(ordersCu, reviewsCu, usersCu[i].id, users[viTri].id);
            usersCu[i].id = users[viTri].id;
            users[viTri] = usersCu[i];
        }
        else{
            if(findIn(users, usersCu[i].id) != null){
                var idMoi = getMaxId(users) + 1;
                changeUserId(ordersCu, reviewsCu, usersCu[i].id, idMoi);
                usersCu[i].id = idMoi;
            }
            users.push(usersCu[i]);
        }
    }
    for(var i = 0; i < ordersCu.length; i++)
        delete ordersCu[i].daDoiId;
    for(var i = 0; i < reviewsCu.length; i++)
        delete reviewsCu[i].daDoiId;
    mergeRows(duLieu["orders"], ordersCu);
    mergeRows(duLieu["reviews"], reviewsCu);
}

function mergeRows(mangMoi, mangCu){
    for(var i = 0; i < mangCu.length; i++){
        var dong = findIn(mangMoi, mangCu[i].id);
        if(dong != null && dong.created_at == mangCu[i].created_at){
            mangMoi[mangMoi.indexOf(dong)] = mangCu[i];
        }
        else{
            if(dong != null)
                mangCu[i].id = getMaxId(mangMoi) + 1;
            mangMoi.push(mangCu[i]);
        }
    }
}

// Đổi user_id trong đơn hàng và đánh giá (chỉ đổi dòng chưa đổi lần nào)
function changeUserId(orders, reviews, idCu, idMoi){
    if(idCu == idMoi)
        return;
    var cacMang = [orders, reviews];
    for(var k = 0; k < cacMang.length; k++){
        for(var i = 0; i < cacMang[k].length; i++){
            if(cacMang[k][i].user_id == idCu && cacMang[k][i].daDoiId != true){
                cacMang[k][i].user_id = idMoi;
                cacMang[k][i].daDoiId = true;
            }
        }
    }
}

function findIn(mang, id){
    for(var i = 0; i < mang.length; i++){
        if(mang[i].id == id)
            return mang[i];
    }
    return null;
}

function getMaxId(mang){
    var max = 0;
    for(var i = 0; i < mang.length; i++){
        if(Number(mang[i].id) > max)
            max = Number(mang[i].id);
    }
    return max;
}

function getTable(ten){
    var chuoi = localStorage.getItem("rc_" + ten);
    if(chuoi == null)
        return [];
    return JSON.parse(chuoi);
}

function saveTable(ten, mang){
    localStorage.setItem("rc_" + ten, JSON.stringify(mang));
}

function findById(ten, id){
    var mang = getTable(ten);
    for(var i = 0; i < mang.length; i++){
        if(mang[i].id == id)
            return mang[i];
    }
    return null;
}

function getNextId(ten){
    var mang = getTable(ten);
    var max = 0;
    for(var i = 0; i < mang.length; i++){
        if(Number(mang[i].id) > max)
            max = Number(mang[i].id);
    }
    return max + 1;
}

function getObject(ten){
    var chuoi = localStorage.getItem("rc_" + ten);
    if(chuoi == null)
        return null;
    return JSON.parse(chuoi);
}

function saveObject(ten, doiTuong){
    localStorage.setItem("rc_" + ten, JSON.stringify(doiTuong));
}

function resetData(){
    var cacKhoa = [];
    for(var i = 0; i < localStorage.length; i++){
        if(localStorage.key(i).indexOf("rc_") == 0)
            cacKhoa.push(localStorage.key(i));
    }
    for(var i = 0; i < cacKhoa.length; i++)
        localStorage.removeItem(cacKhoa[i]);
    window.location.reload();
}
