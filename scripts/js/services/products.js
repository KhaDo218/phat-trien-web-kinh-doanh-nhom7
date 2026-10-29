/* =====================================================================
   ROOMCRAFT - services/products.js (nghiệp vụ sản phẩm)
   Người phụ trách: Nguyên Khôi
   Dữ liệu: getTable("products"), getTable("categories"), getTable("styles")
   ===================================================================== */

function getActiveProducts(){
    var products = getTable("products");
    var active = [];
    for(var i = 0; i < products.length; i++){
        if(products[i].is_active != false)
            active.push(products[i]);
    }
    return active;
}

// Sản phẩm mới đang bán (không tính đồ cũ). Trang Sản phẩm và các gợi ý chỉ dùng hàm này,
// đồ cũ chỉ hiện ở trang Đồ cũ.
function getNewProducts(){
    var products = getActiveProducts();
    var kq = [];
    for(var i = 0; i < products.length; i++){
        if(products[i].product_type != "USED")
            kq.push(products[i]);
    }
    return kq;
}

function getProductsByStyle(styleId){
    var products = getNewProducts();
    var matched = [];
    for(var i = 0; i < products.length; i++){
        var styleIds = products[i].style_ids || [];
        var found = products[i].style_id == styleId;
        for(var j = 0; j < styleIds.length; j++){
            if(styleIds[j] == styleId)
                found = true;
        }
        if(found)
            matched.push(products[i]);
    }
    return matched;
}

function getProductsByCategory(categoryId){
    var categories = getTable("categories");
    var products = getNewProducts();
    var categoryIds = [categoryId];
    var category = findById("categories", categoryId);

    if(category && (category.parent_id == null || category.parent_id == "")){
        for(var i = 0; i < categories.length; i++){
            if(categories[i].parent_id == categoryId)
                categoryIds.push(categories[i].id);
        }
    }

    var matched = [];
    for(var i = 0; i < products.length; i++){
        for(var j = 0; j < categoryIds.length; j++){
            if(categoryIds[j] == products[i].category_id){
                matched.push(products[i]);
                break;
            }
        }
    }
    return matched;
}

function searchProducts(tuKhoa){
    var keyword = (tuKhoa || "").trim().toLowerCase();
    var products = getNewProducts();
    if(keyword == "")
        return products;

    var matched = [];
    for(var i = 0; i < products.length; i++){
        var haystack = [
            products[i].id,
            products[i].name,
            products[i].brand,
            products[i].description
        ].join(" ").toLowerCase();
        if(haystack.indexOf(keyword) >= 0)
            matched.push(products[i]);
    }
    return matched;
}

function getCategoryName(categoryId){
    var category = findById("categories", categoryId);
    return category ? category.name : "";
}

function getStyleName(styleId){
    var style = findById("styles", styleId);
    return style ? style.name : "";
}

/* ----- Bán chạy, đánh giá (dùng cho sắp xếp và hiện số sao trên thẻ sản phẩm) ----- */

// Số lượng đã bán của từng sản phẩm (đơn không bị hủy)
function getSoldMap(){
    var orders = getTable("orders");
    var daBan = {};
    for(var i = 0; i < orders.length; i++){
        if(orders[i].status == "Cancelled") continue;
        var items = orders[i].items || [];
        for(var j = 0; j < items.length; j++)
            daBan[items[j].product_id] = (daBan[items[j].product_id] || 0) + Number(items[j].quantity);
    }
    return daBan;
}

// Điểm đánh giá trung bình và số lượt đánh giá (bỏ đánh giá bị ẩn).
// "score" cộng thêm 2 lượt ảo 4 sao để món 1 lượt 5 sao không xếp trên món 20 lượt 4,8 sao.
function getRatingMap(){
    var reviews = getTable("reviews");
    var tong = {}, dem = {};
    for(var i = 0; i < reviews.length; i++){
        if(reviews[i].is_hidden) continue;
        var id = reviews[i].product_id;
        tong[id] = (tong[id] || 0) + Number(reviews[i].rating);
        dem[id] = (dem[id] || 0) + 1;
    }
    var kq = {};
    for(var pid in dem) kq[pid] = { avg: tong[pid] / dem[pid], count: dem[pid], score: (tong[pid] + 8) / (dem[pid] + 2) };
    return kq;
}
