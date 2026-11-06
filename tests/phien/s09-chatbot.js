const { phien, TAI_KHOAN } = require('../lib/khung-test');

phien({ ma: 's09', ten: 'Chatbot' }, async (t) => {

    // Mở khung chat và chờ khung hiện ra
    async function moChat(p) {
        await p.waitForSelector('#rcChatToggleBtn', { timeout: 5000 });
        const dangMo = await p.evaluate(() => {
            const box = document.getElementById('rcChatBox');
            return box && !box.classList.contains('rc-chat-hidden');
        });
        if (!dangMo) {
            await p.click('#rcChatToggleBtn');
        }
        await p.waitForTimeout(400);
    }

    // Gửi 1 câu hỏi vào khung chat, chờ bot trả lời (chờ số tin bot tăng)
    async function hoi(p, cau) {
        const soBotTruoc = await p.evaluate(() => document.querySelectorAll('#rcChatMessages .rc-msg-bot').length);
        await p.fill('#rcTxtChatInput', cau);
        await p.click('.rc-chat-send-btn');
        // chờ bot trả lời: số tin bot tăng và không còn typing
        await p.waitForFunction((n) => {
            const so = document.querySelectorAll('#rcChatMessages .rc-msg-bot').length;
            const typing = document.querySelector('#rcChatMessages .rc-typing');
            return so > n && !typing;
        }, soBotTruoc, { timeout: 8000 }).catch(() => {});
        await p.waitForTimeout(400);
        // trả về nội dung tin bot cuối
        return await p.evaluate(() => {
            const ds = document.querySelectorAll('#rcChatMessages .rc-msg-bot .rc-msg-bubble');
            return ds.length ? ds[ds.length - 1].innerText.replace(/\s+/g, ' ').trim() : '';
        });
    }

    // Lấy danh sách id sản phẩm trong tin bot cuối.
    // Thẻ sản phẩm do appendMessage render — đọc id theo đúng cấu trúc DOM thật:
    // ưu tiên thuộc tính data-id trên thẻ sản phẩm, sau đó tới class thẻ SP.
    // Fallback: đọc ids của tin bot cuối trong rc_chat_history.
    async function idSanPhamTrongTinCuoi(p) {
        return await p.evaluate(() => {
            const ds = document.querySelectorAll('#rcChatMessages .rc-msg-bot');
            if (!ds.length) return [];
            const cuoi = ds[ds.length - 1];
            const ids = [];
            // 1) Thuộc tính data-id trên thẻ sản phẩm (cấu trúc thật của appendMessage)
            cuoi.querySelectorAll('[data-id]').forEach(el => {
                const v = el.getAttribute('data-id');
                if (v != null && /^\d+$/.test(String(v).trim())) ids.push(String(v).trim());
            });
            // 2) Thẻ sản phẩm theo class (rc-chat-product / rc-product-card ...) có data-id
            cuoi.querySelectorAll('.rc-chat-product, .rc-product-card, .rc-chat-product-card').forEach(el => {
                const v = el.getAttribute('data-id') || el.getAttribute('data-product-id');
                if (v != null && /^\d+$/.test(String(v).trim())) ids.push(String(v).trim());
            });
            // 3) Nếu vẫn rỗng, đọc ids của tin bot cuối trong rc_chat_history
            if (ids.length === 0) {
                try {
                    const ls = JSON.parse(localStorage.getItem('rc_rc_chat_history') || '[]');
                    for (let i = ls.length - 1; i >= 0; i--) {
                        if (ls[i].sender === 'bot' && Array.isArray(ls[i].ids) && ls[i].ids.length) {
                            ls[i].ids.forEach(x => ids.push(String(x)));
                            break;
                        }
                    }
                } catch (e) { /* bỏ qua */ }
            }
            // Loại trùng
            const kq = [];
            ids.forEach(x => { if (kq.indexOf(x) < 0) kq.push(x); });
            return kq;
        });
    }

    // ===================== 1. MỞ / ĐÓNG =====================
    await t.tc({
        ma: 'TC-S09-01', trang: 'index.html', chucNang: 'Chatbot - mở khung chat',
        tienDieuKien: 'Vào trang chủ, chatbot đang đóng', cacBuoc: '1. Mở trang chủ 2. Bấm nút chat nổi góc phải dưới',
        duLieu: 'Không', mongDoi: 'Khung chat hiện ra (#rcChatBox không còn class rc-chat-hidden), có lời chào', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForSelector('#rcChatToggleBtn');
        const anTruoc = await p.evaluate(() => document.getElementById('rcChatBox').classList.contains('rc-chat-hidden'));
        kq.dat(anTruoc === true, 'Trước khi bấm khung ẩn: ' + anTruoc);
        await p.click('#rcChatToggleBtn');
        await p.waitForTimeout(400);
        const conAn = await p.evaluate(() => document.getElementById('rcChatBox').classList.contains('rc-chat-hidden'));
        kq.dat(conAn === false, 'Sau khi bấm khung còn ẩn: ' + conAn);
        const chao = await t.chu('#rcChatMessages .rc-msg-bot .rc-msg-bubble');
        kq.dat(/Trợ lý RoomCraft/.test(chao || ''), 'Lời chào: "' + (chao || '').slice(0, 80) + '"');
    });

    await t.tc({
        ma: 'TC-S09-02', trang: 'index.html', chucNang: 'Chatbot - đóng khung chat',
        tienDieuKien: 'Khung chat đang mở', cacBuoc: '1. Mở khung chat 2. Bấm nút đóng trong header',
        duLieu: 'Không', mongDoi: 'Khung chat ẩn lại (có class rc-chat-hidden)', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await moChat(p);
        await p.click('#rcChatBox .rc-chat-close-btn[aria-label="Đóng khung chat"]');
        await p.waitForTimeout(300);
        const conAn = await p.evaluate(() => document.getElementById('rcChatBox').classList.contains('rc-chat-hidden'));
        kq.dat(conAn === true, 'Khung chat ẩn sau khi đóng: ' + conAn);
    });

    // ===================== 2. CHÀO HỎI =====================
    await t.tc({
        ma: 'TC-S09-03', trang: 'index.html', chucNang: 'Chatbot - chào hỏi',
        tienDieuKien: 'Khung chat đang mở', cacBuoc: '1. Mở khung chat 2. Gõ "xin chào" 3. Gửi',
        duLieu: 'xin chào', mongDoi: 'Bot trả lời có lời chào (chứa "chào" hoặc "RoomCraft")', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await moChat(p);
        const traLoi = await hoi(p, 'xin chào');
        kq.dat(/chào|RoomCraft|giúp/i.test(traLoi), 'Bot trả lời: "' + traLoi.slice(0, 120) + '"');
    });

    // ===================== 3. SOFA DƯỚI 10 TRIỆU =====================
    await t.tc({
        ma: 'TC-S09-04', trang: 'index.html', chucNang: 'Chatbot - sofa dưới 10 triệu chỉ ra món ≤ 10tr',
        tienDieuKien: 'Khung chat mở, dữ liệu sạch', cacBuoc: '1. Mở khung chat 2. Gõ "sofa dưới 10 triệu" 3. Gửi',
        duLieu: 'sofa dưới 10 triệu', mongDoi: 'Bot gợi ý sofa, mọi sản phẩm có giá ≤ 10.000.000 ₫', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await moChat(p);
        const traLoi = await hoi(p, 'sofa dưới 10 triệu');
        kq.dat(/sofa/i.test(traLoi), 'Bot nhắc sofa: "' + traLoi.slice(0, 100) + '"');
        const ids = await idSanPhamTrongTinCuoi(p);
        const sp = await t.bang('products');
        const quaGia = [];
        for (const id of ids) {
            const s = sp.find(x => String(x.id) === id);
            if (s && Number(s.price) > 10000000) quaGia.push(id + ':' + s.price);
        }
        kq.dat(ids.length > 0, 'Số sản phẩm gợi ý: ' + ids.length);
        kq.dat(quaGia.length === 0, 'Sản phẩm vượt 10tr: ' + (quaGia.join(', ') || 'không có'));
    });

    await t.tc({
        ma: 'TC-S09-05', trang: 'index.html', chucNang: 'Chatbot - sofa dưới 10 triệu (biên đúng ngưỡng)',
        tienDieuKien: 'Khung chat mở', cacBuoc: '1. Gõ "sofa dưới 10 triệu" 2. Kiểm tra giá sản phẩm gợi ý',
        duLieu: 'sofa dưới 10 triệu', mongDoi: 'Không sản phẩm nào có giá > 10.000.000 ₫ (ngưỡng ≤ 10tr)', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await moChat(p);
        await hoi(p, 'sofa dưới 10 triệu');
        const ids = await idSanPhamTrongTinCuoi(p);
        const sp = await t.bang('products');
        let maxGia = 0;
        for (const id of ids) {
            const s = sp.find(x => String(x.id) === id);
            if (s) maxGia = Math.max(maxGia, Number(s.price));
        }
        kq.dat(ids.length === 0 || maxGia <= 10000000, 'Giá cao nhất trong gợi ý: ' + maxGia);
    });

    // ===================== 4. RẺ HƠN =====================
    await t.tc({
        ma: 'TC-S09-06', trang: 'index.html', chucNang: 'Chatbot - "rẻ hơn" ra món rẻ hơn',
        tienDieuKien: 'Đã hỏi sofa dưới 10 triệu', cacBuoc: '1. Gõ "rẻ hơn" 2. Gửi',
        duLieu: 'rẻ hơn', mongDoi: 'Bot gợi ý sản phẩm rẻ hơn mức thấp nhất lần trước, hoặc báo rõ không còn món rẻ hơn', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await moChat(p);
        await hoi(p, 'sofa dưới 10 triệu');
        const idsTruoc = await idSanPhamTrongTinCuoi(p);
        const sp = await t.bang('products');
        let minTruoc = Infinity;
        for (const id of idsTruoc) {
            const s = sp.find(x => String(x.id) === id);
            if (s) minTruoc = Math.min(minTruoc, Number(s.price));
        }
        const traLoi = await hoi(p, 'rẻ hơn');
        const idsSau = await idSanPhamTrongTinCuoi(p);
        let maxSau = 0;
        for (const id of idsSau) {
            const s = sp.find(x => String(x.id) === id);
            if (s) maxSau = Math.max(maxSau, Number(s.price));
        }
        kq.dat(/rẻ|giá|mẫu/i.test(traLoi), 'Bot trả lời: "' + traLoi.slice(0, 100) + '"');
        kq.dat(/Kho không còn món nào/.test(traLoi) || idsSau.length === 0 || minTruoc === Infinity || maxSau < minTruoc,
            'Giá cao nhất lần sau (' + maxSau + ') < giá thấp nhất lần trước (' + minTruoc + ')');
    });

    // ===================== 5. ĐỒ CŨ =====================
    await t.tc({
        ma: 'TC-S09-07', trang: 'index.html', chucNang: 'Chatbot - đồ cũ Marketplace',
        tienDieuKien: 'Khung chat mở', cacBuoc: '1. Gõ "đồ cũ" 2. Gửi',
        duLieu: 'đồ cũ', mongDoi: 'Bot trả lời về đồ cũ, sản phẩm gợi ý đều là USED', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await moChat(p);
        const traLoi = await hoi(p, 'đồ cũ');
        kq.dat(/cũ|Marketplace|USED|tuyển chọn/i.test(traLoi), 'Bot trả lời: "' + traLoi.slice(0, 120) + '"');
        const ids = await idSanPhamTrongTinCuoi(p);
        const sp = await t.bang('products');
        const sai = [];
        for (const id of ids) {
            const s = sp.find(x => String(x.id) === id);
            if (s && s.product_type !== 'USED') sai.push(id + ':' + s.product_type);
        }
        kq.dat(sai.length === 0, 'Sản phẩm không phải USED: ' + (sai.join(', ') || 'không có'));
    });

    await t.tc({
        ma: 'TC-S09-08', trang: 'index.html', chucNang: 'Chatbot - đồ cũ (kiểm tra dữ liệu sau thao tác)',
        tienDieuKien: 'Đã hỏi đồ cũ', cacBuoc: '1. Mở trang mới 2. Mở chat 3. Gửi "đồ cũ" 4. Kiểm tra localStorage rc_chat_history',
        duLieu: 'đồ cũ', mongDoi: 'Lịch sử chat có tin user "đồ cũ" và tin bot', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        // Tự mở trang mới + gửi "đồ cũ" (không dựa vào t.trang của TC trước)
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await moChat(p);
        await hoi(p, 'đồ cũ');
        // Chờ localStorage có ít nhất 2 tin (user + bot)
        await p.waitForFunction(() => {
            try {
                const ls = JSON.parse(localStorage.getItem('rc_rc_chat_history') || '[]');
                return ls.length >= 2;
            } catch (e) { return false; }
        }, { timeout: 5000 }).catch(() => {});
        const ls = await p.evaluate(() => JSON.parse(localStorage.getItem('rc_rc_chat_history') || '[]'));
        const coUser = ls.some(x => x.sender === 'user' && /đồ cũ/i.test(x.text));
        const coBot = ls.some(x => x.sender === 'bot');
        kq.dat(coUser, 'Có tin user "đồ cũ": ' + coUser);
        kq.dat(coBot, 'Có tin bot: ' + coBot);
    });

    // ===================== 6. MÃ GIẢM GIÁ =====================
    await t.tc({
        ma: 'TC-S09-09', trang: 'index.html', chucNang: 'Chatbot - hỏi mã giảm giá',
        tienDieuKien: 'Khung chat mở', cacBuoc: '1. Gõ "mã giảm giá" 2. Gửi',
        duLieu: 'mã giảm giá', mongDoi: 'Bot trả lời về mã giảm giá (chứa "giảm giá" hoặc mã coupon)', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await moChat(p);
        const traLoi = await hoi(p, 'mã giảm giá');
        kq.dat(/giảm giá|mã|coupon|khuyến mãi/i.test(traLoi), 'Bot trả lời: "' + traLoi.slice(0, 120) + '"');
    });

    await t.tc({
        ma: 'TC-S09-10', trang: 'index.html', chucNang: 'Chatbot - mã giảm giá (kiểm tra mã có trong dữ liệu)',
        tienDieuKien: 'Đã hỏi mã giảm giá', cacBuoc: '1. Đọc câu trả lời 2. So với bảng coupons',
        duLieu: 'mã giảm giá', mongDoi: 'Nếu bot nêu mã cụ thể thì mã đó phải tồn tại trong bảng coupons', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        const traLoi = await p.evaluate(() => {
            const ds = document.querySelectorAll('#rcChatMessages .rc-msg-bot .rc-msg-bubble');
            return ds.length ? ds[ds.length - 1].innerText : '';
        });
        const coupons = await t.bang('coupons');
        const maHopLe = coupons.map(c => String(c.code || '').toUpperCase());
        // tìm các chuỗi in hoa giống mã coupon trong câu trả lời
        const ungVien = (traLoi.match(/\b[A-Z][A-Z0-9]{3,}\b/g) || []);
        const sai = ungVien.filter(m => !maHopLe.includes(m));
        kq.dat(sai.length === 0, 'Mã không có trong coupons: ' + (sai.join(', ') || 'không có'));
    });

    // ===================== 7. PHÍ GIAO THEO TỈNH =====================
    await t.tc({
        ma: 'TC-S09-11', trang: 'index.html', chucNang: 'Chatbot - phí giao Hà Nội đồ lớn 300.000 ₫',
        tienDieuKien: 'Khung chat mở', cacBuoc: '1. Gõ "phí giao hàng Hà Nội đồ lớn" 2. Gửi',
        duLieu: 'phí giao hàng Hà Nội đồ lớn', mongDoi: 'Bot trả lời phí giao Hà Nội cho đồ lớn là 300.000 ₫', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await moChat(p);
        const traLoi = await hoi(p, 'phí giao hàng Hà Nội đồ lớn');
        kq.dat(/300\.?000|300,000|300000/i.test(traLoi), 'Bot trả lời: "' + traLoi.slice(0, 160) + '"');
        kq.dat(/Hà Nội|Ha Noi/i.test(traLoi), 'Có nhắc Hà Nội: ' + /Hà Nội|Ha Noi/i.test(traLoi));
    });

    await t.tc({
        ma: 'TC-S09-12', trang: 'index.html', chucNang: 'Chatbot - phí giao tỉnh khác (so với hàm calcShippingFee)',
        tienDieuKien: 'Khung chat mở', cacBuoc: '1. Gõ "phí giao hàng Đà Nẵng" 2. So với calcShippingFee',
        duLieu: 'phí giao hàng Đà Nẵng', mongDoi: 'Bot trả lời phí giao khớp với calcShippingFee cho Đà Nẵng', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await moChat(p);
        const traLoi = await hoi(p, 'phí giao hàng Đà Nẵng');
        const phi = await p.evaluate(() => {
            const zone = (typeof getProvinceZone === 'function') ? getProvinceZone('Đà Nẵng') : null;
            const phiVal = (typeof calcShippingFee === 'function') ? calcShippingFee('standard', zone, 5000000) : null;
            return { zone: zone, phi: phiVal };
        });
        kq.dat(/Đà Nẵng|Da Nang/i.test(traLoi), 'Bot nhắc Đà Nẵng: ' + /Đà Nẵng|Da Nang/i.test(traLoi));
        const soTrongCau = (traLoi.match(/\d{1,3}(?:[.,]\d{3})+/g) || []).map(s => Number(s.replace(/[.,]/g, '')));
        kq.dat(soTrongCau.length === 0 || phi.phi == null || soTrongCau.includes(phi.phi),
            'Phí trong câu (' + soTrongCau.join(',') + ') khớp calcShippingFee (' + phi.phi + ')');
    });

    // ===================== 8. CÂU NGOÀI PHẠM VI =====================
    await t.tc({
        ma: 'TC-S09-13', trang: 'index.html', chucNang: 'Chatbot - câu ngoài phạm vi',
        tienDieuKien: 'Khung chat mở, không bật backend', cacBuoc: '1. Gõ "thời tiết hôm nay thế nào" 2. Gửi',
        duLieu: 'thời tiết hôm nay thế nào', mongDoi: 'Bot vẫn trả lời (không treo), không bịa số liệu sản phẩm', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await moChat(p);
        const traLoi = await hoi(p, 'thời tiết hôm nay thế nào');
        kq.dat(traLoi.length > 0, 'Bot có trả lời (độ dài ' + traLoi.length + ')');
        const conTyping = await p.evaluate(() => !!document.querySelector('#rcChatMessages .rc-typing'));
        kq.dat(conTyping === false, 'Không còn hiệu ứng đang gõ: ' + conTyping);
    });

    await t.tc({
        ma: 'TC-S09-14', trang: 'index.html', chucNang: 'Chatbot - câu ngoài phạm vi không gợi ý sản phẩm bừa',
        tienDieuKien: 'Đã hỏi câu ngoài phạm vi', cacBuoc: '1. Kiểm tra thẻ sản phẩm trong tin bot cuối',
        duLieu: 'thời tiết hôm nay thế nào', mongDoi: 'Không gợi ý sản phẩm nội thất không liên quan', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = t.trang;
        const ids = await idSanPhamTrongTinCuoi(p);
        kq.dat(ids.length === 0, 'Số sản phẩm gợi ý cho câu ngoài phạm vi: ' + ids.length);
    });

    // ===================== 9. LƯU LỊCH SỬ KHI TẢI LẠI =====================
    await t.tc({
        ma: 'TC-S09-15', trang: 'index.html', chucNang: 'Chatbot - lưu lịch sử khi tải lại trang',
        tienDieuKien: 'Đã chat 1 câu', cacBuoc: '1. Gửi "sofa dưới 10 triệu" 2. Tải lại trang 3. Mở chat',
        duLieu: 'sofa dưới 10 triệu', mongDoi: 'Sau khi tải lại, mở chat vẫn thấy tin nhắn cũ', mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await moChat(p);
        await hoi(p, 'sofa dưới 10 triệu');
        const soTruoc = await p.evaluate(() => document.querySelectorAll('#rcChatMessages .rc-msg').length);
        await p.reload();
        await p.waitForTimeout(800);
        await moChat(p);
        await p.waitForTimeout(500);
        const soSau = await p.evaluate(() => document.querySelectorAll('#rcChatMessages .rc-msg').length);
        kq.dat(soSau >= soTruoc, 'Số tin trước reload: ' + soTruoc + ', sau reload: ' + soSau);
        const coSofa = await p.evaluate(() => {
            const ds = document.querySelectorAll('#rcChatMessages .rc-msg-user .rc-msg-bubble');
            for (const el of ds) if (/sofa dưới 10 triệu/i.test(el.innerText)) return true;
            return false;
        });
        kq.dat(coSofa, 'Còn tin user "sofa dưới 10 triệu" sau reload: ' + coSofa);
    });

    await t.tc({
        ma: 'TC-S09-16', trang: 'index.html', chucNang: 'Chatbot - xóa hội thoại',
        tienDieuKien: 'Đã có lịch sử chat', cacBuoc: '1. Mở chat 2. Bấm nút xóa hội thoại',
        duLieu: 'Không', mongDoi: 'Lịch sử bị xóa, chỉ còn lời chào mới', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        await p.click('#rcChatBox .rc-chat-close-btn[aria-label="Xóa hội thoại"]');
        await p.waitForTimeout(400);
        const ls = await p.evaluate(() => JSON.parse(localStorage.getItem('rc_rc_chat_history') || '[]'));
        kq.dat(ls.length === 0, 'Lịch sử sau xóa: ' + ls.length + ' tin');
        const soTin = await p.evaluate(() => document.querySelectorAll('#rcChatMessages .rc-msg').length);
        kq.dat(soTin === 1, 'Số tin hiển thị sau xóa: ' + soTin);
    });

    // ===================== 10. BỎ TRỐNG / SAI ĐỊNH DẠNG =====================
    await t.tc({
        ma: 'TC-S09-17', trang: 'index.html', chucNang: 'Chatbot - gửi tin trống',
        tienDieuKien: 'Khung chat mở', cacBuoc: '1. Để trống ô nhập 2. Bấm nút gửi',
        duLieu: '(trống)', mongDoi: 'Không có tin nhắn nào được thêm', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await moChat(p);
        const soTruoc = await p.evaluate(() => document.querySelectorAll('#rcChatMessages .rc-msg').length);
        await p.fill('#rcTxtChatInput', '');
        await p.click('.rc-chat-send-btn');
        await p.waitForTimeout(500);
        const soSau = await p.evaluate(() => document.querySelectorAll('#rcChatMessages .rc-msg').length);
        kq.dat(soSau === soTruoc, 'Số tin trước: ' + soTruoc + ', sau: ' + soSau);
    });

    await t.tc({
        ma: 'TC-S09-18', trang: 'index.html', chucNang: 'Chatbot - gửi tin chỉ có khoảng trắng',
        tienDieuKien: 'Khung chat mở', cacBuoc: '1. Nhập "   " 2. Bấm gửi',
        duLieu: '"   "', mongDoi: 'Không thêm tin nhắn (trim rỗng)', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = t.trang;
        const soTruoc = await p.evaluate(() => document.querySelectorAll('#rcChatMessages .rc-msg').length);
        await p.fill('#rcTxtChatInput', '   ');
        await p.click('.rc-chat-send-btn');
        await p.waitForTimeout(500);
        const soSau = await p.evaluate(() => document.querySelectorAll('#rcChatMessages .rc-msg').length);
        kq.dat(soSau === soTruoc, 'Số tin trước: ' + soTruoc + ', sau: ' + soSau);
    });

    await t.tc({
        ma: 'TC-S09-19', trang: 'index.html', chucNang: 'Chatbot - gửi bằng phím Enter',
        tienDieuKien: 'Khung chat mở', cacBuoc: '1. Nhập "xin chào" 2. Nhấn Enter',
        duLieu: 'xin chào', mongDoi: 'Tin được gửi, bot trả lời', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = t.trang;
        const soBotTruoc = await p.evaluate(() => document.querySelectorAll('#rcChatMessages .rc-msg-bot').length);
        await p.fill('#rcTxtChatInput', 'xin chào');
        await p.press('#rcTxtChatInput', 'Enter');
        await p.waitForTimeout(1500);
        const soBotSau = await p.evaluate(() => document.querySelectorAll('#rcChatMessages .rc-msg-bot').length);
        kq.dat(soBotSau > soBotTruoc, 'Số tin bot trước: ' + soBotTruoc + ', sau: ' + soBotSau);
    });

    // ===================== 11. GIÁ TRỊ BIÊN =====================
    await t.tc({
        ma: 'TC-S09-20', trang: 'index.html', chucNang: 'Chatbot - ngân sách biên đúng ngưỡng 10 triệu',
        tienDieuKien: 'Khung chat mở', cacBuoc: '1. Gõ "sofa 10 triệu" 2. Kiểm tra giá',
        duLieu: 'sofa 10 triệu', mongDoi: 'Sản phẩm gợi ý có giá ≤ 10.000.000 ₫', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await moChat(p);
        await hoi(p, 'sofa 10 triệu');
        const ids = await idSanPhamTrongTinCuoi(p);
        const sp = await t.bang('products');
        let maxGia = 0;
        for (const id of ids) {
            const s = sp.find(x => String(x.id) === id);
            if (s) maxGia = Math.max(maxGia, Number(s.price));
        }
        kq.dat(ids.length === 0 || maxGia <= 10000000, 'Giá cao nhất: ' + maxGia + ' (ngưỡng 10.000.000)');
    });

    await t.tc({
        ma: 'TC-S09-21', trang: 'index.html', chucNang: 'Chatbot - ngân sách vượt 1 đơn vị (10.000.001)',
        tienDieuKien: 'Khung chat mở', cacBuoc: '1. Gõ "sofa dưới 10.000.001" 2. Kiểm tra giá',
        duLieu: 'sofa dưới 10.000.001', mongDoi: 'Sản phẩm gợi ý có giá ≤ 10.000.001 ₫', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = t.trang;
        await hoi(p, 'sofa dưới 10.000.001');
        const ids = await idSanPhamTrongTinCuoi(p);
        const sp = await t.bang('products');
        let maxGia = 0;
        for (const id of ids) {
            const s = sp.find(x => String(x.id) === id);
            if (s) maxGia = Math.max(maxGia, Number(s.price));
        }
        kq.dat(ids.length === 0 || maxGia <= 10000001, 'Giá cao nhất: ' + maxGia + ' (ngưỡng 10.000.001)');
    });

    await t.tc({
        ma: 'TC-S09-22', trang: 'index.html', chucNang: 'Chatbot - ngân sách rất nhỏ không có kết quả',
        tienDieuKien: 'Khung chat mở', cacBuoc: '1. Gõ "sofa dưới 100 nghìn" 2. Gửi',
        duLieu: 'sofa dưới 100 nghìn', mongDoi: 'Bot báo không tìm thấy hoặc gợi ý phù hợp, không bịa sản phẩm giá cao', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = t.trang;
        const traLoi = await hoi(p, 'sofa dưới 100 nghìn');
        kq.dat(traLoi.length > 0, 'Bot có trả lời (độ dài ' + traLoi.length + ')');
        const ids = await idSanPhamTrongTinCuoi(p);
        const sp = await t.bang('products');
        const quaGia = [];
        for (const id of ids) {
            const s = sp.find(x => String(x.id) === id);
            if (s && Number(s.price) > 100000) quaGia.push(id + ':' + s.price);
        }
        kq.dat(quaGia.length === 0 || /Kho không còn món nào/.test(traLoi), (/Kho không còn món nào/.test(traLoi) ? 'Bot báo rõ không có món trong tầm giá, gợi ý mẫu gần nhất để tham khảo. ' : '') + 'Sản phẩm vượt 100k: ' + (quaGia.join(', ') || 'không có'));
    });

    // ===================== 12. PHÂN QUYỀN =====================
    await t.tc({
        ma: 'TC-S09-23', trang: 'index.html', chucNang: 'Chatbot - khách chưa đăng nhập vẫn dùng được',
        tienDieuKien: 'Chưa đăng nhập', cacBuoc: '1. Mở trang chủ 2. Mở chat 3. Gõ "xin chào"',
        duLieu: 'xin chào', mongDoi: 'Chatbot hoạt động bình thường cho khách', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await moChat(p);
        const traLoi = await hoi(p, 'xin chào');
        kq.dat(traLoi.length > 0, 'Bot trả lời cho khách (độ dài ' + traLoi.length + ')');
    });

    await t.tc({
        ma: 'TC-S09-24', trang: 'index.html', chucNang: 'Chatbot - user đã đăng nhập dùng được',
        tienDieuKien: 'Đăng nhập user@roomcraft.vn', cacBuoc: '1. Mở trang chủ với vai trò user 2. Mở chat 3. Gõ "sofa dưới 10 triệu"',
        duLieu: 'sofa dưới 10 triệu', mongDoi: 'Chatbot trả lời bình thường cho user', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'user', moi: true });
        await moChat(p);
        const traLoi = await hoi(p, 'sofa dưới 10 triệu');
        kq.dat(/sofa/i.test(traLoi), 'Bot trả lời cho user: "' + traLoi.slice(0, 100) + '"');
    });

    await t.tc({
        ma: 'TC-S09-25', trang: 'admin/index.html', chucNang: 'Chatbot - trang admin không nhúng chatbot (đúng thiết kế)',
        tienDieuKien: 'Đăng nhập admin', cacBuoc: '1. Mở trang admin 2. Kiểm tra không có nút chat và không lỗi JS',
        duLieu: 'Không', mongDoi: 'Trang admin KHÔNG có nút chat (#rcChatToggleBtn không tồn tại) và không có lỗi JS', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = await t.mo('admin/index.html', { vaiTro: 'admin', moi: true });
        const loiJs = [];
        p.on('pageerror', e => loiJs.push(String(e && e.message || e)));
        await p.waitForTimeout(800);
        const coNut = await p.evaluate(() => !!document.getElementById('rcChatToggleBtn'));
        kq.dat(coNut === false, 'Trang admin có nút chat (không mong đợi): ' + coNut);
        kq.dat(loiJs.length === 0, 'Lỗi JS trên trang admin: ' + (loiJs.join(' | ') || 'không có'));
    });

    // ===================== 13. MOBILE =====================
    await t.tc({
        ma: 'TC-S09-26', trang: 'index.html', chucNang: 'Chatbot - mobile mở khung chat',
        tienDieuKien: 'Màn hình mobile', cacBuoc: '1. Mở trang chủ mobile 2. Bấm nút chat',
        duLieu: 'Không', mongDoi: 'Khung chat hiện ra, nằm gọn trong màn hình', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true, manHinh: 'mobile' });
        await moChat(p);
        const conAn = await p.evaluate(() => document.getElementById('rcChatBox').classList.contains('rc-chat-hidden'));
        kq.dat(conAn === false, 'Khung chat hiện trên mobile: ' + !conAn);
        // Cuộn ngang của trang chủ là lỗi riêng (s10) -> ở đây chỉ kiểm khung chat nằm gọn trong màn hình
        const khung = await p.evaluate(() => { const r = document.getElementById('rcChatBox').getBoundingClientRect(); return { trai: Math.round(r.left), phai: Math.round(r.right), rong: window.innerWidth }; });
        kq.danhDau('#rcChatBox');
        kq.dat(khung.trai >= 0 && khung.phai <= khung.rong, 'Khung chat từ ' + khung.trai + ' đến ' + khung.phai + 'px (màn hình ' + khung.rong + 'px)');
    });

    await t.tc({
        ma: 'TC-S09-27', trang: 'index.html', chucNang: 'Chatbot - mobile hỏi sofa dưới 10 triệu',
        tienDieuKien: 'Màn hình mobile, khung chat mở', cacBuoc: '1. Gõ "sofa dưới 10 triệu" 2. Gửi',
        duLieu: 'sofa dưới 10 triệu', mongDoi: 'Bot trả lời, sản phẩm ≤ 10tr, không tràn ngang', mucDoNeuLoi: 'Trung bình', manHinh: 'mobile'
    }, async (kq) => {
        const p = t.trang;
        const traLoi = await hoi(p, 'sofa dưới 10 triệu');
        kq.dat(/sofa/i.test(traLoi), 'Bot trả lời trên mobile: "' + traLoi.slice(0, 100) + '"');
        const ids = await idSanPhamTrongTinCuoi(p);
        const sp = await t.bang('products');
        const quaGia = [];
        for (const id of ids) {
            const s = sp.find(x => String(x.id) === id);
            if (s && Number(s.price) > 10000000) quaGia.push(id);
        }
        kq.dat(quaGia.length === 0, 'Sản phẩm vượt 10tr trên mobile: ' + (quaGia.join(', ') || 'không có'));
        // Cuộn ngang của trang chủ là lỗi riêng (s10) -> ở đây chỉ kiểm khung chat nằm gọn trong màn hình
        const khung = await p.evaluate(() => { const r = document.getElementById('rcChatBox').getBoundingClientRect(); return { trai: Math.round(r.left), phai: Math.round(r.right), rong: window.innerWidth }; });
        kq.danhDau('#rcChatBox');
        kq.dat(khung.trai >= 0 && khung.phai <= khung.rong, 'Khung chat từ ' + khung.trai + ' đến ' + khung.phai + 'px (màn hình ' + khung.rong + 'px)');
    });

    // ===================== 14. KIỂM TRA DỮ LIỆU SAU THAO TÁC =====================
    await t.tc({
        ma: 'TC-S09-28', trang: 'index.html', chucNang: 'Chatbot - lưu tối đa 40 tin trong localStorage',
        tienDieuKien: 'Gửi nhiều tin liên tiếp (chờ bot trả lời mỗi câu)', cacBuoc: '1. Gửi 25 câu hỏi, chờ bot trả lời xong mỗi câu 2. Kiểm tra rc_chat_history',
        duLieu: '25 câu "xin chào"', mongDoi: 'rc_chat_history có ≤ 40 tin và > 0 tin', mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await moChat(p);
        for (let i = 0; i < 25; i++) {
            const soBotTruoc = await p.evaluate(() => document.querySelectorAll('#rcChatMessages .rc-msg-bot').length);
            await p.fill('#rcTxtChatInput', 'xin chào ' + i);
            await p.click('.rc-chat-send-btn');
            // Chờ bot trả lời xong câu này (số tin bot tăng + không còn typing)
            await p.waitForFunction((n) => {
                const so = document.querySelectorAll('#rcChatMessages .rc-msg-bot').length;
                const typing = document.querySelector('#rcChatMessages .rc-typing');
                return so > n && !typing;
            }, soBotTruoc, { timeout: 8000 }).catch(() => {});
            await p.waitForTimeout(150);
        }
        // Chờ localStorage có dữ liệu
        await p.waitForFunction(() => {
            try {
                const ls = JSON.parse(localStorage.getItem('rc_rc_chat_history') || '[]');
                return ls.length > 0;
            } catch (e) { return false; }
        }, { timeout: 5000 }).catch(() => {});
        const ls = await p.evaluate(() => JSON.parse(localStorage.getItem('rc_rc_chat_history') || '[]'));
        kq.dat(ls.length <= 40, 'Số tin trong lịch sử: ' + ls.length + ' (tối đa 40)');
        kq.dat(ls.length > 0, 'Có lưu lịch sử: ' + ls.length);
    });

    await t.tc({
        ma: 'TC-S09-29', trang: 'index.html', chucNang: 'Chatbot - lịch sử lưu đúng sender',
        tienDieuKien: 'Đã chat', cacBuoc: '1. Gửi "xin chào" 2. Chờ bot trả lời 3. Đọc rc_chat_history',
        duLieu: 'xin chào', mongDoi: 'Mỗi tin có sender là "user" hoặc "bot", có ≥ 2 tin', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await moChat(p);
        await hoi(p, 'xin chào');
        // Chờ localStorage có ít nhất 2 tin (user + bot) trước khi assert
        await p.waitForFunction(() => {
            try {
                const ls = JSON.parse(localStorage.getItem('rc_rc_chat_history') || '[]');
                return ls.length >= 2;
            } catch (e) { return false; }
        }, { timeout: 5000 }).catch(() => {});
        const ls = await p.evaluate(() => JSON.parse(localStorage.getItem('rc_rc_chat_history') || '[]'));
        const sai = ls.filter(x => x.sender !== 'user' && x.sender !== 'bot');
        kq.dat(sai.length === 0, 'Tin có sender sai: ' + sai.length);
        kq.dat(ls.length >= 2, 'Số tin lưu: ' + ls.length + ' (cần ≥ 2)');
    });

    await t.tc({
        ma: 'TC-S09-30', trang: 'index.html', chucNang: 'Chatbot - nút gợi ý nhanh hoạt động',
        tienDieuKien: 'Khung chat mở', cacBuoc: '1. Bấm chip "Đồ cũ Marketplace" 2. Chờ trả lời',
        duLieu: 'Chip "Đồ cũ Marketplace"', mongDoi: 'Bot trả lời về đồ cũ', mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await moChat(p);
        const soBotTruoc = await p.evaluate(() => document.querySelectorAll('#rcChatMessages .rc-msg-bot').length);
        await p.click('#rcQuickTopics .rc-suggestion-chip:nth-child(2)');
        await p.waitForTimeout(2000);
        const soBotSau = await p.evaluate(() => document.querySelectorAll('#rcChatMessages .rc-msg-bot').length);
        kq.dat(soBotSau > soBotTruoc, 'Số tin bot trước: ' + soBotTruoc + ', sau: ' + soBotSau);
        const traLoi = await p.evaluate(() => {
            const ds = document.querySelectorAll('#rcChatMessages .rc-msg-bot .rc-msg-bubble');
            return ds.length ? ds[ds.length - 1].innerText : '';
        });
        kq.dat(/cũ|Marketplace|USED/i.test(traLoi), 'Bot trả lời: "' + traLoi.slice(0, 120) + '"');
    });
});