/* =====================================================================
   ROOMCRAFT - Quên mật khẩu (forgot-password.html)
   Người phụ trách: Quỳnh Kha
   Bước 1: nhập email -> tạo mã OTP (mô phỏng gửi email)
   Bước 2: nhập đúng mã
   Bước 3: đặt mật khẩu mới -> quay về trang đăng nhập
   ===================================================================== */

var emailCanDoi = "";       // email đang đặt lại mật khẩu
var daXacMinh = false;      // chỉ được sang bước 3 khi đã nhập đúng mã
var demGiay = 0;
var dongHo = null;

function initPage(){
    renderHeader("");
    renderFooter();
    renderChatbot();
    document.getElementById("txtEmail").focus();
}

// Ẩn hết các bước, chỉ hiện bước so
function showStep(so){
    for(var i = 1; i <= 3; i++)
        document.getElementById("step" + i).className = "hidden";
    document.getElementById("step" + so).className = "";
    if(so == 1)
        clearInterval(dongHo);
}

// Bước 1
function doSendCode(){
    var email = document.getElementById("txtEmail").value.trim();
    var o = document.getElementById("msgError");
    o.innerHTML = "";
    if(checkEmail(email) == false){
        alert("Email không hợp lệ!");
        document.getElementById("txtEmail").focus();
        return false;
    }
    var user = findUserByEmail(email);
    if(user == null){
        o.innerHTML = "Không tìm thấy tài khoản với email này!";
        return false;
    }
    if(user.is_active == false){
        o.innerHTML = "Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên!";
        return false;
    }
    emailCanDoi = user.email;
    daXacMinh = false;
    sendCode();
    document.getElementById("lblEmail").innerHTML = emailCanDoi;
    document.getElementById("txtOtp").value = "";
    showStep(2);
    document.getElementById("txtOtp").focus();
    return false;
}

function sendCode(){
    var ma = createVerificationCode(emailCanDoi, "RESET_PASSWORD");
    document.getElementById("lblOtp").innerHTML = ma;
    document.getElementById("msgOtpError").innerHTML = "";
    demGiay = 60;
    clearInterval(dongHo);
    dongHo = setInterval(countDown, 1000);
    countDown();
}

function countDown(){
    var link = document.getElementById("lnkResend");
    if(demGiay > 0){
        link.innerHTML = "Gửi lại mã sau " + demGiay + " giây";
        link.className = "disabled";
        demGiay = demGiay - 1;
    }
    else{
        link.innerHTML = "Gửi lại mã";
        link.className = "";
        clearInterval(dongHo);
    }
}

function resendCode(){
    if(demGiay > 0)
        return;
    sendCode();
}

// Bước 2
function doVerify(){
    var ma = document.getElementById("txtOtp").value;
    if(ma.trim() == ""){
        alert("Vui lòng nhập mã xác minh!");
        document.getElementById("txtOtp").focus();
        return false;
    }
    var loi = checkVerificationCode(emailCanDoi, "RESET_PASSWORD", ma);
    if(loi != ""){
        document.getElementById("msgOtpError").innerHTML = loi;
        return false;
    }
    daXacMinh = true;
    showStep(3);
    clearInterval(dongHo);
    document.getElementById("txtNewPassword").focus();
    return false;
}

// Bước 3
function doReset(){
    if(daXacMinh == false){
        showStep(1);
        return false;
    }
    var matKhau = document.getElementById("txtNewPassword").value;
    var nhapLai = document.getElementById("txtConfirm").value;
    var loi = checkPasswordRule(matKhau);
    if(loi != ""){
        alert(loi);
        document.getElementById("txtNewPassword").focus();
        return false;
    }
    if(matKhau != nhapLai){
        alert("Mật khẩu nhập lại không khớp!");
        document.getElementById("txtConfirm").focus();
        return false;
    }
    var users = getTable("users");
    for(var i = 0; i < users.length; i++){
        if(users[i].email == emailCanDoi)
            users[i].password_hash = sha256(matKhau);
    }
    saveTable("users", users);
    alert("Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.");
    window.location.href = "login.html";
    return false;
}

function showPassword(){
    var kieu = "password";
    if(document.getElementById("chkShow").checked)
        kieu = "text";
    document.getElementById("txtNewPassword").type = kieu;
    document.getElementById("txtConfirm").type = kieu;
}
