/* =====================================================================
   ROOMCRAFT - Quản lý sản phẩm (admin/products.html)
   Người phụ trách: Nguyên Khôi
   ===================================================================== */

var ADMIN_PRODUCT_PAGE_SIZE = 20;
var adminProductPage = 1;

function initPage(){
    if(requireAdmin() == false)
        return;
    renderAdminSidebar("products");
    populateProductFormOptions();
    renderAdminProducts();
}

function populateProductFormOptions(){
    var categories = getTable("categories");
    var styles = getTable("styles");
    var categorySelect = document.getElementById("cboProductCategory");
    var styleSelect = document.getElementById("cboProductStyle");
    categorySelect.innerHTML = "<option value=''>Chọn danh mục</option>";
    styleSelect.innerHTML = "<option value=''>Chọn phong cách</option>";

    for(var i = 0; i < categories.length; i++){
        var category = categories[i];
        var option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.parent_id == null ? category.name : "— " + category.name;
        categorySelect.appendChild(option);
    }
    for(var i = 0; i < styles.length; i++){
        var styleOption = document.createElement("option");
        styleOption.value = styles[i].id;
        styleOption.textContent = styles[i].name;
        styleSelect.appendChild(styleOption);
    }
}

function getAdminProducts(){
    var products = getTable("products");
    var newProducts = [];
    for(var i = 0; i < products.length; i++){
        if(products[i].product_type != "USED")
            newProducts.push(products[i]);
    }
    return newProducts;
}

function renderAdminProducts(){
    var tbody = document.getElementById("tbProducts");
    var products = getAdminProducts();
    var keyword = document.getElementById("txtProductSearch").value.trim().toLowerCase();
    var status = document.getElementById("cboProductStatus").value;
    var filtered = [];

    for(var i = 0; i < products.length; i++){
        var product = products[i];
        var searchText = (product.id + " " + product.name + " " + (product.brand || "")).toLowerCase();
        if(keyword != "" && searchText.indexOf(keyword) < 0)
            continue;
        if(status == "active" && product.is_active == false)
            continue;
        if(status == "inactive" && product.is_active != false)
            continue;
        filtered.push(product);
    }

    var pageCount = Math.max(1, Math.ceil(filtered.length / ADMIN_PRODUCT_PAGE_SIZE));
    if(adminProductPage > pageCount)
        adminProductPage = pageCount;
    if(adminProductPage < 1)
        adminProductPage = 1;
    var start = (adminProductPage - 1) * ADMIN_PRODUCT_PAGE_SIZE;
    tbody.innerHTML = "";

    for(var i = start; i < Math.min(start + ADMIN_PRODUCT_PAGE_SIZE, filtered.length); i++)
        tbody.appendChild(createAdminProductRow(filtered[i]));

    document.getElementById("productResult").textContent = filtered.length + " sản phẩm";
    renderAdminProductPagination(adminProductPage, pageCount);
}

function createAdminProductRow(product){
    var row = document.createElement("tr");
    var imageCell = document.createElement("td");
    var image = document.createElement("img");
    image.className = "admin-product-thumb";
    image.src = product.images && product.images.length > 0 ? asset(product.images[0]) : "";
    image.alt = product.name;
    image.loading = "lazy";
    imageCell.appendChild(image);
    row.appendChild(imageCell);

    var productCell = document.createElement("td");
    var productName = document.createElement("strong");
    productName.textContent = product.name;
    var productId = document.createElement("small");
    productId.textContent = product.id;
    productCell.appendChild(productName);
    productCell.appendChild(productId);
    row.appendChild(productCell);

    var categoryCell = document.createElement("td");
    var category = findById("categories", product.category_id);
    categoryCell.textContent = category ? category.name : "Chưa phân loại";
    row.appendChild(categoryCell);

    var priceCell = document.createElement("td");
    priceCell.textContent = formatVND(product.price);
    row.appendChild(priceCell);

    var stockCell = document.createElement("td");
    stockCell.textContent = product.stock_quantity;
    row.appendChild(stockCell);

    var statusCell = document.createElement("td");
    var statusLabel = document.createElement("span");
    statusLabel.className = product.is_active == false ? "badge badge-out" : "badge badge-stock";
    statusLabel.textContent = product.is_active == false ? "Đang ẩn" : "Đang bán";
    statusCell.appendChild(statusLabel);
    row.appendChild(statusCell);

    var actionCell = document.createElement("td");
    actionCell.className = "admin-product-actions";
    var editButton = document.createElement("button");
    editButton.className = "btn-link";
    editButton.type = "button";
    editButton.textContent = "Sửa";
    editButton.onclick = function(){
        openProductForm(product.id);
    };
    actionCell.appendChild(editButton);

    var visibilityButton = document.createElement("button");
    visibilityButton.className = "btn-link";
    visibilityButton.type = "button";
    visibilityButton.textContent = product.is_active == false ? "Hiển thị" : "Ẩn";
    visibilityButton.onclick = function(){
        toggleAdminProductVisibility(product.id);
    };
    actionCell.appendChild(visibilityButton);
    row.appendChild(actionCell);
    return row;
}

function renderAdminProductPagination(page, pageCount){
    var nav = document.getElementById("adminProductPagination");
    nav.innerHTML = "";
    if(pageCount <= 1)
        return;
    for(var i = 1; i <= pageCount; i++){
        // 48 trang thì chỉ hiện trang đầu, trang cuối và 2 trang quanh trang đang xem
        if(i != 1 && i != pageCount && Math.abs(i - page) > 2){
            if(i == page - 3 || i == page + 3){
                var dots = document.createElement("span");
                dots.className = "catalog-page-dots";
                dots.textContent = "...";
                nav.appendChild(dots);
            }
            continue;
        }
        var button = document.createElement("button");
        button.className = "catalog-page-link" + (i == page ? " active" : "");
        button.type = "button";
        button.textContent = i;
        button.disabled = i == page;
        button.onclick = function(pageNumber){
            return function(){
                adminProductPage = pageNumber;
                renderAdminProducts();
            };
        }(i);
        nav.appendChild(button);
    }
}

function openProductForm(productId){
    var panel = document.getElementById("productFormPanel");
    var form = document.getElementById("frmProduct");
    form.reset();
    document.getElementById("chkProductActive").checked = true;
    document.getElementById("txtProductId").readOnly = false;
    document.getElementById("productFormMode").textContent = productId == "" ? "Thêm sản phẩm" : "Cập nhật sản phẩm";
    document.getElementById("productFormTitle").textContent = productId == "" ? "Thêm sản phẩm" : "Chỉnh sửa sản phẩm";

    if(productId != ""){
        var product = findById("products", productId);
        if(product == null || product.product_type == "USED"){
            alert("Không tìm thấy sản phẩm mới để chỉnh sửa.");
            return;
        }
        document.getElementById("txtProductId").value = product.id;
        document.getElementById("txtProductId").readOnly = true;
        document.getElementById("txtProductName").value = product.name || "";
        document.getElementById("txtProductBrand").value = product.brand || "";
        document.getElementById("cboProductCategory").value = product.category_id;
        document.getElementById("cboProductStyle").value = product.style_id || (product.style_ids && product.style_ids.length > 0 ? product.style_ids[0] : "");
        document.getElementById("txtProductPrice").value = product.price;
        document.getElementById("txtProductOriginalPrice").value = product.original_price || "";
        document.getElementById("txtProductStock").value = product.stock_quantity;
        document.getElementById("txtProductDimensions").value = product.dimensions || "";
        document.getElementById("txtProductMaterial").value = product.material || "";
        document.getElementById("txtProductColor").value = product.color || "";
        document.getElementById("txtProductImages").value = (product.images || []).join("\n");
        document.getElementById("txtProductModel").value = product.model_3d_url || "";
        document.getElementById("txtProductDescription").value = product.description || "";
        document.getElementById("chkProductActive").checked = product.is_active != false;
    }

    panel.classList.remove("hidden");
    window.scrollTo(0, panel.offsetTop);
}

function closeProductForm(){
    document.getElementById("productFormPanel").classList.add("hidden");
    document.getElementById("frmProduct").reset();
}

function saveAdminProduct(event){
    event.preventDefault();
    var products = getTable("products");
    var id = document.getElementById("txtProductId").value.trim();
    var categoryId = document.getElementById("cboProductCategory").value;
    var styleId = document.getElementById("cboProductStyle").value;
    var isEditing = document.getElementById("txtProductId").readOnly;
    var existing = null;
    for(var i = 0; i < products.length; i++){
        if(products[i].id == id)
            existing = products[i];
    }

    if(isEditing && existing == null){
        alert("Không tìm thấy sản phẩm để cập nhật.");
        return false;
    }
    if(!isEditing && existing != null){
        alert("Mã sản phẩm đã tồn tại.");
        return false;
    }
    if(existing != null && existing.product_type == "USED"){
        alert("Mã sản phẩm này thuộc danh mục đồ cũ, không thể ghi đè.");
        return false;
    }

    var imageText = document.getElementById("txtProductImages").value.split(/\r?\n/);
    var images = [];
    for(var i = 0; i < imageText.length; i++){
        var imagePath = imageText[i].trim();
        if(imagePath != "")
            images.push(imagePath);
    }
    if(images.length == 0){
        alert("Vui lòng nhập ít nhất một đường dẫn ảnh.");
        return false;
    }

    var price = Number(document.getElementById("txtProductPrice").value);
    var originalPrice = document.getElementById("txtProductOriginalPrice").value;
    if(price <= 0){
        alert("Giá bán phải lớn hơn 0!");
        document.getElementById("txtProductPrice").focus();
        return false;
    }
    if(originalPrice != "" && Number(originalPrice) <= price){
        alert("Giá gốc phải lớn hơn giá bán (để trống nếu không giảm giá)!");
        document.getElementById("txtProductOriginalPrice").focus();
        return false;
    }

    var category = findById("categories", categoryId);
    if(category == null){
        alert("Vui lòng chọn danh mục hợp lệ.");
        return false;
    }
    var style = findById("styles", styleId);
    if(style == null){
        alert("Vui lòng chọn phong cách hợp lệ.");
        return false;
    }

    var product = existing || {};
    product.id = id;
    product.category_id = category.id;
    product.parent_category_id = category.parent_id == null ? category.id : category.parent_id;
    // giữ lại các phong cách phụ đã có, phong cách vừa chọn đứng đầu
    var oldStyleIds = product.style_ids || [];
    product.style_id = style.id;
    product.style_ids = [style.id];
    for(var i = 0; i < oldStyleIds.length; i++){
        if(oldStyleIds[i] != style.id)
            product.style_ids.push(oldStyleIds[i]);
    }
    product.name = document.getElementById("txtProductName").value.trim();
    product.brand = document.getElementById("txtProductBrand").value.trim();
    product.price = price;
    product.original_price = originalPrice == "" ? null : Number(originalPrice);
    product.stock_quantity = Number(document.getElementById("txtProductStock").value);
    product.dimensions = document.getElementById("txtProductDimensions").value.trim();
    product.material = document.getElementById("txtProductMaterial").value.trim();
    product.color = document.getElementById("txtProductColor").value.trim();
    product.images = images;
    product.model_3d_url = document.getElementById("txtProductModel").value.trim() || null;
    product.description = document.getElementById("txtProductDescription").value.trim();
    product.product_type = "NEW";
    product.is_active = document.getElementById("chkProductActive").checked;
    if(existing == null)
        product.created_at = new Date().toISOString();

    if(existing == null)
        products.push(product);
    saveTable("products", products);
    closeProductForm();
    renderAdminProducts();
    alert("Đã lưu sản phẩm.");
    return false;
}

function toggleAdminProductVisibility(productId){
    var products = getTable("products");
    var product = null;
    for(var i = 0; i < products.length; i++){
        if(products[i].id == productId)
            product = products[i];
    }
    if(product == null || product.product_type == "USED"){
        alert("Không tìm thấy sản phẩm để cập nhật.");
        return;
    }
    product.is_active = product.is_active == false;
    saveTable("products", products);
    renderAdminProducts();
}
