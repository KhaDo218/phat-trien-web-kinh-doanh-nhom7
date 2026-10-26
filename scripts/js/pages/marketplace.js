/* =====================================================================
   ROOMCRAFT - Đồ cũ tuyển chọn (marketplace.html)
   Người phụ trách: Như Huyền
   Nghiệp vụ: Danh sách đồ cũ (product_type = "USED"), lọc tình trạng,
              giá, thương hiệu, danh mục, tìm kiếm và sắp xếp.
   ===================================================================== */

var currentCondition = "";
var searchDebounceTimer = null;

// Khởi tạo trang sau khi nạp xong dữ liệu
function initPage(){
    renderHeader("do-cu");
    renderFooter();
    renderChatbot();

    populateFilterDropdowns();
    readUrlParams();
    applyFilters();
}

// Đổ dữ liệu vào các ô chọn Danh mục & Thương hiệu từ dữ liệu đồ cũ thực tế
function populateFilterDropdowns(){
    var allProducts = getTable("products");
    var usedProducts = [];
    for(var i = 0; i < allProducts.length; i++){
        if(allProducts[i].product_type === "USED" && allProducts[i].is_active !== false)
            usedProducts.push(allProducts[i]);
    }

    // Danh mục
    var catSelect = document.getElementById("slCategory");
    var catMap = {};
    for(var j = 0; j < usedProducts.length; j++){
        var catId = usedProducts[j].category_id;
        if(catId && !catMap[catId]){
            var catObj = findById("categories", catId);
            if(catObj) catMap[catId] = catObj.name;
        }
    }
    for(var cid in catMap){
        var opt = document.createElement("option");
        opt.value = cid;
        opt.textContent = catMap[cid];
        catSelect.appendChild(opt);
    }

    // Thương hiệu
    var brandSelect = document.getElementById("slBrand");
    var brandMap = {};
    for(var k = 0; k < usedProducts.length; k++){
        var b = usedProducts[k].brand;
        if(b && !brandMap[b]){
            brandMap[b] = true;
            var bOpt = document.createElement("option");
            bOpt.value = b;
            bOpt.textContent = b;
            brandSelect.appendChild(bOpt);
        }
    }
}

// Đọc tham số URL (nếu khách bấm từ trang khác sang: ?condition=Like+New...)
function readUrlParams(){
    var cond = getParam("condition");
    if(cond){
        currentCondition = cond;
        updateConditionChipsUI();
    }
    var q = getParam("q");
    if(q){
        var txtSearch = document.getElementById("txtMarketSearch");
        if(txtSearch) txtSearch.value = q;
    }
    var cat = getParam("category");
    if(cat){
        var slCat = document.getElementById("slCategory");
        if(slCat) slCat.value = cat;
    }
}

function setConditionFilter(grade){
    currentCondition = grade;
    updateConditionChipsUI();
    applyFilters();
}

function updateConditionChipsUI(){
    var container = document.getElementById("filterGradeChips");
    if(!container) return;
    var chips = container.querySelectorAll(".chip");
    chips.forEach(function(chip){
        chip.classList.remove("active");
        if(currentCondition === "" && chip.textContent.indexOf("Tất cả") >= 0){
            chip.classList.add("active");
        } else if(currentCondition && chip.textContent.indexOf(currentCondition) >= 0){
            chip.classList.add("active");
        }
    });
}

function onSearchInput(){
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(function(){
        applyFilters();
    }, 250);
}

// Áp dụng tất cả bộ lọc và hiển thị danh sách
function applyFilters(){
    var allProducts = getTable("products");
    var list = [];
    for(var i = 0; i < allProducts.length; i++){
        var p = allProducts[i];
        if(p.product_type === "USED" && p.is_active !== false)
            list.push(p);
    }

    // 1. Lọc theo Tình trạng
    if(currentCondition !== ""){
        list = list.filter(function(item){
            return item.condition_grade === currentCondition;
        });
    }

    // 2. Lọc theo Khoảng giá
    var radPrice = document.querySelector("input[name='radPrice']:checked");
    var priceVal = radPrice ? radPrice.value : "";
    if(priceVal){
        var parts = priceVal.split("-");
        var minPrice = Number(parts[0]);
        var maxPrice = Number(parts[1]);
        list = list.filter(function(item){
            return item.price >= minPrice && item.price <= maxPrice;
        });
    }

    // 3. Lọc theo Danh mục
    var selCat = document.getElementById("slCategory").value;
    if(selCat){
        list = list.filter(function(item){
            return String(item.category_id) === String(selCat);
        });
    }

    // 4. Lọc theo Thương hiệu
    var selBrand = document.getElementById("slBrand").value;
    if(selBrand){
        list = list.filter(function(item){
            return item.brand === selBrand;
        });
    }

    // 5. Lọc Chỉ còn hàng
    var chkInStock = document.getElementById("chkInStockOnly").checked;
    if(chkInStock){
        list = list.filter(function(item){
            return item.stock_quantity > 0;
        });
    }

    // 6. Tìm kiếm từ khóa
    var searchTxt = (document.getElementById("txtMarketSearch").value || "").trim().toLowerCase();
    if(searchTxt){
        list = list.filter(function(item){
            var matchName = (item.name || "").toLowerCase().indexOf(searchTxt) >= 0;
            var matchDesc = (item.description || "").toLowerCase().indexOf(searchTxt) >= 0;
            var matchBrand = (item.brand || "").toLowerCase().indexOf(searchTxt) >= 0;
            var matchMat = (item.material || "").toLowerCase().indexOf(searchTxt) >= 0;
            var matchNote = (item.condition_note || "").toLowerCase().indexOf(searchTxt) >= 0;
            return matchName || matchDesc || matchBrand || matchMat || matchNote;
        });
    }

    // 7. Sắp xếp
    var sortVal = document.getElementById("slSort").value;
    if(sortVal === "price-asc"){
        list.sort(function(a, b){ return a.price - b.price; });
    } else if(sortVal === "price-desc"){
        list.sort(function(a, b){ return b.price - a.price; });
    } else if(sortVal === "grade"){
        var gradeOrder = { "Like New": 1, "Good": 2, "Fair": 3 };
        list.sort(function(a, b){
            return (gradeOrder[a.condition_grade] || 4) - (gradeOrder[b.condition_grade] || 4);
        });
    } else {
        // newest: id descending
        list.sort(function(a, b){
            return b.id.localeCompare(a.id);
        });
    }

    renderResults(list);
    renderActiveTags();
}

function renderResults(list){
    var grid = document.getElementById("usedProductsGrid");
    var emptyBox = document.getElementById("emptyResults");
    var countLbl = document.getElementById("lblResultCount");

    countLbl.textContent = "Tìm thấy " + list.length + " món đồ cũ tuyển chọn";

    grid.innerHTML = "";
    if(list.length === 0){
        grid.classList.add("hidden");
        emptyBox.classList.remove("hidden");
        return;
    }

    grid.classList.remove("hidden");
    emptyBox.classList.add("hidden");

    for(var i = 0; i < list.length; i++){
        var card = createProductCard(list[i]);
        grid.appendChild(card);
    }
}

function renderActiveTags(){
    var container = document.getElementById("divActiveTags");
    if(!container) return;
    container.innerHTML = "";

    if(currentCondition){
        container.appendChild(createTag("Tình trạng: " + currentCondition, function(){
            setConditionFilter("");
        }));
    }

    var radPrice = document.querySelector("input[name='radPrice']:checked");
    if(radPrice && radPrice.value){
        var spanText = radPrice.nextElementSibling ? radPrice.nextElementSibling.textContent : "Giá";
        container.appendChild(createTag("Mức giá: " + spanText, function(){
            document.querySelector("input[name='radPrice'][value='']").checked = true;
            applyFilters();
        }));
    }

    var selCat = document.getElementById("slCategory");
    if(selCat && selCat.value){
        var catName = selCat.options[selCat.selectedIndex].text;
        container.appendChild(createTag("Danh mục: " + catName, function(){
            selCat.value = "";
            applyFilters();
        }));
    }

    var selBrand = document.getElementById("slBrand");
    if(selBrand && selBrand.value){
        container.appendChild(createTag("Hiệu: " + selBrand.value, function(){
            selBrand.value = "";
            applyFilters();
        }));
    }

    var searchVal = (document.getElementById("txtMarketSearch").value || "").trim();
    if(searchVal){
        container.appendChild(createTag("Từ khóa: " + searchVal, function(){
            document.getElementById("txtMarketSearch").value = "";
            applyFilters();
        }));
    }
}

function createTag(label, onRemove){
    var tag = document.createElement("span");
    tag.className = "active-tag-chip";
    tag.innerHTML = label + " <span class='material-symbols-outlined'>close</span>";
    tag.onclick = onRemove;
    return tag;
}

function resetFilters(){
    currentCondition = "";
    updateConditionChipsUI();

    var radAll = document.querySelector("input[name='radPrice'][value='']");
    if(radAll) radAll.checked = true;

    var slCat = document.getElementById("slCategory");
    if(slCat) slCat.value = "";

    var slBrand = document.getElementById("slBrand");
    if(slBrand) slBrand.value = "";

    var chkStock = document.getElementById("chkInStockOnly");
    if(chkStock) chkStock.checked = false;

    var txtSearch = document.getElementById("txtMarketSearch");
    if(txtSearch) txtSearch.value = "";

    var slSort = document.getElementById("slSort");
    if(slSort) slSort.value = "newest";

    applyFilters();
}
