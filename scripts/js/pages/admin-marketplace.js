/* =====================================================================
   ROOMCRAFT - Quản lý đồ cũ (admin/marketplace.html)
   Người phụ trách: Như Huyền
   Việc cần làm: Thêm / sửa / ẩn / xóa đồ cũ trên Marketplace.
   ===================================================================== */

var searchDebounceTimer = null;

function initPage(){
    if(requireAdmin() == false)
        return;

    renderAdminSidebar("marketplace");
    populateModalDropdowns();
    renderTable();
}

function populateModalDropdowns(){
    var cats = getTable("categories");
    var slCat = document.getElementById("slCategory");
    slCat.innerHTML = "<option value=''>-- Chọn danh mục --</option>";
    for(var i = 0; i < cats.length; i++){
        if(cats[i].parent_id !== null){
            var opt = document.createElement("option");
            opt.value = cats[i].id;
            opt.textContent = cats[i].name;
            slCat.appendChild(opt);
        }
    }

    var styles = getTable("styles");
    var slStyle = document.getElementById("slStyle");
    slStyle.innerHTML = "<option value=''>-- Chọn phong cách --</option>";
    for(var j = 0; j < styles.length; j++){
        var sOpt = document.createElement("option");
        sOpt.value = styles[j].id;
        sOpt.textContent = styles[j].name;
        slStyle.appendChild(sOpt);
    }
}

function onSearchChange(){
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(function(){
        renderTable();
    }, 200);
}

function renderTable(){
    var allProducts = getTable("products");
    var usedList = [];
    for(var i = 0; i < allProducts.length; i++){
        if(allProducts[i].product_type === "USED")
            usedList.push(allProducts[i]);
    }

    // Cập nhật thẻ số liệu thống kê
    var total = usedList.length;
    var activeCount = 0;
    var soldCount = 0;
    var hiddenCount = 0;

    for(var k = 0; k < usedList.length; k++){
        var item = usedList[k];
        if(item.is_active === false){
            hiddenCount++;
        } else if(item.stock_quantity === 0){
            soldCount++;
        } else {
            activeCount++;
        }
    }

    document.getElementById("statTotal").textContent = total;
    document.getElementById("statActive").textContent = activeCount;
    document.getElementById("statSold").textContent = soldCount;
    document.getElementById("statHidden").textContent = hiddenCount;

    // Lọc theo thanh công cụ
    var q = (document.getElementById("txtSearch").value || "").trim().toLowerCase();
    var filterGrade = document.getElementById("slFilterGrade").value;
    var filterStock = document.getElementById("slFilterStock").value;
    var filterActive = document.getElementById("slFilterActive").value;

    var filtered = usedList.filter(function(p){
        if(q){
            var matchId = (p.id || "").toLowerCase().indexOf(q) >= 0;
            var matchName = (p.name || "").toLowerCase().indexOf(q) >= 0;
            var matchBrand = (p.brand || "").toLowerCase().indexOf(q) >= 0;
            if(!matchId && !matchName && !matchBrand) return false;
        }
        if(filterGrade && p.condition_grade !== filterGrade) return false;
        if(filterStock !== "" && String(p.stock_quantity) !== String(filterStock)) return false;
        if(filterActive !== "" && String(p.is_active !== false) !== filterActive) return false;
        return true;
    });

    var tbody = document.getElementById("tbUsedProducts");
    var emptyDiv = document.getElementById("divEmpty");
    tbody.innerHTML = "";

    if(filtered.length === 0){
        emptyDiv.classList.remove("hidden");
        return;
    }
    emptyDiv.classList.add("hidden");

    for(var idx = 0; idx < filtered.length; idx++){
        var p = filtered[idx];
        var tr = document.createElement("tr");

        var catObj = findById("categories", p.category_id);
        var catName = catObj ? catObj.name : "—";
        var styleObj = findById("styles", p.style_id);
        var styleName = styleObj ? styleObj.name : "—";

        var gradeBadgeCls = "badge-grade-good";
        if(p.condition_grade === "Like New") gradeBadgeCls = "badge-grade-likenew";
        else if(p.condition_grade === "Fair") gradeBadgeCls = "badge-grade-fair";

        var stockHtml = p.stock_quantity > 0
            ? "<span class='badge badge-stock'>Còn 1</span>"
            : "<span class='badge badge-out'>Đã bán</span>";

        var activeHtml = p.is_active !== false
            ? "<span class='badge badge-stock'>Hiển thị</span>"
            : "<span class='badge badge-out'>Đang ẩn</span>";

        var imgSrc = (p.images && p.images.length > 0) ? asset(p.images[0]) : "";

        var html = "";
        html += "<td><img src='" + imgSrc + "' alt='' class='table-img'></td>";
        html += "<td><code>" + p.id + "</code></td>";
        html += "<td><strong>" + p.name + "</strong><br><small class='text-secondary'>Hiệu: " + (p.brand || "—") + " • Đã dùng: " + (p.usage_time || "—") + "</small></td>";
        html += "<td>" + catName + "<br><small class='text-secondary'>" + styleName + "</small></td>";
        html += "<td><span class='badge " + gradeBadgeCls + "'>" + (p.condition_grade || "Good") + "</span></td>";
        html += "<td><strong>" + formatVND(p.price) + "</strong></td>";
        html += "<td>" + stockHtml + "</td>";
        html += "<td>" + activeHtml + "</td>";
        html += "<td class='actions-cell'>"
              + "  <button type='button' class='btn btn-outline btn-sm' onclick='editProduct(\"" + p.id + "\")' title='Sửa món đồ cũ'><span class='material-symbols-outlined'>edit</span> Sửa</button>"
              + "  <button type='button' class='btn btn-light btn-sm' onclick='toggleActive(\"" + p.id + "\")' title='" + (p.is_active !== false ? "Ẩn khỏi Marketplace" : "Hiển thị lại") + "'><span class='material-symbols-outlined'>" + (p.is_active !== false ? "visibility_off" : "visibility") + "</span></button>"
              + "  <button type='button' class='btn btn-outline btn-danger btn-sm' onclick='deleteProduct(\"" + p.id + "\")' title='Xóa món đồ cũ'><span class='material-symbols-outlined'>delete</span></button>"
              + "</td>";

        tr.innerHTML = html;
        tbody.appendChild(tr);
    }
}

function openAddModal(){
    document.getElementById("txtEditId").value = "";
    document.getElementById("lblModalTitle").textContent = "Thêm món đồ cũ mới";
    document.getElementById("lblModalOverline").textContent = "Thêm mới";
    document.getElementById("frmUsedProduct").reset();
    document.getElementById("chkIsActive").checked = true;
    document.getElementById("txtStock").value = "1";
    document.getElementById("slGrade").value = "Good";
    document.getElementById("modalUsed").classList.remove("hidden");
}

function editProduct(id){
    var p = findById("products", id);
    if(!p){
        alert("Không tìm thấy sản phẩm mã " + id);
        return;
    }

    document.getElementById("txtEditId").value = p.id;
    document.getElementById("lblModalTitle").textContent = "Sửa món đồ cũ: " + p.id;
    document.getElementById("lblModalOverline").textContent = "Cập nhật";

    document.getElementById("txtName").value = p.name || "";
    document.getElementById("txtBrand").value = p.brand || "";
    document.getElementById("slCategory").value = p.category_id || "";
    document.getElementById("slStyle").value = p.style_id || "";
    document.getElementById("slGrade").value = p.condition_grade || "Good";
    document.getElementById("txtPrice").value = p.price || 0;
    document.getElementById("txtOriginalPrice").value = p.original_price || "";
    document.getElementById("txtStock").value = String(p.stock_quantity);
    document.getElementById("txtUsageTime").value = p.usage_time || "";
    document.getElementById("txtConditionNote").value = p.condition_note || "";
    document.getElementById("txtDimensions").value = p.dimensions || "";
    document.getElementById("txtMaterial").value = p.material || "";
    document.getElementById("txtColor").value = p.color || "";
    document.getElementById("txtImages").value = (p.images || []).join("\n");
    document.getElementById("txtDescription").value = p.description || "";
    document.getElementById("chkIsActive").checked = (p.is_active !== false);

    document.getElementById("modalUsed").classList.remove("hidden");
}

function closeModal(){
    document.getElementById("modalUsed").classList.add("hidden");
}

function saveUsedProduct(e){
    e.preventDefault();

    var editId = document.getElementById("txtEditId").value;
    var name = document.getElementById("txtName").value.trim();
    var brand = document.getElementById("txtBrand").value.trim();
    var catId = Number(document.getElementById("slCategory").value);
    var catObj = findById("categories", catId);
    var parentCatId = (catObj && catObj.parent_id) ? catObj.parent_id : catId;   // danh mục cha của danh mục đã chọn
    var styleId = Number(document.getElementById("slStyle").value);
    var grade = document.getElementById("slGrade").value;
    var price = Number(document.getElementById("txtPrice").value);
    var origPrice = document.getElementById("txtOriginalPrice").value ? Number(document.getElementById("txtOriginalPrice").value) : null;
    var stock = Number(document.getElementById("txtStock").value);
    var usageTime = document.getElementById("txtUsageTime").value.trim();
    var condNote = document.getElementById("txtConditionNote").value.trim();
    var dims = document.getElementById("txtDimensions").value.trim();
    var mat = document.getElementById("txtMaterial").value.trim();
    var col = document.getElementById("txtColor").value.trim();
    var desc = document.getElementById("txtDescription").value.trim();
    var isActive = document.getElementById("chkIsActive").checked;

    var rawImgs = document.getElementById("txtImages").value.split(/[\n,]+/);
    var images = [];
    for(var i = 0; i < rawImgs.length; i++){
        var s = rawImgs[i].trim();
        if(s) images.push(s);
    }
    if(images.length === 0){
        images.push("assets/marketplace/used-001-01.jpg");
    }

    var allProducts = getTable("products");

    if(editId){
        // Sửa sản phẩm
        for(var j = 0; j < allProducts.length; j++){
            if(allProducts[j].id === editId){
                allProducts[j].name = name;
                allProducts[j].brand = brand;
                allProducts[j].category_id = catId;
                allProducts[j].parent_category_id = parentCatId;
                allProducts[j].style_id = styleId;
                allProducts[j].style_ids = [styleId];
                allProducts[j].condition_grade = grade;
                allProducts[j].price = price;
                allProducts[j].original_price = origPrice;
                allProducts[j].stock_quantity = stock;
                allProducts[j].usage_time = usageTime;
                allProducts[j].condition_note = condNote;
                allProducts[j].dimensions = dims;
                allProducts[j].material = mat;
                allProducts[j].color = col;
                allProducts[j].images = images;
                allProducts[j].description = desc;
                allProducts[j].is_active = isActive;
                break;
            }
        }
        alert("Đã cập nhật món đồ cũ " + editId + " thành công!");
    } else {
        // Thêm mới: sinh id tự động used-xxx
        var maxUsedNum = 0;
        for(var k = 0; k < allProducts.length; k++){
            if(allProducts[k].id && allProducts[k].id.indexOf("used-") === 0){
                var num = Number(allProducts[k].id.replace("used-", ""));
                if(num > maxUsedNum) maxUsedNum = num;
            }
        }
        var nextNum = maxUsedNum + 1;
        var newId = "used-" + (nextNum < 10 ? "00" + nextNum : (nextNum < 100 ? "0" + nextNum : nextNum));

        var newItem = {
            id: newId,
            category_id: catId,
            style_id: styleId,
            name: name,
            brand: brand || "IKEA",
            price: price,
            original_price: origPrice,
            dimensions: dims,
            material: mat,
            color: col,
            description: desc,
            model_3d_url: null,
            stock_quantity: stock,
            product_type: "USED",
            is_active: isActive,
            images: images,
            style_ids: [styleId],
            parent_category_id: parentCatId,
            condition_grade: grade,
            usage_time: usageTime,
            condition_note: condNote
        };
        allProducts.push(newItem);
        alert("Đã thêm món đồ cũ mới với mã: " + newId + "!");
    }

    saveTable("products", allProducts);
    closeModal();
    renderTable();
    return false;
}

function toggleActive(id){
    var allProducts = getTable("products");
    for(var i = 0; i < allProducts.length; i++){
        if(allProducts[i].id === id){
            allProducts[i].is_active = (allProducts[i].is_active === false) ? true : false;
            break;
        }
    }
    saveTable("products", allProducts);
    renderTable();
}

function deleteProduct(id){
    if(!confirm("Bạn có chắc chắn muốn xóa món đồ cũ mã " + id + " khỏi hệ thống không?")){
        return;
    }
    var allProducts = getTable("products");
    var filtered = allProducts.filter(function(p){
        return p.id !== id;
    });
    saveTable("products", filtered);
    alert("Đã xóa món đồ cũ " + id + "!");
    renderTable();
}
