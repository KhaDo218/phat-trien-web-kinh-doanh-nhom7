/* =====================================================================
   ROOMCRAFT - footer.js (chân trang dùng chung)
   Người phụ trách: Quỳnh Kha
   Cách dùng: trong trang có <div id="footer"></div>, cuối trang gọi renderFooter();
   Popup Điều khoản dịch vụ: gọi showTerms() hoặc showTerms("van-chuyen") để mở và cuộn
   tới đúng mục (mã mục xem trong mảng TERMS bên dưới). Đóng: nút X, nút dưới, bấm ra
   ngoài khung hoặc phím Esc.
   ===================================================================== */

function renderFooter(){
    var goc = getRoot() + "scripts/";
    var html = "";
    html += "<div class='container'>";
    html += "  <div class='footer-top'>";
    html += "    <div class='about'>";
    html += "      <a class='logo' href='" + goc + "index.html'>ROOMCRAFT</a>";
    html += "      <p>Nền tảng thương mại điện tử nội thất lấy không gian sống làm trung tâm.</p>";
    html += "      <p class='overline'>Kiến trúc • Thủ công • Sưu tầm</p>";
    html += "    </div>";
    html += "    <div class='columns'>";
    html += "      <div>";
    html += "        <h4>Khám phá</h4>";
    html += "        <ul>";
    html += "          <li><a href='" + goc + "products.html'>Sản phẩm</a></li>";
    html += "          <li><a href='" + goc + "rooms.html'>Không gian mẫu</a></li>";
    html += "          <li><a href='" + goc + "marketplace.html'>Đồ cũ</a></li>";
    html += "        </ul>";
    html += "      </div>";
    html += "      <div>";
    html += "        <h4>Hỗ trợ &amp; Chính sách</h4>";
    html += "        <ul>";
    html += "          <li><a href='javascript:showTerms(\"van-chuyen\")'>Vận chuyển &amp; Giao hàng</a></li>";
    html += "          <li><a href='javascript:showTerms(\"doi-tra\")'>Đổi trả &amp; Bảo hành</a></li>";
    html += "          <li><a href='javascript:showTerms(\"xem-3d\")'>Hướng dẫn trải nghiệm 3D</a></li>";
    html += "          <li><a href='javascript:showTerms()'>Điều khoản dịch vụ</a></li>";
    html += "        </ul>";
    html += "      </div>";
    html += "    </div>";
    html += "  </div>";
    html += "  <div class='footer-bottom'>";
    html += "    <span>© " + new Date().getFullYear() + " ROOMCRAFT. All rights reserved.</span>";
    html += "    <span>Hà Nội • TP. Hồ Chí Minh • Đà Nẵng</span>";
    html += "  </div>";
    html += "</div>";
    document.getElementById("footer").innerHTML = html;
}

/* ---------------------------------------------------------------------
   ĐIỀU KHOẢN DỊCH VỤ (hiện dạng popup)
   Mỗi mục: ma (để cuộn tới), tieuDe, noiDung (mảng các đoạn)
   --------------------------------------------------------------------- */
var TERMS_UPDATED = "29/10/2026";
var TERMS = [
    { ma: "gioi-thieu", tieuDe: "1. Giới thiệu và chấp nhận điều khoản", noiDung: [
        "RoomCraft là nền tảng thương mại điện tử nội thất lấy không gian sống làm trung tâm: bạn khám phá các căn phòng mẫu, xem từng món đồ trong phòng, xoay mô hình 3D và đặt mua trực tuyến.",
        "Khi truy cập, đăng ký tài khoản hoặc đặt hàng trên RoomCraft, bạn xác nhận đã đọc, hiểu và đồng ý với các điều khoản dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng website.",
        "Lưu ý: RoomCraft là đồ án môn học Phát triển Web Kinh doanh. Các bước gửi mã xác minh, thanh toán và giao hàng trên website đều là mô phỏng, không phát sinh giao dịch thật."
    ]},
    { ma: "tai-khoan", tieuDe: "2. Tài khoản người dùng", noiDung: [
        "Bạn có thể đăng ký bằng email (xác minh bằng mã OTP gồm 6 số, hiệu lực 5 phút) hoặc đăng nhập nhanh bằng tài khoản Google.",
        "Bạn chịu trách nhiệm cung cấp thông tin chính xác (họ tên, email, số điện thoại, địa chỉ) và tự bảo mật mật khẩu của mình. Mỗi email và mỗi số điện thoại chỉ được dùng cho một tài khoản.",
        "RoomCraft có quyền khóa tài khoản vi phạm điều khoản (gian lận đơn hàng, đánh giá sai sự thật, phá hoại hệ thống). Tài khoản bị khóa không thể đăng nhập cho tới khi được quản trị viên mở lại."
    ]},
    { ma: "san-pham", tieuDe: "3. Sản phẩm, giá và hình ảnh", noiDung: [
        "Giá sản phẩm được niêm yết bằng Việt Nam đồng (VND) và đã bao gồm thuế. Giá có thể thay đổi mà không báo trước, nhưng đơn đã đặt luôn giữ nguyên giá tại thời điểm đặt.",
        "Ảnh phòng mẫu, ảnh sản phẩm và mô hình 3D chỉ mang tính minh họa. Màu sắc thực tế có thể chênh lệch nhẹ do ánh sáng và màn hình hiển thị; kích thước chính xác xem ở mục Thông số của từng sản phẩm.",
        "Số lượng mỗi lần đặt không vượt quá số lượng còn trong kho. Sản phẩm hết hàng sẽ được ghi rõ và không thể thêm vào giỏ."
    ]},
    { ma: "xem-3d", tieuDe: "4. Trải nghiệm 3D và Shop the Room", noiDung: [
        "Ở trang chi tiết sản phẩm có nút Xem 3D: kéo chuột (hoặc vuốt trên điện thoại) để xoay, cuộn chuột (hoặc chụm hai ngón) để phóng to, thu nhỏ.",
        "Ở trang chi tiết không gian, bấm vào các chấm tròn trên ảnh phòng để xem thông tin món đồ và thêm vào giỏ hàng ngay.",
        "Mô hình 3D được dựng từ ảnh sản phẩm nhằm giúp bạn hình dung hình dáng và tỉ lệ; chi tiết vân gỗ, chất liệu vải có thể không giống hoàn toàn sản phẩm thật."
    ]},
    { ma: "dat-hang", tieuDe: "5. Đặt hàng và thanh toán", noiDung: [
        "Đơn hàng được ghi nhận khi bạn hoàn tất bước Thanh toán. Trạng thái đơn lần lượt là: Đã xác nhận, Đang đóng gói, Đang giao, Đã giao. Bạn theo dõi trạng thái tại mục Đơn hàng của tôi.",
        "Bạn có thể hủy đơn khi đơn chưa chuyển sang trạng thái Đang giao. Đơn đã hủy không thể khôi phục.",
        "Phương thức thanh toán: thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng, ví điện tử hoặc thẻ tín dụng / ghi nợ (mô phỏng).",
        "COD chỉ áp dụng cho đơn từ 10.000.000 ₫ trở xuống. Đơn trên 10.000.000 ₫ cần thanh toán trước toàn bộ hoặc đặt cọc 30% giá trị đơn, phần còn lại thanh toán khi nhận hàng. Khi hủy đơn, tiền đã trả trước hoặc tiền cọc được hoàn lại đầy đủ trong 3–5 ngày làm việc.",
        "Mã giảm giá áp dụng theo điều kiện riêng của từng mã (giá trị đơn tối thiểu, thời hạn). Mỗi đơn hàng chỉ dùng được một mã."
    ]},
    { ma: "van-chuyen", tieuDe: "6. Vận chuyển và giao hàng", noiDung: [
        "Đồ trang trí, gối, chăn ga, đèn, thảm, rèm: giao tiêu chuẩn 3–5 ngày, phí 35.000 ₫ nội thành TP. Hồ Chí Minh, Hà Nội, Đà Nẵng và 50.000 ₫ các tỉnh khác, miễn phí cho đơn từ 2.000.000 ₫. Giao nhanh 1–2 ngày phí 80.000 ₫, chỉ áp dụng nội thành.",
        "Nội thất cỡ lớn (sofa, giường, tủ, bàn ghế, kệ...): giao bằng xe tải và lắp đặt tận nơi trong 3–7 ngày, nhân viên gọi hẹn khung giờ trước khi giao. Phí 300.000 ₫ nội thành (miễn phí cho đơn từ 15.000.000 ₫), 600.000 ₫ tỉnh lân cận, 1.200.000 ₫ tỉnh xa. Đơn có cả nội thất lớn và đồ nhỏ được giao chung một chuyến.",
        "Nhà phố không có thang máy, giao từ tầng 3 trở lên có thể phát sinh phí khuân vác; nhân viên sẽ báo trước khi giao. Thời gian giao không tính Chủ nhật và ngày lễ.",
        "Vui lòng kiểm tra tình trạng kiện hàng khi nhận. Nếu sản phẩm bị móp, vỡ do vận chuyển, hãy chụp ảnh và báo cho RoomCraft trong vòng 48 giờ."
    ]},
    { ma: "doi-tra", tieuDe: "7. Đổi trả và bảo hành", noiDung: [
        "Sản phẩm mới được đổi trả trong 7 ngày kể từ khi nhận hàng nếu bị lỗi do nhà sản xuất, hư hỏng khi vận chuyển hoặc giao sai mẫu. Sản phẩm cần còn nguyên tem, nhãn và chưa qua sử dụng sai cách.",
        "Không áp dụng đổi trả với sản phẩm đã qua sử dụng gây hư hỏng, sản phẩm đặt theo yêu cầu riêng và đồ cũ đã ghi rõ tình trạng khi bán.",
        "Đồ nội thất mới được bảo hành 12 tháng đối với lỗi kết cấu (khung, chân, ray ngăn kéo). Bảo hành không áp dụng cho hư hỏng do va đập, ẩm ướt hoặc tự ý sửa chữa."
    ]},
    { ma: "do-cu", tieuDe: "8. Đồ cũ (Marketplace)", noiDung: [
        "Đồ cũ được phân loại theo tình trạng: Like New (gần như mới), Good (còn tốt, có dấu hiệu sử dụng nhẹ), Fair (dùng tốt, có vết xước hoặc phai màu thấy rõ).",
        "Tình trạng, thời gian đã sử dụng và ghi chú hư hao được mô tả kèm ảnh thật của từng món. Mỗi món đồ cũ thường chỉ có một chiếc; vui lòng đọc kỹ mô tả trước khi đặt."
    ]},
    { ma: "danh-gia", tieuDe: "9. Đánh giá sản phẩm", noiDung: [
        "Bạn chỉ có thể đánh giá sản phẩm thuộc đơn hàng đã giao thành công, mỗi sản phẩm một lần.",
        "Nội dung đánh giá cần trung thực, lịch sự, không chứa thông tin cá nhân, quảng cáo hay ngôn từ xúc phạm. RoomCraft có quyền ẩn hoặc xóa đánh giá vi phạm."
    ]},
    { ma: "bao-mat", tieuDe: "10. Quyền riêng tư và dữ liệu", noiDung: [
        "RoomCraft chỉ dùng thông tin của bạn để xử lý đơn hàng, giao hàng và hỗ trợ tài khoản; không bán hay chia sẻ cho bên thứ ba ngoài đơn vị vận chuyển.",
        "Mật khẩu được mã hóa một chiều trước khi lưu, RoomCraft không thể xem mật khẩu của bạn. Khi đăng nhập bằng Google, RoomCraft chỉ nhận họ tên, email và ảnh đại diện."
    ]},
    { ma: "so-huu", tieuDe: "11. Quyền sở hữu nội dung", noiDung: [
        "Giao diện, logo ROOMCRAFT, bố cục và nội dung biên soạn trên website thuộc về nhóm phát triển RoomCraft. Hình ảnh sản phẩm và phòng mẫu thuộc về các thương hiệu, nhà cung cấp tương ứng.",
        "Bạn không được sao chép, khai thác nội dung của website cho mục đích thương mại khi chưa được cho phép."
    ]},
    { ma: "thay-doi", tieuDe: "12. Thay đổi điều khoản và liên hệ", noiDung: [
        "RoomCraft có thể cập nhật điều khoản này; ngày cập nhật gần nhất được ghi ở đầu trang. Việc bạn tiếp tục sử dụng website sau khi cập nhật được hiểu là đồng ý với điều khoản mới.",
        "Mọi thắc mắc vui lòng liên hệ qua khung chat hỗ trợ ở góc phải màn hình hoặc tại các showroom RoomCraft ở Hà Nội, TP. Hồ Chí Minh và Đà Nẵng."
    ]}
];

// Tạo popup lần đầu (createElement), các lần sau chỉ hiện lại
function createTermsModal(){
    var nen = document.createElement("div");
    nen.id = "termsModal";
    nen.className = "modal hidden";
    nen.setAttribute("onclick", "if(event.target == this) closeTerms()");

    var html = "";
    html += "<div class='modal-box'>";
    html += "  <div class='modal-head'>";
    html += "    <div>";
    html += "      <p class='overline'>Cập nhật ngày " + TERMS_UPDATED + "</p>";
    html += "      <h2 class='headline-section'>Điều khoản dịch vụ</h2>";
    html += "    </div>";
    html += "    <button class='btn-icon' type='button' title='Đóng' onclick='closeTerms()'><span class='material-symbols-outlined'>close</span></button>";
    html += "  </div>";
    html += "  <div class='modal-body' id='termsBody'>";
    // mục lục
    html += "    <ul class='terms-toc'>";
    for(var i = 0; i < TERMS.length; i++)
        html += "  <li><a href='javascript:scrollTerms(\"" + TERMS[i].ma + "\")'>" + TERMS[i].tieuDe + "</a></li>";
    html += "    </ul>";
    // nội dung
    for(var i = 0; i < TERMS.length; i++){
        html += "  <section class='terms-section' id='terms-" + TERMS[i].ma + "'>";
        html += "    <h3 class='title-product'>" + TERMS[i].tieuDe + "</h3>";
        for(var j = 0; j < TERMS[i].noiDung.length; j++)
            html += "  <p>" + TERMS[i].noiDung[j] + "</p>";
        html += "  </section>";
    }
    html += "  </div>";
    html += "  <div class='modal-foot'>";
    html += "    <input class='btn' type='button' id='btnTermsOk' value='Đã hiểu' onclick='acceptTerms()'>";
    html += "  </div>";
    html += "</div>";
    nen.innerHTML = html;
    document.body.appendChild(nen);
}

function showTerms(maMuc){
    if(document.getElementById("termsModal") == null)
        createTermsModal();
    // mở từ trang Đăng ký (có ô "Tôi đồng ý") thì nút dưới thành "Tôi đồng ý"
    var nut = document.getElementById("btnTermsOk");
    if(document.getElementById("chkAgree") != null)
        nut.value = "Tôi đồng ý";
    else
        nut.value = "Đã hiểu";

    document.getElementById("termsModal").className = "modal";
    document.body.style.overflow = "hidden";        // khóa cuộn trang phía sau
    document.onkeydown = function(e){
        if(e.keyCode == 27)
            closeTerms();
    };
    if(maMuc != null)
        scrollTerms(maMuc);
    else
        document.getElementById("termsBody").scrollTop = 0;
}

function scrollTerms(maMuc){
    var muc = document.getElementById("terms-" + maMuc);
    var body = document.getElementById("termsBody");
    if(muc != null)
        body.scrollTop = muc.offsetTop - 8;     // .modal-body có position: relative nên offsetTop tính từ khung cuộn
}

function closeTerms(){
    document.getElementById("termsModal").className = "modal hidden";
    document.body.style.overflow = "";
    document.onkeydown = null;
}

function acceptTerms(){
    var o = document.getElementById("chkAgree");
    if(o != null)
        o.checked = true;
    closeTerms();
}
