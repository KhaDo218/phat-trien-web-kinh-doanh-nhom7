/* =====================================================================
   ROOMCRAFT - footer.js (chân trang dùng chung)
   Người phụ trách: Quỳnh Kha
   Cách dùng: trong trang có <div id="footer"></div>, cuối trang gọi renderFooter();
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
    html += "          <li><a href='#'>Vận chuyển &amp; Giao hàng</a></li>";
    html += "          <li><a href='#'>Đổi trả &amp; Bảo hành</a></li>";
    html += "          <li><a href='#'>Hướng dẫn trải nghiệm 3D</a></li>";
    html += "          <li><a href='#'>Điều khoản dịch vụ</a></li>";
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
