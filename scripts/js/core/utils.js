/* =====================================================================
   ROOMCRAFT - utils.js (các hàm tiện ích dùng chung)
   Người phụ trách: Quỳnh Kha
   Hàm có trong file:
     getRoot()          -> "../" hoặc "../../" (đường dẫn về thư mục gốc repo)
     asset(duongDan)    -> đường dẫn ảnh/model dùng được trong trang hiện tại
     formatVND(soTien)  -> "4.160.000 ₫"
     getParam(ten)      -> lấy tham số trên URL, vd. product-detail.html?id=abc
     formatDate(chuoi)  -> "19/10/2026"
     checkEmail(email), checkPhone(sdt) -> true / false
     checkPasswordRule(matKhau) -> "" nếu đạt, ngược lại trả về câu báo lỗi
     sha256(chuoi)      -> mã băm mật khẩu (giống cột password_hash)
   ===================================================================== */

// Trang trong scripts/ cần lùi 1 cấp, trang trong scripts/admin/ cần lùi 2 cấp
function getRoot(){
    var path = window.location.pathname;
    if(path.indexOf("/admin/") >= 0)
        return "../../";
    return "../";
}

// Đường dẫn trong JSON tính từ thư mục gốc (vd. "assets/products/...")
function asset(duongDan){
    if(duongDan == null || duongDan == "")
        return "";
    if(duongDan.indexOf("http") == 0)
        return duongDan;
    return getRoot() + duongDan;
}

// 4160000 -> "4.160.000 ₫"
function formatVND(soTien){
    var chuoi = Math.round(Number(soTien)).toString();
    var kq = "";
    var dem = 0;
    for(var i = chuoi.length - 1; i >= 0; i--){
        kq = chuoi.charAt(i) + kq;
        dem = dem + 1;
        if(dem % 3 == 0 && i > 0 && chuoi.charAt(i - 1) != "-")
            kq = "." + kq;
    }
    return kq + " ₫";
}

// product-detail.html?id=abc&tab=2 -> getParam("id") = "abc"
function getParam(ten){
    var query = window.location.search.substring(1);
    var cacCap = query.split("&");
    for(var i = 0; i < cacCap.length; i++){
        var cap = cacCap[i].split("=");
        if(cap[0] == ten)
            return decodeURIComponent((cap[1] || "").replace(/\+/g, " "));
    }
    return "";
}

// "2026-10-19T08:30:00" -> "19/10/2026"
function formatDate(chuoi){
    var d = new Date(chuoi);
    var ngay = d.getDate();
    var thang = d.getMonth() + 1;
    if(ngay < 10)
        ngay = "0" + ngay;
    if(thang < 10)
        thang = "0" + thang;
    return ngay + "/" + thang + "/" + d.getFullYear();
}

function checkEmail(email){
    var mau = /^[a-zA-Z0-9._]+@[a-zA-Z0-9]+(\.[a-zA-Z]+)+$/;
    return mau.test(email);
}

function checkPhone(sdt){
    var mau = /^0[0-9]{9}$/;
    return mau.test(sdt);
}

// Mật khẩu: ít nhất 8 ký tự, có cả chữ và số
function checkPasswordRule(matKhau){
    if(matKhau.length < 8)
        return "Mật khẩu phải có ít nhất 8 ký tự!";
    var coChu = /[a-zA-Z]/;
    var coSo = /[0-9]/;
    if(coChu.test(matKhau) == false || coSo.test(matKhau) == false)
        return "Mật khẩu phải có cả chữ và số!";
    return "";
}

// SHA-256 viết bằng JavaScript thuần (dùng để so mật khẩu với password_hash).
// Không cần đọc hiểu phần bên trong, chỉ cần gọi sha256("Admin@123").
function sha256(chuoi){
    function rotr(x, n){
        return (x >>> n) | (x << (32 - n));
    }
    var k = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    var h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

    // chuỗi -> mảng byte UTF-8
    var bytes = [];
    var utf8 = unescape(encodeURIComponent(chuoi));
    for(var i = 0; i < utf8.length; i++)
        bytes.push(utf8.charCodeAt(i));
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while(bytes.length % 64 != 56)
        bytes.push(0);
    for(var i = 7; i >= 0; i--)
        bytes.push(i >= 4 ? 0 : (bitLen >>> (i * 8)) & 0xff);

    for(var j = 0; j < bytes.length; j += 64){
        var w = [];
        for(var t = 0; t < 64; t++){
            if(t < 16){
                w[t] = (bytes[j + t * 4] << 24) | (bytes[j + t * 4 + 1] << 16) | (bytes[j + t * 4 + 2] << 8) | bytes[j + t * 4 + 3];
            }
            else{
                var s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
                var s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
                w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
            }
        }
        var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
        for(var t = 0; t < 64; t++){
            var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
            var ch = (e & f) ^ (~e & g);
            var temp1 = (hh + S1 + ch + k[t] + w[t]) | 0;
            var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
            var maj = (a & b) ^ (a & c) ^ (b & c);
            var temp2 = (S0 + maj) | 0;
            hh = g; g = f; f = e;
            e = (d + temp1) | 0;
            d = c; c = b; b = a;
            a = (temp1 + temp2) | 0;
        }
        h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
        h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
    }

    var kq = "";
    for(var i = 0; i < 8; i++)
        kq = kq + ("00000000" + (h[i] >>> 0).toString(16)).slice(-8);
    return kq;
}
