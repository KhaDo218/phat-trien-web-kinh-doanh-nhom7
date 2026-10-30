/* =====================================================================
   ROOMCRAFT - Đăng ký (register.html)
   Người phụ trách: Quỳnh Kha
   Bước 1: nhập thông tin -> kiểm tra -> tạo mã OTP (mô phỏng gửi email)
   Bước 2: nhập đúng mã -> tạo tài khoản (is_verified = true) -> tự đăng nhập
   ===================================================================== */

var thongTinDangKy = null;     // thông tin bước 1, chỉ lưu vào rc_users khi xác minh xong
var demGiay = 0;               // đếm ngược trước khi được gửi lại mã
var dongHo = null;

function initPage(){
    renderHeader("");
    renderFooter();
    renderChatbot();
    // đã đăng nhập thì không cần đăng ký
    if(isLoggedIn()){
        window.location.href = "account.html";
        return;
    }
    checkPasswordLive();
    document.getElementById("txtFullName").focus();
}

function checkRegisterForm(){
    var ten = document.getElementById("txtFullName").value;
    var email = document.getElementById("txtEmail").value.trim();
    var sdt = document.getElementById("txtPhone").value.trim();
    var matKhau = document.getElementById("txtPassword").value;
    var nhapLai = document.getElementById("txtConfirm").value;

    if(ten.trim() == ""){
        alert("Họ và tên không được bỏ trống!");
        document.getElementById("txtFullName").focus();
        return false;
    }
    if(checkEmail(email) == false){
        alert("Email không hợp lệ!");
        document.getElementById("txtEmail").focus();
        return false;
    }
    if(findUserByEmail(email) != null){
        alert("Email này đã được đăng ký, vui lòng đăng nhập!");
        document.getElementById("txtEmail").focus();
        return false;
    }
    if(checkPhone(sdt) == false){
        alert("Số điện thoại phải gồm 10 số và bắt đầu bằng số 0!");
        document.getElementById("txtPhone").focus();
        return false;
    }
    if(findUserByPhone(sdt) != null){
        alert("Số điện thoại này đã được sử dụng!");
        document.getElementById("txtPhone").focus();
        return false;
    }
    var loi = checkPasswordRule(matKhau);
    if(loi != ""){
        alert(loi);
        document.getElementById("txtPassword").focus();
        return false;
    }
    if(matKhau != nhapLai){
        alert("Mật khẩu nhập lại không khớp!");
        document.getElementById("txtConfirm").focus();
        return false;
    }
    if(document.getElementById("chkAgree").checked == false){
        alert("Bạn cần đồng ý với Điều khoản dịch vụ!");
        return false;
    }
    return true;
}

// Bước 1 -> Bước 2
function doRegister(){
    if(checkRegisterForm() == false)
        return false;
    thongTinDangKy = {
        full_name: document.getElementById("txtFullName").value.trim(),
        email: document.getElementById("txtEmail").value.trim().toLowerCase(),
        phone: document.getElementById("txtPhone").value.trim(),
        password: document.getElementById("txtPassword").value
    };
    sendCode();
    document.getElementById("step1").className = "hidden";
    document.getElementById("step2").className = "";
    document.getElementById("lblEmail").innerHTML = thongTinDangKy.email;
    document.getElementById("txtOtp").value = "";
    document.getElementById("txtOtp").focus();
    return false;
}

// Tạo mã mới, hiện trong khung "Email mô phỏng", 60 giây sau mới được gửi lại
function sendCode(){
    var ma = createVerificationCode(thongTinDangKy.email, "REGISTER");
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

function backToStep1(){
    clearInterval(dongHo);
    document.getElementById("step2").className = "hidden";
    document.getElementById("step1").className = "";
}

// Bước 2: kiểm tra mã, đúng thì tạo tài khoản
function doVerify(){
    var ma = document.getElementById("txtOtp").value;
    if(ma.trim() == ""){
        alert("Vui lòng nhập mã xác minh!");
        document.getElementById("txtOtp").focus();
        return false;
    }
    var loi = checkVerificationCode(thongTinDangKy.email, "REGISTER", ma);
    if(loi != ""){
        document.getElementById("msgOtpError").innerHTML = loi;
        return false;
    }

    var users = getTable("users");
    var user = {
        id: getNextId("users"),
        role_id: 1,
        full_name: thongTinDangKy.full_name,
        email: thongTinDangKy.email,
        phone: thongTinDangKy.phone,
        password_hash: sha256(thongTinDangKy.password),
        google_id: null,
        avatar_url: null,
        default_address: null,
        is_verified: true,
        is_active: true,
        created_at: new Date().toISOString()
    };
    users.push(user);
    saveTable("users", users);
    clearInterval(dongHo);

    login(user.email, thongTinDangKy.password);
    alert("Đăng ký thành công! Chào mừng " + user.full_name + " đến với RoomCraft.");
    window.location.href = "index.html";
    return false;
}

function showPassword(){
    var kieu = "password";
    if(document.getElementById("chkShow").checked)
        kieu = "text";
    document.getElementById("txtPassword").type = kieu;
    document.getElementById("txtConfirm").type = kieu;
}

// Kiểm tra mật khẩu ngay khi gõ: quy tắc đỏ/xanh + báo nhập lại đã khớp chưa
function checkPasswordLive(){
    showPasswordRules("txtPassword", "divPasswordRules");
    showConfirmMatch("txtPassword", "txtConfirm", "msgConfirm");
}
