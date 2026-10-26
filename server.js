/**
 * =====================================================================
 * ROOMCRAFT - AI Chatbot Backend Server (Node.js Standard Library)
 * Khởi chạy: node server.js
 * Cổng mặc định: 3000 (truy cập http://localhost:3000)
 * =====================================================================
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Đọc file .env nếu có
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, 'utf8').split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                const idx = trimmed.indexOf('=');
                const key = trimmed.substring(0, idx).trim();
                const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
                if (key && !process.env[key]) {
                    process.env[key] = val;
                }
            }
        }
    }
}
loadEnv();

const PORT = parseInt(process.env.PORT || '3000', 10);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Rate Limiting: 30 requests / 60 seconds / IP
const rateLimits = new Map();
function checkRateLimit(ip) {
    const now = Date.now();
    const timestamps = (rateLimits.get(ip) || []).filter(t => now - t < 60000);
    if (timestamps.length >= 30) {
        rateLimits.set(ip, timestamps);
        return false;
    }
    timestamps.push(now);
    rateLimits.set(ip, timestamps);
    return true;
}

// Nạp dữ liệu sản phẩm, danh mục, phong cách
let PRODUCTS = [];
let CATEGORIES = {};
let STYLES = {};
let FAQS = [];

function loadData() {
    try {
        const catFile = path.join(__dirname, 'data', 'json', 'categories.json');
        if (fs.existsSync(catFile)) {
            const cats = JSON.parse(fs.readFileSync(catFile, 'utf8'));
            for (const c of cats) CATEGORIES[c.id] = c.name;
        }

        const styleFile = path.join(__dirname, 'data', 'json', 'styles.json');
        if (fs.existsSync(styleFile)) {
            const styles = JSON.parse(fs.readFileSync(styleFile, 'utf8'));
            for (const s of styles) STYLES[s.id] = s.name;
        }

        const faqFile = path.join(__dirname, 'data', 'json', 'chatbot_faqs.json');
        if (fs.existsSync(faqFile)) {
            FAQS = JSON.parse(fs.readFileSync(faqFile, 'utf8'));
        }

        const pFile = path.join(__dirname, 'data', 'json', 'products.json');
        if (fs.existsSync(pFile)) {
            PRODUCTS.push(...JSON.parse(fs.readFileSync(pFile, 'utf8')));
        }

        const usedFile = path.join(__dirname, 'data', 'json', 'used_products.json');
        if (fs.existsSync(usedFile)) {
            PRODUCTS.push(...JSON.parse(fs.readFileSync(usedFile, 'utf8')));
        }

        console.log(`[*] Node.js Server: Đã nạp ${PRODUCTS.length} sản phẩm, ${FAQS.length} FAQs`);
    } catch (err) {
        console.error('Lỗi nạp dữ liệu:', err);
    }
}
loadData();

function normalizeVi(str) {
    if (!str) return '';
    return str.toLowerCase()
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9 ]/g, ' ')
        .trim();
}

function matchFaq(query) {
    const qNorm = normalizeVi(query);
    const qWords = new Set(qNorm.split(/\s+/));
    const scored = [];
    for (const item of FAQS) {
        if (item.is_active === false) continue;
        const kwList = (item.keywords || '').split(',').map(k => normalizeVi(k.trim())).filter(Boolean);
        let score = 0;
        for (const kw of kwList) {
            if (qNorm.includes(kw)) {
                score += kw.split(/\s+/).length * 12;
            } else {
                const kwWords = new Set(kw.split(/\s+/));
                let commonCount = 0;
                for (const w of kwWords) {
                    if (qWords.has(w)) commonCount++;
                }
                if (commonCount > 0) score += commonCount * 3;
            }
        }
        if (score >= 10) scored.push({ score, item });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.length > 0 ? scored[0].item : null;
}

const STOPWORDS = new Set([
    'co', 'khong', 'cho', 'minh', 'toi', 'em', 'anh', 'chi', 'hoi', 'cac',
    'nhung', 'duoc', 'vay', 'nhe', 'nhi', 'gi', 'nao', 'dau', 'nhu', 'the',
    'sao', 'la', 'voi', 'va', 've', 'o', 'tai', 'duoi', 'tren', 'tam',
    'khoang', 'muc', 'gia', 'tien', 'trieu', 'tr', 'k', 'dong', 'vnd',
    'chiec', 'cai', 'bo', 'loai', 'can', 'muon', 'tim', 'mau'
]);

const KEY_PHRASES = [
    { phrase: 'ban an', catId: 7 },
    { phrase: 'ghe an', catId: 7 },
    { phrase: 'ban lam viec', catId: 12 },
    { phrase: 'ban tra', catId: 6 },
    { phrase: 'ban phu', catId: 6 },
    { phrase: 'ke tivi', catId: 11 },
    { phrase: 'tu quan ao', catId: 10 },
    { phrase: 'tu dau giuong', catId: 10 },
    { phrase: 'sofa giuong', catId: 8 },
    { phrase: 'sofa goc', catId: 8 },
    { phrase: 'sofa', catId: 8 },
    { phrase: 'ghe thu gian', catId: 5 },
    { phrase: 'ghe bar', catId: 7 },
    { phrase: 'ghe dau', catId: 7 },
    { phrase: 'binh hoa', catId: 15 },
    { phrase: 'tham', catId: 19 },
    { phrase: 'tranh', catId: 16 },
    { phrase: 'guong', catId: 16 },
    { phrase: 'den trang tri', catId: 18 },
    { phrase: 'chan ga', catId: 21 },
    { phrase: 'goi tua', catId: 17 }
];

const COLORS = {
    hong: ['hong', 'kem hong', 'pastel'],
    trang: ['trang', 'white', 'ivory', 'ngoc trai'],
    den: ['den', 'black'],
    xam: ['xam', 'gray', 'grey', 'xi mang'],
    nau: ['nau', 'brown', 'walnut', 'cognac', 'go'],
    xanh: ['xanh', 'blue', 'green', 'navy', 'cham'],
    vang: ['vang', 'gold', 'yellow'],
    cam: ['cam', 'orange'],
    be: ['be', 'beige', 'cat'],
    tim: ['tim', 'purple', 'violet'],
    do: ['do', 'red', 'burgundy']
};

function extractBudget(query) {
    const q = normalizeVi(query);
    const m = q.match(/(?:duoi|<|khoang|tam|duoi muc|duoi gia)\s*(\d+(?:[.,]\d+)?)\s*(?:trieu|tr|m\b)/);
    if (m) {
        const val = parseFloat(m[1].replace(',', '.'));
        return Math.round(val * 1000000);
    }
    const m2 = q.match(/(?:duoi|<|tam)\s*(\d{1,3}(?:[.,]\d{3}){1,3})/);
    if (m2) {
        return parseInt(m2[1].replace(/[.,]/g, ''), 10);
    }
    const m3 = q.match(/(\d+(?:[.,]\d+)?)\s*(?:trieu|tr)\b/);
    if (m3) {
        const val = parseFloat(m3[1].replace(',', '.'));
        return Math.round(val * 1000000);
    }
    return null;
}

function searchProducts(query, maxItems = 5) {
    const qNorm = normalizeVi(query);
    const tokens = qNorm.split(/\s+/).filter(t => !STOPWORDS.has(t) && t.length >= 2);
    const budget = extractBudget(query);
    const isAskingUsed = ['do cu', 'cu', 'secondhand', 'used', 'marketplace'].some(k => qNorm.includes(k));

    // Target colors
    let targetColors = [];
    const mColor = qNorm.match(/(?:mau|gam mau|tong|tone|color)\s+([a-z]+)/);
    if (mColor) {
        const cReq = mColor[1];
        if (COLORS[cReq]) {
            targetColors = COLORS[cReq];
        } else if (!STOPWORDS.has(cReq)) {
            targetColors = [cReq];
        }
    }

    const scored = [];
    for (const p of PRODUCTS) {
        if (p.is_active === false) continue;
        const price = p.price || 0;
        if (budget && price > budget) continue;

        const pName = p.name || '';
        const nameNorm = normalizeVi(pName);
        const descNorm = normalizeVi(p.description || '');
        const matNorm = normalizeVi(p.material || '');
        const colorNorm = normalizeVi(p.color || '');
        const brandNorm = normalizeVi(p.brand || '');
        const corpus = `${nameNorm} ${descNorm} ${matNorm} ${colorNorm} ${brandNorm}`;

        const nameWords = new Set(nameNorm.split(/\s+/));
        const corpusWords = new Set(corpus.split(/\s+/));

        let score = 0;

        // Color check: bắt buộc phải có màu này nếu người dùng đã chỉ định
        if (targetColors.length > 0) {
            const hasColor = targetColors.some(tc => {
                const reg = new RegExp(`\\b${tc}\\b`, 'i');
                return reg.test(colorNorm);
            });
            if (!hasColor) {
                continue;
            }
            score += 35;
        }

        // Used preference
        if (isAskingUsed) {
            if (p.product_type === 'USED') score += 30;
            else score -= 10;
        }

        // Key phrases
        for (const kp of KEY_PHRASES) {
            if (qNorm.includes(kp.phrase)) {
                if (nameNorm.includes(kp.phrase)) score += 45;
                else if (kp.catId && p.category_id === kp.catId) score += 25;
                else if (corpus.includes(kp.phrase)) score += 15;
            }
        }

        // Word tokens
        for (const t of tokens) {
            if (nameWords.has(t)) score += t.length * 5;
            else if (corpusWords.has(t)) score += t.length * 2;
        }

        // Styles
        for (const [sId, sName] of Object.entries(STYLES)) {
            if (qNorm.includes(normalizeVi(sName))) {
                const pStyles = p.style_ids || [p.style_id];
                if (pStyles.includes(parseInt(sId, 10))) score += 15;
            }
        }

        // Categories
        for (const [cId, cName] of Object.entries(CATEGORIES)) {
            if (qNorm.includes(normalizeVi(cName)) && p.category_id === parseInt(cId, 10)) {
                score += 12;
            }
        }

        if (qNorm.includes('3d') && p.model_3d_url) score += 15;

        if (score >= 5) {
            scored.push({ score, product: p });
        }
    }

    // Nếu câu hỏi nhắm vào loại sản phẩm cụ thể (sofa, bàn ăn, bàn làm việc...)
    // và có sản phẩm khớp chính xác danh mục / tên đó, chỉ giữ lại sản phẩm phù hợp nhất
    for (const kp of KEY_PHRASES) {
        if (qNorm.includes(kp.phrase)) {
            const primaryItems = scored.filter(item => {
                const nameN = normalizeVi(item.product.name || '');
                return nameN.includes(kp.phrase) || (kp.catId && item.product.category_id === kp.catId);
            });
            scored = primaryItems;
            break;
        }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, maxItems).map(s => s.product);
}

function formatVnd(val) {
    try {
        return Math.round(Number(val)).toLocaleString('vi-VN') + ' ₫';
    } catch {
        return val + ' ₫';
    }
}

function formatProductContext(products) {
    if (!products || !products.length) return 'Không tìm thấy sản phẩm nào trong kho đáp ứng trực tiếp yêu cầu này.';
    return products.map(p => {
        const cat = CATEGORIES[p.category_id] || 'Nội thất';
        const styles = (p.style_ids || [p.style_id]).map(id => STYLES[id]).filter(Boolean).join(', ') || 'Hiện đại';
        const isUsed = p.product_type === 'USED';
        const stock = p.stock_quantity > 0 ? 'Còn hàng' : (isUsed ? 'Đã bán' : 'Hết hàng');
        return `- Mã: ${p.id}
  Tên: ${p.name}
  Giá: ${formatVnd(p.price)}${p.original_price ? ' (Giá gốc: ' + formatVnd(p.original_price) + ')' : ''}
  Danh mục: ${cat} | Phong cách: ${styles}
  Chất liệu: ${p.material || 'Gỗ'} | Màu: ${p.color || 'Tiêu chuẩn'} | Kích thước: ${p.dimensions || 'Theo tiêu chuẩn'}
  Tình trạng kho: ${stock} | Loại: ${isUsed ? 'Đồ cũ tuyển chọn (' + (p.condition_grade || 'Good') + ', đã dùng ' + (p.usage_time || '') + ')' : 'Sản phẩm mới'}
  Xem chi tiết: product-detail.html?id=${p.id}
  Mô tả: ${(p.description || '').substring(0, 200)}`;
    }).join('\n');
}

const SYSTEM_PROMPT = `Bạn là RoomCraft AI, trợ lý tư vấn nội thất của website RoomCraft.
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
  AI: "Bạn nên ưu tiên sofa 2 chỗ ngồi, thiết kế gọn và màu sáng. Bạn có thể tham khảo Ghế sofa đôi Fiona (Coastal) hoặc Ghế đôi gỗ ngoài trời kèm nệm."`;

function generateFallbackResponse(message, products) {
    const qNorm = normalizeVi(message);
    const budget = extractBudget(message);

    const faq = matchFaq(message);
    if (faq) {
        const topic = faq.topic;
        if (['POLICY', 'SHIPPING', 'RETURN'].includes(topic) || ['doi tra', 'chinh sach', 'van chuyen', 'ship', 'giao hang', 'bao hanh', 'thanh toan', 'hoa don', 'vat', 'ma giam gia', 'voucher', 'phong nho', 'chung cu'].some(k => qNorm.includes(k))) {
            return faq.answer;
        }
    }

    for (const [sid, sname] of Object.entries(STYLES)) {
        if (qNorm.includes(normalizeVi(sname)) && ['la gi', 'nhu the nao', 'dac diem', 'phong cach'].some(k => qNorm.includes(k))) {
            const descs = {
                1: 'Bohemian là phong cách tự do, phóng khoáng, dùng nhiều chất liệu tự nhiên như mây, đay, gỗ và cây xanh.',
                2: 'Coastal là phong cách lấy cảm hứng từ biển với tông trắng, xanh dương và be cát; chất liệu nhẹ như lanh, mây và gỗ sáng màu.',
                3: 'Farmhouse mang vẻ đẹp mộc mạc kiểu nhà vườn với gỗ thô, tông trung tính ấm và các chi tiết cổ điển.',
                4: 'Glam là phong cách sang trọng, nổi bật với nhung, kim loại mạ vàng, gương và đá cẩm thạch.',
                5: 'Mid-century Modern nổi bật với đường nét gọn gàng, chân côn, gỗ óc chó và các mảng màu nhấn cá tính giữa thế kỷ 20.',
                6: 'Scandinavian là phong cách Bắc Âu, nổi bật với màu sắc nhẹ nhàng, thiết kế tối giản và chất liệu tự nhiên. Phù hợp với không gian hiện đại, thoáng sáng.',
                7: 'Traditional mang vẻ đẹp cổ điển và cân đối với gỗ tối màu, hoa văn tinh tế và chi tiết chạm khắc.'
            };
            const desc = descs[sid] || `${sname} là phong cách nội thất đặc trưng tại RoomCraft.`;
            const sample = products && products.length ? ` RoomCraft hiện có các sản phẩm phong cách ${sname} như ${products[0].name} (${formatVnd(products[0].price)}).` : '';
            return desc + sample;
        }
    }

    if (products && products.length) {
        const topProds = products.slice(0, 3);
        const lines = topProds.map(p => {
            const isUsed = p.product_type === 'USED';
            const stockInfo = isUsed ? ' (Đồ cũ tuyển chọn)' : '';
            const mat = p.material || 'Gỗ';
            return `• ${p.name}: giá ${formatVnd(p.price)}${stockInfo} (Chất liệu: ${mat})`;
        });
        const budgetNote = budget ? ` trong ngân sách ${formatVnd(budget)}` : '';
        return `RoomCraft hiện có các sản phẩm phù hợp${budgetNote}:\n${lines.join('\n')}\nBạn có thể bấm vào sản phẩm trên web để xem chi tiết hoặc trải nghiệm mô hình 3D.`;
    }

    if (['mau', 'color'].some(k => qNorm.includes(k))) {
        return 'Hiện mình chưa tìm thấy sản phẩm màu này trong danh mục RoomCraft. Bạn muốn tham khảo những màu khác hoặc mẫu mã khác không?';
    }
    return 'Hiện mình chưa tìm thấy sản phẩm phù hợp với yêu cầu này trong danh mục RoomCraft. Bạn muốn tham khảo thêm danh mục hoặc mức giá khác không?';
}

function callGemini(message, history, productContext, relevantProducts = []) {
    return new Promise((resolve) => {
        const apiKey = process.env.GEMINI_API_KEY || '';
        if (!apiKey) {
            return resolve({
                reply: generateFallbackResponse(message, relevantProducts),
                hasError: false
            });
        }

        const contents = [];
        const fullInstruction = `${SYSTEM_PROMPT}\n\nDỮ LIỆU SẢN PHẨM LIÊN QUAN TRONG KHO ROOMCRAFT:\n${productContext}`;

        const recentHistory = (history || []).slice(-6);
        for (const h of recentHistory) {
            const role = h.role === 'user' ? 'user' : 'model';
            const text = h.content || (h.parts && h.parts[0] && h.parts[0].text) || '';
            if (text) contents.push({ role, parts: [{ text }] });
        }

        contents.push({ role: 'user', parts: [{ text: `${fullInstruction}\n\n[CÂU HỎI HIỆN TẠI CỦA KHÁCH HÀNG]: ${message}` }] });

        const payload = JSON.stringify({
            contents,
            generationConfig: { temperature: 0.5, maxOutputTokens: 600 }
        });

        const req = https.request({
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            },
            timeout: 12000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const candidates = parsed.candidates || [];
                    if (candidates.length && candidates[0].content && candidates[0].content.parts) {
                        return resolve({ reply: candidates[0].content.parts[0].text.trim() });
                    }
                } catch {}
                resolve({
                    error: 'API_RESPONSE_ERROR',
                    reply: 'Hiện tại hệ thống AI đang tạm thời gián đoạn kết nối. Bạn vui lòng thử lại sau giây lát hoặc liên hệ hotline 1900 6868 nhé!'
                });
            });
        });

        req.on('error', () => {
            resolve({
                error: 'NETWORK_ERROR',
                reply: 'Hiện tại hệ thống AI đang tạm thời gián đoạn kết nối. Bạn vui lòng thử lại sau giây lát hoặc liên hệ hotline 1900 6868 nhé!'
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({
                error: 'TIMEOUT',
                reply: 'Hết thời gian kết nối AI. Bạn vui lòng thử lại sau giây lát nhé!'
            });
        });

        req.write(payload);
        req.end();
    });
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.glb': 'model/gltf-binary',
    '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Health check
    if (pathname === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ status: 'ok', hasApiKey: Boolean(process.env.GEMINI_API_KEY) }));
    }

    // Chat endpoint
    if (pathname === '/api/chat' && req.method === 'POST') {
        const clientIp = req.socket.remoteAddress || 'unknown';
        if (!checkRateLimit(clientIp)) {
            res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                error: 'RATE_LIMIT',
                reply: 'Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng đợi 1 phút trước khi hỏi tiếp nhé.'
            }));
        }

        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const message = (data.message || '').trim();
                const history = data.history || [];

                if (!message) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    return res.end(JSON.stringify({ error: 'EMPTY_MESSAGE' }));
                }

                // 1. RAG Search
                const faq = matchFaq(message);
                const relevantProds = searchProducts(message, 5);
                let prodContext = formatProductContext(relevantProds);
                if (faq) {
                    prodContext += `\n\n[THÔNG TIN CHÍNH SÁCH / GIẢI ĐÁP PHÙ HỢP TỪ ROOMCRAFT]:\nChủ đề: ${faq.topic}\nNội dung: ${faq.answer}`;
                }

                // 2. Call Gemini API
                const aiResult = await callGemini(message, history, prodContext, relevantProds);

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({
                    reply: aiResult.reply,
                    hasError: Boolean(aiResult.error),
                    matchedCount: relevantProds.length
                }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: 'SERVER_ERROR', reply: 'Đã có lỗi xảy ra phía máy chủ.' }));
            }
        });
        return;
    }

    // Static file serving
    let filePath = path.join(__dirname, pathname === '/' || pathname === '/index.html' ? 'index.html' : pathname);
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('404 Not Found');
        }
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`[*] RoomCraft Node.js Server đang chạy tại http://localhost:${PORT}`);
    console.log(`[*] API Endpoint: http://localhost:${PORT}/api/chat`);
});
