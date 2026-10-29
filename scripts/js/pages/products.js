/* =====================================================================
   ROOMCRAFT - Nội thất cho không gian của bạn (products.html)
   Người phụ trách: Nguyên Khôi
   Khung lọc dùng chung với trang Đồ cũ (components/catalog-filter.js):
   mức giá, danh mục, chất liệu, màu sắc, thương hiệu, còn hàng, tìm kiếm, sắp xếp.
   Phần riêng của trang này: hàng nút Phong cách phía trên.
   ===================================================================== */

var currentStyle = "";
var currentPage = 1;

function initPage(){
    renderHeader("san-pham");
    renderFooter();
    renderChatbot();

    renderFilterPanel("filterPanel", getNewProducts(), "");
    var state = readFilterParams();
    if(!state.sort) state.sort = "default";
    setFilterState(state);
    currentStyle = getParam("style");
    currentPage = Number(getParam("page")) || 1;

    renderStyleFilter();
    renderProducts();
}

// Hàng nút phong cách: bấm là lọc ngay, giữ nguyên các bộ lọc khác
function renderStyleFilter(){
    var styles = getTable("styles");
    var html = "<button type='button' class='style-filter-link" + (currentStyle == "" ? " active" : "") + "' onclick='setStyleFilter(\"\")'>Tất cả phong cách</button>";
    for(var i = 0; i < styles.length; i++){
        html += "<button type='button' class='style-filter-link" + (String(styles[i].id) == currentStyle ? " active" : "") + "'"
             + " onclick='setStyleFilter(\"" + styles[i].id + "\")'>" + styles[i].name + "</button>";
    }
    document.getElementById("styleFilter").innerHTML = html;
}

function setStyleFilter(styleId){
    currentStyle = String(styleId);
    renderStyleFilter();
    onFilterChange();
}

// Khung lọc dùng chung gọi hàm này khi khách bấm "Đặt lại"
function resetPageFilters(){
    currentStyle = "";
    document.getElementById("cboFilterSort").value = "default";
    renderStyleFilter();
}

// Khung lọc dùng chung gọi hàm này mỗi khi khách đổi một lựa chọn
function onFilterChange(){
    currentPage = 1;
    renderProducts();
}

function goToFilterPage(page){
    currentPage = page;
    renderProducts();
    document.getElementById("styleFilter").scrollIntoView({ behavior: "smooth" });
}

function renderProducts(){
    var state = getFilterState();
    var products = currentStyle != "" ? getProductsByStyle(currentStyle) : getNewProducts();
    products = filterProductList(products, state);
    sortProductList(products, state.sort, state.q);

    var total = products.length;
    var pageCount = Math.max(1, Math.ceil(total / FILTER_PAGE_SIZE));
    if(currentPage < 1) currentPage = 1;
    if(currentPage > pageCount) currentPage = pageCount;
    var start = (currentPage - 1) * FILTER_PAGE_SIZE;

    var grid = document.getElementById("productGrid");
    grid.innerHTML = "";
    for(var i = start; i < Math.min(start + FILTER_PAGE_SIZE, total); i++)
        grid.appendChild(createProductCard(products[i]));

    document.getElementById("productCount").textContent = "Tìm thấy " + total + " sản phẩm";
    renderFilterPagination("catalogPagination", currentPage, pageCount);

    var nhanRieng = [];
    if(currentStyle != "")
        nhanRieng.push({ label: "Phong cách: " + getStyleName(currentStyle), remove: "currentStyle=\"\";renderStyleFilter()" });
    renderActiveFilterTags("divActiveTags", state, nhanRieng);
    renderCatalogBreadcrumb(state.category);
    renderEmptySuggestions(total);

    // Ghi bộ lọc lên địa chỉ trang để tải lại / gửi link vẫn giữ nguyên
    var extra = [];
    if(currentStyle != "") extra.push("style=" + currentStyle);
    if(currentPage > 1) extra.push("page=" + currentPage);
    history.replaceState(null, "", "products.html" + filterStateToQuery(state, extra, "default"));
}

// Trang chủ / Sản phẩm / Danh mục cha / Danh mục con
function renderCatalogBreadcrumb(categoryId){
    var html = "<a href='index.html'>Trang chủ</a><span>/</span>";
    var category = categoryId ? findById("categories", categoryId) : null;
    if(!category){
        html += "Sản phẩm";
    } else {
        html += "<a href='products.html'>Sản phẩm</a><span>/</span>";
        var parent = category.parent_id ? findById("categories", category.parent_id) : null;
        if(parent)
            html += "<a href='products.html?category=" + parent.id + "'>" + parent.name + "</a><span>/</span>";
        html += category.name;
    }
    document.getElementById("catalogBreadcrumb").innerHTML = html;
}

// Không có kết quả: gợi ý món còn hàng cùng phong cách / danh mục
function renderEmptySuggestions(total){
    var section = document.getElementById("emptySuggestions");
    if(total > 0){
        section.classList.add("hidden");
        return;
    }
    section.classList.remove("hidden");
    var state = getFilterState();
    var products = currentStyle != "" ? getProductsByStyle(currentStyle) : getNewProducts();
    if(state.category != ""){
        var cungDanhMuc = filterProductList(products, { q: "", price: "", category: state.category, materials: [], colors: [], brand: "", inStock: true });
        if(cungDanhMuc.length > 0) products = cungDanhMuc;
    }
    var html = [];
    for(var i = 0; i < products.length && html.length < 3; i++){
        if(Number(products[i].stock_quantity) > 0) html.push(products[i]);
    }
    var box = document.getElementById("relatedProducts");
    box.innerHTML = "";
    for(var j = 0; j < html.length; j++)
        box.appendChild(createProductCard(html[j]));
}
