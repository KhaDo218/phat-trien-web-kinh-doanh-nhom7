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
    initPanorama();
    initAboutScrub();

    var revealItems = document.querySelectorAll(".section-head, .room-card, .str-demo, .str-steps > li, .style-tile");
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
    var litImage = section.querySelector(".pointlight-lit");
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

        // Toạ độ mask tính theo khung ảnh sáng (khung ảnh lớn hơn section 5% mỗi phía)
        var s = section.getBoundingClientRect();
        var img = litImage.getBoundingClientRect();
        section.style.setProperty("--x", (s.left + now.x * s.width - img.left) + "px");
        section.style.setProperty("--y", (s.top + now.y * s.height - img.top) + "px");
        section.style.setProperty("--tx", ((now.x - 0.5) * 2).toFixed(3));
        section.style.setProperty("--ty", ((now.y - 0.5) * 2).toFixed(3));
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

// ----- Tham quan 360°: vẽ ảnh toàn cảnh (equirectangular, tỉ lệ 2:1) bằng WebGL -----
// Mỗi điểm ảnh trên màn hình tính ra một hướng nhìn, đổi hướng đó thành kinh độ / vĩ độ
// rồi lấy màu tương ứng trên ảnh toàn cảnh. Kéo chuột đổi hướng nhìn (yaw: quay trái phải, pitch: ngước lên xuống).
var PANO_VERTEX = "attribute vec2 aPos; varying vec2 vPos;"
    + "void main(){ vPos = aPos; gl_Position = vec4(aPos, 0.0, 1.0); }";
var PANO_FRAGMENT = "precision highp float;"
    + "uniform sampler2D uTex; uniform vec2 uView; uniform float uTanHalf; uniform float uAspect; varying vec2 vPos;"
    + "void main(){"
    + "  vec3 d = normalize(vec3(vPos.x * uTanHalf * uAspect, vPos.y * uTanHalf, -1.0));"
    + "  float cp = cos(uView.y), sp = sin(uView.y);"
    + "  d = vec3(d.x, d.y * cp - d.z * sp, d.y * sp + d.z * cp);"
    + "  float cy = cos(uView.x), sy = sin(uView.x);"
    + "  d = vec3(d.x * cy + d.z * sy, d.y, -d.x * sy + d.z * cy);"
    + "  float lon = atan(d.x, -d.z);"
    + "  float lat = asin(clamp(d.y, -1.0, 1.0));"
    + "  gl_FragColor = texture2D(uTex, vec2(lon / 6.2831853 + 0.5, 0.5 - lat / 3.1415927));"
    + "}";

function initPanorama(){
    var section = document.getElementById("pano");
    if(!section)
        return;
    var canvas = document.getElementById("panoCanvas");
    var hint = document.getElementById("panoHint");
    var src = section.getAttribute("data-src");
    var gl = canvas.getContext("webgl", { antialias: false }) || canvas.getContext("experimental-webgl");

    // Không có WebGL: dùng ảnh làm nền trượt ngang (xem .pano.no-webgl trong index.css)
    if(!gl){
        section.classList.add("no-webgl");
        section.style.backgroundImage = "url('" + src + "')";
        return;
    }

    var program = createPanoProgram(gl);
    var uView = gl.getUniformLocation(program, "uView");
    var uTanHalf = gl.getUniformLocation(program, "uTanHalf");
    var uAspect = gl.getUniformLocation(program, "uAspect");

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var view = { yaw: -1.35, pitch: 0, fov: 75 };   // hướng nhìn (radian; bắt đầu quay về phía ghế và giường) và góc nhìn (độ)
    var target = { fov: 75 };
    var hover = { x: 0, y: 0, sx: 0, sy: 0 };          // nghiêng nhẹ theo con trỏ khi chỉ rê chuột
    var drag = null;
    var velocity = 0;                                  // quán tính sau khi thả chuột
    var lastTouch = 0;                                 // thời điểm người xem chạm lần cuối
    var loaded = false, running = false, lastTime = 0;

    function resize(){
        var tiLe = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(canvas.clientWidth * tiLe);
        canvas.height = Math.round(canvas.clientHeight * tiLe);
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function frame(time){
        if(!running)
            return;
        var dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
        lastTime = time;

        if(drag == null){
            view.yaw += velocity;
            velocity *= 0.92;
            // để yên 2.5 giây thì phòng tự xoay chậm
            if(!reduceMotion && time - lastTouch > 2500)
                view.yaw += dt * 0.06;
        }
        hover.sx += (hover.x - hover.sx) * 0.06;
        hover.sy += (hover.y - hover.sy) * 0.06;
        view.fov += (target.fov - view.fov) * 0.12;

        var pitch = Math.max(-1.2, Math.min(1.2, view.pitch + hover.sy * 0.12));
        gl.uniform2f(uView, view.yaw - hover.sx * 0.3, pitch);
        gl.uniform1f(uTanHalf, Math.tan(view.fov * Math.PI / 360));
        gl.uniform1f(uAspect, canvas.width / canvas.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        window.requestAnimationFrame(frame);
    }

    function setRunning(on){
        if(on && !running && loaded){
            running = true;
            lastTime = 0;
            resize();
            window.requestAnimationFrame(frame);
        }
        else if(!on)
            running = false;
    }

    // Kéo để xoay: kéo sang phải thì nội dung trôi sang phải (giống Google Street View)
    section.addEventListener("pointerdown", function(e){
        if(e.target.closest && e.target.closest("button"))
            return;
        drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
        velocity = 0;
        lastTouch = performance.now();
        section.classList.add("dragging");
        section.setPointerCapture(e.pointerId);
        hint.classList.add("hide");
    });
    section.addEventListener("pointermove", function(e){
        var r = section.getBoundingClientRect();
        if(drag == null){
            if(e.pointerType == "mouse"){
                hover.x = (e.clientX - r.left) / r.width * 2 - 1;
                hover.y = (e.clientY - r.top) / r.height * 2 - 1;
            }
            return;
        }
        var heSo = (view.fov * Math.PI / 180) / r.height;    // số radian ứng với 1px kéo
        var dx = (e.clientX - drag.x) * heSo;
        view.yaw += dx;
        view.pitch = Math.max(-1.2, Math.min(1.2, view.pitch + (e.clientY - drag.y) * heSo));
        velocity = dx;
        drag.x = e.clientX;
        drag.y = e.clientY;
        lastTouch = performance.now();
    });
    function endDrag(){
        drag = null;
        section.classList.remove("dragging");
        lastTouch = performance.now();
    }
    section.addEventListener("pointerup", endDrag);
    section.addEventListener("pointercancel", endDrag);
    section.addEventListener("pointerleave", function(){
        hover.x = 0;
        hover.y = 0;
    });

    // Nút phóng to / thu nhỏ (không dùng con lăn chuột để khỏi chặn cuộn trang)
    document.getElementById("panoZoomIn").addEventListener("click", function(){
        target.fov = Math.max(40, target.fov - 12);
        lastTouch = performance.now();
    });
    document.getElementById("panoZoomOut").addEventListener("click", function(){
        target.fov = Math.min(95, target.fov + 12);
        lastTouch = performance.now();
    });
    window.addEventListener("resize", function(){
        if(running)
            resize();
    });

    // Tải ảnh (~3MB) khi người xem cuộn gần tới section; ảnh lớn hơn khả năng card đồ họa thì thu nhỏ trước
    function loadImage(){
        var img = new Image();
        img.onload = function(){
            var toiDa = gl.getParameter(gl.MAX_TEXTURE_SIZE);
            var nguon = img;
            if(img.width > toiDa){
                nguon = document.createElement("canvas");
                nguon.width = toiDa;
                nguon.height = toiDa / 2;
                nguon.getContext("2d").drawImage(img, 0, 0, nguon.width, nguon.height);
            }
            var tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, nguon);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            loaded = true;
            section.classList.add("ready");
            setRunning(isVisible);
        };
        img.src = src;
    }

    var isVisible = false;
    if("IntersectionObserver" in window){
        var daTai = false;
        new IntersectionObserver(function(entries){
            if(entries[0].isIntersecting && !daTai){
                daTai = true;
                loadImage();
            }
        }, { rootMargin: "600px 0px" }).observe(section);
        new IntersectionObserver(function(entries){
            isVisible = entries[0].isIntersecting;
            setRunning(isVisible);
        }).observe(section);
    }
    else{
        isVisible = true;
        loadImage();
    }
}

// Biên dịch shader và tạo hình chữ nhật phủ kín canvas
function createPanoProgram(gl){
    function shader(loai, ma){
        var s = gl.createShader(loai);
        gl.shaderSource(s, ma);
        gl.compileShader(s);
        return s;
    }
    var program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, PANO_VERTEX));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, PANO_FRAGMENT));
    gl.linkProgram(program);
    gl.useProgram(program);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    return program;
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
        o.innerHTML = "<img src='" + asset(anh) + "' alt='Phong cách " + roomEscape(styles[i].name) + "' loading='lazy'>"
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
        html += "<img src='" + asset(anh[i]) + "' alt='" + (i == 0 ? roomEscape(room.name) : "") + "'" + (i > 0 ? " loading='lazy'" : "") + ">";
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
