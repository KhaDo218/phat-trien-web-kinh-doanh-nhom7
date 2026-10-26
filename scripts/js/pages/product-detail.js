/* =====================================================================
   ROOMCRAFT - Chi tiết sản phẩm (product-detail.html)
   Người phụ trách: Nguyên Khôi & Như Huyền (phần đồ cũ)
   Việc cần làm: Hiển thị chi tiết sản phẩm, ảnh nhiều góc, xem 3D,
                 thông tin tình trạng & thời gian sử dụng đồ cũ.
   ===================================================================== */

var currentProduct = null;
var activeMediaMode = "photo"; // "photo" hoặc "3d"

function initPage(){
    var id = getParam("id");
    currentProduct = findById("products", id);

    // sản phẩm bị Admin ẩn (is_active = false) thì khách không xem được
    if(!currentProduct || currentProduct.is_active === false){
        renderHeader("san-pham");
        renderFooter();
        renderChatbot();
        showProductNotFound();
        return;
    }

    if(currentProduct.product_type === "USED"){
        renderHeader("do-cu");
    } else {
        renderHeader("san-pham");
    }
    renderFooter();
    renderChatbot();

    renderProductDetails(currentProduct);
}

function showProductNotFound(){
    var container = document.getElementById("productDetailContainer");
    var notFound = document.getElementById("productNotFound");
    if(container) container.classList.add("hidden");
    if(notFound) notFound.classList.remove("hidden");
}

function renderProductDetails(p){
    document.title = p.name + " - RoomCraft";

    // 1. Breadcrumb
    var bcrumb = document.getElementById("divBreadcrumb");
    if(p.product_type === "USED"){
        bcrumb.innerHTML = "<a href='index.html'>Trang chủ</a><span>/</span>"
                         + "<a href='marketplace.html'>Đồ cũ tuyển chọn</a><span>/</span>"
                         + p.name;
    } else {
        var cat = findById("categories", p.category_id);
        var catName = cat ? cat.name : "Sản phẩm";
        bcrumb.innerHTML = "<a href='index.html'>Trang chủ</a><span>/</span>"
                         + "<a href='products.html'>Sản phẩm</a><span>/</span>"
                         + "<a href='products.html?category=" + p.category_id + "'>" + catName + "</a><span>/</span>"
                         + p.name;
    }

    // 2. Nhãn thương hiệu & danh mục
    var brandCatLbl = document.getElementById("lblBrandCat");
    var catObj = findById("categories", p.category_id);
    var cName = catObj ? catObj.name : "Nội thất";
    brandCatLbl.textContent = (p.brand || "RoomCraft").toUpperCase() + " • " + cName.toUpperCase();

    var typeBadge = document.getElementById("lblProductTypeBadge");
    if(p.product_type === "USED"){
        typeBadge.textContent = "Đồ cũ độc bản";
        typeBadge.className = "badge badge-grade-good";
    } else {
        typeBadge.textContent = "Sản phẩm mới";
        typeBadge.className = "badge";
    }

    // 3. Tiêu đề & giá
    document.getElementById("lblProductName").textContent = p.name;
    document.getElementById("lblPrice").textContent = formatVND(p.price);

    var oldPriceElem = document.getElementById("lblOldPrice");
    var saleBadge = document.getElementById("lblSalePercent");
    if(p.original_price && p.original_price > p.price){
        oldPriceElem.textContent = formatVND(p.original_price);
        oldPriceElem.classList.remove("hidden");

        var pct = Math.round((1 - (p.price / p.original_price)) * 100);
        saleBadge.textContent = "Tiết kiệm " + pct + "%";
        saleBadge.classList.remove("hidden");
    } else {
        oldPriceElem.classList.add("hidden");
        saleBadge.classList.add("hidden");
    }

    // 4. Khung thông tin đồ cũ (Nếu là đồ cũ)
    var usedBox = document.getElementById("usedProductInfoBox");
    if(p.product_type === "USED"){
        usedBox.classList.remove("hidden");

        var gradeBadge = document.getElementById("lblConditionGradeBadge");
        gradeBadge.textContent = p.condition_grade || "Good";
        var gradeCls = "badge-grade-good";
        if(p.condition_grade === "Like New") gradeCls = "badge-grade-likenew";
        else if(p.condition_grade === "Fair") gradeCls = "badge-grade-fair";
        gradeBadge.className = "badge " + gradeCls;

        document.getElementById("lblUsageTime").textContent = p.usage_time || "Chưa cập nhật";
        document.getElementById("lblConditionNote").textContent = p.condition_note || "Đã kiểm định đầy đủ kết cấu";

        var stockLbl = document.getElementById("lblUsedStock");
        if(p.stock_quantity === 0){
            stockLbl.textContent = "Đã bán (Hết hàng)";
            stockLbl.style.color = "#8C3B2D";
        } else {
            stockLbl.textContent = "Còn duy nhất 1 món trong kho";
            stockLbl.style.color = "#2C6B3F";
        }
    } else {
        usedBox.classList.add("hidden");
    }

    // 5. Thông số kỹ thuật
    document.getElementById("lblDimensions").textContent = p.dimensions || "Theo tiêu chuẩn";
    document.getElementById("lblMaterial").textContent = p.material || "Đang cập nhật";
    document.getElementById("lblColor").textContent = p.color || "Tiêu chuẩn";
    document.getElementById("lblBrand").textContent = p.brand || "RoomCraft";
    document.getElementById("lblDescription").innerHTML = "<p>" + (p.description || "Chưa có mô tả chi tiết.") + "</p>";

    // 6. Hình ảnh & Thumbnails
    renderMediaGallery(p);

    // 7. Nút tồn kho & Giỏ hàng
    setupCartActions(p);

    // 8. Trạng thái nút yêu thích
    updateWishlistDetailButton(p.id);
}

function renderMediaGallery(p){
    var images = p.images || [];
    var imgMain = document.getElementById("imgMain");
    if(images.length > 0){
        imgMain.src = asset(images[0]);
    }

    var thumbsBox = document.getElementById("divThumbnails");
    thumbsBox.innerHTML = "";
    for(var i = 0; i < images.length; i++){
        var thumb = document.createElement("button");
        thumb.type = "button";
        thumb.className = "thumb-btn" + (i === 0 ? " active" : "");
        thumb.innerHTML = "<img src='" + asset(images[i]) + "' alt='Ảnh " + (i + 1) + "'>";
        (function(idx, src){
            thumb.onclick = function(){
                imgMain.src = asset(src);
                switchMediaMode("photo");
                var allThumbs = thumbsBox.querySelectorAll(".thumb-btn");
                allThumbs.forEach(function(t){ t.classList.remove("active"); });
                thumb.classList.add("active");
            };
        })(i, images[i]);
        thumbsBox.appendChild(thumb);
    }

    // Mô hình 3D nếu có
    var switcher = document.getElementById("divMediaSwitcher");
    var viewerContainer = document.getElementById("divModelViewer");
    if(p.model_3d_url){
        switcher.classList.remove("hidden");
        viewerContainer.innerHTML = "<model-viewer src='" + asset(p.model_3d_url) + "' "
                                  + "camera-controls auto-rotate shadow-intensity='1' ar "
                                  + "style='width:100%; height:100%; min-height:480px; background:#EEEEEC;'></model-viewer>";
    } else {
        switcher.classList.add("hidden");
        viewerContainer.innerHTML = "";
    }
}

function switchMediaMode(mode){
    activeMediaMode = mode;
    var imgMain = document.getElementById("imgMain");
    var viewerBox = document.getElementById("divModelViewer");
    var btnPhoto = document.getElementById("btnShowPhoto");
    var btn3D = document.getElementById("btnShow3D");

    if(mode === "3d"){
        imgMain.classList.add("hidden");
        viewerBox.classList.remove("hidden");
        if(btn3D) btn3D.classList.add("active");
        if(btnPhoto) btnPhoto.classList.remove("active");
    } else {
        viewerBox.classList.add("hidden");
        imgMain.classList.remove("hidden");
        if(btnPhoto) btnPhoto.classList.add("active");
        if(btn3D) btn3D.classList.remove("active");
    }
}

function setupCartActions(p){
    var btnAdd = document.getElementById("btnAddToCart");
    var qtyInp = document.getElementById("txtQuantity");

    if(p.stock_quantity === 0){
        btnAdd.disabled = true;
        btnAdd.className = "btn btn-light btn-full";
        btnAdd.innerHTML = "<span class='material-symbols-outlined'>block</span> " + (p.product_type === "USED" ? "Đã bán" : "Hết hàng");
        qtyInp.disabled = true;
        qtyInp.value = 0;
    } else {
        btnAdd.disabled = false;
        btnAdd.className = "btn btn-full";
        btnAdd.innerHTML = "<span class='material-symbols-outlined'>shopping_bag</span> Thêm vào giỏ hàng";
        qtyInp.disabled = false;
        qtyInp.max = p.stock_quantity;
        qtyInp.value = 1;
    }
}

function handleAddToCart(){
    if(!currentProduct || currentProduct.stock_quantity === 0)
        return;

    var qty = Number(document.getElementById("txtQuantity").value);
    var loi = addToCart(currentProduct.id, qty);      // services/cart.js
    if(loi != ""){
        alert(loi);
        return;
    }

    var msgNotice = document.getElementById("msgCartNotice");
    if(msgNotice){
        msgNotice.textContent = "Đã thêm " + qty + " sản phẩm vào giỏ hàng!";
        msgNotice.classList.remove("hidden");
        setTimeout(function(){
            msgNotice.classList.add("hidden");
        }, 3000);
    }
}

function handleToggleWishlist(){
    if(!currentProduct) return;
    var btnWish = document.getElementById("btnAddToWishlist");
    toggleWishlistProduct(currentProduct.id, btnWish);
    updateWishlistDetailButton(currentProduct.id);
}

function updateWishlistDetailButton(productId){
    var isFav = checkIsWishlist(productId);
    var icon = document.getElementById("iconWishlistDetail");
    if(icon){
        if(isFav){
            icon.style.fontVariationSettings = "\"FILL\" 1";
            icon.style.color = "#8C3B2D";
        } else {
            icon.style.fontVariationSettings = "\"FILL\" 0";
            icon.style.color = "";
        }
    }
}
