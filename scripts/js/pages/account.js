/* =====================================================================
   ROOMCRAFT - Tài khoản của tôi (account.html)
   Người phụ trách: Quỳnh Kha
   Hồ sơ cá nhân, đổi mật khẩu (tài khoản Google chưa có mật khẩu thì tạo mới),
   liên kết tới Đơn hàng và Wishlist.
   ===================================================================== */

function initPage(){
    if(requireLogin() == false)
        return;
    renderHeader("");
    renderFooter();
    renderChatbot();
    showAccount();
}

function showAccount(){
    var user = getCurrentUser();
    checkPasswordLive();

    // Cột trái
    var avatar = document.getElementById("divAvatar");
    if(user.avatar_url != null && user.avatar_url != ""){
        avatar.innerHTML = "";
        var img = document.createElement("img");
        img.src = user.avatar_url;
        img.alt = user.full_name;
        avatar.appendChild(img);
    }
    else{
        avatar.innerHTML = getInitials(user.full_name);
    }
    document.getElementById("lblName").innerHTML = user.full_name;
    document.getElementById("lblSince").innerHTML = "Thành viên từ " + formatDate(user.created_at);
    document.getElementById("lblOrderCount").innerHTML = countOrders(user.id);
    document.getElementById("lblWishCount").innerHTML = countWishlist(user.id);
    if(isAdmin())
        document.getElementById("liAdmin").className = "";

    // Hồ sơ
    document.getElementById("txtFullName").value = user.full_name;
    document.getElementById("txtEmail").value = user.email;
    document.getElementById("txtPhone").value = "";
    document.getElementById("txtAddress").value = "";
    if(user.phone != null)
        document.getElementById("txtPhone").value = user.phone;
    if(user.default_address != null)
        document.getElementById("txtAddress").value = user.default_address;
    if(user.google_id != null)
        document.getElementById("lblGoogle").innerHTML = "✓ Đã liên kết đăng nhập Google";
    else
        document.getElementById("lblGoogle").innerHTML = "Chưa liên kết Google (đăng nhập bằng Google với cùng email để liên kết)";

    // Mật khẩu: tài khoản tạo bằng Google chưa có mật khẩu -> ẩn ô mật khẩu hiện tại
    if(user.password_hash == null){
        document.getElementById("lblPasswordTitle").innerHTML = "Tạo mật khẩu";
        document.getElementById("lblMenuPassword").innerHTML = "Tạo mật khẩu";
        document.getElementById("lblNoPassword").className = "text-secondary small";
        document.getElementById("divOldPassword").className = "form-group hidden";
    }
    else{
        document.getElementById("lblPasswordTitle").innerHTML = "Đổi mật khẩu";
        document.getElementById("lblMenuPassword").innerHTML = "Đổi mật khẩu";
        document.getElementById("lblNoPassword").className = "text-secondary small hidden";
        document.getElementById("divOldPassword").className = "form-group";
    }
}

// "Nguyễn Văn An" -> "NA" (chữ đầu của họ và tên)
function getInitials(ten){
    var cacTu = ten.trim().split(" ");
    var kq = cacTu[0].charAt(0);
    if(cacTu.length > 1)
        kq = kq + cacTu[cacTu.length - 1].charAt(0);
    return kq.toUpperCase();
}

function countOrders(userId){
    var orders = getTable("orders");
    var dem = 0;
    for(var i = 0; i < orders.length; i++){
        if(orders[i].user_id == userId)
            dem = dem + 1;
    }
    return dem;
}

function countWishlist(userId){
    var wishlists = getObject("wishlists");
    if(wishlists == null || wishlists[userId] == null)
        return 0;
    return wishlists[userId].length;
}

function saveProfile(){
    var ten = document.getElementById("txtFullName").value.trim();
    var sdt = document.getElementById("txtPhone").value.trim();
    var diaChi = document.getElementById("txtAddress").value.trim();
    var user = getCurrentUser();
    document.getElementById("msgProfile").innerHTML = "";

    if(ten == ""){
        alert("Họ và tên không được bỏ trống!");
        document.getElementById("txtFullName").focus();
        return false;
    }
    if(sdt != ""){
        if(checkPhone(sdt) == false){
            alert("Số điện thoại phải gồm 10 số và bắt đầu bằng số 0!");
            document.getElementById("txtPhone").focus();
            return false;
        }
        var nguoiKhac = findUserByPhone(sdt);
        if(nguoiKhac != null && nguoiKhac.id != user.id){
            alert("Số điện thoại này đã được tài khoản khác sử dụng!");
            document.getElementById("txtPhone").focus();
            return false;
        }
    }

    var users = getTable("users");
    for(var i = 0; i < users.length; i++){
        if(users[i].id == user.id){
            users[i].full_name = ten;
            users[i].phone = null;
            users[i].default_address = null;
            if(sdt != "")
                users[i].phone = sdt;
            if(diaChi != "")
                users[i].default_address = diaChi;
        }
    }
    saveTable("users", users);
    document.getElementById("msgProfile").innerHTML = "Đã lưu thông tin.";
    renderHeader("");       // cập nhật tên trên header
    showAccount();
    return false;
}

function changePassword(){
    var user = getCurrentUser();
    var cu = document.getElementById("txtOldPassword").value;
    var moi = document.getElementById("txtNewPassword").value;
    var nhapLai = document.getElementById("txtConfirm").value;
    var o = document.getElementById("msgPassword");
    o.innerHTML = "";

    if(user.password_hash != null){
        if(cu == ""){
            alert("Vui lòng nhập mật khẩu hiện tại!");
            document.getElementById("txtOldPassword").focus();
            return false;
        }
        if(sha256(cu) != user.password_hash){
            o.innerHTML = "Mật khẩu hiện tại không đúng!";
            return false;
        }
        if(cu == moi){
            o.innerHTML = "Mật khẩu mới phải khác mật khẩu hiện tại!";
            return false;
        }
    }
    var loi = checkPasswordRule(moi);
    if(loi != ""){
        alert(loi);
        document.getElementById("txtNewPassword").focus();
        return false;
    }
    if(moi != nhapLai){
        alert("Mật khẩu nhập lại không khớp!");
        document.getElementById("txtConfirm").focus();
        return false;
    }

    var users = getTable("users");
    for(var i = 0; i < users.length; i++){
        if(users[i].id == user.id)
            users[i].password_hash = sha256(moi);
    }
    saveTable("users", users);
    document.getElementById("txtOldPassword").value = "";
    document.getElementById("txtNewPassword").value = "";
    document.getElementById("txtConfirm").value = "";
    alert("Cập nhật mật khẩu thành công!");
    showAccount();
    return false;
}

function doLogout(){
    if(confirm("Bạn có chắc muốn đăng xuất?"))
        logout();
}

// Kiểm tra mật khẩu ngay khi gõ: quy tắc đỏ/xanh + báo nhập lại đã khớp chưa
function checkPasswordLive(){
    showPasswordRules("txtNewPassword", "divPasswordRules");
    showConfirmMatch("txtNewPassword", "txtConfirm", "msgConfirm");
}
