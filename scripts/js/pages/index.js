/* =====================================================================
   ROOMCRAFT - Trang chủ (index.html)
   Người phụ trách: Bảo Duy (Kha làm trang mẫu, Duy làm tiếp)
   Dữ liệu: rc_rooms, rc_room_hotspots, rc_products, rc_styles
   Hàm thẻ phòng createRoomCard() nằm trong components/room-card.js
   ===================================================================== */

// Phòng muốn đưa lên trang chủ (nếu Admin xóa phòng thì tự lấy phòng khác)
var FEATURED_ROOM_IDS = ["room-bohemian-4189649", "room-scandinavian-4237170", "room-mid-century-modern-4229562"];
var DEMO_ROOM_ID = "room-farmhouse-4189945";       // phòng minh họa ở mục Shop the Room
var ABOUT_ROOM_ID = "room-traditional-4240421";    // ảnh ở mục Về RoomCraft

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    renderHeader("");
    renderFooter();
    renderChatbot();
    showStats();
    showRooms();
    showDemoRoom();
    showFeaturedProducts();
    showStyles();
    showAbout();
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

// ----- 3 phòng nổi bật: ưu tiên FEATURED_ROOM_IDS, thiếu thì lấy phòng có hotspot khác phong cách -----
function showRooms(){
    var list = document.getElementById("roomList");
    list.innerHTML = "";
    var chon = [];
    var daLayStyle = [];
    for(var i = 0; i < FEATURED_ROOM_IDS.length; i++){
        var room = findById("rooms", FEATURED_ROOM_IDS[i]);
        if(room != null){
            chon.push(room);
            daLayStyle.push(room.style_id);
        }
    }
    var rooms = sortRoomsForDisplay(getTable("rooms"));
    for(var i = 0; i < rooms.length && chon.length < 3; i++){
        if(daLayStyle.indexOf(rooms[i].style_id) >= 0)
            continue;
        chon.push(rooms[i]);
        daLayStyle.push(rooms[i].style_id);
    }
    for(var i = 0; i < chon.length; i++)
        list.appendChild(createRoomCard(chon[i], i + 1));
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

    var revealItems = document.querySelectorAll(".section-head, .room-card, .str-demo, .str-steps > li, .style-tile, #ve-roomcraft .about-text, #ve-roomcraft .about-image");
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

// Bỏ qua phần tiêu đề ở 8 giây đầu và 5 giây cuối khi phát video hero.
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
        o.innerHTML = "<img src='" + asset(anh) + "' alt='Phong cách " + roomEscape(styles[i].name) + "' loading='lazy'>"
                    + "<span class='style-info'>"
                    + "  <span class='title-product'>" + roomEscape(styles[i].name) + "</span>"
                    + "  <span class='style-count'>" + soPhong + " không gian <span class='material-symbols-outlined'>arrow_forward</span></span>"
                    + "</span>";
        list.appendChild(o);
    }
}

function showAbout(){
    var room = findById("rooms", ABOUT_ROOM_ID);
    if(room == null)
        room = getTable("rooms")[0];
    if(room == null)
        return;
    document.getElementById("aboutImage").src = asset(room.image_url);
    document.getElementById("aboutCaption").innerHTML = "<a href='room-detail.html?id=" + encodeURIComponent(room.id) + "'>"
        + roomEscape(room.name) + "</a>";
}
