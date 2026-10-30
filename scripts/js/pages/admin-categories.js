/* =====================================================================
   ROOMCRAFT - Quản lý danh mục (admin/categories.html)
   Người phụ trách: Nguyên Khôi
   ===================================================================== */

function initPage(){
    if(requireAdmin() == false)
        return;
    renderAdminSidebar("categories");
    renderParentCategoryOptions();
    renderCategories();
}

function renderParentCategoryOptions(selectedParent, excludeId){
    var select = document.getElementById("cboParentCategory");
    var categories = getTable("categories");
    select.innerHTML = "";

    var rootOption = document.createElement("option");
    rootOption.value = "";
    rootOption.textContent = "Không có (danh mục cha)";
    select.appendChild(rootOption);
    for(var i = 0; i < categories.length; i++){
        if(categories[i].parent_id != null || categories[i].id == excludeId)
            continue;
        var option = document.createElement("option");
        option.value = categories[i].id;
        option.textContent = categories[i].name;
        select.appendChild(option);
    }
    if(selectedParent != null)
        select.value = selectedParent;
}

function renderCategories(){
    var categories = getTable("categories");
    var products = getTable("products");
    var tbody = document.getElementById("tbCategories");
    tbody.innerHTML = "";
    var roots = [];
    var children = [];
    for(var i = 0; i < categories.length; i++){
        if(categories[i].parent_id == null)
            roots.push(categories[i]);
        else
            children.push(categories[i]);
    }

    var rowCount = 0;
    for(var i = 0; i < roots.length; i++){
        tbody.appendChild(createCategoryRow(roots[i], categories, products));
        rowCount++;
        for(var j = 0; j < children.length; j++){
            if(children[j].parent_id == roots[i].id){
                tbody.appendChild(createCategoryRow(children[j], categories, products));
                rowCount++;
            }
        }
    }
    document.getElementById("categoryResult").textContent = rowCount + " danh mục";
}

function createCategoryRow(category, categories, products){
    var row = document.createElement("tr");
    var idCell = document.createElement("td");
    idCell.textContent = category.id;
    row.appendChild(idCell);

    var nameCell = document.createElement("td");
    nameCell.textContent = category.parent_id == null ? category.name : "— " + category.name;
    row.appendChild(nameCell);

    var parentCell = document.createElement("td");
    var parent = category.parent_id == null ? null : findById("categories", category.parent_id);
    parentCell.textContent = parent ? parent.name : "—";
    row.appendChild(parentCell);

    var countCell = document.createElement("td");
    var count = 0;
    for(var i = 0; i < products.length; i++){
        if(products[i].category_id == category.id)
            count++;
    }
    if(category.parent_id == null){
        for(var i = 0; i < products.length; i++){
            var productCategory = findById("categories", products[i].category_id);
            if(productCategory && productCategory.parent_id == category.id)
                count++;
        }
    }
    countCell.textContent = count;
    row.appendChild(countCell);

    var actions = document.createElement("td");
    var editButton = document.createElement("button");
    editButton.className = "btn-link";
    editButton.type = "button";
    editButton.textContent = "Sửa";
    editButton.onclick = function(){
        editCategory(category.id);
    };
    actions.appendChild(editButton);

    var deleteButton = document.createElement("button");
    deleteButton.className = "btn-link";
    deleteButton.type = "button";
    deleteButton.textContent = "Xóa";
    deleteButton.onclick = function(){
        deleteCategory(category.id);
    };
    actions.appendChild(deleteButton);
    row.appendChild(actions);
    return row;
}

function editCategory(categoryId){
    var category = findById("categories", categoryId);
    if(category == null){
        alert("Không tìm thấy danh mục.");
        return;
    }
    document.getElementById("txtCategoryId").value = category.id;
    document.getElementById("txtCategoryName").value = category.name;
    document.getElementById("txtCategoryNameEn").value = category.name_en || "";
    renderParentCategoryOptions(category.parent_id, category.id);
    document.getElementById("categoryFormMode").textContent = "Cập nhật danh mục";
    document.getElementById("categoryFormTitle").textContent = "Chỉnh sửa danh mục";
    window.scrollTo(0, 0);
}

function resetCategoryForm(){
    document.getElementById("frmCategory").reset();
    document.getElementById("txtCategoryId").value = "";
    document.getElementById("txtCategoryNameEn").value = "";
    renderParentCategoryOptions();
    document.getElementById("categoryFormMode").textContent = "Danh mục sản phẩm";
    document.getElementById("categoryFormTitle").textContent = "Thêm danh mục";
}

function saveCategory(event){
    event.preventDefault();
    var categories = getTable("categories");
    var products = getTable("products");
    var idValue = document.getElementById("txtCategoryId").value;
    var name = document.getElementById("txtCategoryName").value.trim();
    var nameEn = document.getElementById("txtCategoryNameEn").value.trim();
    var parentValue = document.getElementById("cboParentCategory").value;
    var id = idValue == "" ? null : Number(idValue);
    var parentId = parentValue == "" ? null : Number(parentValue);
    var category = null;

    for(var i = 0; i < categories.length; i++){
        if(id != null && categories[i].id == id)
            category = categories[i];
    }
    if(id != null && category == null){
        alert("Danh mục không còn tồn tại.");
        return false;
    }
    if(parentId != null && findById("categories", parentId) == null){
        alert("Vui lòng chọn danh mục cha hợp lệ.");
        return false;
    }
    if(id != null && parentId == id){
        alert("Danh mục không thể là danh mục cha của chính nó.");
        return false;
    }

    if(category && category.parent_id == null && parentId != null){
        for(var i = 0; i < categories.length; i++){
            if(categories[i].parent_id == category.id){
                alert("Không thể chuyển danh mục cha thành danh mục con khi còn danh mục con bên dưới.");
                return false;
            }
        }
    }

    for(var i = 0; i < categories.length; i++){
        if(categories[i].id != id && categories[i].parent_id == parentId && categories[i].name.toLowerCase() == name.toLowerCase()){
            alert("Danh mục cùng cấp đã có tên này.");
            return false;
        }
    }

    if(category == null){
        var nextId = 0;
        for(var i = 0; i < categories.length; i++){
            if(Number(categories[i].id) > nextId)
                nextId = Number(categories[i].id);
        }
        category = { id: nextId + 1, parent_id: parentId, name: name, name_en: nameEn || name };
        categories.push(category);
    } else {
        category.name = name;
        category.parent_id = parentId;
        category.name_en = nameEn || name;
    }

    saveTable("categories", categories);

    // cập nhật lại danh mục cha của các sản phẩm thuộc danh mục này
    var newParent = category.parent_id == null ? category.id : category.parent_id;
    var changed = false;
    for(var i = 0; i < products.length; i++){
        if(products[i].category_id == category.id && products[i].parent_category_id != newParent){
            products[i].parent_category_id = newParent;
            changed = true;
        }
    }
    if(changed)
        saveTable("products", products);

    renderCategories();
    renderParentCategoryOptions();
    resetCategoryForm();
    alert("Đã lưu danh mục.");
    return false;
}

// Chỉ cho xóa danh mục trống: không còn danh mục con và không còn sản phẩm nào
function deleteCategory(categoryId){
    var categories = getTable("categories");
    var products = getTable("products");
    for(var i = 0; i < categories.length; i++){
        if(categories[i].parent_id == categoryId){
            alert("Danh mục còn danh mục con, hãy xóa hoặc chuyển danh mục con trước!");
            return;
        }
    }
    for(var i = 0; i < products.length; i++){
        if(products[i].category_id == categoryId){
            alert("Danh mục còn sản phẩm, không thể xóa!");
            return;
        }
    }
    if(confirm("Bạn có chắc muốn xóa danh mục này?") == false)
        return;
    var conLai = [];
    for(var i = 0; i < categories.length; i++){
        if(categories[i].id != categoryId)
            conLai.push(categories[i]);
    }
    saveTable("categories", conLai);
    resetCategoryForm();
    renderCategories();
}
