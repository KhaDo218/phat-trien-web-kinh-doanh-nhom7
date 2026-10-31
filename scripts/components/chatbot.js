/* =====================================================================
   ROOMCRAFT - chatbot.js (Trợ lý tư vấn nội thất AI RoomCraft)
   Người phụ trách: Như Huyền
   Nhiệm vụ:
     - Giữ nguyên 100% giao diện, màu sắc, font chữ và các câu hỏi gợi ý.
     - Đọc dữ liệu thật trong data/json (products, categories, styles, coupons,
       shipping_methods, chatbot_faqs) để trả lời giá, tồn kho, phong cách,
       phí giao, mã giảm giá... nên không bịa số liệu.
     - Câu hỏi khó / hỏi lạ mới gọi API trợ lý ở localhost:3000 (server.js hoặc
       server.py); câu trả lời của API phải qua chatCheckAiReply() mới được hiện.
     - Không bật backend thì vẫn trả lời được ngay bằng dữ liệu trong máy.
     - Duy trì ngữ cảnh hội thoại để hiểu "còn mẫu khác không?", "cái nào rẻ hơn?".
   ===================================================================== */

var chatbotIsOpen = false;
var chatSessionHistory = []; // Lưu ngữ cảnh hội thoại trong phiên
var chatLastRelaxed = null;  // Ghi lại các điều kiện đã nới (màu/ chất liệu/ ngân sách) cho API

function renderChatbot(){
    if(document.getElementById("rcChatbotWrapper"))
        return;

    var wrapper = document.createElement("div");
    wrapper.id = "rcChatbotWrapper";

    var html = "";
    // Nút mở chat nổi ở góc phải dưới
    html += "<button id='rcChatToggleBtn' class='rc-chat-toggle-btn' onclick='toggleChatbot()' title='Trò chuyện với RoomCraft' aria-label='Mở khung chat'>"
          + "  <span class='material-symbols-outlined rc-icon-chat'>chat_bubble</span>"
          + "  <span class='material-symbols-outlined rc-icon-close' style='display:none;'>close</span>"
          + "  <span class='rc-chat-badge' id='rcChatBadge'>1</span>"
          + "</button>";

    html += "<div id='rcChatBox' class='rc-chat-box rc-chat-hidden'>"
          + "  <div class='rc-chat-header'>"
          + "    <div class='rc-chat-header-info'>"
          + "      <div class='rc-chat-avatar'><span class='material-symbols-outlined'>support_agent</span></div>"
          + "      <div>"
          + "        <h4 class='rc-chat-title'>Trợ lý ảo RoomCraft</h4>"
          + "        <p class='rc-chat-status'><span class='rc-status-dot'></span>Trực tuyến • Sẵn sàng hỗ trợ</p>"
          + "      </div>"
          + "    </div>"
          + "    <div style='display:flex;gap:4px;align-items:center;'>"
          + "      <button class='rc-chat-close-btn' onclick='chatXoaLuu()' title='Xóa hội thoại' aria-label='Xóa hội thoại'>"
          + "        <span class='material-symbols-outlined'>delete</span>"
          + "      </button>"
          + "      <button class='rc-chat-close-btn' onclick='toggleChatbot()' title='Đóng' aria-label='Đóng khung chat'>"
          + "        <span class='material-symbols-outlined'>close</span>"
          + "      </button>"
          + "    </div>"
          + "  </div>"

          + "  <div class='rc-chat-messages' id='rcChatMessages'>"
          + "    <div class='rc-msg rc-msg-bot'>"
          + "      <div class='rc-msg-bubble'>"
          + "        <p>Xin chào! Mình là <strong>Trợ lý RoomCraft</strong>. Mình có thể giải đáp thông tin về sản phẩm, phong cách nội thất, xem 3D, chính sách vận chuyển, đổi trả và đồ cũ tuyển chọn Marketplace.</p>"
          + "        <p style='margin-top:8px;'>Bạn cần hỗ trợ điều gì hôm nay?</p>"
          + "      </div>"
          + "      <span class='rc-msg-time'>Bây giờ</span>"
          + "    </div>"
          + "    <div class='rc-chat-suggestions' id='rcQuickTopics'>"
          + "      <span class='rc-suggestion-chip' onclick='handleQuickTopic(\"Sản phẩm & Mô hình 3D\")'>🛋️ Sản phẩm & 3D</span>"
          + "      <span class='rc-suggestion-chip' onclick='handleQuickTopic(\"Đồ cũ Marketplace\")'>♻️ Đồ cũ Marketplace</span>"
          + "      <span class='rc-suggestion-chip' onclick='handleQuickTopic(\"Tư vấn phong cách\")'>🎨 Tư vấn phong cách</span>"
          + "      <span class='rc-suggestion-chip' onclick='handleQuickTopic(\"Vận chuyển & Lắp đặt\")'>🚚 Vận chuyển & Giao hàng</span>"
          + "      <span class='rc-suggestion-chip' onclick='handleQuickTopic(\"Chính sách đổi trả\")'>🔄 Đổi trả & Hoàn tiền</span>"
          + "      <span class='rc-suggestion-chip' onclick='handleQuickTopic(\"Phương thức thanh toán\")'>💳 Thanh toán & Hóa đơn</span>"
          + "    </div>"
          + "  </div>"

          + "  <div class='rc-chat-footer'>"
          + "    <input type='text' id='rcTxtChatInput' class='rc-chat-input' placeholder='Nhập câu hỏi của bạn...' onkeydown='onChatInputKeyDown(event)'>"
          + "    <button class='rc-chat-send-btn' onclick='sendChatMessage()' title='Gửi' aria-label='Gửi tin nhắn'>"
          + "      <span class='material-symbols-outlined'>send</span>"
          + "    </button>"
          + "  </div>"
          + "</div>";

    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
}

// ============ LƯU LỊCH SỬ CHAT (localStorage) ============
// Đóng chat mở lại vẫn còn hội thoại; tối đa 40 tin để không phình localStorage.
// Dạng lưu: [{ sender: "user"|"bot", text, ids: [mã SP] }] — ids để vẽ lại thẻ SP.
var CHAT_LUU_KEY = "rc_chat_history";
var CHAT_LUU_MAX = 40;

function chatDocLuu(){
    try{
        var s = getObject(CHAT_LUU_KEY);
        return (s != null && s.length != null) ? s : [];
    }catch(e){ return []; }
}

function chatGhiLuu(tin){
    var ds = chatDocLuu();
    ds.push(tin);
    while(ds.length > CHAT_LUU_MAX) ds.shift();   // quá 40 tin -> bỏ tin cũ nhất
    saveObject(CHAT_LUU_KEY, ds);
}

function chatXoaLuu(){
    saveObject(CHAT_LUU_KEY, []);
    var container = document.getElementById("rcChatMessages");
    if(!container) return;
    // Xóa hết tin nhắn rồi vẽ lại lời chào
    container.innerHTML = "";
    var chao = document.createElement("div");
    chao.className = "rc-msg rc-msg-bot";
    chao.innerHTML = "<div class='rc-msg-bubble'>"
        + "<p>Đã xóa hội thoại. Xin chào! Mình là <strong>Trợ lý RoomCraft</strong>, "
        + "mình có thể giúp gì cho bạn?</p>"
        + "</div><span class='rc-msg-time'>Bây giờ</span>";
    container.appendChild(chao);
}

// Vẽ lại lịch sử đã lưu khi mở chat (chỉ khi khung còn trống)
function chatVeLaiLuu(){
    var container = document.getElementById("rcChatMessages");
    if(!container || container.children.length > 1) return;   // đã có tin -> không vẽ
    var ds = chatDocLuu();
    for(var i = 0; i < ds.length; i++){
        var sp = [];
        for(var j = 0; j < (ds[i].ids || []).length; j++){
            var idx = chatBuildIndex();
            if(idx.byId[ds[i].ids[j]] != null) sp.push(idx.byId[ds[i].ids[j]]);
        }
        appendMessage(ds[i].text, ds[i].sender, { products: sp, chips: [] });
    }
}

function toggleChatbot(){
    var box = document.getElementById("rcChatBox");
    var toggleBtn = document.getElementById("rcChatToggleBtn");
    var iconChat = toggleBtn.querySelector(".rc-icon-chat");
    var iconClose = toggleBtn.querySelector(".rc-icon-close");
    var badge = document.getElementById("rcChatBadge");

    chatbotIsOpen = !chatbotIsOpen;
    if(chatbotIsOpen){
        box.classList.remove("rc-chat-hidden");
        iconChat.style.display = "none";
        iconClose.style.display = "inline-block";
        if(badge) badge.style.display = "none";
        chatVeLaiLuu();   // đóng mở lại vẫn còn hội thoại cũ
        setTimeout(function(){
            var inp = document.getElementById("rcTxtChatInput");
            if(inp) inp.focus();
        }, 150);
    } else {
        box.classList.add("rc-chat-hidden");
        iconChat.style.display = "inline-block";
        iconClose.style.display = "none";
    }
}

function onChatInputKeyDown(e){
    if(e.key === "Enter" || e.keyCode === 13){
        e.preventDefault();
        sendChatMessage();
    }
}

var chatDangXuLy = false;   // đang chờ trả lời -> bỏ qua tin gửi thêm (chống spam Enter)

function sendChatMessage(){
    var input = document.getElementById("rcTxtChatInput");
    var question = (input.value || "").trim();
    if(question == "") return;
    if(chatDangXuLy) return;   // chưa xong câu trước -> bỏ qua, tránh gửi trùng

    appendMessage(question, "user");
    input.value = "";
    chatDangXuLy = true;
    chatGhiLuu({ sender: "user", text: question, ids: [] });   // lưu lịch sử chat

    // Ghi nhận vào lịch sử hội thoại trong phiên
    chatSessionHistory.push({ role: "user", content: question });

    showTypingIndicator();

    // chatReply() tra dữ liệu thật trước, chỉ gọi API khi câu hỏi khó.
    // Bọc try/catch: lỗi bất kỳ (dữ liệu hỏng, biến null...) cũng phải trả lời
    // được, nếu không dấu "..." quay mãi mãi và khách không biết bị sao.
    try{
        chatReply(question, function(answer){
            removeTypingIndicator();
            appendMessage(answer.text, "bot", { products: answer.products, chips: answer.chips });
            chatSessionHistory.push({ role: "model", content: answer.text });
            // Lưu vào lịch sử (kèm mã SP để vẽ lại thẻ sau khi đóng/ mở chat)
            var ids = [];
            for(var i = 0; i < (answer.products || []).length; i++) ids.push(answer.products[i].id);
            chatGhiLuu({ sender: "bot", text: answer.text, ids: ids });
            chatDangXuLy = false;
        });
    } catch(e){
        removeTypingIndicator();
        appendMessage("Xin lỗi bạn, mình gặp sự cố khi xử lý câu này. "
            + "Bạn thử hỏi lại theo cách khác nhé (vd: \"sofa dưới 10 triệu\")!", "bot", { chips: chatSuggestChips() });
        chatDangXuLy = false;
    }
}

function handleQuickTopic(topicText){
    var input = document.getElementById("rcTxtChatInput");
    input.value = topicText;
    sendChatMessage();
}

/* =====================================================================
   LÕI TRA CỨU DỮ LIỆU + GỌI API CHO CÂU HỎI KHÓ
   - Giá, tồn kho, phí giao, mã giảm giá đều đọc từ data/json nên không bịa.
   - Chỉ câu hỏi không khớp dữ liệu hoặc cần tư vấn sâu mới gọi API ở cổng 3000.
   ===================================================================== */

var CHAT_API_URL = "http://localhost:3000/api/chat";
var chatApiState = null;      // null: chưa thử, true: dùng được, false: tắt cho cả phiên
var chatIndex = null;         // dữ liệu đã chuẩn hóa, dựng ở tin nhắn đầu cho khỏi chậm trang
var chatLastContext = null;   // ngữ cảnh câu trước, để hiểu "còn mẫu khác không?"
var chatShownIds = [];        // mã sản phẩm đã gợi ý, để "xem thêm" không lặp lại

// Khách gõ kiểu nào cũng quy về từ dùng trong dữ liệu (chạy trên chuỗi đã bỏ dấu)
var CHAT_SYNONYMS = [
    ["so pha", "sofa"], ["ghe dai", "sofa"], ["couch", "sofa"],
    ["ban khach", "ban tra"], ["ban salon", "ban tra"],
    ["ban van phong", "ban lam viec"], ["ban hoc", "ban lam viec"],
    ["tu ao", "tu quan ao"], ["wardrobe", "tu quan ao"], ["tu day", "tu quan ao"],
    ["tab dau giuong", "tu dau giuong"], ["tu canh giuong", "tu dau giuong"],
    ["gia sach", "ke sach"], ["ghe quay", "ghe bar"],
    ["den doc sach", "den cay"], ["den ngu", "den ban"],
    ["rem von", "rem cua"],
    ["second hand", "do cu"], ["secondhand", "do cu"], ["used", "do cu"],
    ["bao nhieu tien", "gia"], ["may tien", "gia"],
    // Lỗi chính tả thường gặp của "minimalism" -> tối giản
    ["minimailism", "toi gian"], ["minimalism", "toi gian"], ["minimalist", "toi gian"],
    ["japandi", "toi gian"],
    // Teencode / viết tắt thường gặp khi chat (thay nguyên từ nên không nhiễu)
    ["ko", "khong"], ["hok", "khong"], ["hem", "khong"], ["k", "khong"],
    ["dc", "duoc"], ["vs", "voi"], ["ib", "lien he"], ["mn", "minh"],
    ["cx", "cung"], ["r", "roi"], ["j", "gi"], ["z", "vay"], ["nt", "tin nhan"],
    ["bn", "bao nhieu"], ["tks", "cam on"], ["tkx", "cam on"], ["sp", "san pham"],
    ["sdt", "so dien thoai"], ["bh", "bao hanh"], ["dt", "dien thoai"],
    ["hong", "khong"], ["koaw", "khong"]
];

// Cụm từ chỉ loại sản phẩm -> mã danh mục (categories.json).
// Chỉ dùng cụm đủ rõ, tránh từ ngắn dễ nhiễu như "tu", "den", "goi", "tham".
var CHAT_CATEGORY_PHRASES = [
    ["ghe don", 5], ["ghe thu gian", 5], ["ghe banh", 5], ["armchair", 5],
    ["ban tra", 6], ["ban phu", 6], ["ban dau giuong", 6], ["ban uong nuoc", 6], ["ban console", 6],
    ["ban an", 7], ["ghe an", 7], ["ban bar", 7], ["ghe bar", 7], ["ban bep", 7],
    ["sofa goc", 8], ["sofa giuong", 8], ["sofa", 8],
    ["giuong ngu", 9], ["tu dau giuong", 9], ["dau giuong", 9],
    ["tu quan ao", 10], ["tu luu tru", 10], ["ke sach", 10], ["ke treo tuong", 10],
    ["tu bep", 10], ["tu trang diem", 10],
    ["ke tivi", 11], ["tu tivi", 11], ["tu buffet", 11], ["sideboard", 11], ["tu chen", 11],
    ["ban lam viec", 12], ["ban may tinh", 12],
    ["noi that ngoai troi", 13], ["do ngoai troi", 13], ["ban ghe ngoai troi", 13],
    ["do trang tri", 14], ["khay", 14], ["gio dan", 14], ["gio dung", 14], ["bat gom", 14],
    ["binh hoa", 15], ["lo hoa", 15], ["binh gom", 15], ["chau cay", 15], ["cay canh", 15],
    ["cay nhan tao", 15],
    ["tranh treo tuong", 16], ["tranh", 16], ["guong", 16], ["khung anh", 16],
    ["goi tua", 17], ["vo goi", 17], ["goi sofa", 17], ["goi trang tri", 17],
    ["den ban", 18], ["den cay", 18], ["den chum", 18], ["den tha", 18], ["den trang tri", 18],
    ["den op tran", 18], ["den roi tranh", 18],
    ["tham trai", 19], ["tham long", 19], ["tham trang tri", 19], ["tham phong khach", 19],
    ["quat tran", 18], ["quat", 18],
    ["chan phu", 21], ["chan mong", 21],
    ["vo chan", 22],
    ["ga giuong", 23], ["bo ga", 23],
    ["chan chan bong", 24], ["chan bong", 24],
    ["khan tam", 25], ["khan tay", 25],
    ["ao goi", 26],
    ["rem cua", 28], ["thanh rem", 28]
];

// Màu: mỗi từ khóa có thể quy về NHIỀU nhóm màu (vd. "xanh" = lá hoặc dương),
// chấm điểm theo kiểu "cả hai đều đạt" để không phải chọn sai một nhóm.
// coDau: từ còn dấu dò trên câu gốc — tránh nhầm đèn/đen, cẩm/cam, trang/trắng.
var CHAT_COLORS = [
    { words: ["hong dat", "hong phan", "hong", "pastel"], groups: ["Hồng, đỏ & cam"], label: "hồng",
      coDau: ["hồng", "hồng đất", "hồng phấn", "pastel"] },
    { words: ["do ruou", "burgundy", "do don"], groups: ["Hồng, đỏ & cam"], label: "đỏ",
      coDau: ["đỏ rượu", "đỏ đô", "burgundy", "đỏ đậm"] },
    { words: ["cam chay", "cam dat", "cam"], groups: ["Hồng, đỏ & cam"], label: "cam",
      coDau: ["cam cháy", "cam đất", "cam"] },
    { words: ["trang sua", "trang nga", "trang", "ivory"], groups: ["Trắng & kem"], label: "trắng",
      coDau: ["trắng sữa", "trắng ngà", "trắng", "ivory"] },
    { words: ["kem sua", "kem"], groups: ["Trắng & kem"], label: "kem",
      coDau: ["kem sữa", "kem"] },
    { words: ["den nham", "den"], groups: ["Đen"], label: "đen",
      coDau: ["đen nhám", "đen"] },
    { words: ["xam khoi", "xam nhat", "xam", "ghi"], groups: ["Xám"], label: "xám",
      coDau: ["xám khói", "xám nhạt", "xám", "ghi"] },
    { words: ["nau bo", "nau dat", "nau", "cognac", "walnut", "oc cho"], groups: ["Be & nâu"], label: "nâu",
      coDau: ["nâu bò", "nâu đất", "nâu", "cognac", "walnut", "óc chó"] },
    { words: ["be cat", "beige"], groups: ["Be & nâu"], label: "be",
      coDau: ["be cát", "beige", "be"] },
    { words: ["xanh reu", "xanh oliu", "xanh co vit", "xanh ngoc", "xanh la"], groups: ["Xanh lá"], label: "xanh lá",
      coDau: ["xanh rêu", "xanh oliu", "xanh cổ vịt", "xanh ngọc", "xanh lá"] },
    { words: ["xanh navy", "xanh bien", "xanh duong", "navy"], groups: ["Xanh dương"], label: "xanh dương",
      coDau: ["xanh navy", "xanh biển", "xanh dương", "navy"] },
    { words: ["vang dong", "vang", "dong thau", "gold"], groups: ["Vàng & đồng"], label: "vàng",
      coDau: ["vàng đồng", "vàng", "đồng thau", "gold"] },
    // "xanh" chung chung: khách có thể ý lá hoặc dương
    { words: ["xanh"], groups: ["Xanh lá", "Xanh dương"], label: "xanh",
      coDau: ["xanh"] }
];

// Cụm từ "đối tượng": loại đồ đi kèm chất liệu (vd. "bàn đá" = bàn + đá cẩm thạch).
// Đây là chỗ câu "bàn đá màu xanh" trước đây bị mất danh mục.
var CHAT_OBJECT_PHRASES = [
    { phrases: ["ban da", "ban tra da", "mat da"], catIds: [6], matGroup: "Đá & bê tông", label: "bàn đá" },
    { phrases: ["ban go"], catIds: [6, 7], matGroup: "Gỗ", label: "bàn gỗ" },
    { phrases: ["ban tra kinh", "ban kinh", "ban mat kinh", "mat kinh"], catIds: [6], matGroup: "Thủy tinh", label: "bàn mặt kính", vatLieuHien: "thủy tinh/ kính" },
    { phrases: ["ban lam viec kinh"], catIds: [12], matGroup: "Thủy tinh", label: "bàn làm việc kính", vatLieuHien: "thủy tinh/ kính" },
    { phrases: ["ban may tinh", "ban lam viec"], catIds: [12], matGroup: null, label: "bàn làm việc" },
    { phrases: ["ban may"], catIds: [6], matGroup: "Kim loại", label: "bàn kim loại" },
    { phrases: ["sofa da", "ghe da"], catIds: [8], matGroup: "Da", label: "sofa/ ghế da" },
    { phrases: ["goi sofa", "goi tua sofa"], catIds: [17], matGroup: null, label: "gối sofa" },
    { phrases: ["sofa vai", "sofa ni"], catIds: [8], matGroup: "Vải & sợi", label: "sofa vải" },
    { phrases: ["ban an go"], catIds: [7], matGroup: "Gỗ", label: "bàn ăn gỗ" },
    { phrases: ["giuong go"], catIds: [9], matGroup: "Gỗ", label: "giường gỗ" },
    { phrases: ["tu go"], catIds: [10, 11], matGroup: "Gỗ", label: "tủ gỗ" },
    { phrases: ["ban be tong"], catIds: [6], matGroup: "Đá & bê tông", label: "bàn bê tông" },
    { phrases: ["ke may", "ke sat"], catIds: [10, 11], matGroup: "Kim loại", label: "kệ kim loại" },
    { phrases: ["den go"], catIds: [18], matGroup: "Gỗ", label: "đèn gỗ" },
    { phrases: ["binh gom", "lo gom"], catIds: [15], matGroup: "Gốm sứ", label: "bình gốm" }
];

// Chất liệu: khớp material_group. Từ ngắn ("da", "go") phải đi cùng từ rõ nghĩa.
// coDau: từ còn dấu dò trên câu gốc, tránh nhầm "da" trong "đá" khi bỏ dấu trùng nhau.
var CHAT_MATERIALS = [
    { words: ["go soi", "go oc cho", "go xoai", "go teak", "go tu nhien", "go cong nghiep"], group: "Gỗ", keyword: "gỗ",
      coDau: ["gỗ sồi", "gỗ óc chó", "gỗ xoài", "gỗ teak", "gỗ tự nhiên", "gỗ công nghiệp", "gỗ"] },
    { words: ["may tre", "coi", "jute", "rattan", "may dan"], group: "Mây, tre, cói", keyword: "mây",
      coDau: ["mây tre", "mây đan", "cói", "jute", "rattan"] },
    { words: ["gom su", "dat nung", "gom", "ceramic"], group: "Gốm sứ", keyword: "gốm",
      coDau: ["gốm sứ", "đất nung", "gốm", "ceramic"] },
    { words: ["thuy tinh", "pha le", "glass"], group: "Thủy tinh", keyword: "thủy tinh",
      coDau: ["thủy tinh", "pha lê", "glass", "kính"] },
    { words: ["kim loai", "thep", "nhom", "sat"], group: "Kim loại", keyword: "kim loại",
      coDau: ["kim loại", "thép", "nhôm", "sắt"] },
    { words: ["da cam thach", "marble", "be tong", "travertine", "da nhan tao", "da tu nhien"], group: "Đá & bê tông", keyword: "đá",
      coDau: ["đá cẩm thạch", "marble", "bê tông", "travertine", "đá nhân tạo", "đá tự nhiên", "đá"] },
    { words: ["vai lanh", "ni", "nhung", "cotton", "lanh", "boucle", "chenille"], group: "Vải & sợi", keyword: "vải",
      coDau: ["vải lanh", "nỉ", "nhung", "cotton", "linen", "bouclé", "chenille"] },
    { words: ["da bo", "da that", "da pu", "da nubuck", "leather"], group: "Da", keyword: "da",
      coDau: ["da bò", "da thật", "da pu", "da nubuck", "leather", "da"] }
];

// Phong cách: tên trong styles.json + cách gọi tiếng Việt
var CHAT_STYLES = [
    { words: ["bohemian", "boho"], id: 1 },
    { words: ["coastal", "ven bien"], id: 2 },
    { words: ["farmhouse", "nha vuon"], id: 3 },
    { words: ["glam"], id: 4 },
    { words: ["mid century", "midcentury", "hoai co"], id: 5 },
    { words: ["scandinavian", "bac au", "toi gian", "minimalism", "minimalist"], id: 6 },
    { words: ["traditional", "co dien", "truyen thong"], id: 7 }
];

// Loại phòng + danh mục nên ưu tiên (boost) / né (avoid) theo loại phòng —
// GỘP MỘT BẢNG: label dùng làm khóa chung cho CHAT_ROOMS và CHAT_ROOM_CATS,
// hết lệch chuỗi tiếng Việt giữa 2 bảng (sai 1 dấu là hỏng âm thầm).
// boost: danh mục cốt lõi đứng đầu (điểm cộng giảm dần theo vị trí).
var CHAT_ROOMS = [
    { words: ["phong khach"], label: "phòng khách",
      boost: [8, 8, 6, 11, 5, 19, 16, 18, 14, 15], avoid: [9, 25, 26] },
    { words: ["phong ngu"], label: "phòng ngủ",
      boost: [9, 9, 9, 10, 12], avoid: [7, 6, 11, 13] },
    { words: ["phong an", "nha bep"], label: "phòng ăn",
      boost: [7, 7, 11, 13, 14], avoid: [9, 8] },
    { words: ["phong lam viec", "goc lam viec"], label: "phòng làm việc",
      boost: [12, 12, 10, 18, 5, 6, 16], avoid: [9, 7] },
    { words: ["ban cong", "san vuon", "ngoai troi"], label: "ban công, sân vườn",
      boost: [13, 13, 14, 15], avoid: [9, 23, 25, 26] },
    { words: ["phong be", "phong tre"], label: "phòng trẻ em",
      boost: [10, 17, 15, 9], avoid: [] },
    // Không gian kinh doanh / công cộng
    { words: ["quan cafe", "quan an", "nha hang", "cafe", "restaurant", "coffee", "tra sua"], label: "quán cafe, nhà hàng",
      boost: [7, 7, 18, 6, 11, 5, 14, 15, 16], avoid: [9, 10, 23, 25, 26] },
    { words: ["cua hang", "shop", "showroom"], label: "cửa hàng",
      boost: [7, 11, 6, 18, 14, 15, 19], avoid: [9, 23, 25, 26] },
    { words: ["van phong", "cong ty", "office"], label: "văn phòng, công ty",
      boost: [12, 12, 10, 18, 5, 6, 8], avoid: [9, 23, 25, 26, 22] },
    { words: ["khach san", "homestay", "resort"], label: "khách sạn, homestay",
      boost: [9, 9, 6, 18, 11, 14, 15], avoid: [7, 25] }
];

// Tra nhanh cấu hình boost/avoid theo label phòng (CHAT_ROOM_CATS cũ)
function chatPhongCachCua(label){
    for(var i = 0; i < CHAT_ROOMS.length; i++){
        if(CHAT_ROOMS[i].label == label) return CHAT_ROOMS[i];
    }
    return null;
}

// Cụm nhập nhằng khi bỏ dấu: không cho dò màu/ chất liệu bên trong các cụm này.
// Vd. "cẩm thạch" chứa "cam", "trang trí" chứa "trang", "kinh doanh" chứa "kính".
var CHAT_NHAM_TU = ["cẩm thạch", "trang trí", "kinh doanh", "kính lõm", "đèn năng lượng"];

// Che các cụm nhập nhằng trong câu (dùng trước khi dò bảng không dấu)
function chatCheCumNhapNhang(cauCoDau){
    var s = " " + chatLower(cauCoDau) + " ";
    for(var i = 0; i < CHAT_NHAM_TU.length; i++){
        var cum = CHAT_NHAM_TU[i];
        s = s.split(" " + cum + " ").join(" " + cum.replace(/[a-zà-ỹăâđêôơư ]/gi, "#") + " ");
    }
    return s;
}

// Sửa lỗi gõ (typo) bằng khoảng cách Levenshtein trên từ điển đóng dựng tự động
// từ các bảng sẵn có (danh mục, đối tượng, màu, chất liệu, phong cách, phòng, đồng nghĩa).
// Chỉ sửa từ >=4 ký tự; từ 4-7 ký tự cho sai <=1, từ >=8 cho sai <=2;
// và chỉ chấp nhận khi ứng viên tốt nhất hơn hẳn ứng viên nhì (tránh sửa bừa).
var chatTuDien = null;
function chatDungTuDien(){
    if(chatTuDien != null) return chatTuDien;
    var tu = [];
    function them(w){
        if(w.length < 3) return;               // từ quá ngắn không đưa vào từ điển
        if(/[0-9]/.test(w)) return;            // từ chứa số (vd "500k") không sửa
        for(var i = 0; i < tu.length; i++) if(tu[i] == w) return;
        tu.push(w);
    }
    for(var i = 0; i < CHAT_CATEGORY_PHRASES.length; i++){
        var ct1 = CHAT_CATEGORY_PHRASES[i][0].split(" ");
        for(var j = 0; j < ct1.length; j++) them(ct1[j]);
    }
    for(var o = 0; o < CHAT_OBJECT_PHRASES.length; o++){
        for(var p = 0; p < CHAT_OBJECT_PHRASES[o].phrases.length; p++){
            var ct2 = CHAT_OBJECT_PHRASES[o].phrases[p].split(" ");
            for(var q = 0; q < ct2.length; q++) them(ct2[q]);
        }
    }
    for(var c = 0; c < CHAT_COLORS.length; c++){
        for(var w = 0; w < CHAT_COLORS[c].words.length; w++) them(CHAT_COLORS[c].words[w]);
    }
    for(var m = 0; m < CHAT_MATERIALS.length; m++){
        for(var w2 = 0; w2 < CHAT_MATERIALS[m].words.length; w2++) them(CHAT_MATERIALS[m].words[w2]);
    }
    for(var s = 0; s < CHAT_STYLES.length; s++){
        for(var w3 = 0; w3 < CHAT_STYLES[s].words.length; w3++) them(CHAT_STYLES[s].words[w3]);
    }
    for(var r = 0; r < CHAT_ROOMS.length; r++){
        for(var w4 = 0; w4 < CHAT_ROOMS[r].words.length; w4++) them(CHAT_ROOMS[r].words[w4]);
    }
    for(var i2 = 0; i2 < CHAT_SYNONYMS.length; i2++){
        them(CHAT_SYNONYMS[i2][0]);
        them(CHAT_SYNONYMS[i2][1]);
    }
    chatTuDien = tu;
    return tu;
}

// Từ "được bảo vệ": các từ tiếng Việt ĐÚNG của đời thường / câu hỏi chính sách,
// tuyệt đối không cho chatFixTypos sửa (kẻo "phẩm" -> "thảm", "toán" -> "trấn").
// Gồm: từ khoá FAQ (từ file chatbot_faqs.json) + từ hỏi thông dụng hay gặp.
var chatTuThat = null;
function chatDungTuThat(){
    if(chatTuThat != null) return chatTuThat;
    var tu = [];
    function them(w){
        if(w.length < 2) return;
        for(var i = 0; i < tu.length; i++) if(tu[i] == w) return;
        tu.push(w);
    }
    // Từ khoá FAQ sống trong JSON (chính sách, vận chuyển, đổi trả...)
    var faqs = getTable("chatbot_faqs");
    for(var f = 0; f < faqs.length; f++){
        var kwList = (faqs[f].keywords || "").split(",");
        for(var k = 0; k < kwList.length; k++){
            var cum = normalizeText(kwList[k]);
            var cacTu = cum.split(" ");
            for(var t = 0; t < cacTu.length; t++) them(cacTu[t]);
        }
    }
    // Từ đời thường: không thuộc kho sản phẩm nên dễ bị Levenshtein kéo sang từ sai
    var tuThuong = ["pham", "toan", "chuyen", "mai", "thuoc", "xu", "gian", "cach",
        "phi", "hang", "giao", "lap", "dat", "gia", "bao", "nhieu", "the", "nao",
        "truong", "chuong", "dich", "vu", "khuyen", "kich", "chinh", "sach",
        "hoi", "muon", "can", "tim", "mua", "xem", "co", "khong", "gi", "vay",
        "minh", "ban", "shop", "o", "dau", "ra", "sao", "vao", "nhu", "sau"];
    for(var i2 = 0; i2 < tuThuong.length; i2++) them(tuThuong[i2]);
    // Từ đã có trong từ điển sản phẩm cũng phải được bảo vệ
    var tuDien = chatDungTuDien();
    for(var i3 = 0; i3 < tuDien.length; i3++) them(tuDien[i3]);
    chatTuThat = tu;
    return tu;
}

// Khoảng cách Levenshtein giữa 2 từ (số phép sửa chữ ít nhất để biến a thành b)
function chatLevenshtein(a, b){
    var m = a.length, n = b.length;
    var d = [];
    for(var i = 0; i <= m; i++){ d[i] = [i]; }
    for(var j = 0; j <= n; j++){ d[0][j] = j; }
    for(var i2 = 1; i2 <= m; i2++){
        for(var j2 = 1; j2 <= n; j2++){
            var chiPhi = (a.charAt(i2 - 1) == b.charAt(j2 - 1)) ? 0 : 1;
            var nho = d[i2 - 1][j2] + 1;
            if(d[i2][j2 - 1] + 1 < nho) nho = d[i2][j2 - 1] + 1;
            if(d[i2 - 1][j2 - 1] + chiPhi < nho) nho = d[i2 - 1][j2 - 1] + chiPhi;
            d[i2][j2] = nho;
        }
    }
    return d[m][n];
}

// Tách từ dính liền nhau: "denbann" = "den"+"bann",
// chỉ nhận cách cắt mà CẢ HAI mảnh đều gần một từ trong từ điển (<=1 sai mỗi mảnh),
// mảnh 2 phải giống từ khớp ở ký tự CUỐI, và ít nhất 1 mảnh khớp CHÍNH XÁC (d == 0)
// để khỏi bẻ từ đúng thành cụm vô nghĩa ("chuyen" -> "thu den").
function chatTachTuDinh(t, tuDien){
    if(t.length < 7 || t.length > 16) return null;
    var ketQua = null;
    for(var d = 3; d <= t.length - 3; d++){
        var p1 = t.substring(0, d), p2 = t.substring(d);
        if(p1.length < 3 || p2.length < 3) continue;   // mảnh quá ngắn dễ nhiễu
        var d1 = 99, d2 = 99, w1 = "", w2 = "";
        for(var j = 0; j < tuDien.length; j++){
            var w = tuDien[j];
            if(Math.abs(w.length - p1.length) <= 1){
                var l1 = chatLevenshtein(p1, w);
                if(l1 < d1){ d1 = l1; w1 = w; }
            }
            if(Math.abs(w.length - p2.length) <= 1){
                var l2 = chatLevenshtein(p2, w);
                if(l2 < d2){ d2 = l2; w2 = w; }
            }
        }
        var coKhopChinhXac = (d1 == 0 || d2 == 0);
        if(d1 <= 1 && d2 <= 1 && coKhopChinhXac && p2.charAt(p2.length - 1) == w2.charAt(w2.length - 1)){
            if(ketQua == null || (d1 + d2) < (ketQua.d1 + ketQua.d2))
                ketQua = { d1: d1, d2: d2, w1: w1, w2: w2 };
        }
    }
    return ketQua;
}

function chatFixTypos(qn){
    var tuDien = chatDungTuDien();
    var tuThat = chatDungTuThat();
    var cacTu = qn.split(" ");
    var kq = [];
    for(var i = 0; i < cacTu.length; i++){
        var tu = cacTu[i];
        // Từ thuộc danh sách bảo vệ (đời thường/ FAQ) -> giữ nguyên tuyệt đối
        var laTuThat = false;
        for(var b = 0; b < tuThat.length; b++){
            if(tuThat[b] == tu){ laTuThat = true; break; }
        }
        if(!laTuThat && tu.length >= 4 && !/[0-9]/.test(tu)){
            var nguong = (tu.length >= 8) ? 2 : 1;
            var best = "", bestD = 99, secondD = 99, soUngVien = 0;
            for(var j = 0; j < tuDien.length; j++){
                var w = tuDien[j];
                if(Math.abs(w.length - tu.length) > nguong) continue;   // chênh dài quá -> bỏ sớm
                var d = chatLevenshtein(tu, w);
                if(d < bestD){ secondD = bestD; bestD = d; best = w; soUngVien = 1; }
                else if(d == bestD) soUngVien++;
                else if(d < secondD){ secondD = d; }
            }
            // Ứng viên nhì phải xa hơn hẳn; nếu nhiều từ bằng điểm thì cũng không sửa (mơ hồ)
            if(bestD <= nguong && soUngVien == 1 && secondD > bestD) tu = best;
            // Từ dài mà không sửa được -> thử tách từ dính liền ("denbann" -> "den ban")
            else if(tu.length >= 7){
                var tach = chatTachTuDinh(tu, tuDien);
                if(tach != null) tu = tach.w1 + " " + tach.w2;
            }
        }
        kq.push(tu);
    }
    return kq.join(" ");
}

// Chuẩn hóa câu hỏi: bỏ dấu -> sửa typo -> đổi từ đồng nghĩa, gộp khoảng trắng
function chatPrepare(query){
    var qn = normalizeText(query);
    qn = chatFixTypos(qn);
    var padded = " " + qn + " ";
    for(var i = 0; i < CHAT_SYNONYMS.length; i++){
        padded = padded.split(" " + CHAT_SYNONYMS[i][0] + " ").join(" " + CHAT_SYNONYMS[i][1] + " ");
    }
    return padded.replace(/\s+/g, " ").trim();
}

// So khớp cả cụm từ, tránh "tham" khớp nhầm trong "tham khảo"
function chatHasPhrase(qn, phrase){
    return (" " + qn + " ").indexOf(" " + phrase + " ") >= 0;
}

// Chữ thường còn dấu (dùng để phân biệt từ nhập nhằng khi bỏ dấu: đèn/đen, cẩm/cam...)
function chatLower(query){
    return (" " + String(query || "").toLowerCase() + " ").replace(/\s+/g, " ").trim();
}

function chatInList(mang, giaTri){
    for(var i = 0; i < mang.length; i++){
        if(String(mang[i]) == String(giaTri)) return true;
    }
    return false;
}

// "10 triệu" -> 10000000; "500k" -> 500000; "10.000.000" -> 10000000
function chatToVnd(so, donVi){
    var raw = String(so).trim();
    var v;
    if(/^[0-9]{1,3}(\.[0-9]{3})+$/.test(raw))
        v = Number(raw.replace(/\./g, ""));
    else
        v = parseFloat(raw.replace(",", "."));

    if(donVi == "trieu" || donVi == "tr") return Math.round(v * 1000000);
    if(donVi == "k" || donVi == "nghin") return Math.round(v * 1000);
    // Không ghi đơn vị: số lớn là đồng, số vừa là nghìn, số nhỏ hiểu là triệu
    if(v >= 100000) return Math.round(v);
    if(v >= 20) return Math.round(v * 1000);
    return Math.round(v * 1000000);
}

function chatParseBudget(qn){
    var kq = { min: null, max: null };
    var s = " " + qn + " ";
    var m;

    // "từ 5 đến 10 triệu" / "2-4 triệu"
    m = s.match(/(\d+(?:[.,]\d+)?)\s*(trieu|tr)?\s*(?:den|toi|-)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|k|nghin)/);
    if(m){
        kq.min = chatToVnd(m[1], m[2] || m[4]);
        kq.max = chatToVnd(m[3], m[4]);
        return kq;
    }
    // "dưới 10 triệu" / "tối đa 5tr" / "nhỏ hơn 800k"
    m = s.match(/(?:duoi|toi da|khong qua|nho hon)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|k|nghin)?/);
    if(m){
        kq.max = chatToVnd(m[1], m[2] || "");
        return kq;
    }
    // "trên 20 triệu" / "hơn 5tr"
    m = s.match(/(?:tren|hon|toi thieu|lon hon)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|k|nghin)?/);
    if(m){
        kq.min = chatToVnd(m[1], m[2] || "");
        return kq;
    }
    // "khoảng 5 triệu" -> lấy vùng cộng trừ cho dễ chọn
    m = s.match(/(?:khoang|tam|co tam)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|k|nghin)\b/);
    if(m){
        var giua = chatToVnd(m[1], m[2]);
        kq.min = Math.round(giua * 0.8);
        kq.max = Math.round(giua * 1.15);
        return kq;
    }
    // Chỉ ghi "15 triệu" -> coi là mức trần
    m = s.match(/(\d+(?:[.,]\d+)?)\s*(trieu|tr|k|nghin)\b/);
    if(m)
        kq.max = chatToVnd(m[1], m[2]);
    return kq;
}

function chatDetectCategory(qn, chiSoTruoc){
    var ids = [];
    for(var i = 0; i < CHAT_CATEGORY_PHRASES.length; i++){
        if(chatHasPhrase(qn, CHAT_CATEGORY_PHRASES[i][0]) && !chatInList(ids, CHAT_CATEGORY_PHRASES[i][1]))
            ids.push(CHAT_CATEGORY_PHRASES[i][1]);
    }
    // Catch-all "nội thất": chỉ bật khi câu THẬT SỰ trống tín hiệu — không có phòng /
    // phong cách / đối tượng cụ thể. Có tín hiệu khác thì không bật (kẻo nuốt hết tín hiệu).
    if(ids.length == 0 && chatHasPhrase(qn, "noi that")
       && chiSoTruoc.room == "" && chiSoTruoc.styleIds.length == 0 && chiSoTruoc.object == null){
        for(var c = 5; c <= 13; c++) ids.push(c);
        ids.laCatchAll = true;   // đánh dấu: đây KHÔNG phải tín hiệu lọc thật
    }
    return ids;
}

function chatDetectStyle(qn){
    var ids = [];
    for(var i = 0; i < CHAT_STYLES.length; i++){
        for(var j = 0; j < CHAT_STYLES[i].words.length; j++){
            if(chatHasPhrase(qn, CHAT_STYLES[i].words[j]) && !chatInList(ids, CHAT_STYLES[i].id))
                ids.push(CHAT_STYLES[i].id);
        }
    }
    return ids;
}

// Dò từ khóa còn dấu trên câu gốc: chỉ nhận khi khớp NGUYÊN TỪ (tránh "đèn" chứa "đen").
function chatDetectCoDau(cauDau, bang){
    for(var i = 0; i < bang.length; i++){
        var tu = bang[i].coDau;
        if(!tu) continue;
        for(var j = 0; j < tu.length; j++){
            if(chatHasPhrase(cauDau, tu[j])) return bang[i];
        }
    }
    return null;
}

function chatDetectRoom(qn){
    for(var i = 0; i < CHAT_ROOMS.length; i++){
        for(var j = 0; j < CHAT_ROOMS[i].words.length; j++){
            if(chatHasPhrase(qn, CHAT_ROOMS[i].words[j])) return CHAT_ROOMS[i].label;
        }
    }
    return "";
}


// Dựng bảng tra 1 lần ở tin nhắn đầu (products ~2MB, để tránh chậm lúc mở trang)
function chatBuildIndex(){
    if(chatIndex != null) return chatIndex;

    var mangSanPham = getTable("products");
    var idx = { products: [], byId: {}, categories: {}, styles: {} };

    var cats = getTable("categories");
    for(var c = 0; c < cats.length; c++)
        idx.categories[String(cats[c].id)] = cats[c];

    var sts = getTable("styles");
    for(var s = 0; s < sts.length; s++)
        idx.styles[String(sts[s].id)] = sts[s];

    for(var i = 0; i < mangSanPham.length; i++){
        var p = mangSanPham[i];
        var dong = {
            raw: p,
            id: String(p.id),
            name: p.name || "",
            nameNorm: normalizeText(p.name || ""),
            brand: p.brand || "",
            catId: String(p.category_id || ""),
            styleIds: p.style_ids || [],
            price: Number(p.price || 0),
            origPrice: Number(p.original_price || 0),
            colorGroup: p.color_group || "",
            color: normalizeText(p.color || ""),
            matGroup: p.material_group || "",
            stock: Number(p.stock_quantity || 0),
            used: p.product_type == "USED",
            grade: p.condition_grade || "",
            has3d: !!(p.model_3d_url),
            usedUp: p.stock_quantity === 0
        };
        idx.products.push(dong);
        idx.byId[dong.id] = dong;
    }
    chatIndex = idx;
    return idx;
}


// Bỏ dấu tiếng Việt, giữ chữ thường (tái tạo lại hàm cũ vì nhiều chỗ gọi)
function normalizeText(str){
    if(!str) return "";
    var s = str.toLowerCase();
    // Bỏ dấu bằng tổ hợp Unicode (NFD) trước — bắt được mọi ký tự tiếng Việt
    // kể cả tổ hợp chưa liệt kê bên dưới (đ, ơ, ư, dấu nặng...).
    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // Các regex cũ giữ lại để cover trường hợp trình duyệt cũ không hỗ trợ normalize
    s = s.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    s = s.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    s = s.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    s = s.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    s = s.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    s = s.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    s = s.replace(/đ/g, "d");
    return s.replace(/[^a-z0-9 ]/g, " ").trim();
}

// Chấm điểm 1 sản phẩm với bộ lọc hiện có; trả về null nếu bị loại
// Từ chức năng: không dùng làm từ khóa khớp tên sản phẩm
var CHAT_STOPWORD_EXTRA = ["duoi", "tren", "hon", "khoang", "tam", "trieu", "toi", "nghin",
    "nhat", "nhieu", "tot", "dep", "hinh", "moi", "cung", "khac", "them", "coi", "xem",
    "nhung", "nhu", "nao", "vay", "phong", "cach", "sang", "trong", "re",
    "gi", "cho", "minh", "hoi", "muon", "can", "tim", "khong", "quan", "mong", "cua"];

// Gộp tín hiệu từ câu hỏi + ngữ cảnh câu trước thành bộ lọc
function chatBuildFilter(qn, question){
    // Đối tượng có kèm chất liệu: "bàn đá", "sofa da"... ưu tiên trước để không mất tín hiệu
    var doiTuong = null;
    for(var o = 0; o < CHAT_OBJECT_PHRASES.length; o++){
        for(var op = 0; op < CHAT_OBJECT_PHRASES[o].phrases.length; op++){
            if(chatHasPhrase(qn, CHAT_OBJECT_PHRASES[o].phrases[op])){
                doiTuong = CHAT_OBJECT_PHRASES[o];
                break;
            }
        }
        if(doiTuong != null) break;
    }

    // Dò màu/ chất liệu trên bản CÒN DẤU trước (phân biệt đèn/đen, cẩm/cam, trang/trắng).
    var cauDau = chatCheCumNhapNhang(question);
    var colorDau = chatDetectCoDau(cauDau, CHAT_COLORS);
    var matDau = chatDetectCoDau(cauDau, CHAT_MATERIALS);

    // Detect room/ style TRƯỚC để catch-all "nội thất" biết mà không kích hoạt khi câu có tín hiệu
    var roomTruoc = chatDetectRoom(qn);
    var styleTruoc = chatDetectStyle(qn);
    var catTruoc = chatDetectCategory(qn, { room: roomTruoc, styleIds: styleTruoc, object: doiTuong });
    var khoaLoaiTruoc = chatTimKhoaLoai(qn);

    var boLoc = {
        qn: qn,
        question: question,
        catIds: catTruoc,
        styleIds: styleTruoc,
        // Màu/ chất liệu chỉ dò trên bản còn dấu: bản bỏ dấu làm "đèn" = "đen",
        // "cẩm thạch" chứa "cam", "trang trí" chứa "trắng" — nhận nhầm sẽ lọc sai toàn bộ
        color: colorDau,
        material: matDau,
        budget: chatParseBudget(qn),
        usedOnly: false,
        want3d: chatHasPhrase(qn, "3d"),
        room: roomTruoc,
        object: doiTuong,
        khoaLoaiDo: khoaLoaiTruoc,         // khóa loại đồ từ bảng danh từ chính
        kichThuoc: chatDocYKichThuoc(qn, khoaLoaiTruoc, catTruoc, doiTuong),
        dacDiem: chatDocDacDiem(qn),       // đặc điểm kiểu dáng (góc, kéo dài, treo...)
        chiConHang: chatHasPhrase(qn, "con hang") || chatHasPhrase(qn, "dang co"),
        keywords: []
    };
    // Đối tượng mang danh mục (+ chất liệu nếu có) của riêng nó
    if(doiTuong != null){
        for(var c = 0; c < doiTuong.catIds.length; c++){
            if(!chatInList(boLoc.catIds, doiTuong.catIds[c]))
                boLoc.catIds.push(doiTuong.catIds[c]);
        }
        if(doiTuong.matGroup != null)
            boLoc.material = { group: doiTuong.matGroup, keyword: doiTuong.vatLieuHien || doiTuong.label };
    }
    // Từ khóa còn lại: chỉ lấy từ ≥4 ký tự, không phải từ chức năng,
    // và không nằm trong cụm danh mục/ phong cách/ màu/ chất liệu đã nhận
    var cacTu = qn.split(" ");
    for(var i = 0; i < cacTu.length; i++){
        var tu = cacTu[i];
        if(tu.length < 4) continue;
        if(chatInList(CHAT_STOPWORD_EXTRA, tu)) continue;
        // Bỏ từ đã là một phần của cụm danh mục/ phong cách đã khớp
        var thuocCum = false;
        for(var p = 0; p < CHAT_CATEGORY_PHRASES.length; p++){
            var cum = CHAT_CATEGORY_PHRASES[p][0];
            if(chatHasPhrase(qn, cum) && cum.split(" ").indexOf(tu) >= 0) thuocCum = true;
        }
        for(var p2 = 0; p2 < CHAT_STYLES.length; p2++){
            for(var w = 0; w < CHAT_STYLES[p2].words.length; w++){
                if(chatHasPhrase(qn, CHAT_STYLES[p2].words[w]) && CHAT_STYLES[p2].words[w].split(" ").indexOf(tu) >= 0)
                    thuocCum = true;
            }
        }
        if(thuocCum) continue;
        boLoc.keywords.push(tu);
    }
    // Đồ cũ
    if(chatHasPhrase(qn, "do cu") || chatHasPhrase(qn, "marketplace"))
        boLoc.usedOnly = true;
    // Đã có tín hiệu cụ thể (đối tượng/ danh mục/ phong cách/ đồ cũ/ phòng/ màu/ chất liệu)
    // thì bỏ từ khóa rác — độ phù hợp chấm bằng các tín hiệu đó, từ khóa chỉ dùng khi câu mơ hồ
    if(boLoc.object != null || boLoc.catIds.length > 0 || boLoc.styleIds.length > 0
       || boLoc.usedOnly || boLoc.room != "" || boLoc.color != null || boLoc.material != null)
        boLoc.keywords = [];
    // Ngữ cảnh câu trước: "còn mẫu khác không" / "cái nào rẻ hơn" /
    // nút "Xem thêm mẫu khác" / "Rẻ hơn" — kéo ĐỦ bộ lọc của câu trước
    // (kể cả usedOnly/ room/ object/ cụm tên) để không lệch danh mục.
    var hoiThem = chatHasPhrase(qn, "khac khong") || chatHasPhrase(qn, "xem them")
               || chatHasPhrase(qn, "con mau") || chatHasPhrase(qn, "mau khac");
    var hoiRe = chatHasPhrase(qn, "re hon");
    if((hoiThem || hoiRe) && chatLastContext != null){
        if(boLoc.catIds.length == 0) boLoc.catIds = chatLastContext.catIds;
        if(boLoc.styleIds.length == 0) boLoc.styleIds = chatLastContext.styleIds;
        if(boLoc.color == null) boLoc.color = chatLastContext.color;
        if(boLoc.material == null) boLoc.material = chatLastContext.material;
        if(boLoc.usedOnly == false && chatLastContext.usedOnly == true) boLoc.usedOnly = true;
        if(boLoc.room == "" && chatLastContext.room) boLoc.room = chatLastContext.room;
        if(boLoc.object == null && chatLastContext.object) boLoc.object = chatLastContext.object;
        if(boLoc.want3d == false && chatLastContext.want3d == true) boLoc.want3d = true;
        if(boLoc.khoaLoaiDo == null && chatLastContext.khoaLoaiDo) boLoc.khoaLoaiDo = chatLastContext.khoaLoaiDo;
        if(hoiRe) boLoc.budget.max = chatLastContext.budget.max != null
            ? Math.round(chatLastContext.budget.max * 0.7) : null;
    }
    return boLoc;
}

// Bộ lọc có đủ tín hiệu riêng để lọc sản phẩm không
function chatFilterHasSignal(boLoc){
    return boLoc.catIds.length > 0 || boLoc.styleIds.length > 0
        || boLoc.color != null || boLoc.material != null
        || boLoc.usedOnly || boLoc.want3d || boLoc.room != "" || boLoc.keywords.length > 0;
}

// Đếm số tín hiệu đã nhận trong bộ lọc (dùng để quyết định có nên hỏi lại hay không)
function chatDemTinHieu(boLoc){
    var n = 0;
    if(boLoc.catIds.length > 0) n++;
    if(boLoc.object != null) n++;
    if(boLoc.styleIds.length > 0) n++;
    if(boLoc.color != null) n++;
    if(boLoc.material != null) n++;
    if(boLoc.budget.max != null || boLoc.budget.min != null) n++;
    if(boLoc.room != "") n++;
    if(boLoc.usedOnly) n++;
    return n;
}

// Trả lời câu hỏi sản phẩm bằng dữ liệu thật
// Khi bộ lọc chặt không có kết quả: nới dần theo thứ tự màu -> chất liệu, luôn báo đã nới gì
function chatAnswerProducts(boLoc){
    var sp = chatSearch(boLoc, 3);
    var ghiChuNoi = "";
    var daNoi = [];           // các điều kiện đã nới (cho API biết ở Phase C)
    chatLastRelaxed = null;

    // 1. Rỗng mà vẫn giữ màu/ chất liệu -> nới MÀU trước (kho ít khi đủ cả 2 điều kiện)
    if(sp.length == 0 && boLoc.color != null){
        var mauGoc = boLoc.color.label;
        daNoi.push("màu " + mauGoc);
        boLoc.color = null;   // nới trước khi search
        sp = chatSearch(boLoc, 3);
        if(sp.length > 0)
            ghiChuNoi = "Kho hiện chưa có " + (boLoc.object ? boLoc.object.label : "sản phẩm")
                      + " màu " + mauGoc + ". Dưới đây là các mẫu " + (boLoc.object ? boLoc.object.label : "gần nhất")
                      + " (khác màu) để bạn tham khảo:";
    }
    // 2. Vẫn rỗng -> nới CHẤT LIỆU
    if(sp.length == 0 && boLoc.material != null){
        var vatLieuGoc = boLoc.material.keyword;
        daNoi.push("chất liệu " + vatLieuGoc);
        boLoc.material = null;   // nới trước khi search
        sp = chatSearch(boLoc, 3);
        if(sp.length > 0)
            ghiChuNoi = "Kho hiện chưa có " + (boLoc.object ? boLoc.object.label : "sản phẩm")
                      + " làm bằng " + vatLieuGoc + ". Dưới đây là các mẫu cùng loại khác chất liệu:";
    }
    // 3. Vẫn rỗng -> bỏ từ khóa (nếu có); vẫn rỗng nữa mà có ngân sách -> gợi ý món rẻ trong tầm giá
    if(sp.length == 0 && boLoc.keywords.length > 0){
        boLoc.keywords = [];
        daNoi.push("từ khóa mô tả");
        sp = chatSearch(boLoc, 3);
        if(sp.length > 0)
            ghiChuNoi = "Mình chưa chắc bạn muốn loại đồ nào, dưới đây là vài gợi ý gần với câu hỏi của bạn:";
    }
    // 4. Vẫn rỗng mà có ngân sách -> trả các món trong tầm giá, hoặc nới ngân sách nếu không có gì
    if(sp.length == 0 && boLoc.budget.max != null){
        var muc = boLoc.budget.max;
        var goiY = chatGoiYSapNganSach(muc);
        daNoi.push("ngân sách dưới " + formatVND(muc));
        if(goiY.sp.length > 0)
            return { text: goiY.text, products: goiY.sp, chips: chatSuggestChips() };
        // Không có món nào dưới mức giá -> nới ngân sách, nói rõ là gợi ý giá cao hơn
        boLoc.budget.max = null;
        sp = chatSearch(boLoc, 3);
        if(sp.length > 0)
            ghiChuNoi = "Kho hiện chưa có món nào dưới " + formatVND(muc)
                      + ". Dưới đây là các mẫu gần nhất (giá cao hơn) để bạn tham khảo:";
    }

    if(sp.length == 0){
        // Nới hết vẫn rỗng + câu có >=2 tín hiệu -> hỏi lại 1 câu kèm gợi ý gần nhất,
        // thay vì kết luận "chưa có" (vì nới rồi nên kết luận đó không còn chính xác)
        if(daNoi.length > 0) chatLastRelaxed = daNoi;   // Phase C: AI biết đã nới gì
        if(chatDemTinHieu(boLoc) >= 2){
            var goiYGan = chatSearch(boLoc, 3);
            var hoi = "Mình chưa tìm được món nào khớp cả yêu cầu này trong kho. ";
            if(boLoc.object != null) hoi += "Bạn muốn ưu tiên giữ " + boLoc.object.label;
            else if(boLoc.catIds.length > 0) hoi += "Bạn muốn ưu tiên giữ loại đồ đã chọn";
            else hoi += "Bạn muốn ưu tiên điều kiện nào";
            hoi += " (màu, chất liệu, ngân sách) để mình lọc lại cho chính xác?";
            if(goiYGan.length > 0)
                return { text: hoi, products: goiYGan, chips: chatSuggestChips() };
            return { text: hoi, products: [], chips: chatSuggestChips() };
        }
        return {
            text: "Hiện RoomCraft chưa có sản phẩm khớp đúng yêu cầu này trong kho. "
                + "Bạn thử nới rộng ngân sách, đổi màu/ chất liệu hoặc hỏi một loại đồ khác nhé!",
            products: [],
            chips: ["Sofa dưới 10 triệu", "Bàn ăn gỗ", "Đồ cũ Marketplace", "Mã giảm giá"]
        };
    }

    chatGhiNhoNguCanh(boLoc, sp);
    return chatDungLoiDan(boLoc, sp, ghiChuNoi);
}

// Ghi ngữ cảnh + mã đã hiện để "xem thêm" không lặp
function chatGhiNhoNguCanh(boLoc, sp){
    chatLastContext = boLoc;
    for(var i = 0; i < sp.length; i++)
        chatShownIds.push(sp[i].id);
}

// Phần còn lại của chatAnswerProducts: dựng lời dẫn từ ngữ cảnh hiện có
function chatDungLoiDan(boLoc, sp, ghiChuNoi){
    chatLastContext = boLoc;
    for(var i = 0; i < sp.length; i++)
        chatShownIds.push(sp[i].id);

    var dau = ghiChuNoi != "" ? ghiChuNoi + "\n" : "";
    // Có kết quả ngoài vùng ngân sách -> nói rõ là gợi ý gần nhất, không nói "phù hợp"
    if(dau == "" && boLoc.budget.max != null){
        var coVuot = false;
        for(var v = 0; v < sp.length; v++){
            if(sp[v].price > boLoc.budget.max) coVuot = true;
        }
        if(coVuot){
            dau = "Kho không còn món nào trong tầm " + formatVND(boLoc.budget.max)
                + ". Dưới đây là các mẫu gần nhất (giá cao hơn) để bạn tham khảo:\n";
        }
    }
    if(dau == "" && boLoc.usedOnly){
        dau = "Đồ cũ tuyển chọn trên Marketplace (mỗi món duy nhất 1 chiếc):\n";
    } else if(dau == "" && boLoc.styleIds.length > 0 && boLoc.catIds.length == 0){
        var tenPhongCach = "";
        var styles = getTable("styles");
        for(var s = 0; s < styles.length; s++){
            if(chatInList(boLoc.styleIds, styles[s].id)) tenPhongCach = styles[s].name;
        }
        if(tenPhongCach != ""){
            var moTa = "";
            for(var s2 = 0; s2 < styles.length; s2++)
                if(styles[s2].name == tenPhongCach) moTa = styles[s2].description || "";
            dau = tenPhongCach + ": " + moTa + "\nVài sản phẩm tiêu biểu:\n";
        }
    }

    var text = dau + "Mình tìm được " + sp.length + " sản phẩm phù hợp:\n";
    var chips = ["Rẻ hơn", "Xem thêm mẫu khác", "Phí giao hàng", "Mã giảm giá"];
    return { text: text, products: sp, chips: chips };
}

// Gợi ý món rẻ nhất trong kho khi khách hỏi "cái gì dưới X" mà không nêu loại đồ
function chatGoiYSapNganSach(soTien){
    var idx = chatBuildIndex();
    var mang = [];
    for(var i = 0; i < idx.products.length; i++){
        var s = idx.products[i];
        if(s.raw.is_active == false) continue;
        if(s.price <= soTien) mang.push(s);
    }
    mang.sort(function(a, b){ return b.price - a.price; });  // đắt nhất trong tầm giá lên đầu
    var chon = mang.slice(0, 3);
    if(chon.length == 0)
        return { text: "Kho chưa có món nào dưới " + formatVND(soTien) + ". Bạn thử nâng ngân sách lên nhé!", sp: [] };
    return { text: "Các món dưới " + formatVND(soTien) + " đang có trong kho:", sp: chon };
}

// Vài món bán chạy (còn hàng, giá giảm nếu có) để gợi ý khi câu hỏi chưa rõ
function chatTopBanChay(soLuong){
    var idx = chatBuildIndex();
    var mang = [];
    for(var i = 0; i < idx.products.length; i++){
        var s = idx.products[i];
        if(s.raw.is_active == false || s.usedUp) continue;
        mang.push(s);
    }
    // Ưu tiên món có giá gốc cao hơn giá bán (đang giảm) rồi đến giá thấp
    mang.sort(function(a, b){
        var gA = (a.origPrice > a.price && a.origPrice > 0) ? 1 : 0;
        var gB = (b.origPrice > b.price && b.origPrice > 0) ? 1 : 0;
        if(gB != gA) return gB - gA;
        return a.price - b.price;
    });
    return mang.slice(0, soLuong);
}

// Đếm số sản phẩm còn bán trong các danh mục (dùng để nới lọc khi danh mục quá nhỏ)
function chatDemKho(catIds){
    var idx = chatBuildIndex();
    var n = 0;
    for(var i = 0; i < idx.products.length; i++){
        var s = idx.products[i];
        if(s.raw.is_active == false) continue;
        if(chatInList(catIds, s.catId)) n++;
    }
    return n;
}

// FAQ có sẵn nhưng thay số liệu viết cứng bằng số liệu sống trong JSON
function chatAnswerFaq(boLoc){
    var rawFaqs = getTable("chatbot_faqs");
    var qn = boLoc.qn;
    // Cụm từ bổ sung ánh xạ thẳng vào FAQ (không sửa chatbot_faqs.json nên không cần tăng DATA_VERSION)
    var faqExtra = [
        ["giao lap", 16], ["phi lap dat", 16], ["giao va lap", 16], ["lap dat", 16],
        ["chi phi giao", 15], ["phi giao", 15], ["ban chay", -1], ["ban tot", -1]
    ];
    for(var e = 0; e < faqExtra.length; e++){
        if(chatHasPhrase(qn, faqExtra[e][0])){
            if(faqExtra[e][1] == -1) return null;   // câu "bán chạy" -> đi sang route sản phẩm
            for(var fe = 0; fe < rawFaqs.length; fe++){
                if(rawFaqs[fe].id == faqExtra[e][1] && rawFaqs[fe].is_active !== false){
                    var textE = rawFaqs[fe].answer;
                    return { text: textE, products: [], chips: ["Sofa dưới 10 triệu", "Bàn ăn gỗ", "Xem 3D", "Đồ cũ Marketplace"] };
                }
            }
        }
    }
    var bestMatch = null, maxScore = 0;
    for(var i = 0; i < rawFaqs.length; i++){
        var f = rawFaqs[i];
        if(f.is_active === false) continue;
        var kwList = (f.keywords || "").split(",");
        var score = 0;
        for(var k = 0; k < kwList.length; k++){
            var kw = normalizeText(kwList[k]);
            if(kw.length > 0 && qn.indexOf(kw) >= 0) score += kw.length * 3;
        }
        if(score > maxScore){ maxScore = score; bestMatch = f; }
    }
    if(bestMatch == null || maxScore < 5) return null;

    var text = bestMatch.answer;
    // Mã giảm giá: đọc coupons.json thay vì câu viết sẵn
    if(bestMatch.topic == "POLICY" && qn.indexOf("giam gia") >= 0){
        var coupons = getTable("coupons");
        if(coupons.length > 0){
            text = "Mã giảm giá đang có tại RoomCraft:\n";
            for(var c = 0; c < coupons.length; c++){
                var cp = coupons[c];
                if(cp.is_active == false) continue;
                var giam = cp.discount_type == "PERCENT"
                    ? "giảm " + cp.discount_value + "%"
                    : "giảm " + formatVND(cp.discount_value);
                text += "• " + cp.code + " — " + giam + ", áp dụng cho đơn từ "
                     + formatVND(cp.min_order_value) + "\n";
            }
            text += "Mỗi đơn dùng 1 mã, nhập ở trang Thanh toán.";
        }
    }
    return { text: text, products: [], chips: ["Sofa dưới 10 triệu", "Bàn ăn gỗ", "Xem 3D", "Đồ cũ Marketplace"] };
}

// Định tuyến câu hỏi: chào hỏi -> FAQ -> sản phẩm -> API
function chatDecideRoute(boLoc){
    var qn = boLoc.qn;
    // Chào hỏi / hỏi bot là ai: trả lời ngay, không lọc sản phẩm
    if(chatHasPhrase(qn, "hello") || chatHasPhrase(qn, "xin chao") || chatHasPhrase(qn, "chao ban")
       || chatHasPhrase(qn, "chao bot") || chatHasPhrase(qn, "chao shop") || chatHasPhrase(qn, "chao roomcraft")
       || chatHasPhrase(qn, "hi bot") || chatHasPhrase(qn, "alo") || chatHasPhrase(qn, "chao")
       || chatHasPhrase(qn, "ban la ai") || chatHasPhrase(qn, "ban gi the") || chatHasPhrase(qn, "cam on"))
        return "greeting";
    var faqWords = ["chinh sach", "doi tra", "hoan tien", "bao hanh", "thanh toan", "hoa don",
                    "giao hang", "van chuyen", "phi giao", "ship", "cod", "giao bao lau",
                    "giam gia", "voucher", "coupon", "theo doi don", "trang thai don",
                    "chi phi giao", "lap dat", "boc xep", "khuyen mai",
                    "xuat xu", "nguon goc", "kich thuoc", "hoa don do"];
    for(var i = 0; i < faqWords.length; i++){
        if(qn.indexOf(faqWords[i]) >= 0) return "faq";
    }
    if(chatFilterHasSignal(boLoc)){
        // Câu "xem thêm mẫu khác"/ "rẻ hơn" khi ĐÃ có ngữ cảnh: luôn tra sản phẩm,
        // KHÔNG bao giờ rơi xuống AI (AI không biết kho, sẽ bịa "chưa ghi nhận danh mục")
        var laHoiNguCanh = (chatHasPhrase(qn, "khac khong") || chatHasPhrase(qn, "xem them")
            || chatHasPhrase(qn, "con mau") || chatHasPhrase(qn, "mau khac")
            || chatHasPhrase(qn, "re hon")) && chatLastContext != null;
        // Câu tư vấn mở có TÍN HIỆU lọc (room/ style/ object) nhưng không kèm yêu cầu
        // lọc cụ thể (ngân sách/ màu/ chất liệu/ danh mục) -> đưa cho AI tư vấn tổng thể
        var coYeuCauLoc = boLoc.budget.max != null || boLoc.budget.min != null
            || boLoc.color != null || boLoc.material != null || boLoc.catIds.length > 0;
        var coChuTuVan2 = chatHasPhrase(qn, "tu van") || chatHasPhrase(qn, "bo tri")
            || chatHasPhrase(qn, "thiet ke") || chatHasPhrase(qn, "phu hop")
            || chatHasPhrase(qn, "the nao") || chatHasPhrase(qn, "nen dung")
            || chatHasPhrase(qn, "goi y");
        if(coChuTuVan2 && !coYeuCauLoc && !laHoiNguCanh) return "advice";
        return "products";
    }
    // Câu tư vấn mở: có chữ "tư vấn/ gợi ý/ bố trí/ phù hợp/ nên..." và nhắc phòng/ phong cách
    var coChuTuVan = chatHasPhrase(qn, "tu van") || chatHasPhrase(qn, "goi y") || chatHasPhrase(qn, "bo tri")
        || chatHasPhrase(qn, "nen dung") || chatHasPhrase(qn, "phu hop") || chatHasPhrase(qn, "thiet ke")
        || chatHasPhrase(qn, "sang trong") || chatHasPhrase(qn, "the nao");
    var coKhongGian = boLoc.room != "" || boLoc.styleIds.length > 0
        || chatHasPhrase(qn, "phong") || chatHasPhrase(qn, "can ho") || chatHasPhrase(qn, "nha");
    if(coChuTuVan && coKhongGian) return "advice";
    return "api";
}

// Lời chào / giới thiệu bot
function chatAnswerGreeting(){
    return {
        text: "Xin chào! Mình là Trợ lý RoomCraft. Mình tra được giá, tồn kho, đồ cũ, mã giảm giá "
            + "và phí giao hàng ngay từ dữ liệu cửa hàng. Bạn cứ hỏi kiểu \"sofa dưới 10 triệu\" "
            + "hoặc \"bàn ăn gỗ\" nhé!",
        products: [],
        chips: ["Sofa dưới 10 triệu", "Bàn ăn gỗ", "Đồ cũ Marketplace", "Mã giảm giá"]
    };
}

// Danh từ chính của tên sản phẩm: từ đầu tiên, bỏ qua "bộ/set/combo" và số
// ("Bộ 2 ghế ăn gỗ Aniek" -> "ghe"). Tiếng Việt đặt danh từ chính đầu cụm danh từ.
var CHAT_BO_QUA_DAU = ["bo", "set", "combo"];
function chatDauMuc(tenNorm){
    var cacTu = tenNorm.split(" ");
    var i = 0;
    while(i < cacTu.length && (chatInList(CHAT_BO_QUA_DAU, cacTu[i]) || /^[0-9]+$/.test(cacTu[i])))
        i++;
    return cacTu[i] || "";
}

// Bảng khoá loại đồ: cụm khách hỏi -> danh từ chính bắt buộc trong tên SP.
// "giuong ngu" -> chỉ nhận SP có danh từ chính "giuong" (loại Tủ đầu giường,
// Bàn đầu giường dù cùng danh mục 9); "co" = từ bắt buộc có thêm trong tên (tuỳ chọn).
var CHAT_KHOA_LOAI = {
    "giuong ngu":     { dau: ["giuong"], nhan: "giường ngủ" },
    "giuong":         { dau: ["giuong"], nhan: "giường" },
    "tu dau giuong":  { dau: ["tu"], co: ["dau giuong"], nhan: "tủ đầu giường" },
    "ban dau giuong": { dau: ["ban"], co: ["dau giuong"], nhan: "bàn đầu giường" },
    "ban tra":        { dau: ["ban", "don"], nhan: "bàn trà" },
    "ban phu":        { dau: ["ban"], nhan: "bàn phụ" },
    "ban an":         { dau: ["ban"], nhan: "bàn ăn" },
    "ghe an":         { dau: ["ghe"], nhan: "ghế ăn" },
    "ghe don":        { dau: ["ghe"], nhan: "ghế đơn" },
    "ghe thu gian":   { dau: ["ghe"], nhan: "ghế thư giãn" },
    "sofa goc":       { dau: ["sofa", "manh", "ghe"], nhan: "sofa góc" },
    "sofa giuong":    { dau: ["sofa"], co: ["giuong"], nhan: "sofa giường" },
    "sofa":           { dau: ["sofa", "manh", "ghe"], nhan: "sofa" },
    "tu quan ao":     { dau: ["tu"], co: ["quan ao"], nhan: "tủ quần áo" },
    "ke sach":        { dau: ["ke", "tu"], nhan: "kệ sách" },
    "ke tivi":        { dau: ["ke", "tu"], co: ["tivi"], nhan: "kệ tivi" },
    "tu buffet":      { dau: ["tu"], nhan: "tủ buffet" },
    "ban lam viec":   { dau: ["ban"], nhan: "bàn làm việc" },
    "ban may tinh":   { dau: ["ban"], nhan: "bàn làm việc" },
    "binh hoa":       { dau: ["binh"], nhan: "bình hoa" },
    "lo hoa":         { dau: ["binh"], nhan: "lọ hoa" },
    "binh gom":       { dau: ["binh"], nhan: "bình gốm" },
    "cay canh":       { dau: ["cay", "canh", "chau"], nhan: "cây cảnh" },
    "cay trang tri":  { dau: ["cay", "canh", "chau"], nhan: "cây trang trí" },
    "chau cay":       { dau: ["chau", "cay"], nhan: "chậu cây" },
    "tranh treo tuong": { dau: ["tranh"], nhan: "tranh treo tường" },
    "tranh":          { dau: ["tranh"], nhan: "tranh" },
    "guong":          { dau: ["guong"], nhan: "gương" },
    "goi tua":        { dau: ["goi"], nhan: "gối tựa" },
    "goi sofa":       { dau: ["goi", "vo"], nhan: "gối sofa" },
    "den ban":        { dau: ["den"], nhan: "đèn bàn" },
    "den chum":       { dau: ["den"], nhan: "đèn chùm" },
    "den cay":        { dau: ["den"], nhan: "đèn cây" },
    "den tha":        { dau: ["den"], nhan: "đèn thả" },
    "den trang tri":  { dau: ["den"], nhan: "đèn trang trí" },
    "quat tran":      { dau: ["quat"], nhan: "quạt trần" },
    "tham trai":      { dau: ["tham"], nhan: "thảm trải" },
    "tham long":      { dau: ["tham"], nhan: "thảm lông" },
    "tham":           { dau: ["tham"], nhan: "thảm" },
    "rem cua":        { dau: ["rem", "thanh"], nhan: "rèm cửa" },
    "chan phu":       { dau: ["chan"], nhan: "chăn phủ" },
    "khan tam":       { dau: ["khan"], nhan: "khăn tắm" },
    "ao goi":         { dau: ["vo"], nhan: "vỏ gối" }
};

// Tìm khóa loại đồ cho câu hỏi: khớp cụm DÀI NHẤT trong bảng trên
function chatTimKhoaLoai(qn){
    var totNhat = null;
    for(var cum in CHAT_KHOA_LOAI){
        if(chatHasPhrase(qn, cum)){
            if(totNhat == null || cum.length > totNhat._len){
                totNhat = { dau: CHAT_KHOA_LOAI[cum].dau, co: CHAT_KHOA_LOAI[cum].co || null,
                            nhan: CHAT_KHOA_LOAI[cum].nhan };
                totNhat._len = cum.length;
            }
        }
    }
    return totNhat;
}

// ============ KÍCH THƯỚC ============
// Tách các con số từ chuỗi dimensions (đa dạng định dạng: "222 x 208 x 140 cm",
// "R 213 x S 102 x C 89 cm", "Ø 135 x C 65 cm", "Dài 66 cm"...).
// Bỏ số >400 (lỗi nhập liệu vd "C 945 cm" cho sofa 3 chỗ) và <5 (số lượng/ inch phụ).
function chatTachSoKichThuoc(dims){
    var so = String(dims || "").match(/\d+(?:[.,]\d+)?/g) || [];
    var kq = [];
    for(var i = 0; i < so.length; i++){
        var v = parseFloat(so[i].replace(",", "."));
        if(!isNaN(v) && v >= 5 && v <= 400) kq.push(v);
    }
    return kq;
}

// Chiều dài lớn nhất của SP (cm); 0 nếu không đọc được
function chatChieuDai(sp){
    var so = chatTachSoKichThuoc(sp.raw.dimensions);
    if(so.length == 0) return 0;
    var max = 0;
    for(var i = 0; i < so.length; i++)
        if(so[i] > max) max = so[i];
    return max;
}

// Nhận diện ý định kích thước trong câu hỏi:
// - soMin/soMax: ngưỡng cm cụ thể ("dài 2m", "dưới 1m6")
// - kieu: "lon" / "nho" / "vua" — so bằng phân vị p67/p33 của loại đồ khi chấm điểm
function chatDocYKichThuoc(qn, khoaLoai, catIds, doiTuong){
    var y = { soMin: null, soMax: null, kieu: null };
    // Số cụ thể kèm đơn vị: "2m", "1m6", "160cm", "dưới 2 mét", "tren 1m"
    var m = qn.match(/(\d+(?:[.,]\d+)?)\s*(?:m\b|met|meter)/);
    if(m){
        var giatri = parseFloat(m[1].replace(",", "."));
        if(giatri < 10) giatri = giatri * 100;          // "2m" = 200cm
        y.soMax = Math.round(giatri);
        // Nếu câu có "tren/lon hon/it nhat" -> thành ngưỡng dưới
        if(chatHasPhrase(qn, "tren") || chatHasPhrase(qn, "lon hon") || chatHasPhrase(qn, "it nhat"))
            { y.soMin = y.soMax; y.soMax = null; }
    }
    if(y.soMin == null && y.soMax == null){
        // "cỡ lớn/ nhỏ" phải ĐI CÙNG LOẠI ĐỒ ("giường ngủ cỡ lớn", "sofa nhỏ");
        // "quán cafe NHỎ", "căn hộ nhỏ" là mô tả không gian — không phải kích thước SP
        var coKieu = chatHasPhrase(qn, "co lon") || chatHasPhrase(qn, "co nho") || chatHasPhrase(qn, "co vua");
        var tuKichThuoc = null;
        if(coKieu) tuKichThuoc = "co lon";
        if(chatHasPhrase(qn, "co nho")) tuKichThuoc = "co nho";
        if(chatHasPhrase(qn, "co vua")) tuKichThuoc = "co vua";
        if(tuKichThuoc == null){
            // "nhỏ/ to" chỉ nhận khi câu CÓ loại đồ cụ thể, dạng "<loại đồ> nhỏ/ to"
            var coLoaiDo = khoaLoai != null || (catIds != null && catIds.length > 0) || doiTuong != null;
            if(coLoaiDo){
                var mNho = qn.match(/(san pham|mo hinh|ban|ghe|sofa|giuong|tham|den|tu|ke|binh|vo|chan|khay|tranh|guong)\s+(nho|to)\b/);
                if(mNho) tuKichThuoc = mNho[2] == "to" ? "lon" : "nho";
            }
        }
        if(tuKichThuoc == "co lon" || tuKichThuoc == "lon") y.kieu = "lon";
        else if(tuKichThuoc == "co nho" || tuKichThuoc == "nho") y.kieu = "nho";
        else if(tuKichThuoc == "co vua") y.kieu = "vua";
        else if(chatHasPhrase(qn, "gon") || chatHasPhrase(qn, "mini")) y.kieu = "nho";
    }
    return y;
}

// ============ ĐẶC ĐIỂM KHÁC (kiểu dáng / thương hiệu / tồn kho) ============
// Khách hỏi kèm đặc điểm ("sofa góc", "bàn kéo dài", "đèn treo tường"...) —
// khớp vào TÊN sản phẩm; món không chứa cụm nào bị loại.
var CHAT_DAC_DIEM = [
    ["sofa goc", ["sofa goc"]],
    ["chữ U", ["chu u"]],
    ["kéo dài", ["keo dai", "mo rong"]],
    ["mở rộng", ["mo rong"]],
    ["treo tường", ["treo tuong"]],
    ["treo", ["treo"]],
    ["xoay", ["xoay"]],
    ["kèm nệm", ["kem nem"]],
    ["ngăn kéo", ["ngan keo"]],
    ["ngăn chứa", ["ngan chua"]],
    ["có sạc", ["co sac"]],
    ["chân côn", ["chan con"]],
    ["module", ["module"]],
    ["đôn", ["don"]],
    ["quầy bar", ["quay bar", "quay"]],
    ["chữ L", ["chu l"]],
    ["nhân tạo", ["nhan tao"]],
    ["cây thật", ["cay that"]],
    ["mặt kính", ["mat kinh"]],
    ["mặt đá", ["mat da"]]
];

// Đọc đặc điểm khách yêu cầu: trả mảng các nhóm cụm (OR trong nhóm, AND giữa nhóm)
function chatDocDacDiem(qn){
    var nhom = [];
    for(var i = 0; i < CHAT_DAC_DIEM.length; i++){
        var cacBienThe = CHAT_DAC_DIEM[i][0].split("|");
        for(var j = 0; j < cacBienThe.length; j++){
            if(chatHasPhrase(qn, normalizeText(cacBienThe[j]))){
                nhom.push(CHAT_DAC_DIEM[i][1]);
                break;
            }
        }
    }
    return nhom;
}

// Kiểm tra SP có đáp ứng các nhóm đặc điểm không
function chatKhopDacDiem(sp, nhom){
    if(nhom.length == 0) return true;
    for(var i = 0; i < nhom.length; i++){
        var khopNhom = false;
        for(var j = 0; j < nhom[i].length; j++){
            if(sp.nameNorm.indexOf(nhom[i][j]) >= 0){ khopNhom = true; break; }
        }
        if(!khopNhom) return false;
    }
    return true;
}

// Phân vị chiều dài trong một tập SP (đã lọc) — dùng làm ngưỡng lớn/ nhỏ
function chatPhanVi(dsSp, q){
    var a = [];
    for(var i = 0; i < dsSp.length; i++){
        var v = chatChieuDai(dsSp[i]);
        if(v > 0) a.push(v);
    }
    if(a.length == 0) return 0;
    a.sort(function(x, y2){ return x - y2; });
    return a[Math.min(a.length - 1, Math.floor(a.length * q))];
}

// Chấm điểm CƠ BẢN: mọi tiêu chí TRỪ kích thước (dùng để tính phân vị,
// tránh gọi đệ quy chatScoreItem khi nó cần phân vị làm ngưỡng)
// Chấm điểm CƠ BẢN: kiểm tra mọi tiêu chí LOẠI (true = đạt, false = loại) —
// trừ kích thước kiểu "cỡ lớn/ nhỏ" (cần phân vị). chatScoreItem gọi hàm này
// để không lặp logic; cũng dùng để tính tập phân vị ngưỡng kích thước.
function chatScoreItemCoBan(sp, boLoc){
    if(sp.raw.is_active == false) return false;
    if(boLoc.catIds.length > 0 && !chatInList(boLoc.catIds, sp.catId)) return false;
    if(boLoc.styleIds.length > 0){
        var cung = false;
        for(var i = 0; i < boLoc.styleIds.length; i++){
            if(chatInList(sp.styleIds, boLoc.styleIds[i])) cung = true;
        }
        if(!cung) return false;
    }
    if(boLoc.color != null){
        var dungMau = false;
        for(var g = 0; g < boLoc.color.groups.length; g++){
            if(sp.colorGroup == boLoc.color.groups[g]) dungMau = true;
        }
        if(!dungMau) return false;
    }
    if(boLoc.material != null && sp.matGroup != boLoc.material.group) return false;
    if(boLoc.usedOnly && !sp.used) return false;
    if(boLoc.want3d && !sp.has3d) return false;
    if(!chatKhopDacDiem(sp, boLoc.dacDiem || [])) return false;
    if(boLoc.chiConHang && (sp.usedUp || sp.raw.stock_quantity <= 0)) return false;
    if(boLoc.khoaLoaiDo != null){
        var dauSp = chatDauMuc(sp.nameNorm);
        var dungDau = false;
        for(var d1 = 0; d1 < boLoc.khoaLoaiDo.dau.length; d1++){
            if(boLoc.khoaLoaiDo.dau[d1] == dauSp){ dungDau = true; break; }
        }
        if(!dungDau) return false;
        if(boLoc.khoaLoaiDo.co != null){
            var dungCo = false;
            for(var d2 = 0; d2 < boLoc.khoaLoaiDo.co.length; d2++){
                if(sp.nameNorm.indexOf(boLoc.khoaLoaiDo.co[d2]) >= 0){ dungCo = true; break; }
            }
            if(!dungCo) return false;
        }
    }
    // Kích thước ngưỡng cm cụ thể (lọc cứng — phần "cỡ lớn/ nhỏ" ở chatScoreItem)
    if(boLoc.kichThuoc != null && boLoc.kichThuoc.soMax != null
       && chatChieuDai(sp) > boLoc.kichThuoc.soMax) return false;
    if(boLoc.kichThuoc != null && boLoc.kichThuoc.soMin != null){
        var cd = chatChieuDai(sp);
        if(cd > 0 && cd < boLoc.kichThuoc.soMin) return false;
    }
    return true;
}

// Tính (và nhớ) ngưỡng phân vị "cỡ lớn/ nhỏ" cho một bộ lọc — gọi MỘT lần cho
// cả bộ lọc thay vì trong từng SP (trước đây lặp lồng nhau O(n²), ~560ms/câu).
var chatNguongCache = null;   // { khoa, lon, nho, du }
function chatNguongKichThuoc(boLoc){
    var khoa = boLoc.qn + "|" + (boLoc.khoaLoaiDo ? boLoc.khoaLoaiDo.nhan : "");
    if(chatNguongCache != null && chatNguongCache.khoa == khoa)
        return chatNguongCache;
    var tapSo = [];
    var idx = chatBuildIndex();
    for(var i = 0; i < idx.products.length; i++){
        if(chatScoreItemCoBan(idx.products[i], boLoc)) tapSo.push(idx.products[i]);
    }
    chatNguongCache = {
        khoa: khoa,
        lon: chatPhanVi(tapSo, 0.67),
        nho: chatPhanVi(tapSo, 0.33),
        du: tapSo.length >= 4
    };
    return chatNguongCache;
}

function chatScoreItem(sp, boLoc, qn){
    // Tất cả tiêu chí LOẠI dùng chung một chỗ (chatScoreItemCoBan) — hết trùng
    // lặp, hết lệch tập lọc giữa phần tính phân vị và phần trả kết quả
    if(!chatScoreItemCoBan(sp, boLoc)) return null;

    var diem = 0;
    // Danh mục (catch-all "nội thất" không cộng — không phải tín hiệu thật)
    if(boLoc.catIds.length > 0 && !boLoc.catIds.laCatchAll) diem += 20;
    if(boLoc.styleIds.length > 0) diem += 15;
    if(boLoc.color != null) diem += 25;
    if(boLoc.material != null) diem += 20;
    if(boLoc.dacDiem != null && boLoc.dacDiem.length > 0) diem += 30;
    if(boLoc.khoaLoaiDo != null) diem += 45;
    // Ngân sách: món ngoài vùng ngân sách bị hạ điểm, không loại hẳn
    if(boLoc.budget.max != null && sp.price > boLoc.budget.max) diem -= 50;
    if(boLoc.budget.min != null && sp.price < boLoc.budget.min) diem -= 15;
    // Kích thước "cỡ lớn/ nhỏ/ vừa": so với phân vị đã tính sẵn (cache, không O(n²))
    if(boLoc.kichThuoc != null && boLoc.kichThuoc.kieu != null){
        var nguong = chatNguongKichThuoc(boLoc);
        var chieuDaiSp = chatChieuDai(sp);
        if(nguong.du){
            if(chieuDaiSp == 0) diem -= 20;   // không đọc được -> hạ nhẹ, ưu tiên món có số
            else {
                if(boLoc.kichThuoc.kieu == "lon" && chieuDaiSp < nguong.lon) return null;
                if(boLoc.kichThuoc.kieu == "nho" && chieuDaiSp > nguong.nho) return null;
                if(boLoc.kichThuoc.kieu == "vua"
                   && (chieuDaiSp < nguong.nho || chieuDaiSp > nguong.lon)) return null;
            }
        }
    }
    // Ưu tiên món còn hàng
    if(sp.usedUp) diem -= 30;
    // Ưu tiên / né danh mục theo loại phòng: danh mục càng cốt lõi (đầu bảng) điểm càng cao
    if(boLoc.room != ""){
        var phongCach = chatPhongCachCua(boLoc.room);
        if(phongCach){
            for(var b = 0; b < phongCach.boost.length; b++){
                if(String(phongCach.boost[b]) == sp.catId){ diem += 45 - b * 5; break; }
            }
            if(chatInList(phongCach.avoid, sp.catId)) diem -= 40;
        }
    }
    // Đồ cũ / 3D
    if(boLoc.usedOnly && sp.used) diem += 20;
    if(boLoc.want3d && sp.has3d) diem += 10;
    // Khớp tên theo cụm danh mục đã nhận: món tên chứa đúng cụm được cộng mạnh
    if(boLoc.catIds.length > 0){
        var cacCum = [];
        for(var c2 = 0; c2 < CHAT_CATEGORY_PHRASES.length; c2++){
            if(chatInList(boLoc.catIds, CHAT_CATEGORY_PHRASES[c2][1])
               && chatHasPhrase(boLoc.qn, CHAT_CATEGORY_PHRASES[c2][0]))
                cacCum.push(CHAT_CATEGORY_PHRASES[c2][0]);
        }
        var cumDai = "";
        for(var c3 = 0; c3 < cacCum.length; c3++)
            if(cacCum[c3].length > cumDai.length) cumDai = cacCum[c3];
        if(cumDai != ""){
            if(sp.nameNorm.indexOf(cumDai) >= 0) diem += 60;
            else if(boLoc.catIds.length == 1 && chatDemKho(boLoc.catIds) > 5) diem -= 25;
        }
    }
    // Khớp tên (nếu khách nêu tên gần đúng)
    if(boLoc.keywords.length > 0){
        var khop = 0;
        for(var k = 0; k < boLoc.keywords.length; k++){
            if(sp.nameNorm.indexOf(boLoc.keywords[k]) >= 0) khop++;
        }
        if(khop == 0) return null;
        diem += khop * 30;
    }
    if(diem <= 0) return null;
    return diem;
}

// Lọc + sắp xếp sản phẩm theo bộ lọc; loại món đã gợi ý trước đó nếu có món thay thế
function chatSearch(boLoc, soLuong){
    var idx = chatBuildIndex();
    var ketQua = [];
    for(var i = 0; i < idx.products.length; i++){
        var diem = chatScoreItem(idx.products[i], boLoc, boLoc.qn);
        if(diem != null)
            ketQua.push({ diem: diem, sp: idx.products[i] });
    }
    // Điểm giảm dần; bằng điểm thì rẻ trước
    ketQua.sort(function(a, b){
        if(b.diem != a.diem) return b.diem - a.diem;
        return a.sp.price - b.sp.price;
    });
    // Đưa món đã gợi ý xuống cuối thay vì loại hẳn (phòng khi không còn món nào khác)
    var moi = [], cu = [];
    for(var j = 0; j < ketQua.length; j++){
        if(chatInList(chatShownIds, ketQua[j].sp.id)) cu.push(ketQua[j]);
        else moi.push(ketQua[j]);
    }
    var hopLe = moi.concat(cu);
    var chon = [];
    for(var k = 0; k < hopLe.length && chon.length < soLuong; k++)
        chon.push(hopLe[k].sp);
    return chon;
}

// Gọi API trợ lý cho câu hỏi khó; thất bại thì dùng câu nội bộ
function chatCallApi(question, boLoc, context, callback){
    // Tương thích chỗ gọi cũ: nếu không truyền context thì đặt callback về vị trí cũ
    if(callback == null){ callback = context; context = { candidates: [], relaxed: [] }; }
    if(chatApiState == false){
        callback({ text: chatApiFallbackText(), products: [], chips: chatSuggestChips() });
        return;
    }
    var xhr = new XMLHttpRequest();
    xhr.open("POST", CHAT_API_URL, true);
    xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    xhr.timeout = 50000;
    xhr.onreadystatechange = function(){
        if(xhr.readyState != 4) return;
        if(xhr.status == 200){
            try{
                var data = JSON.parse(xhr.responseText);
                if(data && data.reply){
                    chatApiState = true;
                    var reply = chatCheckAiReply(String(data.reply), boLoc);
                    // CHỈ hiện thẻ khi AI thật sự nhắc link sản phẩm trong câu trả lời.
                    // Câu phí giao/ chính sách/ tư vấn chung không gắn thẻ kèm theo
                    var spThe = chatTheTuReply(reply);
                    callback({ text: reply, products: spThe, chips: chatSuggestChips() });
                    return;
                }
            } catch(e){}
        }
        chatApiState = false;
        callback({ text: chatApiFallbackText(), products: [], chips: chatSuggestChips() });
    };
    xhr.ontimeout = function(){ chatApiState = false; callback(null); };
    xhr.onerror = function(){ chatApiState = false; callback(null); };

    var payload = {
        message: question,
        history: chatSessionHistory.slice(-6),
        candidates: context.candidates.length > 0 ? context.candidates : chatCandidateBriefs(boLoc, 8),
        relaxed: context.relaxed || []
    };
    xhr.send(JSON.stringify(payload));
}

// Tách mã sản phẩm trong reply của AI -> trả mảng dòng sản phẩm (để hiện thẻ)
function chatTheTuReply(reply){
    var idx = chatBuildIndex();
    var cacMa = reply.match(/product-detail\.html\?id=([a-z0-9-]+)/g) || [];
    var kq = [];
    for(var i = 0; i < cacMa.length && kq.length < 3; i++){
        var ma = cacMa[i].split("id=")[1];
        if(idx.byId[ma] != null) kq.push(idx.byId[ma]);
    }
    return kq;
}

// Câu dự phòng khi API không bật
function chatApiFallbackText(){
    return "Mình chưa kết nối được trợ lý AI ở máy chủ (chưa chạy server.js/ server.py). "
         + "Bạn vẫn có thể hỏi mình về giá, tồn kho, đồ cũ, mã giảm giá hoặc phí giao hàng nhé! "
         + "Ví dụ: \"sofa dưới 10 triệu\", \"mã giảm giá\", \"phí giao hàng về Đồng Nai\".";
}

// Tóm tắt ứng viên để API dựa vào, không tự bịa.
// boLoc rỗng (đã nới hết tín hiệu) -> lấy món bán chạy thay vì trả mảng rỗng
function chatCandidateBriefs(boLoc, soLuong){
    if(soLuong == null) soLuong = 3;
    var briefs = [];
    var sp = chatSearch(boLoc, soLuong);
    if(sp.length == 0) sp = chatTopBanChay(soLuong);
    for(var i = 0; i < sp.length; i++){
        var p = sp[i].raw;
        briefs.push({
            id: p.id, name: p.name, price: Number(p.price || 0),
            material: p.material || "", color: p.color || "",
            dimensions: p.dimensions || "", stock: Number(p.stock_quantity || 0)
        });
    }
    return briefs;
}

// Chặn AI bịa: mọi số tiền / mã sản phẩm phải có trong dữ liệu thật (toàn kho 971 SP).
// Với Phase C, AI có thể gợi ý món thay thế ngoài candidates -> kiểm tra trên toàn kho
function chatCheckAiReply(reply, boLoc){
    var idx = chatBuildIndex();
    var dung = [];
    for(var i = 0; i < idx.products.length; i++) dung.push(idx.products[i].price);
    var methods = getTable("shipping_methods");
    for(var m = 0; m < methods.length; m++){
        dung.push(Number(methods[m].fee_city || 0));
        dung.push(Number(methods[m].fee_province || 0));
        if(methods[m].fee_near) dung.push(Number(methods[m].fee_near));
        if(methods[m].fee_far) dung.push(Number(methods[m].fee_far));
    }

    var cacTien = reply.match(/(\d[\d.,]*)\s*(₫|đ\b|vnd|triệu|tr\b|k\b)/g) || [];
    for(var t = 0; t < cacTien.length; t++){
        var so = cacTien[t].replace(/[^\d]/g, "");
        if(so == "") continue;
        var giaTri = Number(so);
        if(/tr\b|triệu/.test(cacTien[t])) giaTri = giaTri * 1000000;
        if(/k\b/.test(cacTien[t])) giaTri = giaTri * 1000;
        if(dung.indexOf(giaTri) < 0)
            return "Mình vừa nhận câu trả lời từ trợ lý AI nhưng chưa khớp số liệu trong kho, nên dùng câu trả lời chuẩn của RoomCraft. "
                 + "Bạn hỏi cụ thể loại đồ (vd: \"sofa dưới 10 triệu\") để mình tra dữ liệu thật nhé!";
    }
    // Mã sản phẩm trong reply phải tồn tại
    var cacMa = reply.match(/product-detail\.html\?id=([a-z0-9-]+)/g) || [];
    for(var l = 0; l < cacMa.length; l++){
        var ma = cacMa[l].split("id=")[1];
        if(idx.byId[ma] == null)
            return "Câu trả lời AI có liên kết sản phẩm không có trong kho, mình dùng dữ liệu thật thay thế. "
                 + "Bạn hỏi cụ thể loại đồ để mình tra nhé!";
    }
    return reply;
}

function chatSuggestChips(){
    return ["Sofa dưới 10 triệu", "Bàn ăn gỗ", "Đồ cũ Marketplace", "Mã giảm giá", "Phí giao hàng"];
}

// Nhân chính: chọn nhánh và trả lời
function chatReply(question, callback){
    var qn = chatPrepare(question);
    var boLoc = chatBuildFilter(qn, question);
    var route = chatDecideRoute(boLoc);

    if(route == "greeting"){ callback(chatAnswerGreeting()); return; }
    if(route == "faq"){
        var faqAnswer = chatAnswerFaq(boLoc);
        if(faqAnswer != null){ callback(faqAnswer); return; }
        // Câu chính sách/ vận chuyển nhưng FAQ không khớp -> trả lời dẫn hướng,
        // TUYỆT ĐỐI không rơi xuống tra sản phẩm (câu phí ship không phải yêu cầu mua đồ)
        callback({
            text: "Về phần này RoomCraft hỗ trợ đầy đủ: phí giao & lắp đặt, thời gian nhận hàng, "
                + "thanh toán, đổi trả, bảo hành, hoá đơn và mã giảm giá. "
                + "Bạn hỏi cụ thể hơn (vd: \"phí giao hàng\", \"đổi trả thế nào\", \"mã giảm giá\") "
                + "để mình trả lời chính xác nhé!",
            products: [],
            chips: ["Phí giao hàng", "Chính sách đổi trả", "Thanh toán", "Mã giảm giá"]
        });
        return;
    }
    if(route == "products"){
        // "Xem thêm/ rẻ hơn" khi câu trước đã hiện đủ kho của loại đồ -> báo thật, không nới lọc bừa
        var laHoiThem = chatHasPhrase(qn, "xem them") || chatHasPhrase(qn, "khac khong")
            || chatHasPhrase(qn, "con mau") || chatHasPhrase(qn, "mau khac")
            || chatHasPhrase(qn, "re hon");
        if(laHoiThem && boLoc.khoaLoaiDo != null && boLoc.catIds.length > 0){
            var daTraLoi = chatAnswerProducts(boLoc);
            if(daTraLoi.products.length == 0){
                var tenLoai = boLoc.khoaLoaiDo.nhan || "loại đồ này";
                callback({
                    text: "Đây là toàn bộ các mẫu " + tenLoai + " mình đang có trong kho rồi. "
                        + "Bạn muốn xem loại đồ khác, hoặc đổi màu/ chất liệu/ ngân sách để mình lọc tiếp không?",
                    products: [],
                    chips: chatSuggestChips()
                });
                return;
            }
            callback(daTraLoi);
            return;
        }
        // Tra sản phẩm: chatAnswerProducts tự nới lọc (màu -> chất liệu -> từ khóa -> ngân sách)
        var spTraLoi = chatAnswerProducts(boLoc);
        // Câu quá ngắn ("bàn", "ghế") chưa rõ ý -> gợi ý món bán chạy thay vì bỏ trống
        if(spTraLoi.products.length == 0 && qn.split(" ").length <= 2 && qn.length <= 6){
            var banChay = chatTopBanChay(6);
            if(banChay.length > 0){
                callback({ text: "Bạn muốn tìm " + qn + " loại nào? Dưới đây là vài món đang có trong kho:", products: banChay, chips: chatSuggestChips() });
                return;
            }
        }
        callback(spTraLoi);
        return;
    }
    if(route == "api"){
        // Câu chỉ có ngân sách ("cái gì dưới 500k") hoặc 1 từ chung chung -> vẫn tra được
        if(boLoc.budget.max != null || (qn.split(" ").length <= 2 && qn.length <= 6)){
            var banChayNgan = chatTopBanChay(6);
            if(banChayNgan.length > 0){
                var dan = boLoc.budget.max != null
                    ? "Các món dưới " + formatVND(boLoc.budget.max) + " đang có trong kho:"
                    : "Bạn muốn tìm " + qn + " loại nào? Dưới đây là vài món đang có trong kho:";
                callback({ text: dan, products: banChayNgan, chips: chatSuggestChips() });
                return;
            }
        }
    }
    // Câu tư vấn mở ("tư vấn giúp phòng khách bohemian", "nên bố trí phòng ngủ thế nào"...)
    // -> trả 1 tin "đợi trong giây lát" NGAY (không thẻ SP), AI trả lời thì append tin thứ 2
    if(route == "advice"){
        // Lưu ngữ cảnh TRƯỚC để "Xem thêm mẫu khác"/ "Rẻ hơn" bám đúng loại đồ đã tư vấn
        var spAdvice = chatSearch(boLoc, 3);
        chatGhiNhoNguCanh(boLoc, spAdvice);
        var contextTuVan = {
            candidates: chatCandidateBriefs(boLoc, 8),
            relaxed: chatLastRelaxed || []
        };
        var chuDe = boLoc.object ? boLoc.object.label
            : (boLoc.room != "" ? boLoc.room
            : (boLoc.khoaLoaiDo ? boLoc.khoaLoaiDo.nhan : "không gian của bạn"));
        callback({
            text: "Câu tư vấn về " + chuDe + " cần trợ lý AI phân tích kỹ, bạn đợi trong giây lát nhé!",
            products: [],
            chips: []
        });
        // AI chạy nền; trả lời được thì append tin nhắn thứ 2 (thẻ SP chỉ khi AI nhắc link)
        chatCallApi(question, boLoc, contextTuVan, function(ketQuaAI){
            if(ketQuaAI == null || ketQuaAI.text == chatApiFallbackText()){
                // AI lỗi/ timeout -> xin lỗi ngắn gọn, không để khách chờ hoài
                chatAppendAiAnswer({
                    text: "Xin lỗi bạn, trợ lý AI đang bận nên mình chưa tư vấn chi tiết được lúc này. "
                        + "Bạn có thể hỏi về loại đồ cụ thể (vd: \"sofa dưới 10 triệu\") để mình tra dữ liệu ngay nhé!",
                    products: [],
                    chips: []
                });
                return;
            }
            chatAppendAiAnswer(ketQuaAI);
        });
        return;
    }
    // Câu khó -> API. Chụp ngữ cảnh TRƯỚC (candidates 8 món + đã nới gì) để AI tư vấn thay thế
    var context = {
        candidates: chatCandidateBriefs(boLoc, 8),
        relaxed: chatLastRelaxed || []
    };
    chatLastRelaxed = null;
    chatCallApi(question, boLoc, context, function(ketQua){
        if(ketQua == null)
            ketQua = { text: chatApiFallbackText(), products: [], chips: chatSuggestChips() };
        callback(ketQua);
    });
}


/* =====================================================================
   HIỂN THỊ TIN NHẮN & FORMAT NỘI DUNG (GIỮ NGUYÊN GIAO DIỆN)
   ===================================================================== */
function appendMessage(text, sender, tuyChon){
    var container = document.getElementById("rcChatMessages");
    if(!container) return;

    var now = new Date();
    var hours = now.getHours();
    var mins = now.getMinutes();
    var timeStr = (hours < 10 ? "0" + hours : hours) + ":" + (mins < 10 ? "0" + mins : mins);

    tuyChon = tuyChon || {};
    var formatted = (sender === "bot") ? formatResponseHtml(text) : escapeHtml(text);

    var msgDiv = document.createElement("div");
    msgDiv.className = "rc-msg rc-msg-" + sender;
    var bubble = "<div class='rc-msg-bubble'>" + formatted;

    // Thẻ sản phẩm thật (ảnh + tên + giá + tồn kho) dưới câu trả lời
    if(sender == "bot" && tuyChon.products && tuyChon.products.length > 0){
        bubble += "<div class='rc-chat-products'>";
        for(var i = 0; i < tuyChon.products.length; i++){
            var sp = tuyChon.products[i];
            var p = sp.raw;
            var anh = (p.images && p.images.length > 0) ? asset(p.images[0]) : "";
            var nhan = "";
            if(sp.usedUp) nhan = sp.used ? "Đã bán" : "Hết hàng";
            else if(sp.used) nhan = sp.grade || "Đồ cũ";
            else if(sp.stock <= 5) nhan = "Còn " + sp.stock;
            else nhan = "Còn hàng";
            bubble += "<a class='rc-chat-product' href='product-detail.html?id=" + encodeURIComponent(sp.id) + "'>"
                   + "<img src='" + anh + "' alt=''>"
                   + "<span class='rc-chat-product-meta'>"
                   + "<span class='rc-chat-product-name'>" + escapeHtml(sp.name) + "</span>"
                   + "<span class='rc-chat-product-price'>" + formatVND(sp.price)
                   + (sp.origPrice > sp.price ? " <s>" + formatVND(sp.origPrice) + "</s>" : "")
                   + "</span>"
                   + "<span class='rc-chat-product-note'>" + escapeHtml(nhan) + "</span>"
                   + "</span></a>";
        }
        bubble += "</div>";
    }

    // Chip gợi ý câu hỏi tiếp theo (escape nội dung để tránh chèn HTML lạ)
    if(sender == "bot" && tuyChon.chips && tuyChon.chips.length > 0){
        bubble += "<div class='rc-chat-suggestions' style='margin-top:8px;'>";
        for(var c = 0; c < tuyChon.chips.length; c++){
            var chipAnToan = escapeHtml(tuyChon.chips[c]).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            bubble += "<span class='rc-suggestion-chip' onclick='handleQuickTopic(\"" + chipAnToan + "\")'>" + tuyChon.chips[c] + "</span>";
        }
        bubble += "</div>";
    }

    bubble += "</div>";

    msgDiv.innerHTML = bubble + "<span class='rc-msg-time'>" + timeStr + "</span>";

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

// Route "advice": AI trả lời ở nền xong thì append tin nhắn thứ 2 (kèm thẻ sản phẩm).
// Lỗi/ timeout thì im lặng — tin nhắn local đầu tiên đã đủ dùng.
function chatAppendAiAnswer(ketQua){
    if(ketQua == null || !ketQua.text) return;
    var container = document.getElementById("rcChatMessages");
    if(!container) return;   // đã đóng chat -> bỏ qua
    appendMessage(ketQua.text, "bot", { products: ketQua.products || [], chips: [] });
}

function escapeHtml(text){
    if(!text) return "";
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatResponseHtml(text){
    if(!text) return "";
    var html = escapeHtml(text);      // câu trả lời từ AI có thể chứa thẻ HTML lạ, đổi < > & trước rồi mới định dạng

    // Định dạng in đậm **text**
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Định dạng in nghiêng *text*
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    // Định dạng link Markdown [Text](url)
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' target='_blank' style='color:#202020;font-weight:600;text-decoration:underline;'>$1</a>");
    // Định dạng gạch đầu dòng
    html = html.replace(/^\s*[-•*]\s+(.*)$/gm, "<div style='margin-left:8px;margin-top:2px;'>• $1</div>");
    // Định dạng ngắt dòng
    html = html.replace(/\n\n+/g, "</p><p style='margin-top:6px;'>");
    html = html.replace(/\n/g, "<br>");

    return "<p>" + html + "</p>";
}

function showTypingIndicator(){
    var container = document.getElementById("rcChatMessages");
    if(!container) return;

    var ind = document.createElement("div");
    ind.id = "rcTypingIndicator";
    ind.className = "rc-msg rc-msg-bot rc-typing-indicator";
    ind.innerHTML = "<div class='rc-msg-bubble rc-typing-bubble'>"
                  + "  <span></span><span></span><span></span>"
                  + "</div>";
    container.appendChild(ind);
    container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator(){
    var ind = document.getElementById("rcTypingIndicator");
    if(ind && ind.parentNode)
        ind.parentNode.removeChild(ind);
}
