/* =====================================================================
   ROOMCRAFT - auth.js (đăng nhập, đăng xuất, phân quyền)
   Người phụ trách: Quỳnh Kha
   Phiên đăng nhập lưu ở rc_session = { user_id, role }  (role: "User" / "Admin")

   Hàm có trong file:
     login(email, matKhau)  -> "" nếu thành công, ngược lại trả về câu báo lỗi
     logout()
     getSession(), getCurrentUser(), isLoggedIn(), isAdmin()
     requireLogin()         đặt đầu trang cần đăng nhập (giỏ hàng, đơn hàng...)
     requireAdmin()         đặt đầu mọi trang trong admin/
   Tài khoản mẫu: admin@roomcraft.vn / Admin@123, user@roomcraft.vn / User@123
   ===================================================================== */

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
    if(user.password_hash != sha256(matKhau))
        return "Mật khẩu không đúng!";

    var role = findById("roles", user.role_id);
    saveObject("session", { user_id: user.id, role: role.name });
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
