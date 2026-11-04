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
    html += "      <p class='overline'>Kiến trúc, thủ công và sưu tầm</p>";
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
    // Monogram RoomCraft giữa cuối trang: chữ R và C (nét Cormorant Garamond, kéo cao) lồng vào nhau,
    // đứng trong một ô cửa vòm nét đôi như một căn phòng thu nhỏ, phía trên treo chiếc đèn vàng đồng.
    // Chỗ R và C giao nhau có một đường cắt mảnh (mask) nên đặt trên nền màu nào cũng được.
    var MONO_R = "M48.24 100Q46.79 100 43.41 93.95Q40.02 87.9 35.24 76.51Q30.45 65.13 24.56 49.36L32.29 45.54Q40.12 64.81 45.68 76.35Q51.24 87.9 55.54 92.99Q59.84 98.09 63.81 98.09Q64 98.09 64 99.04Q64 100 63.81 100Q57.72 100 53.9 100Q50.08 100 48.24 100ZM26.3 0Q34.71 0 39.3 5.49Q43.89 10.99 43.89 20.54Q43.89 29.62 40.75 36.78Q37.61 43.95 32.63 47.93Q27.65 51.91 21.95 51.91Q20.79 51.91 19.43 51.83Q18.08 51.75 17.02 51.59V87.1Q17.02 91.72 17.5 94.11Q17.98 96.5 19.58 97.29Q21.17 98.09 24.27 98.09Q24.56 98.09 24.56 99.04Q24.56 100 24.27 100Q21.85 100 18.85 99.84Q15.85 99.68 12.28 99.68Q8.89 99.68 5.8 99.84Q2.71 100 0.29 100Q0 100 0 99.04Q0 98.09 0.29 98.09Q3.48 98.09 5.03 97.29Q6.57 96.5 7.15 94.11Q7.73 91.72 7.73 87.1V13.38Q7.73 8.76 7.2 6.45Q6.67 4.14 5.12 3.26Q3.58 2.39 0.39 2.39Q0.19 2.39 0.19 1.43Q0.19 0.48 0.39 0.48Q2.8 0.48 5.85 0.72Q8.89 0.96 12.28 0.96Q15.37 0.96 19.24 0.48Q23.11 0 26.3 0ZM34.32 26.11Q34.32 16.88 33.02 11.86Q31.71 6.85 29.39 4.94Q27.07 3.03 23.98 3.03Q20.21 3.03 18.61 5.33Q17.02 7.64 17.02 13.69V47.29Q18.37 47.61 19.92 47.77Q21.46 47.93 22.62 47.93Q29.1 47.93 31.71 42.6Q34.32 37.26 34.32 26.11Z";
    var MONO_C = "M78.02 4Q81.6 4 84.92 4.52Q88.25 5.04 91.16 6Q94.07 6.96 96.42 8.59Q97.24 9.19 97.5 9.78Q97.75 10.37 97.85 12L99.08 31.56Q99.08 32 98.57 32.15Q98.06 32.3 97.85 31.7Q95.2 19.7 89.98 13.26Q84.77 6.81 76.9 6.81Q69.34 6.81 63.51 12.22Q57.68 17.63 54.41 27.63Q51.14 37.63 51.14 51.41Q51.14 61.48 53.13 69.93Q55.13 78.37 58.76 84.44Q62.39 90.52 67.19 93.85Q71.99 97.19 77.72 97.19Q85.38 97.19 90.29 91.41Q95.2 85.63 98.88 73.33Q98.98 72.89 99.49 73.04Q100 73.19 100 73.48L98.67 91.11Q98.57 92.89 98.31 93.41Q98.06 93.93 97.24 94.52Q92.23 97.48 87.43 98.74Q82.62 100 77.61 100Q66.68 100 58.19 94Q49.71 88 44.86 77.11Q40 66.22 40 52.15Q40 41.48 42.86 32.59Q45.72 23.7 50.89 17.33Q56.05 10.96 63 7.48Q69.95 4 78.02 4Z";
    html += "  <a class='footer-monogram' href='" + goc + "index.html' aria-label='RoomCraft - Trang chủ'>";
    html += "    <svg viewBox='-16 -2 172 176' aria-hidden='true'>";
    html += "      <mask id='rcKnock' maskUnits='userSpaceOnUse' x='-20' y='-20' width='200' height='220'>";
    html += "        <rect x='-20' y='-20' width='200' height='220' fill='#fff'/>";
    html += "        <path transform='translate(29 84) scale(0.82)' d='" + MONO_C + "' fill='#000' stroke='#000' stroke-width='3.2' stroke-linejoin='round'/>";
    html += "      </mask>";
    // ô cửa vòm nét đôi + sàn
    html += "      <g fill='none' stroke='currentColor'>";
    html += "        <path d='M0 170V70A70 70 0 0 1 140 70V170' stroke-width='1.1'/>";
    html += "        <path d='M5 170V70A65 65 0 0 1 135 70V170' stroke-width='0.45'/>";
    html += "        <path d='M-14 170H154' stroke-width='0.6'/>";
    html += "      </g>";
    // đèn thả
    html += "      <g class='mono-lamp' fill='#B08D57'>";
    html += "        <path d='M70 5V33' stroke='#B08D57' stroke-width='0.6'/>";
    html += "        <path d='M60.5 42a9.5 9.5 0 0 1 19 0z'/>";
    html += "        <circle cx='70' cy='45' r='1.7'/>";
    html += "      </g>";
    // chữ RC
    html += "      <g fill='currentColor' stroke='currentColor' stroke-width='0.5' stroke-linejoin='round'>";
    html += "        <g mask='url(#rcKnock)'><path transform='translate(29 84) scale(0.82)' d='" + MONO_R + "'/></g>";
    html += "        <path transform='translate(29 84) scale(0.82)' d='" + MONO_C + "'/>";
    html += "      </g>";
    html += "    </svg>";
    html += "  </a>";
    html += "  <div class='footer-bottom'>";
    html += "    <span>© " + new Date().getFullYear() + " ROOMCRAFT. All rights reserved.</span>";
    html += "    <span>Hà Nội, TP. Hồ Chí Minh, Đà Nẵng</span>";
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
