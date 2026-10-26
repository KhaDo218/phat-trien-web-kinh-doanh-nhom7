/* =====================================================================
   ROOMCRAFT - Nội thất cho không gian của bạn (products.html)
   Người phụ trách: Nguyên Khôi
   ===================================================================== */

var CATALOG_PAGE_SIZE = 12;

function initPage(){
    renderHeader("san-pham");
    renderFooter();
    renderChatbot();

    document.getElementById("txtCatalogSearch").value = getParam("q");
    document.getElementById("cboCatalogCategory").value = getParam("category");
    document.getElementById("txtMinPrice").value = getParam("min");
    document.getElementById("txtMaxPrice").value = getParam("max");
    document.getElementById("cboProductSort").value = getParam("sort") || "default";

    renderCatalogCategories();
    renderStyleFilter();
    renderProducts();
}

function renderCatalogCategories(){
    var select = document.getElementById("cboCatalogCategory");
    var categories = getTable("categories");
    for(var i = 0; i < categories.length; i++){
        var option = document.createElement("option");
        option.value = categories[i].id;
        option.textContent = categories[i].name;
        select.appendChild(option);
    }
    select.value = getParam("category");
}

function renderStyleFilter(){
    var container = document.getElementById("styleFilter");
    var styles = getTable("styles");
    var currentStyle = getParam("style");
    var all = document.createElement("a");
    all.className = "style-filter-link" + (currentStyle == "" ? " active" : "");
    all.href = catalogUrl("", 1);
    all.textContent = "Tất cả phong cách";
    container.appendChild(all);

    for(var i = 0; i < styles.length; i++){
        var link = document.createElement("a");
        link.className = "style-filter-link" + (String(styles[i].id) == currentStyle ? " active" : "");
        link.href = catalogUrl(String(styles[i].id), 1);
        link.textContent = styles[i].name;
        container.appendChild(link);
    }
}

function applyCatalogFilters(event){
    event.preventDefault();
    var min = document.getElementById("txtMinPrice").value;
    var max = document.getElementById("txtMaxPrice").value;
    if(min != "" && max != "" && Number(min) > Number(max)){
        alert("Giá thấp nhất không được lớn hơn giá cao nhất.");
        return false;
    }
    window.location.href = catalogUrl(getParam("style"), 1);
    return false;
}

function changeProductSort(){
    window.location.href = catalogUrl(getParam("style"), 1);
}

function catalogUrl(styleId, page){
    var params = [];
    var q = document.getElementById("txtCatalogSearch").value.trim();
    var category = document.getElementById("cboCatalogCategory").value;
    var min = document.getElementById("txtMinPrice").value;
    var max = document.getElementById("txtMaxPrice").value;
    var sort = document.getElementById("cboProductSort").value;

    if(q != "") params.push("q=" + encodeURIComponent(q));
    if(styleId != "") params.push("style=" + encodeURIComponent(styleId));
    if(category != "") params.push("category=" + encodeURIComponent(category));
    if(min != "") params.push("min=" + encodeURIComponent(min));
    if(max != "") params.push("max=" + encodeURIComponent(max));
    if(sort != "" && sort != "default") params.push("sort=" + encodeURIComponent(sort));
    if(page > 1) params.push("page=" + page);
    return "products.html" + (params.length > 0 ? "?" + params.join("&") : "");
}

function renderProducts(){
    var grid = document.getElementById("productGrid");
    var products = searchProducts(getParam("q"));
    var styleId = getParam("style");
    var categoryId = getParam("category");
    var min = getParam("min");
    var max = getParam("max");

    if(styleId != ""){
        var byStyle = getProductsByStyle(styleId);
        products = intersectProducts(products, byStyle);
    }
    if(categoryId != ""){
        var byCategory = getProductsByCategory(categoryId);
        products = intersectProducts(products, byCategory);
    }
    products = filterCatalogPrice(products, min, max);

    sortCatalogProducts(products, getParam("sort"));
    var total = products.length;
    var pageCount = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
    var page = Number(getParam("page"));
    if(!page || page < 1) page = 1;
    if(page > pageCount) page = pageCount;
    var start = (page - 1) * CATALOG_PAGE_SIZE;

    grid.innerHTML = "";
    for(var i = start; i < Math.min(start + CATALOG_PAGE_SIZE, total); i++)
        grid.appendChild(createProductCard(products[i]));

    document.getElementById("productCount").textContent = total + " sản phẩm";
    renderCatalogPagination(page, pageCount);
    renderEmptySuggestions(total);
}

function filterCatalogPrice(products, min, max){
    var matched = [];
    for(var i = 0; i < products.length; i++){
        var price = Number(products[i].price);
        if((min == "" || price >= Number(min)) && (max == "" || price <= Number(max)))
            matched.push(products[i]);
    }
    return matched;
}

function intersectProducts(first, second){
    var matched = [];
    for(var i = 0; i < first.length; i++){
        for(var j = 0; j < second.length; j++){
            if(first[i].id == second[j].id){
                matched.push(first[i]);
                break;
            }
        }
    }
    return matched;
}

function sortCatalogProducts(products, sort){
    if(sort == "price-asc")
        products.sort(function(a, b){ return Number(a.price) - Number(b.price); });
    else if(sort == "price-desc")
        products.sort(function(a, b){ return Number(b.price) - Number(a.price); });
    else if(sort == "name-asc")
        products.sort(function(a, b){ return a.name.localeCompare(b.name, "vi"); });
}

function renderCatalogPagination(page, pageCount){
    var nav = document.getElementById("catalogPagination");
    nav.innerHTML = "";
    if(pageCount <= 1)
        return;

    if(page > 1)
        addCatalogPageLink(nav, "Trước", page - 1, false);
    for(var i = 1; i <= pageCount; i++){
        if(i == 1 || i == pageCount || Math.abs(i - page) <= 1)
            addCatalogPageLink(nav, i, i, i == page);
        else if(i == page - 2 || i == page + 2){
            var dots = document.createElement("span");
            dots.className = "catalog-page-dots";
            dots.textContent = "...";
            nav.appendChild(dots);
        }
    }
    if(page < pageCount)
        addCatalogPageLink(nav, "Tiếp", page + 1, false);
}

function addCatalogPageLink(container, label, page, active){
    var link = document.createElement("a");
    link.className = "catalog-page-link" + (active ? " active" : "");
    link.href = catalogUrl(getParam("style"), page);
    link.textContent = label;
    if(active)
        link.setAttribute("aria-current", "page");
    container.appendChild(link);
}

function renderEmptySuggestions(total){
    var section = document.getElementById("emptySuggestions");
    var suggestions = document.getElementById("relatedProducts");
    if(total > 0){
        section.classList.add("hidden");
        return;
    }
    section.classList.remove("hidden");
    var products = [];
    var styleId = getParam("style");
    var categoryId = getParam("category");
    if(styleId != "")
        products = getProductsByStyle(styleId);
    if(categoryId != ""){
        var categoryProducts = getProductsByCategory(categoryId);
        if(products.length == 0)
            products = categoryProducts;
        else
            products = intersectProducts(products, categoryProducts);
    }
    if(products.length == 0)
        products = getActiveProducts();
    suggestions.innerHTML = "";
    for(var i = 0; i < products.length && i < 4; i++)
        suggestions.appendChild(createProductCard(products[i]));
}
