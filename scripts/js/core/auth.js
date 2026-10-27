/* =====================================================================
   ROOMCRAFT - auth.js (đăng nhập, đăng xuất, phân quyền)
   Người phụ trách: Quỳnh Kha
   Phiên đăng nhập lưu ở rc_session = { user_id, role }  (role: "User" / "Admin")

   Hàm có trong file:
     login(email, matKhau)  -> "" nếu thành công, ngược lại trả về câu báo lỗi
     loginWithGoogle(credential) -> giống login(), dùng cho nút "Đăng nhập bằng Google"
     logout()
     getSession(), getCurrentUser(), isLoggedIn(), isAdmin()
     mergeGuestData(userId)  gộp giỏ hàng / yêu thích lúc chưa đăng nhập vào tài khoản (tự gọi khi đăng nhập)
     findUserByEmail(email), findUserByPhone(sdt)   không có trả về null
     createVerificationCode(email, mucDich)    tạo mã OTP 6 số (mô phỏng gửi email), trả về mã
     checkVerificationCode(email, mucDich, ma) -> "" nếu mã đúng, ngược lại trả về câu báo lỗi
       mucDich: "REGISTER" (đăng ký) hoặc "RESET_PASSWORD" (quên mật khẩu)
     requireLogin()         đặt đầu trang cần đăng nhập (giỏ hàng, đơn hàng...)
     requireAdmin()         đặt đầu mọi trang trong admin/
   Tài khoản mẫu: admin@roomcraft.vn / Admin@123, user@roomcraft.vn / User@123
   ===================================================================== */

// Client ID tạo ở Google Cloud Console (project RoomCraft). Đây là thông tin công khai, để trong code được.
// Origin được phép: http://127.0.0.1:5500, http://localhost:5500, http://localhost
var GOOGLE_CLIENT_ID = "1093747987025-e0j8pmavu79dllsdd1fe0ikaqsbhp63i.apps.googleusercontent.com";

function login(email, matKhau){
    var users = getTable("users");
    var user = null;
    for(var i = 0; i < users.length; i++){
        if(users[i].email.toLowerCase() == email.trim().toLowerCase())
            user = users[i];
    }
    if(user == null)
        return "Email chưa được đăng ký!";
    if(user.is_active == false)
        return "Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên!";
    if(user.password_hash == null)
        return "Tài khoản này đăng ký bằng Google, vui lòng bấm \"Đăng nhập bằng Google\"!";
    if(user.password_hash != sha256(matKhau))
        return "Mật khẩu không đúng!";

    saveSession(user);
    return "";
}

function saveSession(user){
    var role = findById("roles", user.role_id);
    saveObject("session", { user_id: user.id, role: role.name });
    mergeGuestData(user.id);
}

// Khách chưa đăng nhập vẫn thêm được vào giỏ / yêu thích (lưu ở khóa "guest").
// Đăng nhập xong thì chuyển sang tài khoản để không mất (số lượng không vượt tồn kho).
function mergeGuestData(userId){
    var carts = getObject("carts");
    if(carts != null && carts["guest"] != null){
        var gio = carts[userId];
        if(gio == null)
            gio = [];
        for(var i = 0; i < carts["guest"].length; i++){
            var mon = carts["guest"][i];
            var p = findById("products", mon.product_id);
            var daCo = null;
            for(var j = 0; j < gio.length; j++){
                if(gio[j].product_id == mon.product_id)
                    daCo = gio[j];
            }
            if(daCo == null)
                gio.push({ product_id: mon.product_id, quantity: Number(mon.quantity) });
            else
                daCo.quantity = Number(daCo.quantity) + Number(mon.quantity);
            if(daCo != null && p != null && daCo.quantity > p.stock_quantity)
                daCo.quantity = p.stock_quantity;
        }
        carts[userId] = gio;
        delete carts["guest"];
        saveObject("carts", carts);
    }
    var wishlists = getObject("wishlists");
    if(wishlists != null && wishlists["guest"] != null){
        var ds = wishlists[userId];
        if(ds == null)
            ds = [];
        for(var i = 0; i < wishlists["guest"].length; i++){
            if(ds.indexOf(wishlists["guest"][i]) < 0)
                ds.push(wishlists["guest"][i]);
        }
        wishlists[userId] = ds;
        delete wishlists["guest"];
        saveObject("wishlists", wishlists);
    }
}

// Google trả về credential là chuỗi JWT gồm 3 phần "header.payload.chữ ký".
// Phần payload (giữa) chứa email, tên, ảnh đại diện, mã tài khoản Google (sub).
function readGoogleCredential(credential){
    var payload = credential.split(".")[1];
    payload = payload.replace(/-/g, "+").replace(/_/g, "/");
    while(payload.length % 4 != 0)
        payload = payload + "=";
    var chuoi = decodeURIComponent(escape(atob(payload)));   // giữ đúng dấu tiếng Việt
    return JSON.parse(chuoi);
}

// Đã có tài khoản (cùng google_id hoặc cùng email) thì đăng nhập, chưa có thì tự tạo tài khoản mới
function loginWithGoogle(credential){
    var info = readGoogleCredential(credential);
    var users = getTable("users");
    var user = null;
    for(var i = 0; i < users.length; i++){
        if(users[i].google_id == info.sub || users[i].email.toLowerCase() == info.email.toLowerCase())
            user = users[i];
    }
    if(user == null){
        user = {
            id: getNextId("users"),
            role_id: 1,
            full_name: info.name,
            email: info.email,
            phone: null,
            password_hash: null,
            google_id: info.sub,
            avatar_url: info.picture,
            default_address: null,
            is_verified: true,
            is_active: true,
            created_at: new Date().toISOString()
        };
        users.push(user);
    }
    else{
        if(user.is_active == false)
            return "Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên!";
        user.google_id = info.sub;            // liên kết tài khoản email cũ với Google
        if(user.avatar_url == null)
            user.avatar_url = info.picture;
    }
    saveTable("users", users);
    saveSession(user);
    return "";
}

function logout(){
    localStorage.removeItem("rc_session");
    window.location.href = getRoot() + "scripts/index.html";
}

function getSession(){
    return getObject("session");
}

// Tài khoản bị Admin khóa trong lúc đang đăng nhập thì coi như đã đăng xuất
function getCurrentUser(){
    var session = getSession();
    if(session == null)
        return null;
    var user = findById("users", session.user_id);
    if(user == null || user.is_active == false)
        return null;
    return user;
}

function isLoggedIn(){
    return getCurrentUser() != null;
}

function isAdmin(){
    var session = getSession();
    return session != null && session.role == "Admin" && getCurrentUser() != null;
}

// Chưa đăng nhập -> chuyển sang trang đăng nhập, đăng nhập xong quay lại trang cũ
function requireLogin(){
    if(isLoggedIn() == false){
        alert("Vui lòng đăng nhập để tiếp tục!");
        var trangCu = encodeURIComponent(window.location.href);
        window.location.href = getRoot() + "scripts/login.html?redirect=" + trangCu;
        return false;
    }
    return true;
}

function requireAdmin(){
    if(isAdmin() == false){
        alert("Bạn không có quyền truy cập trang quản trị!");
        // đã đăng nhập bằng tài khoản khách thì về trang chủ, chưa đăng nhập thì sang trang đăng nhập
        if(isLoggedIn())
            window.location.href = getRoot() + "scripts/index.html";
        else
            window.location.href = getRoot() + "scripts/login.html";
        return false;
    }
    return true;
}

function findUserByEmail(email){
    var users = getTable("users");
    for(var i = 0; i < users.length; i++){
        if(users[i].email.toLowerCase() == email.trim().toLowerCase())
            return users[i];
    }
    return null;
}

function findUserByPhone(sdt){
    var users = getTable("users");
    for(var i = 0; i < users.length; i++){
        if(users[i].phone != null && users[i].phone == sdt.trim())
            return users[i];
    }
    return null;
}

// ----- Mã xác minh OTP (mô phỏng: không gửi email thật, trang tự hiện mã ra) -----
var OTP_MINUTES = 5;      // mã hết hạn sau 5 phút

function createVerificationCode(email, mucDich){
    var ma = "";
    for(var i = 0; i < 6; i++)
        ma = ma + Math.floor(Math.random() * 10);

    var codes = getTable("verification_codes");
    // mã cũ cùng email, cùng mục đích chưa dùng thì vô hiệu hóa
    for(var i = 0; i < codes.length; i++){
        if(codes[i].email == email && codes[i].purpose == mucDich)
            codes[i].is_used = true;
    }
    var bayGio = new Date();
    var hetHan = new Date(bayGio.getTime() + OTP_MINUTES * 60 * 1000);
    codes.push({
        id: getNextId("verification_codes"),
        email: email,
        code: ma,
        purpose: mucDich,
        expires_at: hetHan.toISOString(),
        is_used: false,
        created_at: bayGio.toISOString()
    });
    saveTable("verification_codes", codes);
    return ma;
}

function checkVerificationCode(email, mucDich, ma){
    var codes = getTable("verification_codes");
    var dong = null;
    for(var i = 0; i < codes.length; i++){
        if(codes[i].email == email && codes[i].purpose == mucDich && codes[i].is_used == false)
            dong = codes[i];
    }
    if(dong == null)
        return "Không tìm thấy mã xác minh, vui lòng bấm Gửi lại mã!";
    if(new Date() > new Date(dong.expires_at))
        return "Mã xác minh đã hết hạn, vui lòng bấm Gửi lại mã!";
    if(dong.code != ma.trim())
        return "Mã xác minh không đúng!";
    dong.is_used = true;
    saveTable("verification_codes", codes);
    return "";
}
