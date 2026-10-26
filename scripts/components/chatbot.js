/* =====================================================================
   ROOMCRAFT - chatbot.js (Trợ lý tư vấn nội thất AI RoomCraft)
   Người phụ trách: Như Huyền
   Nhiệm vụ:
     - Giữ nguyên 100% giao diện, màu sắc, font chữ và các câu hỏi gợi ý.
     - Nâng cấp chức năng xử lý tin nhắn, kết nối Backend AI API (/api/chat).
     - Duy trì ngữ cảnh hội thoại (Conversation History) trong phiên sử dụng.
     - Xử lý lỗi kết nối, timeout và hiển thị thông báo thân thiện.
   ===================================================================== */

var chatbotIsOpen = false;
var chatSessionHistory = []; // Lưu ngữ cảnh hội thoại trong phiên

function renderChatbot(){
    if(document.getElementById("rcChatbotWrapper"))
        return;

    injectChatbotStyles();

    var wrapper = document.createElement("div");
    wrapper.id = "rcChatbotWrapper";

    var html = "";
    // Nút mở chat nổi ở góc phải dưới
    html += "<button id='rcChatToggleBtn' class='rc-chat-toggle-btn' onclick='toggleChatbot()' title='Trò chuyện với RoomCraft' aria-label='Mở khung chat'>"
          + "  <span class='material-symbols-outlined rc-icon-chat'>chat_bubble</span>"
          + "  <span class='material-symbols-outlined rc-icon-close' style='display:none;'>close</span>"
          + "  <span class='rc-chat-badge' id='rcChatBadge'>1</span>"
          + "</button>";

    // Cửa sổ chat (Giữ nguyên toàn bộ cấu trúc giao diện gốc)
    html += "<div id='rcChatBox' class='rc-chat-box rc-chat-hidden'>"
          + "  <div class='rc-chat-header'>"
          + "    <div class='rc-chat-header-info'>"
          + "      <div class='rc-chat-avatar'><span class='material-symbols-outlined'>support_agent</span></div>"
          + "      <div>"
          + "        <h4 class='rc-chat-title'>Trợ lý ảo RoomCraft</h4>"
          + "        <p class='rc-chat-status'><span class='rc-status-dot'></span>Trực tuyến • Sẵn sàng hỗ trợ</p>"
          + "      </div>"
          + "    </div>"
          + "    <button class='rc-chat-close-btn' onclick='toggleChatbot()' title='Đóng' aria-label='Đóng khung chat'>"
          + "      <span class='material-symbols-outlined'>close</span>"
          + "    </button>"
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

function sendChatMessage(){
    var input = document.getElementById("rcTxtChatInput");
    var question = (input.value || "").trim();
    if(question === "") return;

    appendMessage(question, "user");
    input.value = "";

    // Ghi nhận vào lịch sử hội thoại trong phiên
    chatSessionHistory.push({ role: "user", content: question });

    showTypingIndicator();

    // Gửi yêu cầu tới Backend API trung gian
    callBackendChatApi(question, chatSessionHistory, function(replyText){
        removeTypingIndicator();
        appendMessage(replyText, "bot");
        // Lưu câu trả lời vào lịch sử hội thoại
        chatSessionHistory.push({ role: "model", content: replyText });
    });
}

function handleQuickTopic(topicText){
    var input = document.getElementById("rcTxtChatInput");
    input.value = topicText;
    sendChatMessage();
}

/* =====================================================================
   KẾT NỐI BACKEND AI API VÀ DỰ PHÒNG THÔNG MINH
   ===================================================================== */
function callBackendChatApi(userQuestion, history, callback){
    // Endpoint backend trung gian: ưu tiên cổng 3000 (server.py / server.js) hoặc cùng host
    var endpoints = [
        "http://localhost:3000/api/chat",
        "http://127.0.0.1:3000/api/chat",
        "/api/chat"
    ];

    tryEndpointAt(0, endpoints, userQuestion, history, callback);
}

function tryEndpointAt(index, endpoints, userQuestion, history, callback){
    if(index >= endpoints.length){
        // Nếu tất cả backend endpoints đều không phản hồi: Fallback sang bộ FAQs cục bộ
        var localAnswer = findFaqOrLocalResponse(userQuestion);
        callback(localAnswer);
        return;
    }

    var endpointUrl = endpoints[index];
    var xhr = new XMLHttpRequest();
    xhr.open("POST", endpointUrl, true);
    xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    xhr.timeout = 10000; // Timeout 10 giây

    xhr.onreadystatechange = function(){
        if(xhr.readyState === 4){
            if(xhr.status === 200){
                try{
                    var data = JSON.parse(xhr.responseText);
                    if(data && data.reply){
                        callback(data.reply);
                        return;
                    }
                } catch(e){}
            }
            // Thử endpoint tiếp theo
            tryEndpointAt(index + 1, endpoints, userQuestion, history, callback);
        }
    };

    xhr.ontimeout = function(){
        tryEndpointAt(index + 1, endpoints, userQuestion, history, callback);
    };

    xhr.onerror = function(){
        tryEndpointAt(index + 1, endpoints, userQuestion, history, callback);
    };

    var payload = {
        message: userQuestion,
        history: history.slice(-6) // Gửi tối đa 6 lượt tin nhắn gần nhất
    };
    xhr.send(JSON.stringify(payload));
}

// Phản hồi dự phòng thân thiện nếu máy chủ backend chưa khởi động
function findFaqOrLocalResponse(queryText){
    var rawFaqs = getTable("chatbot_faqs");
    var qNorm = normalizeText(queryText);

    var bestMatch = null;
    var maxScore = 0;

    for(var i = 0; i < rawFaqs.length; i++){
        var f = rawFaqs[i];
        if(f.is_active === false) continue;

        var kwList = (f.keywords || "").split(",");
        var score = 0;
        for(var k = 0; k < kwList.length; k++){
            var kw = normalizeText(kwList[k]);
            if(kw.length > 0 && qNorm.indexOf(kw) >= 0){
                score += kw.length * 3;
            }
        }
        if(score > maxScore){
            maxScore = score;
            bestMatch = f;
        }
    }

    if(bestMatch && maxScore >= 5){
        return bestMatch.answer;
    }

    return "Hiện tại hệ thống AI đang tạm thời gián đoạn kết nối máy chủ. Bạn vui lòng thử lại sau giây lát hoặc liên hệ hotline 1900 6868 để được chuyên viên RoomCraft hỗ trợ trực tiếp nhé!";
}

function normalizeText(str){
    if(!str) return "";
    var s = str.toLowerCase();
    s = s.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    s = s.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    s = s.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    s = s.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    s = s.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    s = s.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    s = s.replace(/đ/g, "d");
    return s.replace(/[^a-z0-9 ]/g, " ").trim();
}

/* =====================================================================
   HIỂN THỊ TIN NHẮN & FORMAT NỘI DUNG (GIỮ NGUYÊN GIAO DIỆN)
   ===================================================================== */
function appendMessage(text, sender){
    var container = document.getElementById("rcChatMessages");
    if(!container) return;

    var now = new Date();
    var hours = now.getHours();
    var mins = now.getMinutes();
    var timeStr = (hours < 10 ? "0" + hours : hours) + ":" + (mins < 10 ? "0" + mins : mins);

    var formatted = (sender === "bot") ? formatResponseHtml(text) : escapeHtml(text);

    var msgDiv = document.createElement("div");
    msgDiv.className = "rc-msg rc-msg-" + sender;
    msgDiv.innerHTML = "<div class='rc-msg-bubble'>" + formatted + "</div>"
                     + "<span class='rc-msg-time'>" + timeStr + "</span>";

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

function escapeHtml(text){
    if(!text) return "";
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatResponseHtml(text){
    if(!text) return "";
    var html = text;

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

/* =====================================================================
   CSS CHO CHATBOT (GIỮ NGUYÊN 100% GIAO DIỆN GỐC)
   ===================================================================== */
function injectChatbotStyles(){
    if(document.getElementById("rcChatbotStyles"))
        return;

    var style = document.createElement("style");
    style.id = "rcChatbotStyles";
    style.textContent = ""
        + "#rcChatbotWrapper{ position: fixed; bottom: 24px; right: 24px; z-index: 9999; font-family: 'Inter', Arial, sans-serif; }\n"
        + ".rc-chat-toggle-btn{ position: relative; width: 56px; height: 56px; border-radius: 50%; background: #202020; color: #FFFFFF; border: none; box-shadow: 0 6px 18px rgba(0,0,0,0.18); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s, background 0.2s; outline: none; }\n"
        + ".rc-chat-toggle-btn:hover{ background: #383838; transform: scale(1.05); }\n"
        + ".rc-chat-toggle-btn .material-symbols-outlined{ font-size: 26px; color: #FFFFFF; }\n"
        + ".rc-chat-badge{ position: absolute; top: -2px; right: -2px; width: 18px; height: 18px; border-radius: 50%; background: #8C3B2D; color: #FFFFFF; font-size: 10px; font-weight: 600; line-height: 18px; text-align: center; border: 2px solid #FFFFFF; }\n"
        + ".rc-chat-box{ position: absolute; bottom: 70px; right: 0; width: 380px; max-width: calc(100vw - 32px); height: 530px; max-height: calc(100vh - 120px); background: #FFFFFF; border: 1px solid #DADAD7; box-shadow: 0 12px 36px rgba(0,0,0,0.15); display: flex; flex-direction: column; overflow: hidden; transition: opacity 0.25s ease, transform 0.25s ease; }\n"
        + ".rc-chat-box.rc-chat-hidden{ opacity: 0; transform: translateY(18px) scale(0.96); pointer-events: none; visibility: hidden; }\n"
        + ".rc-chat-header{ display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #202020; color: #FFFFFF; }\n"
        + ".rc-chat-header-info{ display: flex; align-items: center; gap: 12px; }\n"
        + ".rc-chat-avatar{ width: 34px; height: 34px; border-radius: 50%; background: #383838; display: flex; align-items: center; justify-content: center; }\n"
        + ".rc-chat-avatar .material-symbols-outlined{ font-size: 20px; color: #F7F7F5; }\n"
        + ".rc-chat-title{ font-family: 'EB Garamond', Georgia, serif; font-size: 18px; font-weight: 500; letter-spacing: 0.02em; margin: 0; }\n"
        + ".rc-chat-status{ font-size: 11px; color: #DADAD7; margin: 0; display: flex; align-items: center; gap: 6px; }\n"
        + ".rc-status-dot{ width: 6px; height: 6px; border-radius: 50%; background: #485238; display: inline-block; box-shadow: 0 0 0 2px rgba(72,82,56,0.3); }\n"
        + ".rc-chat-close-btn{ background: transparent; border: none; color: #DADAD7; cursor: pointer; padding: 4px; display: flex; align-items: center; border-radius: 4px; }\n"
        + ".rc-chat-close-btn:hover{ color: #FFFFFF; background: rgba(255,255,255,0.1); }\n"
        + ".rc-chat-messages{ flex: 1; padding: 16px; overflow-y: auto; background: #F7F7F5; display: flex; flex-direction: column; gap: 12px; font-size: 13.5px; line-height: 20px; }\n"
        + ".rc-msg{ display: flex; flex-direction: column; max-width: 86%; }\n"
        + ".rc-msg-bot{ align-self: flex-start; }\n"
        + ".rc-msg-user{ align-self: flex-end; align-items: flex-end; }\n"
        + ".rc-msg-bubble{ padding: 10px 14px; border: 1px solid #DADAD7; word-wrap: break-word; }\n"
        + ".rc-msg-bot .rc-msg-bubble{ background: #FFFFFF; color: #202020; }\n"
        + ".rc-msg-user .rc-msg-bubble{ background: #202020; color: #FFFFFF; border-color: #202020; }\n"
        + ".rc-msg-time{ font-size: 10px; color: #686868; margin-top: 3px; padding: 0 2px; }\n"
        + ".rc-chat-suggestions{ display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }\n"
        + ".rc-suggestion-chip{ display: inline-block; padding: 5px 10px; background: #FFFFFF; border: 1px solid #DADAD7; font-size: 11.5px; color: #202020; cursor: pointer; transition: all 0.15s; }\n"
        + ".rc-suggestion-chip:hover{ background: #202020; color: #FFFFFF; border-color: #202020; }\n"
        + ".rc-chat-footer{ display: flex; gap: 8px; padding: 10px 14px; background: #FFFFFF; border-top: 1px solid #DADAD7; align-items: center; }\n"
        + ".rc-chat-input{ flex: 1; height: 38px; padding: 0 12px; background: #F7F7F5; border: 1px solid #DADAD7; font-size: 13px; outline: none; border-radius: 0; }\n"
        + ".rc-chat-input:focus{ border-color: #202020; background: #FFFFFF; }\n"
        + ".rc-chat-send-btn{ width: 38px; height: 38px; background: #202020; color: #FFFFFF; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; }\n"
        + ".rc-chat-send-btn:hover{ background: #383838; }\n"
        + ".rc-chat-send-btn .material-symbols-outlined{ font-size: 18px; }\n"
        + ".rc-typing-bubble{ display: flex; align-items: center; gap: 4px; padding: 10px 14px; background: #FFFFFF; border: 1px solid #DADAD7; }\n"
        + ".rc-typing-bubble span{ width: 6px; height: 6px; border-radius: 50%; background: #686868; animation: rcBlink 1.2s infinite ease-in-out both; }\n"
        + ".rc-typing-bubble span:nth-child(1){ animation-delay: -0.32s; }\n"
        + ".rc-typing-bubble span:nth-child(2){ animation-delay: -0.16s; }\n"
        + "@keyframes rcBlink{ 0%, 80%, 100%{ transform: scale(0); opacity: 0.3; } 40%{ transform: scale(1); opacity: 1; } }\n"
        + "@media (max-width: 480px){ .rc-chat-box{ width: 100vw; height: calc(100vh - 80px); max-height: none; right: -12px; bottom: 64px; } }\n";

    document.head.appendChild(style);
}
