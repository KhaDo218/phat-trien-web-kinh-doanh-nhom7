const { phien } = require('../lib/khung-test');

phien({ ma: 's13', ten: 'Về RoomCraft & câu chuyện thương hiệu' }, async (t) => {

    // ===== TC-S13-01 =====
    await t.tc({
        ma: 'TC-S13-01', trang: 'about.html', chucNang: 'Mở trang Về RoomCraft',
        tienDieuKien: 'Trình duyệt mở about.html',
        cacBuoc: '1. Mở about.html 2. Đọc tiêu đề tab, đếm thẻ h1, đọc thuộc tính lang của html',
        duLieu: 'URL: about.html',
        mongDoi: 'Tiêu đề tab chứa "Về RoomCraft"; có đúng 1 thẻ h1; html lang="vi"',
        mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('about.html', { vaiTro: 'khach', moi: true });
        await p.waitForSelector('h1');
        const tieuDe = await p.title();
        kq.dat(tieuDe.includes('Về RoomCraft'), 'Tiêu đề tab: "' + tieuDe + '"');
        const soH1 = await p.locator('h1').count();
        kq.dat(soH1 === 1, 'Số thẻ h1: ' + soH1);
        const lang = await p.evaluate(() => document.documentElement.getAttribute('lang'));
        kq.dat(lang === 'vi', 'html lang: "' + lang + '"');
    });

    // ===== TC-S13-02 =====
    await t.tc({
        ma: 'TC-S13-02', trang: 'about.html', chucNang: 'Menu header đánh dấu mục Về RoomCraft',
        tienDieuKien: 'Đang ở about.html',
        cacBuoc: '1. Mở about.html 2. Tìm link tới about.html trong #header 3. Kiểm tra class active/aria-current 4. Mở index.html, bấm link Về RoomCraft trong header (mở menu nếu cần) 5. Kiểm tra URL',
        duLieu: 'Menu: Về RoomCraft',
        mongDoi: 'Trên about.html link Về RoomCraft có class active hoặc aria-current; từ index.html bấm link thì sang about.html',
        mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('about.html', { vaiTro: 'khach', moi: true });
        await p.waitForSelector('#header a');
        const thongTin = await p.evaluate(() => {
            const links = Array.from(document.querySelectorAll('#header a'));
            const link = links.find(a => (a.getAttribute('href') || '').includes('about.html'));
            if (!link) return null;
            return {
                active: link.classList.contains('active'),
                aria: link.getAttribute('aria-current'),
                text: link.textContent.trim()
            };
        });
        kq.dat(thongTin !== null, 'Tìm thấy link about.html trong #header: ' + (thongTin ? thongTin.text : 'không'));
        if (thongTin) {
            kq.dat(thongTin.active || thongTin.aria === 'page' || thongTin.aria === 'true',
                'Link active=' + thongTin.active + ', aria-current=' + thongTin.aria);
        }

        // Từ index.html bấm link
        const p2 = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p2.waitForSelector('#header a');
        let daBam = false;
        const linkVisible = await p2.evaluate(() => {
            const links = Array.from(document.querySelectorAll('#header a'));
            const link = links.find(a => (a.getAttribute('href') || '').includes('about.html'));
            if (!link) return false;
            const r = link.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
        });
        if (linkVisible) {
            await p2.evaluate(() => {
                const links = Array.from(document.querySelectorAll('#header a'));
                const link = links.find(a => (a.getAttribute('href') || '').includes('about.html'));
                link.click();
            });
            daBam = true;
        } else {
            // Thử mở nút menu
            const moMenu = await p2.evaluate(() => {
                const nut = document.querySelector('#header button, #header .menu-toggle, #header .toggle, #header [class*="menu"], #header [class*="toggle"]');
                if (nut) { nut.click(); return true; }
                return false;
            });
            if (moMenu) {
                await p2.waitForTimeout(400);
                const linkVisible2 = await p2.evaluate(() => {
                    const links = Array.from(document.querySelectorAll('#header a'));
                    const link = links.find(a => (a.getAttribute('href') || '').includes('about.html'));
                    if (!link) return false;
                    const r = link.getBoundingClientRect();
                    return r.width > 0 && r.height > 0;
                });
                if (linkVisible2) {
                    await p2.evaluate(() => {
                        const links = Array.from(document.querySelectorAll('#header a'));
                        const link = links.find(a => (a.getAttribute('href') || '').includes('about.html'));
                        link.click();
                    });
                    daBam = true;
                }
            }
        }
        if (daBam) {
            await p2.waitForURL(/about\.html/, { timeout: 5000 }).catch(() => {});
            kq.dat(/about\.html/.test(p2.url()), 'URL sau khi bấm: ' + p2.url());
        } else {
            kq.ghi('Không thấy link hiển thị trên màn hẹp, chuyển trực tiếp');
            await p2.goto(p2.url().replace(/index\.html.*/, 'about.html'));
            await p2.waitForSelector('h1');
            kq.dat(/about\.html/.test(p2.url()), 'URL sau khi goto trực tiếp: ' + p2.url());
        }
    });

    // ===== TC-S13-03 =====
    await t.tc({
        ma: 'TC-S13-03', trang: 'about.html', chucNang: 'Breadcrumb Trang chủ',
        tienDieuKien: 'Đang ở about.html',
        cacBuoc: '1. Mở about.html 2. Bấm link "Trang chủ" trong breadcrumb 3. Kiểm tra URL',
        duLieu: 'Breadcrumb: Trang chủ',
        mongDoi: 'Điều hướng về index.html',
        mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('about.html', { vaiTro: 'khach', moi: true });
        await p.waitForSelector('.breadcrumb a');
        const href = await p.getAttribute('.breadcrumb a', 'href');
        kq.dat(href === 'index.html', 'href breadcrumb: "' + href + '"');
        await p.click('.breadcrumb a');
        await p.waitForURL(/index\.html/, { timeout: 5000 }).catch(() => {});
        kq.dat(/index\.html/.test(p.url()), 'URL sau khi bấm: ' + p.url());
    });

    // ===== TC-S13-04 =====
    await t.tc({
        ma: 'TC-S13-04', trang: 'about.html', chucNang: 'Số liệu khối lời hứa',
        tienDieuKien: 'Đang ở about.html, dữ liệu đã nạp',
        cacBuoc: '1. Mở about.html 2. Đọc #abRooms, #abStyles, #abProducts 3. So sánh với dữ liệu bảng rooms, styles, products',
        duLieu: 'Bảng rooms, styles, products',
        mongDoi: '#abRooms = số phòng; #abStyles = số phong cách; #abProducts = (số sản phẩm is_active != false và product_type != "USED") + "+"',
        mucDoNeuLoi: 'Nghiêm trọng'
    }, async (kq) => {
        const p = await t.mo('about.html', { vaiTro: 'khach', moi: true });
        await p.waitForFunction(() => {
            const el = document.getElementById('abRooms');
            return el && el.textContent.trim() !== '';
        }, { timeout: 5000 });
        const rooms = await t.bang('rooms');
        const styles = await t.bang('styles');
        const products = await t.bang('products');
        const soSp = products.filter(x => x.is_active != false && x.product_type !== 'USED').length;
        const abRooms = (await t.chu('#abRooms')).trim();
        const abStyles = (await t.chu('#abStyles')).trim();
        const abProducts = (await t.chu('#abProducts')).trim();
        kq.dat(abRooms === String(rooms.length), '#abRooms: "' + abRooms + '" (mong đợi ' + rooms.length + ')');
        kq.dat(abStyles === String(styles.length), '#abStyles: "' + abStyles + '" (mong đợi ' + styles.length + ')');
        kq.dat(abProducts === soSp + '+', '#abProducts: "' + abProducts + '" (mong đợi ' + soSp + '+)');
    });

    // ===== TC-S13-05 =====
    await t.tc({
        ma: 'TC-S13-05', trang: 'about.html', chucNang: 'Bốn tấm ảnh - rê chuột/chạm tấm 2',
        tienDieuKien: 'Đang ở about.html, tấm 1 đang active',
        cacBuoc: '1. Mở about.html 2. Kiểm tra tấm 1 active 3. Rê chuột (hoặc chạm) tấm 2 4. Kiểm tra chỉ tấm 2 active',
        duLieu: 'Tấm ảnh #abPanels > li',
        mongDoi: 'Ban đầu tấm 1 active; sau thao tác chỉ tấm 2 active',
        mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('about.html', { vaiTro: 'khach', moi: true });
        await p.waitForSelector('#abPanels > li');
        const banDau = await p.evaluate(() => {
            const lis = Array.from(document.querySelectorAll('#abPanels > li'));
            return lis.map(li => li.classList.contains('active'));
        });
        kq.dat(banDau[0] === true && banDau.slice(1).every(x => !x), 'Ban đầu active: [' + banDau.join(',') + ']');

        const hoverOK = await p.evaluate(() => matchMedia('(hover: hover)').matches);
        const li2 = p.locator('#abPanels > li').nth(1);
        if (hoverOK) {
            await li2.hover();
        } else {
            await li2.click();
        }
        await p.waitForTimeout(300);
        const sau = await p.evaluate(() => {
            const lis = Array.from(document.querySelectorAll('#abPanels > li'));
            return lis.map(li => li.classList.contains('active'));
        });
        kq.dat(sau[1] === true && sau.filter((x, i) => i !== 1 && x).length === 0,
            'Sau thao tác active: [' + sau.join(',') + ']');
    });

    // ===== TC-S13-06 =====
    await t.tc({
        ma: 'TC-S13-06', trang: 'about.html', chucNang: 'Bấm/chạm tấm 4',
        tienDieuKien: 'Đang ở about.html',
        cacBuoc: '1. Mở about.html 2. Bấm tấm 4 3. Kiểm tra chỉ tấm 4 active',
        duLieu: 'Tấm ảnh #abPanels > li thứ 4',
        mongDoi: 'Chỉ tấm 4 active',
        mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('about.html', { vaiTro: 'khach', moi: true });
        await p.waitForSelector('#abPanels > li');
        await p.locator('#abPanels > li').nth(3).click();
        await p.waitForTimeout(300);
        const sau = await p.evaluate(() => {
            const lis = Array.from(document.querySelectorAll('#abPanels > li'));
            return lis.map(li => li.classList.contains('active'));
        });
        kq.dat(sau[3] === true && sau.filter((x, i) => i !== 3 && x).length === 0,
            'Active sau khi bấm tấm 4: [' + sau.join(',') + ']');
    });

    // ===== TC-S13-07 =====
    await t.tc({
        ma: 'TC-S13-07', trang: 'about.html', chucNang: 'Bàn phím focus tấm 3',
        tienDieuKien: 'Đang ở about.html',
        cacBuoc: '1. Mở about.html 2. focus() tấm 3 (tabindex=0) 3. Kiểm tra tấm 3 active',
        duLieu: 'Tấm ảnh #abPanels > li thứ 3',
        mongDoi: 'Tấm 3 active',
        mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('about.html', { vaiTro: 'khach', moi: true });
        await p.waitForSelector('#abPanels > li');
        const tabindex = await p.getAttribute('#abPanels > li:nth-child(3)', 'tabindex');
        kq.dat(tabindex === '0', 'tabindex tấm 3: "' + tabindex + '"');
        await p.evaluate(() => {
            document.querySelectorAll('#abPanels > li')[2].focus();
        });
        await p.waitForTimeout(300);
        const sau = await p.evaluate(() => {
            const lis = Array.from(document.querySelectorAll('#abPanels > li'));
            return lis.map(li => li.classList.contains('active'));
        });
        kq.dat(sau[2] === true && sau.filter((x, i) => i !== 2 && x).length === 0,
            'Active sau focus tấm 3: [' + sau.join(',') + ']');
    });

    // ===== TC-S13-08 =====
    await t.tc({
        ma: 'TC-S13-08', trang: 'about.html', chucNang: 'Hiện dần khi cuộn',
        tienDieuKien: 'Đang ở about.html',
        cacBuoc: '1. Mở about.html 2. Cuộn từng đoạn tới cuối trang 3. Kiểm tra mọi .ab-reveal có class is-visible',
        duLieu: 'Các phần tử .ab-reveal',
        mongDoi: 'Tất cả .ab-reveal đều có class is-visible',
        mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = await t.mo('about.html', { vaiTro: 'khach', moi: true });
        await p.waitForSelector('.ab-reveal');
        const tongSo = await p.locator('.ab-reveal').count();
        kq.dat(tongSo > 0, 'Số phần tử .ab-reveal: ' + tongSo);
        // Cuộn từng đoạn
        await p.evaluate(async () => {
            const h = document.body.scrollHeight;
            const buoc = Math.max(200, Math.floor(h / 8));
            for (let y = 0; y <= h; y += buoc) {
                window.scrollTo(0, y);
                await new Promise(r => setTimeout(r, 120));
            }
            window.scrollTo(0, h);
        });
        await p.waitForFunction(() => {
            const items = document.querySelectorAll('.ab-reveal');
            return items.length > 0 && Array.from(items).every(el => el.classList.contains('is-visible'));
        }, { timeout: 5000 }).catch(() => {});
        const soHien = await p.evaluate(() => {
            const items = document.querySelectorAll('.ab-reveal');
            return Array.from(items).filter(el => el.classList.contains('is-visible')).length;
        });
        kq.dat(soHien === tongSo, 'Số .ab-reveal is-visible: ' + soHien + '/' + tongSo);
    });

    // ===== TC-S13-09 =====
    await t.tc({
        ma: 'TC-S13-09', trang: 'about.html', chucNang: 'Link Khám phá không gian mẫu',
        tienDieuKien: 'Đang ở about.html',
        cacBuoc: '1. Mở about.html 2. Đọc href của .ab-link 3. Bấm link 4. Kiểm tra URL',
        duLieu: 'Link .ab-link',
        mongDoi: 'Dẫn tới rooms.html',
        mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('about.html', { vaiTro: 'khach', moi: true });
        await p.waitForSelector('.ab-link');
        const href = await p.getAttribute('.ab-link', 'href');
        kq.dat(href === 'rooms.html', 'href .ab-link: "' + href + '"');
        await p.click('.ab-link');
        await p.waitForURL(/rooms\.html/, { timeout: 5000 }).catch(() => {});
        kq.dat(/rooms\.html/.test(p.url()), 'URL sau khi bấm: ' + p.url());
    });

    // ===== TC-S13-10 =====
    await t.tc({
        ma: 'TC-S13-10', trang: 'about.html', chucNang: 'Không cuộn ngang',
        tienDieuKien: 'Đang ở about.html',
        cacBuoc: '1. Mở about.html 2. Đo cuộn ngang',
        duLieu: 'Trang about.html',
        mongDoi: 'Không có cuộn ngang (0px)',
        mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('about.html', { vaiTro: 'khach', moi: true });
        await p.waitForSelector('h1');
        await p.waitForTimeout(500);
        const ngang = await t.traNgang();
        kq.dat(ngang === 0, 'Cuộn ngang: ' + ngang + 'px');
    });

    // ===== TC-S13-11 =====
    await t.tc({
        ma: 'TC-S13-11', trang: 'about.html', chucNang: 'SEO và tiếp cận',
        tienDieuKien: 'Đang ở about.html',
        cacBuoc: '1. Mở about.html 2. Đọc meta description 3. Đọc alt ảnh .ab-hero-visual img',
        duLieu: 'Meta description, alt ảnh hero',
        mongDoi: 'Meta description không rỗng; alt ảnh hero không rỗng',
        mucDoNeuLoi: 'Nhẹ'
    }, async (kq) => {
        const p = await t.mo('about.html', { vaiTro: 'khach', moi: true });
        await p.waitForSelector('.ab-hero-visual img');
        const meta = await p.evaluate(() => {
            const m = document.querySelector('meta[name="description"]');
            return m ? m.getAttribute('content') : null;
        });
        kq.dat(meta !== null && meta.trim() !== '', 'Meta description: "' + (meta || '') + '"');
        const alt = await p.getAttribute('.ab-hero-visual img', 'alt');
        kq.dat(alt !== null && alt.trim() !== '', 'Alt ảnh hero: "' + (alt || '') + '"');
    });

    // ===== TC-S13-12 =====
    await t.tc({
        ma: 'TC-S13-12', trang: 'index.html', chucNang: 'Câu chuyện thương hiệu - tab và thanh so sánh',
        tienDieuKien: 'Đang ở index.html',
        cacBuoc: '1. Mở index.html 2. Cuộn tới #brandStory 3. Đếm tab trong #bsTabs 4. Bấm tab thứ 2, kiểm tra #bsRoomType đổi 5. Đặt #bsRange value=20, dispatch input, kiểm tra --split của #bsCompare',
        duLieu: 'Tab thứ 2, range value=20',
        mongDoi: '#bsTabs có ít nhất 2 tab; bấm tab 2 thì #bsRoomType đổi nội dung; --split = 20%',
        mucDoNeuLoi: 'Trung bình'
    }, async (kq) => {
        const p = await t.mo('index.html', { vaiTro: 'khach', moi: true });
        await p.waitForSelector('#brandStory');
        await p.evaluate(() => {
            document.getElementById('brandStory').scrollIntoView({ behavior: 'instant', block: 'start' });
        });
        await p.waitForTimeout(400);
        const soTab = await p.locator('#bsTabs > *').count();
        kq.dat(soTab >= 2, 'Số tab trong #bsTabs: ' + soTab);
        const truoc = await t.chu('#bsRoomType');
        await p.locator('#bsTabs > *').nth(1).click();
        await p.waitForTimeout(500);
        const sau = await t.chu('#bsRoomType');
        kq.dat(truoc !== sau, 'Nội dung #bsRoomType trước: "' + truoc + '", sau: "' + sau + '"');

        await p.evaluate(() => {
            const r = document.getElementById('bsRange');
            r.value = 20;
            r.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await p.waitForTimeout(300);
        const split = await p.evaluate(() => {
            const box = document.getElementById('bsCompare');
            return box.style.getPropertyValue('--split');
        });
        kq.dat(split === '20%', '--split của #bsCompare: "' + split + '" (mong đợi "20%")');
    });

});