/* =====================================================================
   ROOMCRAFT - product-card.js (Thẻ sản phẩm dùng chung)
   Người phụ trách: Nguyên Khôi (dùng ở: products, wishlist, marketplace, room-detail, product-detail)
   Mẫu thẻ theo mockup: ảnh nền #EEEEEC + nút tim góc phải, dòng "THƯƠNG HIỆU • DANH MỤC",
   tên (font Garamond, class title-product), giá + giá gốc gạch ngang (price, price-old),
   nhãn "Còn hàng" (badge badge-stock), nút "Xem chi tiết" (btn btn-full).
   Ảnh: asset(product.images[0]); giá: formatVND(product.price)
   ===================================================================== */

function createProductCard(product){
    var card = document.createElement("div");
    card.className = "product-card card";
    card.setAttribute("data-id", product.id);

    // Lấy thông tin danh mục & phong cách
    var cat = findById("categories", product.category_id);
    var catName = cat ? cat.name : "Nội thất";
    var brandName = product.brand || "RoomCraft";

    // Khung ảnh
    var imgBox = document.createElement("div");
    imgBox.className = "product-card-img";

    var linkImg = document.createElement("a");
    linkImg.href = "product-detail.html?id=" + product.id;

    var img = document.createElement("img");
    var imgSrc = (product.images && product.images.length > 0) ? asset(product.images[0]) : "";
    img.src = imgSrc;
    img.alt = product.name;
    img.loading = "lazy";
    linkImg.appendChild(img);
    imgBox.appendChild(linkImg);

    // Huy hiệu trên ảnh (Đồ cũ: Tình trạng / Mới: 3D nếu có)
    var badgesBox = document.createElement("div");
    badgesBox.className = "product-card-badges";

    if(product.product_type === "USED"){
        var badgeGrade = document.createElement("span");
        var gradeCls = "badge-grade-good";
        if(product.condition_grade === "Like New") gradeCls = "badge-grade-likenew";
        else if(product.condition_grade === "Fair") gradeCls = "badge-grade-fair";
        badgeGrade.className = "badge " + gradeCls;
        badgeGrade.innerHTML = product.condition_grade || "Đồ cũ";
        badgesBox.appendChild(badgeGrade);
    }
    if(typeof product.model_3d_url === "string" && product.model_3d_url.trim() !== ""){
        var badge3d = document.createElement("span");
        badge3d.className = "badge badge-3d";
        badge3d.innerHTML = "<span class='material-symbols-outlined' aria-hidden='true'>view_in_ar</span> Có hình 3D";
        badge3d.setAttribute("aria-label", "Sản phẩm có hình ảnh 3D");
        badgesBox.appendChild(badge3d);
    }

    imgBox.appendChild(badgesBox);

    // Nút yêu thích
    var btnWish = document.createElement("button");
    btnWish.className = "btn-wishlist";
    btnWish.setAttribute("title", "Lưu vào yêu thích");
    btnWish.setAttribute("aria-label", "Yêu thích sản phẩm " + product.name);
    var isFav = checkIsWishlist(product.id);
    btnWish.innerHTML = "<span class='material-symbols-outlined' style='" + (isFav ? "font-variation-settings:\"FILL\" 1; color:#8C3B2D;" : "") + "'>favorite</span>";
    btnWish.onclick = function(e){
        e.preventDefault();
        e.stopPropagation();
        toggleWishlistProduct(product.id, btnWish);
    };
    imgBox.appendChild(btnWish);

    // Thân thẻ
    var body = document.createElement("div");
    body.className = "product-card-body";

    // Overline: THƯƠNG HIỆU • DANH MỤC
    var overline = document.createElement("p");
    overline.className = "overline";
    overline.textContent = brandName.toUpperCase() + " • " + catName.toUpperCase();
    body.appendChild(overline);

    // Tên sản phẩm
    var title = document.createElement("h3");
    title.className = "title-product";
    var titleLink = document.createElement("a");
    titleLink.href = "product-detail.html?id=" + product.id;
    titleLink.textContent = product.name;
    title.appendChild(titleLink);
    body.appendChild(title);

    // Thời gian sử dụng & ghi chú nếu là đồ cũ
    if(product.product_type === "USED"){
        var usedMeta = document.createElement("p");
        usedMeta.className = "product-used-meta";
        var timeText = product.usage_time ? "Đã dùng " + product.usage_time : "Đã qua sử dụng";
        if(product.stock_quantity > 0)
            timeText += " · Duy nhất 1 món";
        usedMeta.innerHTML = "<span class='material-symbols-outlined' style='font-size:14px;vertical-align:-2px;'>history</span> " + timeText;
        body.appendChild(usedMeta);
    }

    // Giá & Trạng thái tồn kho
    var priceRow = document.createElement("div");
    priceRow.className = "product-card-price-row";

    var priceBox = document.createElement("div");
    priceBox.className = "product-prices";
    var priceSpan = document.createElement("span");
    priceSpan.className = "price";
    priceSpan.textContent = formatVND(product.price);
    priceBox.appendChild(priceSpan);

    if(product.original_price && product.original_price > product.price){
        var oldPriceSpan = document.createElement("span");
        oldPriceSpan.className = "price-old";
        oldPriceSpan.textContent = formatVND(product.original_price);
        priceBox.appendChild(oldPriceSpan);
    }
    priceRow.appendChild(priceBox);

    // Nhãn tình trạng kho: Hết hàng / Đã bán, hoặc "Còn N" khi còn từ 5 món trở xuống.
    // Đồ cũ còn hàng đã ghi "Duy nhất 1 món" ở dòng trên. Nhờ vậy giá và giá gốc luôn nằm gọn trên một hàng.
    var stockBadge = document.createElement("span");
    if(product.stock_quantity === 0){
        stockBadge.className = "badge badge-out";
        stockBadge.textContent = product.product_type === "USED" ? "Đã bán" : "Hết hàng";
        priceRow.appendChild(stockBadge);
    } else if(product.product_type !== "USED" && product.stock_quantity <= 5){
        // Như các shop thật: chỉ báo khi sắp hết, còn nhiều thì không cần nhãn
        stockBadge.className = "badge badge-stock";
        stockBadge.textContent = "Còn " + product.stock_quantity;
        priceRow.appendChild(stockBadge);
    }
    body.appendChild(priceRow);

    // Nút hành động
    var actionBox = document.createElement("div");
    actionBox.className = "product-card-actions";
    var btnView = document.createElement("a");
    btnView.className = "btn btn-outline btn-full";
    btnView.href = "product-detail.html?id=" + product.id;
    btnView.textContent = "Xem chi tiết";
    if(product.stock_quantity === 0 && product.product_type === "USED"){
        btnView.className = "btn btn-light btn-full";
        btnView.textContent = "Đã bán";
    }
    actionBox.appendChild(btnView);
    body.appendChild(actionBox);

    card.appendChild(imgBox);
    card.appendChild(body);
    return card;
}

function checkIsWishlist(productId){
    var user = getCurrentUser();
    var wishlists = getObject("wishlists") || {};
    var key = user ? user.id : "guest";
    var list = wishlists[key] || [];
    return list.indexOf(productId) >= 0;
}

function toggleWishlistProduct(productId, btnElem){
    var user = getCurrentUser();
    var wishlists = getObject("wishlists") || {};
    var key = user ? user.id : "guest";
    if(!wishlists[key]) wishlists[key] = [];

    var list = wishlists[key];
    var idx = list.indexOf(productId);
    var icon = btnElem.querySelector(".material-symbols-outlined");

    if(idx >= 0){
        list.splice(idx, 1);
        if(icon){
            icon.style.fontVariationSettings = "\"FILL\" 0";
            icon.style.color = "";
        }
    } else {
        list.push(productId);
        if(icon){
            icon.style.fontVariationSettings = "\"FILL\" 1";
            icon.style.color = "#8C3B2D";
        }
    }
    saveObject("wishlists", wishlists);
    if(typeof updateWishCount == "function") updateWishCount();
}
