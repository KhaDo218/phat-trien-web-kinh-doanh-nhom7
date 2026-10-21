/* =====================================================================
   ROOMCRAFT - product-card.js (thẻ sản phẩm dùng chung)
   Người phụ trách: Nguyên Khôi  (cần xong trước Thứ 5, 22/10)
   Dùng ở: products, wishlist, marketplace, room-detail, product-detail
   Mẫu thẻ theo mockup: ảnh nền #EEEEEC + nút tim góc phải, dòng "THƯƠNG HIỆU • DANH MỤC",
   tên (font Garamond, class title-product), giá + giá gốc gạch ngang (price, price-old),
   nhãn "Còn hàng" (badge badge-stock), nút "Xem chi tiết" (btn btn-full).
   Ảnh: asset(product.images[0]); giá: formatVND(product.price)

   Cách dùng: container.appendChild(createProductCard(product))
   ===================================================================== */

function createProductCard(product){
    var card = document.createElement("article");
    card.className = "card product-card";

    var imageLink = document.createElement("a");
    imageLink.className = "product-card-image";
    imageLink.href = "product-detail.html?id=" + encodeURIComponent(product.id);
    imageLink.setAttribute("aria-label", "Xem " + product.name);

    var image = document.createElement("img");
    if(product.images != null && product.images.length > 0)
        image.src = asset(product.images[0]);
    image.alt = product.name;
    image.loading = "lazy";
    imageLink.appendChild(image);

    var favoriteButton = document.createElement("button");
    favoriteButton.className = "btn-icon product-card-favorite";
    favoriteButton.type = "button";
    favoriteButton.setAttribute("aria-label", "Lưu " + product.name + " vào yêu thích");
    var favoriteIcon = document.createElement("span");
    favoriteIcon.className = "material-symbols-outlined";
    favoriteIcon.textContent = "favorite";
    favoriteButton.appendChild(favoriteIcon);

    var imageArea = document.createElement("div");
    imageArea.className = "product-card-media";
    imageArea.appendChild(imageLink);
    imageArea.appendChild(favoriteButton);

    var content = document.createElement("div");
    content.className = "product-card-content";

    var meta = document.createElement("p");
    meta.className = "overline";
    var categoryName = "";
    if(typeof getCategoryName == "function")
        categoryName = getCategoryName(product.category_id);
    meta.textContent = product.brand || "";
    if(categoryName != "")
        meta.textContent += " · " + categoryName;

    var nameLink = document.createElement("a");
    nameLink.href = imageLink.href;
    var name = document.createElement("h3");
    name.className = "title-product";
    name.className += " product-card-name";
    name.textContent = product.name;
    nameLink.appendChild(name);

    var priceRow = document.createElement("div");
    priceRow.className = "product-card-prices";

    var price = document.createElement("span");
    price.className = "price";
    price.textContent = formatVND(product.price);
    priceRow.appendChild(price);

    if(product.original_price != null && Number(product.original_price) > Number(product.price)){
        var originalPrice = document.createElement("span");
        originalPrice.className = "price-old";
        originalPrice.textContent = formatVND(product.original_price);
        priceRow.appendChild(originalPrice);
    }

    var stock = document.createElement("span");
    if(Number(product.stock_quantity) > 0){
        stock.className = "badge badge-stock";
        stock.textContent = "Còn hàng";
    }
    else{
        stock.className = "badge badge-out";
        stock.textContent = product.product_type == "USED" ? "Đã bán" : "Hết hàng";
    }
    priceRow.appendChild(stock);

    var detailLink = document.createElement("a");
    detailLink.className = "btn btn-full";
    detailLink.href = imageLink.href;
    detailLink.className += " product-card-detail";
    detailLink.textContent = "Xem chi tiết";

    content.appendChild(meta);
    content.appendChild(nameLink);
    content.appendChild(priceRow);
    content.appendChild(detailLink);
    card.appendChild(imageArea);
    card.appendChild(content);
    return card;
}
