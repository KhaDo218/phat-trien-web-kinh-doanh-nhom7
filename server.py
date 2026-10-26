"""
=====================================================================
ROOMCRAFT - AI Chatbot Backend Server (Python Standard Library)
Khởi chạy: python server.py
Cổng mặc định: 3000 (truy cập http://localhost:3000)
Tác dụng:
  1. Bảo vệ Gemini API Key ở backend (đọc từ file .env hoặc biến môi trường).
  2. Cung cấp API POST /api/chat cho Chatbot RoomCraft với cơ chế RAG.
  3. Hỗ trợ CORS để chạy song song với Live Server (port 5500).
  4. Phục vụ file tĩnh (static files) của website.
=====================================================================
"""

import http.server
import json
import os
import re
import socketserver
import sys
import time
import urllib.error
import urllib.request

# Đảm bảo in tiếng Việt trên console Windows không lỗi charmap
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Cổng mặc định

PORT = int(os.environ.get("PORT", 3000))

# Đọc file .env nếu có
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    if key and not os.environ.get(key):
                        os.environ[key] = val

load_env()

# Lấy Gemini API Key
def get_gemini_api_key():
    return os.environ.get("GEMINI_API_KEY", "").strip()

# Bộ nhớ giới hạn lượt gọi (Rate Limiting): tối đa 30 request/phút/IP
rate_limit_cache = {}
RATE_LIMIT_MAX = 30
RATE_LIMIT_WINDOW = 60

def check_rate_limit(client_ip):
    now = time.time()
    timestamps = rate_limit_cache.get(client_ip, [])
    # Loại bỏ các lượt gọi ngoài cửa sổ 60s
    timestamps = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
    if len(timestamps) >= RATE_LIMIT_MAX:
        rate_limit_cache[client_ip] = timestamps
        return False
    timestamps.append(now)
    rate_limit_cache[client_ip] = timestamps
    return True

# Nạp dữ liệu sản phẩm, danh mục, phong cách
PRODUCTS = []
CATEGORIES = {}
STYLES = {}
FAQS = []

def load_data():
    global PRODUCTS, CATEGORIES, STYLES, FAQS
    base_dir = os.path.dirname(__file__)

    # Categories
    cat_file = os.path.join(base_dir, "data", "json", "categories.json")
    if os.path.exists(cat_file):
        try:
            with open(cat_file, "r", encoding="utf-8") as f:
                cats = json.load(f)
                CATEGORIES = {c["id"]: c["name"] for c in cats}
        except Exception as e:
            print("Lỗi đọc categories.json:", e)

    # Styles
    style_file = os.path.join(base_dir, "data", "json", "styles.json")
    if os.path.exists(style_file):
        try:
            with open(style_file, "r", encoding="utf-8") as f:
                styles = json.load(f)
                STYLES = {s["id"]: s["name"] for s in styles}
        except Exception as e:
            print("Lỗi đọc styles.json:", e)

    # FAQs
    FAQS = []
    faq_file = os.path.join(base_dir, "data", "json", "chatbot_faqs.json")
    if os.path.exists(faq_file):
        try:
            with open(faq_file, "r", encoding="utf-8") as f:
                FAQS = json.load(f)
        except Exception as e:
            print("Lỗi đọc chatbot_faqs.json:", e)

    # Products (mới + cũ)
    PRODUCTS = []
    p_file = os.path.join(base_dir, "data", "json", "products.json")
    if os.path.exists(p_file):
        try:
            with open(p_file, "r", encoding="utf-8") as f:
                PRODUCTS.extend(json.load(f))
        except Exception as e:
            print("Lỗi đọc products.json:", e)

    used_file = os.path.join(base_dir, "data", "json", "used_products.json")
    if os.path.exists(used_file):
        try:
            with open(used_file, "r", encoding="utf-8") as f:
                used = json.load(f)
                PRODUCTS.extend(used)
        except Exception as e:
            print("Lỗi đọc used_products.json:", e)

    print(f"[*] Đã nạp {len(PRODUCTS)} sản phẩm ({len(CATEGORIES)} danh mục, {len(STYLES)} phong cách, {len(FAQS)} FAQs)")

load_data()

# Tiện ích chuẩn hóa tiếng Việt
def normalize_vi(text):
    if not text:
        return ""
    s = text.lower()
    patterns = {
        '[àáạảãâầấậẩẫăằắặẳẵ]': 'a',
        '[èéẹẻẽêềếệểễ]': 'e',
        '[ìíịỉĩ]': 'i',
        '[òóọỏõôồốộổỗơờớợởỡ]': 'o',
        '[ùúụủũưừứựửữ]': 'u',
        '[ỳýỵỷỹ]': 'y',
        'đ': 'd'
    }
    for pat, rep in patterns.items():
        s = re.sub(pat, rep, s)
    return re.sub(r'[^a-z0-9 ]', ' ', s).strip()

# Danh sách stopwords tiếng Việt phổ biến trong hội thoại
STOPWORDS = {
    'co', 'khong', 'cho', 'minh', 'toi', 'em', 'anh', 'chi', 'hoi', 'cac', 
    'nhung', 'duoc', 'vay', 'nhe', 'nhi', 'gi', 'nao', 'dau', 'nhu', 'the', 
    'sao', 'la', 'voi', 'va', 've', 'o', 'tai', 'duoi', 'tren', 'tam', 
    'khoang', 'muc', 'gia', 'tien', 'trieu', 'tr', 'k', 'dong', 'vnd', 
    'chiec', 'cai', 'bo', 'loai', 'can', 'muon', 'tim', 'mau'
}

KEY_PHRASES = [
    ('ban an', 7),
    ('ghe an', 7),
    ('ban lam viec', 12),
    ('ban tra', 6),
    ('ban phu', 6),
    ('ke tivi', 11),
    ('tu quan ao', 10),
    ('tu dau giuong', 10),
    ('sofa giuong', 8),
    ('sofa goc', 8),
    ('sofa', 8),
    ('ghe thu gian', 5),
    ('ghe bar', 7),
    ('ghe dau', 7),
    ('binh hoa', 15),
    ('tham', 19),
    ('tranh', 16),
    ('guong', 16),
    ('den trang tri', 18),
    ('chan ga', 21),
    ('goi tua', 17)
]

COLORS = {
    'hong': ['hong', 'kem hong', 'pastel'],
    'trang': ['trang', 'white', 'ivory', 'ngoc trai'],
    'den': ['den', 'black'],
    'xam': ['xam', 'gray', 'grey', 'xi mang'],
    'nau': ['nau', 'brown', 'walnut', 'cognac', 'go'],
    'xanh': ['xanh', 'blue', 'green', 'navy', 'cham'],
    'vang': ['vang', 'gold', 'yellow'],
    'cam': ['cam', 'orange'],
    'be': ['be', 'beige', 'cat'],
    'tim': ['tim', 'purple', 'violet'],
    'do': ['do', 'red', 'burgundy']
}

def match_faq(query):
    q_norm = normalize_vi(query)
    q_words = set(q_norm.split())
    scored = []
    for item in FAQS:
        if not item.get("is_active", True):
            continue
        kw_list = [normalize_vi(k.strip()) for k in item.get("keywords", "").split(",") if k.strip()]
        score = 0
        for kw in kw_list:
            if kw in q_norm:
                score += len(kw.split()) * 12
            else:
                kw_words = set(kw.split())
                common = q_words.intersection(kw_words)
                if common:
                    score += len(common) * 3
        if score >= 10:
            scored.append((score, item))
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[0][1] if scored else None

# Trích xuất ngân sách nếu khách có nêu trong câu hỏi (vd: "dưới 5 triệu", "dưới 3tr", "< 10.000.000")
def extract_budget(query_text):
    q = normalize_vi(query_text)
    m = re.search(r'(?:duoi|<|khoang|tam|duoi muc|duoi gia)\s*(\d+(?:[.,]\d+)?)\s*(?:trieu|tr|m\b)', q)
    if m:
        val = float(m.group(1).replace(',', '.'))
        return int(val * 1000000)
    m2 = re.search(r'(?:duoi|<|tam)\s*(\d{1,3}(?:[.,]\d{3}){1,3})', q)
    if m2:
        val_str = re.sub(r'[.,]', '', m2.group(1))
        return int(val_str)
    m3 = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:trieu|tr)\b', q)
    if m3:
        val = float(m3.group(1).replace(',', '.'))
        return int(val * 1000000)
    return None

# Tìm kiếm sản phẩm liên quan (RAG)
def search_products(query, max_items=5):
    q_norm = normalize_vi(query)
    tokens = [t for t in q_norm.split() if t not in STOPWORDS and len(t) >= 2]
    budget = extract_budget(query)
    is_asking_used = any(k in q_norm for k in ["do cu", "cu", "secondhand", "used", "marketplace"])

    # Xác định nếu khách hỏi một màu cụ thể (ví dụ: "màu hồng", "màu tím", "màu xanh"...)
    target_colors = []
    m_color = re.search(r'(?:mau|gam mau|tong|tone|color)\s+([a-z]+)', q_norm)
    if m_color:
        c_req = m_color.group(1)
        if c_req in COLORS:
            target_colors = COLORS[c_req]
        elif c_req not in STOPWORDS:
            target_colors = [c_req]

    scored = []
    for p in PRODUCTS:
        if p.get("is_active") is False:
            continue

        price = p.get("price", 0)
        # Nếu khách nêu ngân sách: lọc chặt chẽ
        if budget and price > budget:
            continue

        p_name = p.get("name", "")
        p_desc = p.get("description", "")
        p_mat = p.get("material", "")
        p_color = p.get("color", "")
        p_brand = p.get("brand", "")

        name_norm = normalize_vi(p_name)
        desc_norm = normalize_vi(p_desc)
        mat_norm = normalize_vi(p_mat)
        color_norm = normalize_vi(p_color)
        corpus = f"{name_norm} {desc_norm} {mat_norm} {color_norm} {normalize_vi(p_brand)}"

        name_words = set(name_norm.split())
        corpus_words = set(corpus.split())

        score = 0

        # Kiểm tra màu sắc nếu người dùng chỉ định màu cụ thể: bắt buộc phải có màu này
        if target_colors:
            has_color = any(re.search(r'\b' + re.escape(tc) + r'\b', color_norm) for tc in target_colors)
            if not has_color:
                continue
            score += 35

        # Ưu tiên sản phẩm đồ cũ nếu khách hỏi đồ cũ
        if is_asking_used:
            if p.get("product_type") == "USED":
                score += 30
            else:
                score -= 10

        # Khớp cụm từ khóa chuyên biệt (bàn ăn, sofa, bàn làm việc...)
        for phrase, cat_id in KEY_PHRASES:
            if phrase in q_norm:
                if phrase in name_norm:
                    score += 45
                elif cat_id and p.get("category_id") == cat_id:
                    score += 25
                elif phrase in corpus:
                    score += 15

        # Khớp từng từ (khớp toàn từ, không khớp substring để tránh nhiễu)
        for t in tokens:
            if t in name_words:
                score += len(t) * 5
            elif t in corpus_words:
                score += len(t) * 2

        # Khớp phong cách
        for style_id, style_name in STYLES.items():
            st_norm = normalize_vi(style_name)
            if st_norm in q_norm:
                p_styles = p.get("style_ids", []) or [p.get("style_id")]
                if style_id in p_styles:
                    score += 15

        # Khớp danh mục
        for cat_id, cat_name in CATEGORIES.items():
            c_norm = normalize_vi(cat_name)
            if c_norm in q_norm and p.get("category_id") == cat_id:
                score += 12

        # Khớp xem 3D
        if "3d" in q_norm and p.get("model_3d_url"):
            score += 15

        if score >= 5:
            scored.append((score, p))

    # Nếu câu hỏi nhắm vào loại sản phẩm cụ thể (sofa, bàn ăn, bàn làm việc...)
    # chỉ giữ lại sản phẩm phù hợp nhất với loại đó
    for phrase, cat_id in KEY_PHRASES:
        if phrase in q_norm:
            primary_items = [
                item for item in scored 
                if phrase in normalize_vi(item[1].get("name", "")) or (cat_id and item[1].get("category_id") == cat_id)
            ]
            scored = primary_items
            break

    scored.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored[:max_items]]

def format_vnd(amount):
    try:
        val = int(amount)
        return f"{val:,}".replace(",", ".") + " ₫"
    except Exception:
        return str(amount) + " ₫"

# Định dạng context sản phẩm gửi cho AI
def format_product_context(products):
    if not products:
        return "Không tìm thấy sản phẩm nào trong kho đáp ứng trực tiếp yêu cầu này."

    lines = []
    for p in products:
        cat_name = CATEGORIES.get(p.get("category_id"), "Nội thất")
        style_ids = p.get("style_ids", []) or [p.get("style_id")]
        style_names = [STYLES.get(sid, "") for sid in style_ids if sid in STYLES]
        style_str = ", ".join(filter(bool, style_names)) or "Hiện đại"

        is_used = (p.get("product_type") == "USED")
        stock = p.get("stock_quantity", 0)
        stock_str = "Còn hàng" if stock > 0 else ("Đã bán" if is_used else "Hết hàng")

        line = (
            f"- Mã: {p.get('id')}\n"
            f"  Tên: {p.get('name')}\n"
            f"  Giá: {format_vnd(p.get('price', 0))}"
            f" (Giá gốc: {format_vnd(p.get('original_price', 0))})\n" if p.get('original_price') else "\n"
            f"  Danh mục: {cat_name} | Phong cách: {style_str}\n"
            f"  Chất liệu: {p.get('material', 'Chưa rõ')} | Màu: {p.get('color', 'Chưa rõ')} | Kích thước: {p.get('dimensions', 'Theo tiêu chuẩn')}\n"
            f"  Tình trạng kho: {stock_str} | Loại: {'Đồ cũ tuyển chọn (' + str(p.get('condition_grade', 'Good')) + ', đã dùng ' + str(p.get('usage_time', '')) + ')' if is_used else 'Sản phẩm mới 100%'}\n"
            f"  Xem chi tiết: product-detail.html?id={p.get('id')}\n"
            f"  Mô tả: {p.get('description', '')[:200]}"
        )
        lines.append(line)
    return "\n".join(lines)

# SYSTEM PROMPT THEO ĐÚNG 15 QUY TẮC CỦA ĐỀ BÀI
SYSTEM_PROMPT = """Bạn là RoomCraft AI, trợ lý tư vấn nội thất của website RoomCraft.
Nhiệm vụ chính là hỗ trợ khách hàng tìm kiếm, lựa chọn, so sánh và tìm hiểu sản phẩm nội thất đang được kinh doanh trên website.

Quy tắc bắt buộc:
1. Luôn trả lời bằng tiếng Việt tự nhiên, thân thiện, lịch sự và chuyên nghiệp.
2. Trả lời trực tiếp vào trọng tâm câu hỏi, không viết dài dòng.
3. Ưu tiên câu trả lời từ 1–3 câu đối với câu hỏi đơn giản.
4. Chỉ giải thích chi tiết hơn nếu khách hàng yêu cầu tư vấn chuyên sâu.
5. Nếu khách hỏi giá, trả lời giá cụ thể từ dữ liệu, không giải thích lan man.
6. Nếu khách hỏi sản phẩm, đề xuất tối đa 3 sản phẩm phù hợp nhất.
7. Nếu khách đưa ngân sách, chỉ đề xuất sản phẩm có giá trong ngân sách đó.
8. Nếu khách hỏi về phong cách nội thất, giải thích ngắn gọn và liên hệ với sản phẩm đang có.
9. Nếu thiếu thông tin quan trọng, chỉ hỏi lại một câu cần thiết.
10. Không tự suy đoán thông tin sản phẩm chưa được cung cấp.
11. Không trả lời những nội dung không liên quan đến nội thất, sản phẩm hoặc dịch vụ RoomCraft.
12. Không lặp lại lời chào hoặc giới thiệu bản thân trong mỗi tin nhắn.
13. Ghi nhớ ngữ cảnh cuộc hội thoại để hiểu các câu hỏi tiếp theo như "còn mẫu khác không?" hoặc "cái nào rẻ hơn?".
14. Không tự tạo liên kết sản phẩm không tồn tại. Nếu giới thiệu sản phẩm có trong dữ liệu, có thể kèm mã hoặc link product-detail.html?id=<mã>.
15. Nếu khách hỏi một sản phẩm không có trong dữ liệu, trả lời ngắn gọn và có thể đề xuất sản phẩm tương tự nếu tìm được.
AI tuyệt đối không được tự bịa tên sản phẩm, giá bán, tồn kho, chất liệu hoặc chương trình khuyến mãi.

Ví dụ câu trả lời mẫu chuẩn mực:
- Khách: "Phong cách Scandinavian là gì?"
  AI: "Scandinavian là phong cách Bắc Âu, nổi bật với màu sắc nhẹ nhàng, thiết kế tối giản và chất liệu tự nhiên. Phù hợp với không gian hiện đại, thoáng sáng."
- Khách: "Có bàn làm việc dưới 3 triệu không?"
  AI: "RoomCraft hiện có Bàn làm việc Merriton với giá 3.100.000 ₫ (hơi vượt ngân sách một chút) hoặc bạn có thể tham khảo thêm các mẫu bàn trà nhỏ giá từ 950.000 ₫."
- Khách: "Có sofa màu hồng không?"
  AI: "Hiện mình chưa tìm thấy sofa màu hồng trong danh sách sản phẩm RoomCraft. Bạn muốn tham khảo những màu khác không?"
- Khách: "Sofa nào phù hợp phòng nhỏ?"
  AI: "Bạn nên ưu tiên sofa 2 chỗ ngồi, thiết kế gọn và màu sáng. Bạn có thể tham khảo Ghế sofa đôi Fiona (Coastal) hoặc Ghế đôi gỗ ngoài trời kèm nệm."
"""

# Trả lời thông minh dựa trên dữ liệu thật khi chưa cấu hình Gemini API Key
def generate_fallback_response(message, products):
    q_norm = normalize_vi(message)
    budget = extract_budget(message)

    # 0. Khớp câu hỏi chính sách, vận chuyển, đổi trả, bảo hành, thanh toán từ FAQs
    faq = match_faq(message)
    if faq:
        topic = faq.get("topic")
        if topic in ["POLICY", "SHIPPING", "RETURN"] or any(k in q_norm for k in ["doi tra", "chinh sach", "van chuyen", "ship", "giao hang", "bao hanh", "thanh toan", "hoa don", "vat", "ma giam gia", "voucher", "phong nho", "chung cu"]):
            return faq.get("answer")

    # 1. Hỏi về định nghĩa phong cách
    for sid, sname in STYLES.items():
        if normalize_vi(sname) in q_norm and any(k in q_norm for k in ["la gi", "nhu the nao", "dac diem", "phong cach"]):
            style_desc = {
                1: "Bohemian là phong cách tự do, phóng khoáng, dùng nhiều chất liệu tự nhiên như mây, đay, gỗ và cây xanh.",
                2: "Coastal là phong cách lấy cảm hứng từ biển với tông trắng, xanh dương và be cát; chất liệu nhẹ như lanh, mây và gỗ sáng màu.",
                3: "Farmhouse mang vẻ đẹp mộc mạc kiểu nhà vườn với gỗ thô, tông trung tính ấm và các chi tiết cổ điển.",
                4: "Glam là phong cách sang trọng, nổi bật với nhung, kim loại mạ vàng, gương và đá cẩm thạch.",
                5: "Mid-century Modern nổi bật với đường nét gọn gàng, chân côn, gỗ óc chó và các mảng màu nhấn cá tính giữa thế kỷ 20.",
                6: "Scandinavian là phong cách Bắc Âu, nổi bật với màu sắc nhẹ nhàng, thiết kế tối giản và chất liệu tự nhiên. Phù hợp với không gian hiện đại, thoáng sáng.",
                7: "Traditional mang vẻ đẹp cổ điển và cân đối với gỗ tối màu, hoa văn tinh tế và chi tiết chạm khắc."
            }.get(sid, f"{sname} là phong cách nội thất đặc trưng tại RoomCraft.")
            sample = f" RoomCraft hiện có các sản phẩm phong cách {sname} như {products[0].get('name')} ({format_vnd(products[0].get('price', 0))})." if products else ""
            return style_desc + sample

    # 2. Tìm thấy sản phẩm thực tế
    if products:
        top_prods = products[:3]
        lines = []
        for p in top_prods:
            is_used = p.get("product_type") == "USED"
            stock_info = " (Đồ cũ tuyển chọn)" if is_used else ""
            mat = p.get("material") or "Gỗ"
            lines.append(f"• {p.get('name')}: giá {format_vnd(p.get('price', 0))}{stock_info} (Chất liệu: {mat})")
        prods_text = "\n".join(lines)
        budget_note = f" trong ngân sách {format_vnd(budget)}" if budget else ""
        return f"RoomCraft hiện có các sản phẩm phù hợp{budget_note}:\n{prods_text}\nBạn có thể bấm vào sản phẩm trên web để xem chi tiết hoặc trải nghiệm mô hình 3D."

    # 3. Không có sản phẩm phù hợp
    if any(k in q_norm for k in ["mau", "color"]):
        return "Hiện mình chưa tìm thấy sản phẩm màu này trong danh mục RoomCraft. Bạn muốn tham khảo những màu khác hoặc mẫu mã khác không?"
    return "Hiện mình chưa tìm thấy sản phẩm phù hợp với yêu cầu này trong danh mục RoomCraft. Bạn muốn tham khảo thêm danh mục hoặc mức giá khác không?"

# Gọi Gemini API từ backend
def call_gemini(message, history, product_context, relevant_prods=None):
    api_key = get_gemini_api_key()
    if not api_key:
        # Nếu chưa cấu hình Key: sinh câu trả lời trực tiếp từ dữ liệu sản phẩm thật
        fallback_text = generate_fallback_response(message, relevant_prods or [])
        return {
            "reply": fallback_text,
            "isLocalFallback": True
        }

    # Xây dựng lịch sử hội thoại chuẩn Gemini contents format
    contents = []

    # System instruction kết hợp context sản phẩm
    full_instruction = (
        SYSTEM_PROMPT
        + "\n\nDỮ LIỆU SẢN PHẨM LIÊN QUAN TRONG KHO ROOMCRAFT:\n"
        + product_context
    )

    # Thêm các tin nhắn lịch sử (tối đa 6 tin gần nhất để giữ context)
    recent_history = history[-6:] if history else []
    for h in recent_history:
        role = "user" if h.get("role") == "user" else "model"
        text = h.get("content", "") or h.get("parts", [{}])[0].get("text", "")
        if text:
            contents.append({"role": role, "parts": [{"text": text}]})

    # Thêm câu hỏi hiện tại kèm bối cảnh
    user_prompt = f"{full_instruction}\n\n[CÂU HỎI HIỆN TẠI CỦA KHÁCH HÀNG]: {message}"
    contents.append({"role": "user", "parts": [{"text": user_prompt}]})

    # Thử gọi gemini-2.5-flash trước, nếu lỗi thì thử gemini-1.5-flash
    models = ["gemini-2.5-flash", "gemini-1.5-flash"]
    last_error = ""

    for model_name in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.5,
                "maxOutputTokens": 600
            }
        }
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data_bytes, headers={"Content-Type": "application/json"})

        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                res_body = response.read().decode("utf-8")
                res_json = json.loads(res_body)
                candidates = res_json.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        text = parts[0].get("text", "").strip()
                        return {"reply": text, "model": model_name}
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            last_error = f"HTTP {e.code}: {err_body}"
            print(f"[!] Lỗi gọi {model_name}: {last_error}")
            continue
        except Exception as e:
            last_error = str(e)
            print(f"[!] Lỗi kết nối {model_name}: {last_error}")
            continue

    return {
        "error": "API_CALL_FAILED",
        "reply": "Hiện tại hệ thống AI đang tạm thời gián đoạn kết nối. Bạn vui lòng thử lại sau giây lát hoặc liên hệ hotline 1900 6868 nhé!"
    }

# HTTP Handler
class RoomCraftHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Thiết lập CORS headers
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        # Health check endpoint
        if self.path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            has_key = bool(get_gemini_api_key())
            resp = json.dumps({"status": "ok", "hasApiKey": has_key, "productsCount": len(PRODUCTS)})
            self.wfile.write(resp.encode("utf-8"))
            return

        # Mặc định chuyển hướng root sang scripts/index.html
        if self.path == "/" or self.path == "/index.html":
            self.send_response(302)
            self.send_header("Location", "/scripts/index.html")
            self.end_headers()
            return

        super().do_GET()

    def do_POST(self):
        if self.path == "/api/chat":
            client_ip = self.client_address[0]
            if not check_rate_limit(client_ip):
                self.send_response(429)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                resp = json.dumps({
                    "error": "RATE_LIMIT",
                    "reply": "Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng đợi 1 phút trước khi hỏi tiếp nhé."
                }, ensure_ascii=False)
                self.wfile.write(resp.encode("utf-8"))
                return

            content_len = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_len)

            try:
                data = json.loads(body_bytes.decode("utf-8"))
            except Exception:
                self.send_response(400)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "INVALID_JSON"}).encode("utf-8"))
                return

            message = (data.get("message") or "").strip()
            history = data.get("history") or []

            if not message:
                self.send_response(400)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "EMPTY_MESSAGE"}).encode("utf-8"))
                return

            # 1. RAG: Tìm kiếm sản phẩm liên quan và chính sách từ FAQs
            faq = match_faq(message)
            relevant_prods = search_products(message, max_items=5)
            prod_context = format_product_context(relevant_prods)
            if faq:
                prod_context += f"\n\n[THÔNG TIN CHÍNH SÁCH / GIẢI ĐÁP PHÙ HỢP TỪ ROOMCRAFT]:\nChủ đề: {faq.get('topic')}\nNội dung: {faq.get('answer')}"

            # 2. Gọi Gemini AI với system prompt chuẩn và context
            gemini_res = call_gemini(message, history, prod_context, relevant_prods)

            # 3. Trả về cho client
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()

            reply_text = gemini_res.get("reply", "")
            response_data = {
                "reply": reply_text,
                "hasError": bool(gemini_res.get("error")),
                "matchedCount": len(relevant_prods)
            }
            self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

def run():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), RoomCraftHandler) as httpd:
        print("=" * 60)
        print(f"[*] RoomCraft Backend Server đang chạy tại http://localhost:{PORT}")
        print(f"[*] API Endpoint: http://localhost:{PORT}/api/chat")
        has_key = bool(get_gemini_api_key())
        print(f"[*] Gemini API Key: {'Đã cấu hình trong .env' if has_key else 'CHƯA CÓ (sẽ dùng tin nhắn hướng dẫn)'}")
        print("=" * 60)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[*] Đang tắt server...")
            httpd.server_close()

if __name__ == "__main__":
    run()
