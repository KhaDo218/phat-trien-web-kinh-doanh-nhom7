/* =====================================================================
   ROOMCRAFT - Đồ cũ tuyển chọn (marketplace.html)
   Người phụ trách: Như Huyền
   Nghiệp vụ: Danh sách đồ cũ (product_type = "USED").
   Khung lọc dùng chung với trang Sản phẩm (components/catalog-filter.js):
   mức giá, danh mục, chất liệu, màu sắc, thương hiệu, còn hàng, tìm kiếm, sắp xếp.
   Phần riêng của trang này: lọc Tình trạng đồ cũ (Like New / Good / Fair).
   ===================================================================== */

var currentCondition = "";
var draftCondition = "";
var currentPage = 1;
var CONDITIONS = [
    { value: "Like New", label: "Like New (>95%)" },
    { value: "Good",     label: "Good (85-95%)" },
    { value: "Fair",     label: "Fair (>70%)" }
];

// Khởi tạo trang sau khi nạp xong dữ liệu
function initPage(){
    renderHeader("do-cu");
    renderFooter();
    renderChatbot();

    renderFilterPanel("filterPanel", getUsedProducts(), taoHtmlTinhTrang());
    var state = readFilterParams();
    if(!state.sort) state.sort = "newest";
    setFilterState(state);
    currentCondition = getParam("condition");
    draftCondition = currentCondition;
    currentPage = Number(getParam("page")) || 1;
    updateConditionChipsUI();
    renderMarketplace();
}

function getUsedProducts(){
    var allProducts = getTable("products");
    var usedProducts = [];
    for(var i = 0; i < allProducts.length; i++){
        if(allProducts[i].product_type === "USED" && allProducts[i].is_active !== false)
            usedProducts.push(allProducts[i]);
    }
    return usedProducts;
}

// Phần lọc riêng: Tình trạng đồ cũ, đặt ở đầu khung lọc
function taoHtmlTinhTrang(){
    var html = "<div class='filter-group'><h4 class='filter-group-title'>Tình trạng đồ cũ</h4>";
    html += "<div class='filter-chips' id='filterGradeChips'>";
    html += "<button type='button' class='chip' data-value='' onclick='setConditionFilter(\"\")'>Tất cả</button>";
    for(var i = 0; i < CONDITIONS.length; i++)
        html += "<button type='button' class='chip' data-value='" + CONDITIONS[i].value + "' onclick='setConditionFilter(\"" + CONDITIONS[i].value + "\")'>" + CONDITIONS[i].label + "</button>";
    html += "</div></div>";
    return html;
}

function setConditionFilter(grade){
    draftCondition = grade;
    updateConditionChipsUI();
}

function updateConditionChipsUI(){
    var chips = document.getElementById("filterGradeChips").getElementsByTagName("button");
    for(var i = 0; i < chips.length; i++){
        if(chips[i].getAttribute("data-value") == draftCondition)
            chips[i].classList.add("active");
        else
            chips[i].classList.remove("active");
    }
}

// Khung lọc dùng chung gọi hàm này khi khách bấm "Đặt lại"
function resetPageFilters(){
    currentCondition = "";
    draftCondition = "";
    document.getElementById("cboFilterSort").value = "newest";
    updateConditionChipsUI();
}

// Khung lọc dùng chung gọi hàm này mỗi khi khách đổi một lựa chọn
function onFilterChange(){
    currentCondition = draftCondition;
    commitFilterState();
    currentPage = 1;
    renderMarketplace();
}

function goToFilterPage(page){
    currentPage = page;
    renderMarketplace();
    document.getElementById("lblResultCount").scrollIntoView({ behavior: "smooth", block: "center" });
}

function renderMarketplace(){
    var state = getAppliedFilterState();
    var list = filterProductList(getUsedProducts(), state);
    if(currentCondition != ""){
        var theoTinhTrang = [];
        for(var i = 0; i < list.length; i++){
            if(list[i].condition_grade == currentCondition) theoTinhTrang.push(list[i]);
        }
        list = theoTinhTrang;
    }
    sortProductList(list, state.sort, state.q);

    var pageCount = Math.max(1, Math.ceil(list.length / FILTER_PAGE_SIZE));
    if(currentPage > pageCount) currentPage = pageCount;
    var start = (currentPage - 1) * FILTER_PAGE_SIZE;
    renderResults(list.slice(start, start + FILTER_PAGE_SIZE), list.length);
    renderFilterPagination("catalogPagination", currentPage, pageCount);

    var nhanRieng = [];
    if(currentCondition != "")
        nhanRieng.push({ label: "Tình trạng: " + currentCondition, remove: "currentCondition=\"\";draftCondition=\"\";updateConditionChipsUI()" });
    renderActiveFilterTags("divActiveTags", state, nhanRieng);

    // Ghi bộ lọc lên địa chỉ trang để tải lại / gửi link vẫn giữ nguyên
    var extra = [];
    if(currentCondition != "") extra.push("condition=" + encodeURIComponent(currentCondition));
    if(currentPage > 1) extra.push("page=" + currentPage);
    history.replaceState(null, "", "marketplace.html" + filterStateToQuery(state, extra, "newest"));
}

function renderResults(list, total){
    var grid = document.getElementById("usedProductsGrid");
    var emptyBox = document.getElementById("emptyResults");

    document.getElementById("lblResultCount").textContent = "Tìm thấy " + total + " món đồ cũ tuyển chọn";

    grid.innerHTML = "";
    if(total === 0){
        grid.classList.add("hidden");
        emptyBox.classList.remove("hidden");
        return;
    }
    grid.classList.remove("hidden");
    emptyBox.classList.add("hidden");

    for(var i = 0; i < list.length; i++)
        grid.appendChild(createProductCard(list[i]));
}
