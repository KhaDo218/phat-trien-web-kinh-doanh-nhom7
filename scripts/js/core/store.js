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

var DATA_VERSION = "3";     // tăng số này khi data/json thay đổi để mọi máy nạp lại
var DATA_FILES = ["products", "used_products", "categories", "styles", "rooms", "room_hotspots",

                  "users", "roles", "shipping_methods", "coupons", "chatbot_faqs"];

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
    if(localStorage.getItem("rc_orders") == null)
        saveTable("orders", []);
    if(localStorage.getItem("rc_reviews") == null)
        saveTable("reviews", []);
    if(localStorage.getItem("rc_verification_codes") == null)
        saveTable("verification_codes", []);
    if(localStorage.getItem("rc_carts") == null)
        saveObject("carts", {});
    if(localStorage.getItem("rc_wishlists") == null)
        saveObject("wishlists", {});
    localStorage.setItem("rc_version", DATA_VERSION);
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
