/* =====================================================================
   ROOMCRAFT - Trang chủ (index.html)
   Người phụ trách: Bảo Duy (Kha làm trang mẫu, Duy làm tiếp)
   Dữ liệu: rc_rooms, rc_room_hotspots, rc_products, rc_styles
   Hàm dùng chung về phòng (getRoomHotspots, sortRoomsForDisplay) nằm trong components/room-card.js
   ===================================================================== */

var DEMO_ROOM_ID = "room-farmhouse-4189945";       // phòng minh họa ở mục Shop the Room
var ABOUT_ROOM_ID = "room-traditional-4240421";    // ảnh ở mục Về RoomCraft

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    renderHeader("");
    renderFooter();
    renderChatbot();
    showStats();
    showDemoRoom();
    showFeaturedProducts();
    showStyles();
    showAbout();
    showBrandStory();
    initHomeMotion();
}

// ----- Dải số liệu dưới banner -----
function showStats(){
    var products = getTable("products");
    var soSanPham = 0;
    var so3D = 0;
    for(var i = 0; i < products.length; i++){
        if(products[i].is_active == false || products[i].product_type == "USED")
            continue;
        soSanPham = soSanPham + 1;
        if(products[i].model_3d_url != null)
            so3D = so3D + 1;
    }
    var cacSo = [
        { so: getTable("rooms").length, chu: "Không gian mẫu" },
        { so: getTable("styles").length, chu: "Phong cách nội thất" },
        { so: soSanPham, chu: "Sản phẩm đang bán" },
        { so: so3D, chu: "Sản phẩm xem được 3D" }
    ];
    var html = "";
    for(var i = 0; i < cacSo.length; i++)
        html += "<li><span class='stat-number'>" + cacSo[i].so + "</span><span class='overline'>" + cacSo[i].chu + "</span></li>";
    document.getElementById("statList").innerHTML = html;
}

// ----- Phòng minh họa Shop the Room: chấm hotspot dẫn sang trang chi tiết phòng, mở sẵn sản phẩm -----
function showDemoRoom(){
    var room = findById("rooms", DEMO_ROOM_ID);
    if(room == null || getRoomHotspots(room.id).length == 0){
        var rooms = sortRoomsForDisplay(getTable("rooms"));
        room = rooms[0];
    }
    if(room == null){
        document.getElementById("shop-the-room").style.display = "none";
        return;
    }
    var img = document.getElementById("demoImage");
    img.src = asset(room.image_url);
    img.alt = room.name;

    var stage = document.getElementById("demoStage");
    var hotspots = getRoomHotspots(room.id);
    for(var i = 0; i < hotspots.length; i++){
        if(getHotspotImage(hotspots[i], room) != room.image_url)     // chỉ vẽ điểm của ảnh chính
            continue;
        var sp = findProduct(hotspots[i].product_id);
        var a = document.createElement("a");
        a.className = "hotspot";
        a.href = "room-detail.html?id=" + encodeURIComponent(room.id) + "&sp=" + encodeURIComponent(sp.id);
        a.style.left = hotspots[i].position_x + "%";
        a.style.top = hotspots[i].position_y + "%";
        a.setAttribute("aria-label", sp.name + " - " + formatVND(sp.price));
        // nhãn nhỏ hiện khi rê chuột: phía phải chấm, nếu chấm ở nửa phải ảnh thì hiện bên trái
        var lop = "hotspot-tip";
        if(hotspots[i].position_x > 60)
            lop += " tip-left";
        a.innerHTML = "<span class='" + lop + "'><b>" + roomEscape(sp.name) + "</b>" + formatVND(sp.price) + "</span>";
        stage.appendChild(a);
    }
}

// ----- 4 sản phẩm nổi bật: có trong hotspot, còn hàng, có 3D, mỗi phong cách 1 món -----
function showFeaturedProducts(){
    var list = document.getElementById("productList");
    list.innerHTML = "";
    var hotspots = getTable("room_hotspots");
    var chon = [];
    var daLayStyle = [];
    var daLayId = [];
    // Lượt 1: nội thất (danh mục cha 1) có 3D; lượt 2: bất kỳ sản phẩm còn hàng
    for(var luot = 1; luot <= 2; luot++){
        for(var i = 0; i < hotspots.length && chon.length < 8; i++){
            var sp = findProduct(hotspots[i].product_id);
            if(sp == null || sp.is_active == false || Number(sp.stock_quantity) <= 0)
                continue;
            if(daLayId.indexOf(sp.id) >= 0 || daLayStyle.indexOf(sp.style_id) >= 0)
                continue;
            if(luot == 1 && (sp.model_3d_url == null || sp.parent_category_id != 1))
                continue;
            chon.push(sp);
            daLayId.push(sp.id);
            daLayStyle.push(sp.style_id);
        }
    }
    for(var i = 0; i < chon.length; i++){
        var card = createProductCard(chon[i]);
        if(chon[i].images && chon[i].images.length > 1){
            var imageLink = card.querySelector(".product-card-img > a");
            var altImage = document.createElement("img");
            altImage.className = "product-card-alt-image";
            altImage.src = asset(chon[i].images[1]);
            altImage.alt = "";
            altImage.loading = "lazy";
            altImage.decoding = "async";
            imageLink.appendChild(altImage);
        }
        list.appendChild(card);
    }
}

// ----- Chuyển động trang chủ: slider sản phẩm và hiệu ứng xuất hiện khi cuộn -----
function initHomeMotion(){
    initHomeHeader();
    initHeroVideoTrim();
    initFeaturedCarousel();
    initPointlight();
    initAboutScrub();
    initBrandStory();

    var revealItems = document.querySelectorAll(".section-head, .room-card, .str-demo, .str-steps > li, .style-tile, .bs-intro > *, .bs-tabs");
    for(var i = 0; i < revealItems.length; i++){
        revealItems[i].classList.add("home-reveal");
        revealItems[i].style.setProperty("--reveal-delay", (i % 4) * 70 + "ms");
    }

    if(!("IntersectionObserver" in window)){
        for(var j = 0; j < revealItems.length; j++)
            revealItems[j].classList.add("is-visible");
        return;
    }

    var observer = new IntersectionObserver(function(entries){
        for(var k = 0; k < entries.length; k++){
            if(entries[k].isIntersecting){
                entries[k].target.classList.add("is-visible");
                observer.unobserve(entries[k].target);
            }
        }
    }, { threshold: 0.12 });

    for(var n = 0; n < revealItems.length; n++)
        observer.observe(revealItems[n]);
}

// Pointlight: vùng sáng chạy theo con trỏ trên ảnh căn phòng tối, khung ảnh nghiêng nhẹ theo chuột.
// Không rê chuột (hoặc trên điện thoại) thì đèn tự trôi chậm quanh căn phòng.
function initPointlight(){
    var section = document.getElementById("pointlight");
    if(!section)
        return;
    var dark = section.querySelector(".pointlight-dark");
    var glow = section.querySelector(".pointlight-glow");
    var stage = section.querySelector(".pointlight-stage");
    var copy = section.querySelector(".pointlight-copy");
    var size = { w: section.offsetWidth, h: section.offsetHeight };
    window.addEventListener("resize", function(){
        size = { w: section.offsetWidth, h: section.offsetHeight };
    });
    if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        return;

    var mouse = null;                    // vị trí con trỏ (0..1) khi đang rê chuột trong khung
    var now = { x: 0.5, y: 0.55 };       // vị trí đèn hiện tại, trôi dần tới vị trí đích
    var running = false;

    section.addEventListener("pointermove", function(e){
        if(e.pointerType == "touch")
            return;
        var r = section.getBoundingClientRect();
        mouse = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    });
    section.addEventListener("pointerleave", function(){
        mouse = null;
    });

    function frame(time){
        if(!running)
            return;
        var target = mouse;
        if(target == null){
            var t = time / 1000;
            target = { x: 0.5 + Math.sin(t * 0.45) * 0.28, y: 0.55 + Math.sin(t * 0.7) * 0.14 };
        }
        now.x += (target.x - now.x) * 0.08;
        now.y += (target.y - now.y) * 0.08;

        // Dời tâm lớp tối (rộng gấp 3 khung) tới vị trí đèn; chỉ đổi transform nên card đồ họa tự xử lý
        var dich = "translate(" + (now.x * size.w - 1.5 * size.w).toFixed(1) + "px," + (now.y * size.h - 1.5 * size.h).toFixed(1) + "px)";
        dark.style.transform = dich;
        glow.style.transform = dich;
        var tx = (now.x - 0.5) * 2, ty = (now.y - 0.5) * 2;
        stage.style.transform = "rotateY(" + (tx * 5).toFixed(2) + "deg) rotateX(" + (ty * -4).toFixed(2) + "deg) scale(1.02)";
        copy.style.transform = "translate3d(" + (tx * -18).toFixed(1) + "px," + (ty * -12).toFixed(1) + "px,0)";
        window.requestAnimationFrame(frame);
    }

    // Chỉ chạy hiệu ứng khi khung đang hiện trên màn hình
    function setRunning(on){
        if(on && !running){
            running = true;
            window.requestAnimationFrame(frame);
        }
        running = on;
    }
    if("IntersectionObserver" in window){
        new IntersectionObserver(function(entries){
            setRunning(entries[0].isIntersecting);
        }).observe(section);
    }
    else
        setRunning(true);
}

// Bỏ qua 2 giây đầu và 2 giây cuối khi phát video hero.
function initHeroVideoTrim(){
    var video = document.querySelector("#hero .hero-video");
    if(!video)
        return;

    var startAt = Number(video.getAttribute("data-start")) || 0;
    var trimEnd = Number(video.getAttribute("data-end-trim")) || 0;
    var isResetting = false;

    function startTrimmedVideo(){
        if(video.duration && startAt < video.duration){
            video.currentTime = startAt;
            var playPromise = video.play();
            if(playPromise && typeof playPromise.catch == "function")
                playPromise.catch(function(){});
        }
    }
    video.addEventListener("loadedmetadata", startTrimmedVideo);
    video.addEventListener("timeupdate", function(){
        if(isResetting || !video.duration)
            return;
        if(video.currentTime >= video.duration - trimEnd){
            isResetting = true;
            video.currentTime = startAt;
            video.play();
            window.setTimeout(function(){ isResetting = false; }, 80);
        }
    });
    video.addEventListener("ended", startTrimmedVideo);

    if(video.readyState >= 1)
        startTrimmedVideo();
}

// Trang chủ mở đầu bằng video tràn màn hình; header chỉ hiện khi người dùng bắt đầu cuộn.
function initHomeHeader(){
    var header = document.getElementById("header");
    if(!header)
        return;

    var ticking = false;
    function updateHeader(){
        header.classList.toggle("home-header-visible", window.scrollY > 48);
        ticking = false;
    }
    function requestHeaderUpdate(){
        if(ticking)
            return;
        ticking = true;
        window.requestAnimationFrame(updateHeader);
    }

    updateHeader();
    window.addEventListener("scroll", requestHeaderUpdate, { passive: true });
}

function initFeaturedCarousel(){
    var track = document.getElementById("productList");
    var prev = document.getElementById("featuredPrev");
    var next = document.getElementById("featuredNext");
    var progress = document.getElementById("featuredProgressBar");
    if(!track || !prev || !next)
        return;

    var animationFrame = null;
    var lastFrameTime = 0;
    var loopWidth = 0;
    var isPaused = false;
    var resumeTimer = null;
    var pixelsPerSecond = 34;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Nhân đôi dải card để tạo vòng chạy liên tục, không có khoảng trống ở cuối.
    var originalCards = Array.prototype.slice.call(track.children);
    for(var cloneIndex = 0; cloneIndex < originalCards.length; cloneIndex++){
        var clone = originalCards[cloneIndex].cloneNode(true);
        clone.classList.add("product-card-clone");
        clone.setAttribute("aria-hidden", "true");
        clone.querySelectorAll("a, button").forEach(function(control){
            control.setAttribute("tabindex", "-1");
        });
        var cloneWish = clone.querySelector(".btn-wishlist");
        if(cloneWish){
            cloneWish.addEventListener("click", function(event){
                event.preventDefault();
                event.stopPropagation();
                var card = event.currentTarget.closest(".product-card");
                toggleWishlistProduct(card.getAttribute("data-id"), event.currentTarget);
            });
        }
        track.appendChild(clone);
    }

    function getStep(){
        var card = track.querySelector(".product-card");
        if(!card) return track.clientWidth;
        return card.getBoundingClientRect().width + 24;
    }
    function updateCarousel(){
        var firstClone = track.children[originalCards.length];
        loopWidth = firstClone ? firstClone.offsetLeft - originalCards[0].offsetLeft : track.scrollWidth / 2;
        var ratio = loopWidth <= 0 ? 0 : (track.scrollLeft % loopWidth) / loopWidth;
        prev.disabled = loopWidth <= track.clientWidth;
        next.disabled = loopWidth <= track.clientWidth;
        if(progress)
            progress.style.width = Math.max(18, ratio * 100) + "%";
    }
    function pauseMarquee(){
        isPaused = true;
    }
    function resumeMarquee(){
        isPaused = false;
        lastFrameTime = performance.now();
    }
    function runMarquee(time){
        if(lastFrameTime === 0)
            lastFrameTime = time;
        var elapsed = Math.min(40, time - lastFrameTime);
        lastFrameTime = time;
        if(!reduceMotion && !document.hidden && !isPaused && loopWidth > track.clientWidth){
            track.scrollLeft += pixelsPerSecond * elapsed / 1000;
            if(track.scrollLeft >= loopWidth)
                track.scrollLeft -= loopWidth;
        }
        animationFrame = requestAnimationFrame(runMarquee);
    }
    function moveCarousel(direction){
        var step = getStep();
        if(loopWidth <= 0 || step <= 0)
            return;

        pauseMarquee();
        if(resumeTimer != null)
            window.clearTimeout(resumeTimer);

        // Đưa về bản sao tương ứng trước khi lùi/tiến qua hai đầu để tạo vòng lặp liên tục.
        if(direction < 0 && track.scrollLeft < step * 0.5)
            track.scrollLeft = loopWidth;
        else if(direction > 0 && track.scrollLeft >= loopWidth - step * 0.5)
            track.scrollLeft = track.scrollLeft - loopWidth;

        track.scrollTo({
            left: track.scrollLeft + direction * step,
            behavior: reduceMotion ? "auto" : "smooth"
        });

        resumeTimer = window.setTimeout(function(){
            resumeMarquee();
            resumeTimer = null;
        }, 900);
    }
    prev.addEventListener("click", function(){
        moveCarousel(-1);
    });
    next.addEventListener("click", function(){
        moveCarousel(1);
    });
    track.addEventListener("mouseenter", pauseMarquee);
    track.addEventListener("mouseleave", resumeMarquee);
    track.addEventListener("focusin", pauseMarquee);
    track.addEventListener("focusout", resumeMarquee);
    track.addEventListener("pointerdown", function(){
        pauseMarquee();
        window.setTimeout(resumeMarquee, 4000);
    });
    track.addEventListener("scroll", updateCarousel, { passive: true });
    window.addEventListener("resize", updateCarousel);
    document.addEventListener("visibilitychange", function(){
        lastFrameTime = performance.now();
    });
    updateCarousel();
    animationFrame = requestAnimationFrame(runMarquee);
    window.addEventListener("pagehide", function(){
        if(animationFrame != null)
            cancelAnimationFrame(animationFrame);
        if(resumeTimer != null)
            window.clearTimeout(resumeTimer);
    }, { once: true });
}

// ----- Ô phong cách: ảnh 1 phòng tiêu biểu + số phòng, bấm vào sang rooms.html đã lọc -----
function showStyles(){
    var styles = getTable("styles");
    var rooms = sortRoomsForDisplay(getTable("rooms"));
    var list = document.getElementById("styleList");
    list.innerHTML = "";
    for(var i = 0; i < styles.length; i++){
        var anh = "";
        var soPhong = 0;
        for(var j = 0; j < rooms.length; j++){
            if(rooms[j].style_id != styles[i].id)
                continue;
            soPhong = soPhong + 1;
            if(anh == "")
                anh = rooms[j].image_url;
        }
        var o = document.createElement("a");
        o.className = "style-tile";
        o.href = "rooms.html?style=" + styles[i].slug;
        o.title = styles[i].description;
        o.innerHTML = "<img src='" + asset(anh) + "' alt='Phong cách " + roomEscape(styles[i].name) + "' loading='lazy' decoding='async'>"
                    + "<span class='style-info'>"
                    + "  <span class='title-product'>" + roomEscape(styles[i].name) + "</span>"
                    + "  <span class='style-count'>" + soPhong + " không gian <span class='material-symbols-outlined'>arrow_forward</span></span>"
                    + "</span>";
        list.appendChild(o);
    }
}

// ----- Về RoomCraft: các góc chụp của phòng mẫu (để tua khi cuộn) + hàng tên phong cách -----
function showAbout(){
    var room = findById("rooms", ABOUT_ROOM_ID);
    if(room == null)
        room = getTable("rooms")[0];
    if(room == null)
        return;
    var anh = (room.images && room.images.length > 0) ? room.images : [room.image_url];
    var html = "";
    for(var i = 0; i < anh.length; i++)
        html += "<img src='" + asset(anh[i]) + "' alt='" + (i == 0 ? roomEscape(room.name) : "") + "'" + (i > 0 ? " loading='lazy' decoding='async'" : "") + ">";
    document.getElementById("aboutFrames").innerHTML = html;
    document.getElementById("aboutFrameTotal").innerHTML = anh.length < 10 ? "0" + anh.length : anh.length;
    document.getElementById("aboutCaption").innerHTML = "<a href='room-detail.html?id=" + encodeURIComponent(room.id) + "'>"
        + roomEscape(room.name) + "</a>";

    var styles = getTable("styles");
    var list = "";
    for(var j = 0; j < styles.length; j++)
        list += "<li><a href='rooms.html?style=" + styles[j].slug + "'>" + roomEscape(styles[j].name) + "</a></li>";
    document.getElementById("aboutStyles").innerHTML = list;
}

// ----- Câu chuyện thương hiệu: khung so sánh "ý tưởng / hoàn thiện" + thẻ phối màu, kiểu phòng, món nổi bật -----
// Kiểu phòng, diện tích gợi ý và bảng màu chọn tay theo ảnh từng phòng; số món, chất liệu chủ đạo và món nổi bật lấy từ dữ liệu.
var BRAND_STORY_ROOMS = [
    { id: "room-mid-century-modern-4229562", kieu: "Phòng khách", dienTich: 24,
      mau: [["#5B5E3C", "Xanh ô liu"], ["#E8E0D0", "Kem sữa"], ["#B4673F", "Đất nung"], ["#6B4A33", "Gỗ óc chó"]] },
    { id: "room-scandinavian-4226900", kieu: "Phòng ngủ", dienTich: 18,
      mau: [["#2F3A57", "Xanh navy"], ["#EDE7DC", "Vải lanh"], ["#7A7652", "Rêu nhạt"], ["#C99A55", "Hổ phách"]] },
    { id: "room-coastal-4173476", kieu: "Phòng ăn", dienTich: 20,
      mau: [["#B2552C", "Gỉ sét"], ["#2F3B3A", "Xanh rêu đậm"], ["#B8915E", "Gỗ sồi"], ["#F1EEE8", "Trắng ngà"]] },
    { id: "room-bohemian-4236536", kieu: "Phòng sinh hoạt", dienTich: 28,
      mau: [["#A4532F", "Đất nung"], ["#4F6B2A", "Xanh lá"], ["#B8934A", "Đồng thau"], ["#E8E0D0", "Kem"]] }
];

function showBrandStory(){
    var tabs = document.getElementById("bsTabs");
    if(!tabs)
        return;
    var html = "";
    for(var i = 0; i < BRAND_STORY_ROOMS.length; i++){
        var room = findById("rooms", BRAND_STORY_ROOMS[i].id);
        var style = room ? findById("styles", room.style_id) : null;
        html += "<button type='button' role='tab' data-i='" + i + "'>" + BRAND_STORY_ROOMS[i].kieu
              + (style ? "<small>" + roomEscape(style.name) + "</small>" : "") + "</button>";
    }
    tabs.innerHTML = html;
    tabs.onclick = function(e){
        var nut = e.target.closest("button");
        if(nut)
            selectBrandRoom(parseInt(nut.getAttribute("data-i"), 10));
    };

    selectBrandRoom(0);
}

function selectBrandRoom(i){
    var cfg = BRAND_STORY_ROOMS[i];
    var room = cfg ? findById("rooms", cfg.id) : null;
    if(room == null)
        return;
    var style = findById("styles", room.style_id);
    var nuts = document.querySelectorAll("#bsTabs button");
    for(var k = 0; k < nuts.length; k++){
        nuts[k].classList.toggle("active", k == i);
        nuts[k].setAttribute("aria-selected", k == i ? "true" : "false");
    }

    // hiệu ứng chuyển phòng: thẻ kính và ảnh mờ đi rồi hiện lại
    var stage = document.querySelector(".bs-stage");
    stage.classList.remove("is-switching");
    void stage.offsetWidth;
    stage.classList.add("is-switching");

    var anh = asset(room.image_url);
    document.getElementById("bsAfter").src = anh;
    document.getElementById("bsAfter").alt = room.name;
    document.getElementById("bsBefore").src = anh;

    // Bảng màu: bấm vào ô màu để xem tên
    var sw = "";
    for(var m = 0; m < cfg.mau.length; m++)
        sw += "<li><button type='button' style='background:" + cfg.mau[m][0] + "' data-ten='" + cfg.mau[m][1] + "<small>" + cfg.mau[m][0] + "</small>"
            + "' aria-label='" + cfg.mau[m][1] + "'" + (m == 0 ? " class='active'" : "") + "></button></li>";
    var swatches = document.getElementById("bsSwatches");
    swatches.innerHTML = sw;
    document.getElementById("bsSwatchName").innerHTML = cfg.mau[0][1] + "<small>" + cfg.mau[0][0] + "</small>";
    swatches.onclick = function(e){
        var o = e.target.closest("button");
        if(!o)
            return;
        var all = swatches.querySelectorAll("button");
        for(var n = 0; n < all.length; n++)
            all[n].classList.toggle("active", all[n] == o);
        document.getElementById("bsSwatchName").innerHTML = o.getAttribute("data-ten");
    };

    // Món trong phòng: chất liệu xuất hiện nhiều nhất + món nội thất giá cao nhất
    var dem = {};
    var noiBat = null;
    var ids = room.product_ids || [];
    for(var p = 0; p < ids.length; p++){
        var sp = findById("products", ids[p]);
        if(sp == null)
            continue;
        if(sp.material_group)
            dem[sp.material_group] = (dem[sp.material_group] || 0) + 1;
        if(sp.parent_category_id == 1 && sp.images && sp.images.length > 0 && (noiBat == null || sp.price > noiBat.price))
            noiBat = sp;
    }
    var chatLieu = "";
    for(var key in dem)
        if(chatLieu == "" || dem[key] > dem[chatLieu])
            chatLieu = key;
    document.getElementById("bsMaterial").innerHTML = chatLieu || "Tự nhiên";

    document.getElementById("bsRoomType").innerHTML = cfg.kieu + (style ? "<span>" + roomEscape(style.name) + "</span>" : "");
    document.getElementById("bsArea").innerHTML = "~" + cfg.dienTich;
    document.getElementById("bsItems").innerHTML = ids.length;

    var pick = document.getElementById("bsPick");
    if(noiBat){
        pick.style.display = "";
        pick.href = "product-detail.html?id=" + encodeURIComponent(noiBat.id);
        document.getElementById("bsPickImg").src = asset(noiBat.images[0]);
        document.getElementById("bsPickImg").alt = noiBat.name;
        document.getElementById("bsPickName").innerHTML = roomEscape(noiBat.name);
        document.getElementById("bsPickPrice").innerHTML = formatVND(noiBat.price);
    }
    else
        pick.style.display = "none";

    document.getElementById("bsDesc").innerHTML = roomEscape(room.description || "");
    document.getElementById("bsRoomLink").href = "room-detail.html?id=" + encodeURIComponent(room.id);
}

// Thanh kéo so sánh: input range nằm phủ trên ảnh (kéo chuột, chạm và phím mũi tên đều được).
// Lần đầu cuộn tới, thanh tự lướt qua lại một lần để người xem biết có thể kéo.
function initBrandStory(){
    var box = document.getElementById("bsCompare");
    var range = document.getElementById("bsRange");
    if(!box || !range)
        return;
    function setSplit(v){
        box.style.setProperty("--split", v + "%");
    }
    range.addEventListener("input", function(){
        setSplit(range.value);
    });

    if(!("IntersectionObserver" in window) || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches))
        return;
    var daChay = false;
    var obs = new IntersectionObserver(function(entries){
        if(!entries[0].isIntersecting || daChay)
            return;
        daChay = true;
        obs.disconnect();
        var batDau = null;
        function buoc(t){
            if(batDau == null)
                batDau = t;
            var x = Math.min(1, (t - batDau) / 2400);
            var v = x >= 1 ? 50 : 50 + Math.sin(x * Math.PI * 2) * 26;
            range.value = v;
            setSplit(v.toFixed(2));
            if(x < 1)
                requestAnimationFrame(buoc);
        }
        requestAnimationFrame(buoc);
    }, { threshold: 0.5 });
    obs.observe(box);
}

// Cuộn qua section Về RoomCraft: ảnh lùi dần từ cận cảnh ra toàn cảnh và chuyển qua từng góc chụp,
// tiêu đề trượt lên trước, phần chữ dưới đáy hiện sau. Chỉ đặt biến CSS, phần hiển thị nằm trong index.css.
function initAboutScrub(){
    var section = document.getElementById("ve-roomcraft");
    if(!section)
        return;
    if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        return;
    var frames = section.querySelectorAll(".about-frames img");
    var frameNo = document.getElementById("aboutFrameNo");
    var ticking = false;

    // Đổi x trong khoảng [a, b] thành 0..1
    function range(x, a, b){
        return Math.min(1, Math.max(0, (x - a) / (b - a)));
    }

    function update(){
        ticking = false;
        var r = section.getBoundingClientRect();
        var total = section.offsetHeight - window.innerHeight;
        if(total <= 0 || r.bottom < 0 || r.top > window.innerHeight)
            return;
        var p = range(-r.top, 0, total);
        section.style.setProperty("--p", p.toFixed(4));
        // tiêu đề bắt đầu trượt lên từ lúc section mới vào 60% màn hình, xong trước khi ảnh chuyển góc
        section.style.setProperty("--head", range(-r.top, -0.6 * window.innerHeight, 0.15 * total).toFixed(4));
        section.style.setProperty("--foot", range(p, 0.45, 0.7).toFixed(4));

        // Vị trí trên dải ảnh: ảnh i rõ nhất khi f = i, hai ảnh kề nhau hòa vào nhau
        var f = range(p, 0.1, 0.9) * (frames.length - 1);
        for(var i = 0; i < frames.length; i++)
            frames[i].style.opacity = Math.max(0, 1 - Math.abs(f - i)).toFixed(3);
        var so = Math.round(f) + 1;
        frameNo.innerHTML = so < 10 ? "0" + so : so;
    }
    function requestUpdate(){
        if(ticking)
            return;
        ticking = true;
        window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
}
