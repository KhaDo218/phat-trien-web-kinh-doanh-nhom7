/* =====================================================================
   ROOMCRAFT - auth.js (đăng nhập, đăng xuất, phân quyền)
   Người phụ trách: Quỳnh Kha
   Phiên đăng nhập lưu ở rc_session = { user_id, role }  (role: "User" / "Admin")

   Hàm có trong file:
     login(email, matKhau)  -> "" nếu thành công, ngược lại trả về câu báo lỗi
     loginWithGoogle(credential) -> giống login(), dùng cho nút "Đăng nhập bằng Google"
     logout()
     getSession(), getCurrentUser(), isLoggedIn(), isAdmin()
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

function getCurrentUser(){
    var session = getSession();
    if(session == null)
        return null;
    return findById("users", session.user_id);
}

function isLoggedIn(){
    return getCurrentUser() != null;
}

function isAdmin(){
    var session = getSession();
    return session != null && session.role == "Admin";
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
        window.location.href = getRoot() + "scripts/login.html";
        return false;
    }
    return true;
}
