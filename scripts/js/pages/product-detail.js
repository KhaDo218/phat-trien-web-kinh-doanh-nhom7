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
    if(!currentProduct || currentProduct.is_active == false){
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

    renderProductBreadcrumb(p);

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
    document.getElementById("lblDescription").textContent = p.description || "Chưa có mô tả chi tiết.";

    // 6. Hình ảnh & Thumbnails
    renderMediaGallery(p);

    // 7. Nút tồn kho & Giỏ hàng
    setupCartActions(p);

    // 8. Trạng thái nút yêu thích
    updateWishlistDetailButton(p.id);

    // 9. Gợi ý phối phòng và đánh giá
    renderProductRecommendations(p);
    renderProductReviews(p);
}

function renderProductBreadcrumb(p){
    var breadcrumb = document.getElementById("divBreadcrumb");
    while(breadcrumb.firstChild)
        breadcrumb.removeChild(breadcrumb.firstChild);

    appendBreadcrumbLink(breadcrumb, "index.html", "Trang chủ");
    appendBreadcrumbSeparator(breadcrumb);
    if(p.product_type === "USED"){
        appendBreadcrumbLink(breadcrumb, "marketplace.html", "Đồ cũ tuyển chọn");
    } else {
        appendBreadcrumbLink(breadcrumb, "products.html", "Sản phẩm");
        appendBreadcrumbSeparator(breadcrumb);
        var category = findById("categories", p.category_id);
        appendBreadcrumbLink(breadcrumb, "products.html?category=" + encodeURIComponent(p.category_id), category ? category.name : "Danh mục");
    }
    appendBreadcrumbSeparator(breadcrumb);
    breadcrumb.appendChild(document.createTextNode(p.name));
}

function appendBreadcrumbLink(container, href, label){
    var link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    container.appendChild(link);
}

function appendBreadcrumbSeparator(container){
    var separator = document.createElement("span");
    separator.textContent = "/";
    container.appendChild(separator);
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
        var thumbImage = document.createElement("img");
        thumbImage.src = asset(images[i]);
        thumbImage.alt = "Ảnh " + (i + 1);
        thumb.appendChild(thumbImage);
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
        viewerContainer.innerHTML = "";
        var modelViewer = document.createElement("model-viewer");
        modelViewer.setAttribute("src", asset(p.model_3d_url));
        modelViewer.setAttribute("camera-controls", "");
        modelViewer.setAttribute("auto-rotate", "");
        modelViewer.setAttribute("shadow-intensity", "1");
        modelViewer.setAttribute("ar", "");
        modelViewer.style.width = "100%";
        modelViewer.style.height = "100%";
        modelViewer.style.minHeight = "480px";
        modelViewer.style.background = "#EEEEEC";
        viewerContainer.appendChild(modelViewer);
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

function renderProductRecommendations(product){
    var products = getActiveProducts();
    var completeCandidates = [];
    var similar = [];

    for(var i = 0; i < products.length; i++){
        var candidate = products[i];
        if(candidate.id == product.id)
            continue;
        if(candidate.category_id == product.category_id)
            similar.push(candidate);
        else {
            var score = 0;
            if(productsShareStyle(product, candidate))
                score += 2;
            if(product.color && candidate.color && product.color.trim().toLowerCase() == candidate.color.trim().toLowerCase())
                score += 1;
            if(score > 0)
                completeCandidates.push({ product: candidate, score: score });
        }
    }

    completeCandidates.sort(function(a, b){
        return b.score - a.score;
    });
    similar.sort(function(a, b){
        if(productsShareStyle(product, a) && !productsShareStyle(product, b))
            return -1;
        if(!productsShareStyle(product, a) && productsShareStyle(product, b))
            return 1;
        return 0;
    });

    var completeGrid = document.getElementById("completeRoomProducts");
    completeGrid.innerHTML = "";
    for(var i = 0; i < completeCandidates.length && i < 4; i++)
        completeGrid.appendChild(createProductCard(completeCandidates[i].product));
    if(completeCandidates.length == 0)
        document.getElementById("completeRoomEmpty").classList.remove("hidden");

    var similarGrid = document.getElementById("similarProducts");
    similarGrid.innerHTML = "";
    for(var i = 0; i < similar.length && i < 4; i++)
        similarGrid.appendChild(createProductCard(similar[i]));
    if(similar.length == 0)
        document.getElementById("similarProductsEmpty").classList.remove("hidden");
}

function productsShareStyle(first, second){
    var firstStyles = first.style_ids || [];
    var secondStyles = second.style_ids || [];
    if(first.style_id != null && second.style_id != null && first.style_id == second.style_id)
        return true;
    for(var i = 0; i < firstStyles.length; i++){
        for(var j = 0; j < secondStyles.length; j++){
            if(firstStyles[i] == secondStyles[j])
                return true;
        }
    }
    return false;
}

function renderProductReviews(product){
    var reviews = getTable("reviews");
    var visibleReviews = [];
    var totalRating = 0;
    for(var i = 0; i < reviews.length; i++){
        if(reviews[i].product_id == product.id && reviews[i].is_hidden != true){
            visibleReviews.push(reviews[i]);
            totalRating += Number(reviews[i].rating);
        }
    }

    var summary = document.getElementById("reviewSummary");
    if(visibleReviews.length == 0)
        summary.textContent = "Chưa có đánh giá.";
    else
        summary.textContent = (totalRating / visibleReviews.length).toFixed(1) + " / 5 · " + visibleReviews.length + " đánh giá";

    var reviewList = document.getElementById("productReviewList");
    reviewList.innerHTML = "";
    for(var i = visibleReviews.length - 1; i >= 0; i--)
        reviewList.appendChild(createProductReview(visibleReviews[i]));

    updateReviewEligibility(product);
}

function createProductReview(review){
    var card = document.createElement("article");
    card.className = "product-review card";
    var user = findById("users", review.user_id);
    var heading = document.createElement("div");
    heading.className = "product-review-heading";

    var name = document.createElement("strong");
    name.textContent = user ? user.full_name : "Khách hàng";
    heading.appendChild(name);

    var date = document.createElement("span");
    date.className = "text-secondary";
    date.textContent = review.created_at ? formatDate(review.created_at) : "";
    heading.appendChild(date);
    card.appendChild(heading);

    var rating = document.createElement("p");
    rating.className = "product-review-rating";
    var stars = Number(review.rating);
    var starText = "";
    for(var i = 0; i < Math.max(0, Math.min(5, stars)); i++)
        starText += "★";
    rating.textContent = starText + " (" + stars + "/5)";
    card.appendChild(rating);

    var comment = document.createElement("p");
    comment.textContent = review.comment || "";
    card.appendChild(comment);
    return card;
}

function updateReviewEligibility(product){
    var message = document.getElementById("reviewEligibility");
    var form = document.getElementById("frmProductReview");
    var user = getCurrentUser();
    if(user == null){
        message.textContent = "Đăng nhập và mua sản phẩm để gửi đánh giá.";
        return;
    }
    if(hasReviewed(user.id, product.id)){
        message.textContent = "Bạn đã gửi đánh giá cho sản phẩm này.";
        return;
    }

    var orders = getTable("orders");
    var hasDeliveredProduct = false;
    for(var i = 0; i < orders.length; i++){
        if(orders[i].user_id != user.id || orders[i].status != "Delivered")
            continue;
        var items = orders[i].items || [];
        for(var j = 0; j < items.length; j++){
            if(items[j].product_id == product.id)
                hasDeliveredProduct = true;
        }
    }
    if(hasDeliveredProduct){
        message.textContent = "Bạn đã nhận sản phẩm này, hãy chia sẻ cảm nhận của bạn.";
        form.classList.remove("hidden");
    } else {
        message.textContent = "Đánh giá sẽ khả dụng sau khi bạn nhận được sản phẩm.";
    }
}

function submitProductReview(event){
    event.preventDefault();
    var user = getCurrentUser();
    if(user == null || currentProduct == null){
        alert("Vui lòng đăng nhập để gửi đánh giá.");
        return false;
    }
    var comment = document.getElementById("txtReviewComment").value.trim();
    if(comment == ""){
        alert("Vui lòng nhập nhận xét.");
        return false;
    }
    var result = addReview(user.id, currentProduct.id, document.getElementById("cboReviewRating").value, comment);
    if(result != ""){
        alert(result);
        return false;
    }
    document.getElementById("frmProductReview").reset();
    renderProductReviews(currentProduct);
    alert("Cảm ơn bạn đã đánh giá sản phẩm.");
    return false;
}
