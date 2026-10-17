/* =====================================================================
   ROOMCRAFT - Đăng nhập (login.html)
   Người phụ trách: Quỳnh Kha
   ===================================================================== */

function initPage(){
    renderHeader("");
    renderFooter();
    renderChatbot();
    renderGoogleButton();
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
    goAfterLogin();
    return false;
}

// Đăng nhập thành công: quay lại trang trước (nếu có), Admin vào trang quản trị
function goAfterLogin(){
    var trangCu = getParam("redirect");
    if(trangCu != "")
        window.location.href = trangCu;
    else if(isAdmin())
        window.location.href = "admin/index.html";
    else
        window.location.href = "index.html";
}

function showPassword(){
    var o = document.getElementById("txtPassword");
    if(document.getElementById("chkShow").checked)
        o.type = "text";
    else
        o.type = "password";
}

// ----- Đăng nhập bằng Google -----
// Thư viện Google tải không đồng bộ (async) nên có thể chưa sẵn sàng: chờ 0,3 giây rồi thử lại
var soLanChoGoogle = 0;
function renderGoogleButton(){
    if(typeof google == "undefined"){
        soLanChoGoogle = soLanChoGoogle + 1;
        if(soLanChoGoogle > 20){      // chờ quá 6 giây: không có mạng hoặc bị chặn
            document.getElementById("googleButton").innerHTML = "<p class='error-text'>Không tải được đăng nhập Google, kiểm tra kết nối mạng.</p>";
            return;
        }
        setTimeout(renderGoogleButton, 300);
        return;
    }
    var khung = document.getElementById("googleButton");
    var rong = khung.offsetWidth;     // nút Google rộng bằng khung (tối đa 400px)
    if(rong > 400)
        rong = 400;
    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin
    });
    google.accounts.id.renderButton(khung, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: "signin_with",
        locale: "vi",
        width: rong
    });
}

// Google gọi hàm này sau khi người dùng chọn tài khoản
function handleGoogleLogin(response){
    var loi = loginWithGoogle(response.credential);
    if(loi != ""){
        document.getElementById("msgError").innerHTML = loi;
        return;
    }
    goAfterLogin();
}
