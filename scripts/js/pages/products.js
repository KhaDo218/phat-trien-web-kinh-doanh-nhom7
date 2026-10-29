/* =====================================================================
   ROOMCRAFT - Nội thất cho không gian của bạn (products.html)
   Người phụ trách: Nguyên Khôi
   ===================================================================== */

var CATALOG_PAGE_SIZE = 12;
var catalogMinPrice = "";
var catalogMaxPrice = "";
var CATALOG_PRICE_RANGES = [
    { value: "all", min: "", max: "" },
    { value: "under-1000000", min: "0", max: "999999" },
    { value: "1000000-3000000", min: "1000000", max: "3000000" },
    { value: "3000001-6000000", min: "3000001", max: "6000000" },
    { value: "over-6000000", min: "6000001", max: "" }
];

function initPage(){
    renderHeader("san-pham");
    renderFooter();
    renderChatbot();

    document.getElementById("txtCatalogSearch").value = getParam("q");
    document.getElementById("cboCatalogCategory").value = getParam("category");
    catalogMinPrice = getParam("min");
    catalogMaxPrice = getParam("max");
    document.getElementById("cboProductSort").value = getParam("sort") || "default";
    document.getElementById("txtCatalogMaterial").value = getParam("material");
    document.getElementById("txtCatalogColor").value = getParam("color");

    renderCatalogCategories();
    renderStyleFilter();
    renderCatalogFacets();
    renderCatalogBreadcrumb();
    selectCatalogPriceRange();
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

function renderCatalogFacets(){
    var products = getActiveProducts();
    var materials = {};
    var colors = {};
    for(var i = 0; i < products.length; i++){
        var material = (products[i].material || "").trim();
        var color = (products[i].color || "").trim();
        if(material != "")
            materials[material] = true;
        if(color != "")
            colors[color] = true;
    }
    appendCatalogFacetOptions("catalogMaterialOptions", materials);
    appendCatalogFacetOptions("catalogColorOptions", colors);
}

function appendCatalogFacetOptions(listId, values){
    var list = document.getElementById(listId);
    var sorted = Object.keys(values).sort(function(a, b){
        return a.localeCompare(b, "vi");
    });
    for(var i = 0; i < sorted.length; i++){
        var option = document.createElement("option");
        option.value = sorted[i];
        list.appendChild(option);
    }
}

function renderCatalogBreadcrumb(){
    var breadcrumb = document.getElementById("catalogBreadcrumb");
    breadcrumb.innerHTML = "";
    var homeLink = document.createElement("a");
    homeLink.href = "index.html";
    homeLink.textContent = "Trang chủ";
    breadcrumb.appendChild(homeLink);
    appendCatalogBreadcrumbSeparator(breadcrumb);
    var catalogLink = document.createElement("a");
    catalogLink.href = "products.html";
    catalogLink.textContent = "Nội thất cho không gian của bạn";
    breadcrumb.appendChild(catalogLink);
    var category = findById("categories", getParam("category"));
    if(category != null){
        appendCatalogBreadcrumbSeparator(breadcrumb);
        var current = document.createElement("span");
        current.textContent = category.name;
        breadcrumb.appendChild(current);
    }
}

function appendCatalogBreadcrumbSeparator(breadcrumb){
    var separator = document.createElement("span");
    separator.textContent = "/";
    breadcrumb.appendChild(separator);
}

function selectCatalogPriceRange(){
    var radios = document.querySelectorAll("input[name='catalogPriceRange']");
    for(var i = 0; i < radios.length; i++)
        radios[i].checked = false;

    for(var i = 0; i < CATALOG_PRICE_RANGES.length; i++){
        var range = CATALOG_PRICE_RANGES[i];
        if(range.min == catalogMinPrice && range.max == catalogMaxPrice){
            document.querySelector("input[name='catalogPriceRange'][value='" + range.value + "']").checked = true;
            return;
        }
    }
    if(catalogMinPrice == "" && catalogMaxPrice == ""){
        document.querySelector("input[name='catalogPriceRange'][value='all']").checked = true;
        return;
    }
    var custom = document.createElement("label");
    custom.className = "catalog-price-option";
    custom.id = "customCatalogPriceRange";
    var radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "catalogPriceRange";
    radio.checked = true;
    radio.disabled = true;
    var text = document.createElement("span");
    text.textContent = "Khoảng giá tùy chỉnh đang áp dụng";
    custom.appendChild(radio);
    custom.appendChild(text);
    document.querySelector(".catalog-price-options").appendChild(custom);
}

function changeCatalogPriceRange(){
    var selected = document.querySelector("input[name='catalogPriceRange']:checked");
    if(selected == null || selected.value == "custom")
        return;
    for(var i = 0; i < CATALOG_PRICE_RANGES.length; i++){
        if(CATALOG_PRICE_RANGES[i].value == selected.value){
            catalogMinPrice = CATALOG_PRICE_RANGES[i].min;
            catalogMaxPrice = CATALOG_PRICE_RANGES[i].max;
            return;
        }
    }
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
    changeCatalogPriceRange();
    if(catalogMinPrice != "" && catalogMaxPrice != "" && Number(catalogMinPrice) > Number(catalogMaxPrice)){
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
    var min = catalogMinPrice;
    var max = catalogMaxPrice;
    var sort = document.getElementById("cboProductSort").value;
    var material = document.getElementById("txtCatalogMaterial").value.trim();
    var color = document.getElementById("txtCatalogColor").value.trim();

    if(q != "") params.push("q=" + encodeURIComponent(q));
    if(styleId != "") params.push("style=" + encodeURIComponent(styleId));
    if(category != "") params.push("category=" + encodeURIComponent(category));
    if(min != "") params.push("min=" + encodeURIComponent(min));
    if(max != "") params.push("max=" + encodeURIComponent(max));
    if(material != "") params.push("material=" + encodeURIComponent(material));
    if(color != "") params.push("color=" + encodeURIComponent(color));
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
    var material = document.getElementById("txtCatalogMaterial").value;
    var color = document.getElementById("txtCatalogColor").value;

    if(styleId != ""){
        var byStyle = getProductsByStyle(styleId);
        products = intersectProducts(products, byStyle);
    }
    if(categoryId != ""){
        var byCategory = getProductsByCategory(categoryId);
        products = intersectProducts(products, byCategory);
    }
    products = filterCatalogPrice(products, min, max);
    products = filterCatalogFacet(products, "material", material);
    products = filterCatalogFacet(products, "color", color);

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

function filterCatalogFacet(products, field, value){
    var keyword = normalizeProductSearchText(value);
    if(keyword == "")
        return products;
    var matched = [];
    for(var i = 0; i < products.length; i++){
        if(normalizeProductSearchText(products[i][field]).indexOf(keyword) >= 0)
            matched.push(products[i]);
    }
    return matched;
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
    products = filterCatalogFacet(products, "material", document.getElementById("txtCatalogMaterial").value);
    products = filterCatalogFacet(products, "color", document.getElementById("txtCatalogColor").value);
    var inStock = [];
    for(var i = 0; i < products.length; i++){
        if(Number(products[i].stock_quantity) > 0)
            inStock.push(products[i]);
    }
    products = inStock;
    if(products.length == 0){
        products = getActiveProducts();
        products = filterCatalogFacet(products, "material", document.getElementById("txtCatalogMaterial").value);
        products = filterCatalogFacet(products, "color", document.getElementById("txtCatalogColor").value);
        inStock = [];
        for(var i = 0; i < products.length; i++){
            if(Number(products[i].stock_quantity) > 0)
                inStock.push(products[i]);
        }
        products = inStock;
    }
    suggestions.innerHTML = "";
    for(var i = 0; i < products.length && i < 4; i++)
        suggestions.appendChild(createProductCard(products[i]));
}
