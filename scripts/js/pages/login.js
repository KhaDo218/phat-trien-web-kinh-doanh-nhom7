/* =====================================================================
   ROOMCRAFT - Đăng nhập (login.html)
   Người phụ trách: Quỳnh Kha
   ===================================================================== */

function initPage(){
    renderHeader("");
    renderFooter();
    renderChatbot();
    document.getElementById("txtEmail").focus();
}

function checkLoginForm(){
    var email = document.getElementById("txtEmail").value;
    var matKhau = document.getElementById("txtPassword").value;
    if(email.trim() == ""){
        alert("Email không được bỏ trống!");
        document.getElementById("txtEmail").focus();
        return false;
    }
    if(checkEmail(email.trim()) == false){
        alert("Email không hợp lệ!");
        document.getElementById("txtEmail").focus();
        return false;
    }
    if(matKhau == ""){
        alert("Mật khẩu không được bỏ trống!");
        document.getElementById("txtPassword").focus();
        return false;
    }
    return true;
}

// Trả về false để form không gửi đi (trang tự xử lý bằng JavaScript)
function doLogin(){
    if(checkLoginForm() == false)
        return false;
    var email = document.getElementById("txtEmail").value;
    var matKhau = document.getElementById("txtPassword").value;
    var loi = login(email, matKhau);
    if(loi != ""){
        document.getElementById("msgError").innerHTML = loi;
        return false;
    }
    // Đăng nhập thành công: quay lại trang trước (nếu có), Admin vào trang quản trị
    var trangCu = getParam("redirect");
    if(trangCu != "")
        window.location.href = trangCu;
    else if(isAdmin())
        window.location.href = "admin/index.html";
    else
        window.location.href = "index.html";
    return false;
}

function showPassword(){
    var o = document.getElementById("txtPassword");
    if(document.getElementById("chkShow").checked)
        o.type = "text";
    else
        o.type = "password";
}

function loginGoogle(){
    alert("Chức năng đăng nhập Google sẽ được gắn khi có Google Client ID.");
}
