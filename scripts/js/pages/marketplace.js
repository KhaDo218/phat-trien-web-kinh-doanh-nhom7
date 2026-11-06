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
    showMarketHero();
}

// Banner: đổ ảnh + nhãn giá cho 3 ô trưng bày và hàng ảnh tròn "mới về"
function showMarketHero(){
    var used = getUsedProducts();
    var tiles = document.querySelectorAll(".mg-tile");
    for(var i = 0; i < tiles.length; i++){
        var sp = findById("products", tiles[i].getAttribute("data-id"));
        if(sp == null){
            tiles[i].style.display = "none";
            continue;
        }
        tiles[i].href = "product-detail.html?id=" + encodeURIComponent(sp.id);
        var img = tiles[i].querySelector("img");
        img.src = asset(sp.images[0]);
        img.alt = sp.name;
        var giam = sp.original_price ? Math.round((1 - sp.price / sp.original_price) * 100) : 0;
        tiles[i].querySelector(".mg-tag").innerHTML =
              "<span class='mg-name'>" + sp.name.replace(/\s*\(.*\)\s*/, "") + "</span>"
            + "<span class='mg-price'>" + formatVND(sp.price)
            + (giam > 0 ? " <s>" + formatVND(sp.original_price) + "</s> <em>-" + giam + "%</em>" : "") + "</span>";
    }

    // 4 món mới nhất (không trùng 3 món ở trên)
    var html = "";
    var dem = 0;
    for(var j = used.length - 1; j >= 0 && dem < 4; j--){
        if(["used-018", "used-004", "used-003"].indexOf(used[j].id) >= 0 || !used[j].images || !used[j].images.length)
            continue;
        html += "<img src='" + asset(used[j].images[0]) + "' alt=''>";
        dem++;
    }
    document.getElementById("mfThumbs").innerHTML = html;
    document.getElementById("mfCount").innerHTML = used.length;
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
    scheduleFilterChange();
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
