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

function getProductsByStyle(styleId){
    var products = getActiveProducts();
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
    var products = getActiveProducts();
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
    var keyword = normalizeProductSearchText(tuKhoa);
    var products = getActiveProducts();
    if(keyword == "")
        return products;

    var matchedNames = [];
    var matchedDetails = [];
    var keywordPhrase = " " + keyword + " ";
    for(var i = 0; i < products.length; i++){
        var product = products[i];
        var name = " " + normalizeProductSearchText(product.name) + " ";
        if(name.indexOf(keywordPhrase) >= 0){
            matchedNames.push(product);
            continue;
        }
        var details = normalizeProductSearchText([
            product.id,
            product.brand,
            product.description
        ].join(" "));
        if(details.indexOf(keyword) >= 0)
            matchedDetails.push(product);
    }
    return matchedNames.length > 0 ? matchedNames : matchedDetails;
}

function normalizeProductSearchText(value){
    return String(value == null ? "" : value).toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, " ")
        .trim().replace(/\s+/g, " ");
}

function getCategoryName(categoryId){
    var category = findById("categories", categoryId);
    return category ? category.name : "";
}

function getStyleName(styleId){
    var style = findById("styles", styleId);
    return style ? style.name : "";
}
