/* =====================================================================
   ROOMCRAFT - catalog-filter.js (Bộ lọc dùng chung)
   Dùng ở: products.html (Sản phẩm mới) và marketplace.html (Đồ cũ)
   Hai trang có cùng một khung lọc: Mức giá, Danh mục, Chất liệu, Màu sắc,
   Thương hiệu, Chỉ còn hàng + ô tìm kiếm, sắp xếp, nhãn lọc đang chọn, phân trang.
   Phần riêng của từng trang (Phong cách / Tình trạng đồ cũ) do trang tự truyền vào.

   Cách dùng trong trang:
     renderFilterPanel("filterPanel", dsGoc, htmlRieng);   // vẽ khung lọc
     setFilterState(readFilterParams());                    // đọc lọc từ URL
     var kq = filterProductList(dsGoc, getFilterState());   // lọc
     sortProductList(kq, sort, tuKhoa);                     // sắp xếp
   Mỗi khi khách đổi bộ lọc, khung lọc gọi hàm onFilterChange() của trang.
   ===================================================================== */

var PRICE_RANGES = [
    { value: "0-1000000",          label: "Dưới 1 triệu" },
    { value: "1000000-3000000",    label: "Từ 1 – 3 triệu" },
    { value: "3000000-6000000",    label: "Từ 3 – 6 triệu" },
    { value: "6000000-15000000",   label: "Từ 6 – 15 triệu" },
    { value: "15000000-999999999", label: "Trên 15 triệu" }
];

var MATERIAL_GROUPS = ["Gỗ", "Kim loại", "Vải & sợi", "Da", "Mây, tre, cói", "Gốm sứ", "Thủy tinh", "Đá & bê tông", "Khác"];

// Màu của ô tròn bên cạnh tên nhóm màu
var COLOR_GROUPS = [
    { name: "Trắng & kem",    swatch: "#F4F0E6" },
    { name: "Đen",            swatch: "#202020" },
    { name: "Xám",            swatch: "#9A9A96" },
    { name: "Be & nâu",       swatch: "#A0785A" },
    { name: "Xanh lá",        swatch: "#6B7B4F" },
    { name: "Xanh dương",     swatch: "#3D5A80" },
    { name: "Vàng & đồng",    swatch: "#C9A44C" },
    { name: "Hồng, đỏ & cam", swatch: "#C8664F" },
    { name: "Nhiều màu",      swatch: "linear-gradient(135deg,#C8664F,#C9A44C,#6B7B4F,#3D5A80)" }
];

var FILTER_PAGE_SIZE = 12;
var appliedFilterState = null;

function getCatalogMaterialGroup(product){
    if(product.material_group && MATERIAL_GROUPS.indexOf(product.material_group) >= 0)
        return product.material_group;
    var material = String(product.material || "").toLowerCase();
    if(/đá|bê tông|xi măng|marble|granite|concrete|cement|stone/.test(material))
        return "Đá & bê tông";
    if(/gốm|sứ|đất nung|ceramic|porcelain|terracotta/.test(material))
        return "Gốm sứ";
    if(/thủy tinh|kính|glass|mirror/.test(material))
        return "Thủy tinh";
    if(/mây|tre|cói|wicker|rattan|bamboo|cane|seagrass/.test(material))
        return "Mây, tre, cói";
    if(/gỗ|wood|oak|walnut|maple|mango|teak|acacia|pine|plywood|mdf/.test(material))
        return "Gỗ";
    if(/da bò|da thật|da nhân tạo|da tổng hợp|da lộn|leather|leatherette|faux leather/.test(material))
        return "Da";
    if(/kim loại|thép|sắt|nhôm|đồng|inox|thau|metal|steel|iron|aluminum|aluminium|brass|copper|chrome/.test(material))
        return "Kim loại";
    if(/vải|sợi|cotton|linen|polyester|canvas|nhung|len|nỉ|velvet|wool|textile|fabric|chenille|acrylic/.test(material))
        return "Vải & sợi";
    return "Khác";
}

function getCatalogColorGroup(product){
    var validGroups = COLOR_GROUPS.map(function(group){ return group.name; });
    if(product.color_group && validGroups.indexOf(product.color_group) >= 0)
        return product.color_group;
    var color = boDau(product.color);
    if(color == "")
        return "";
    if(/^(chon mau sau|100% len|vai canvas)$/.test(color))
        return "";
    if(/nhieu mau|multicolor|multicolour|pattern|hoa tiet|moi chiec moi khac|loang/.test(color))
        return "Nhiều màu";
    if(/trang|kem|ivory|white|cream|xuong|bone|ecru|pearl|sang mau|phu trang/.test(color))
        return "Trắng & kem";
    if(/den|black|muc in/.test(color))
        return "Đen";
    if(/xam|gray|grey|charcoal|graphite|than chi|silver|bac|khoi|suong|xi mang|ximang|nhom|sat cu|mau soi/.test(color))
        return "Xám";
    if(/xanh la|xanh reu|xanh quan doi|xanh la co|xanh spa|xanh oc dao|xanh diu|xanh thuong xuan|xanh dam lay|green|olive|o liu|moss|sage|mint|forest|rung|bot bien|mong ket|ngoc/.test(color))
        return "Xanh lá";
    if(/xanh duong|xanh dam pha|xanh cham|xanh lan|xanh bien|xanh thuy tinh bien|xanh vu tru|xanh bui|xanh chuon chuon|blue|navy|indigo|lagoon|ocean|dai duong|pacific|royal|teal|turquoise/.test(color))
        return "Xanh dương";
    if(/vang|dong|gold|brass|bronze|champagne|sampanh|sam panh|honey|mat ong|mustard/.test(color))
        return "Vàng & đồng";
    if(/hong|do|cam|pink|red|orange|coral|rust|gi set|cinnamon|cider|berry|plum|tim|mulberry|dau tam|mau que/.test(color))
        return "Hồng, đỏ & cam";
    if(/be|nau|brown|beige|tan|cognac|walnut|natural|tu nhien|go|mocha|caramel|straw|trung tinh|tong dat|sand|cat|latte|sa thach|da voi|da travertine|mau da|taupe|sung|trong suot/.test(color))
        return "Be & nâu";
    return "";
}

function populateCatalogGroupOptions(selectId, groups, selectedValue){
    var select = document.getElementById(selectId);
    select.innerHTML = "";
    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Chọn nhóm";
    select.appendChild(placeholder);
    for(var i = 0; i < groups.length; i++){
        var option = document.createElement("option");
        option.value = typeof groups[i] == "string" ? groups[i] : groups[i].name;
        option.textContent = option.value;
        select.appendChild(option);
    }
    select.value = selectedValue || "";
}

/* ---------------- Tìm kiếm tiếng Việt không dấu ---------------- */

// "Ghế bành" -> "ghe banh"
function boDau(chuoi){
    var s = String(chuoi || "").toLowerCase();
    s = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
    s = s.replace(/đ/g, "d");
    return s;
}

function tachTu(chuoi){
    var tu = boDau(chuoi).split(/[^a-z0-9]+/);
    var kq = [];
    for(var i = 0; i < tu.length; i++){
        if(tu[i] != "") kq.push(tu[i]);
    }
    return kq;
}

// Từ khóa khớp 1 từ: trùng hẳn, hoặc từ khóa dài từ 4 ký tự trở lên thì khớp phần đầu
// ("ban" chỉ khớp "bàn/bán", không khớp "bảng"; "sofa" khớp "sofa", "sofas")
function khopTu(tuKhoa, dsTu){
    for(var i = 0; i < dsTu.length; i++){
        if(dsTu[i] == tuKhoa) return true;
        if(tuKhoa.length >= 4 && dsTu[i].indexOf(tuKhoa) == 0) return true;
    }
    return false;
}

// Điểm khớp của 1 sản phẩm với từ khóa. 0 = không khớp.
// Chỉ tìm trong tên, thương hiệu, chất liệu, màu (không tìm trong mô tả để
// "bàn trà" không ra khăn trải bàn, "ghế" không ra bàn ăn có nhắc tới ghế).
function diemTimKiem(product, tuKhoa){
    var dsTuKhoa = tachTu(tuKhoa);
    if(dsTuKhoa.length == 0) return 1;

    var cumTuKhoa = dsTuKhoa.join(" ");
    var tuTen = tachTu(product.name);
    var tenBoDau = tuTen.join(" ");
    var tuKhac = tachTu([product.brand, product.material, product.color, getCatalogMaterialGroup(product), getCatalogColorGroup(product)].join(" "));

    var trongTen = true, trongTatCa = true;
    for(var i = 0; i < dsTuKhoa.length; i++){
        var coTrongTen = khopTu(dsTuKhoa[i], tuTen);
        if(!coTrongTen) trongTen = false;
        if(!coTrongTen && !khopTu(dsTuKhoa[i], tuKhac)) trongTatCa = false;
    }
    if(!trongTatCa) return 0;
    if(tenBoDau.indexOf(cumTuKhoa) == 0) return 4;     // tên bắt đầu bằng cụm từ khóa
    if(tenBoDau.indexOf(cumTuKhoa) > 0) return 3;      // tên chứa nguyên cụm
    if(trongTen) return 2;                             // tên có đủ các từ
    return 1;                                          // khớp thương hiệu, chất liệu, màu
}

/* ---------------- Vẽ khung lọc ---------------- */

// dsGoc: danh sách sản phẩm của trang (để đếm số món của từng lựa chọn)
// htmlRieng: phần lọc riêng của trang, đặt ở đầu khung (có thể để "")
function renderFilterPanel(containerId, dsGoc, htmlRieng){
    var html = "";
    html += "<div class='filter-header'>";
    html += "<h3 class='filter-title'><span class='material-symbols-outlined'>tune</span> Bộ lọc</h3>";
    html += "<button type='button' class='btn-link' onclick='resetFilterPanel()'>Đặt lại</button>";
    html += "</div>";
    html += htmlRieng || "";

    // Mức giá
    html += "<div class='filter-group'><h4 class='filter-group-title'>Mức giá (VND)</h4><div class='filter-radios'>";
    html += "<label class='radio-label'><input type='radio' name='radPrice' value='' checked><span>Tất cả mức giá</span></label>";
    for(var i = 0; i < PRICE_RANGES.length; i++){
        var soMon = demTheoGia(dsGoc, PRICE_RANGES[i].value);
        if(soMon == 0) continue;
        html += "<label class='radio-label'><input type='radio' name='radPrice' value='" + PRICE_RANGES[i].value + "'>"
             + "<span>" + PRICE_RANGES[i].label + "</span><em class='filter-count'>" + soMon + "</em></label>";
    }
    html += "</div></div>";

    // Danh mục (cha trước, con thụt vào dưới cha)
    html += "<div class='filter-group'><h4 class='filter-group-title'>Danh mục</h4>";
    html += "<select id='cboFilterCategory' class='input'>" + taoOptionDanhMuc() + "</select></div>";

    // Chất liệu
    html += "<div class='filter-group'><h4 class='filter-group-title'>Chất liệu</h4><div class='filter-checks' id='divFilterMaterial'>";
    for(var j = 0; j < MATERIAL_GROUPS.length; j++){
        var soChatLieu = demTheoTruong(dsGoc, "material_group", MATERIAL_GROUPS[j]);
        if(soChatLieu == 0) continue;
        html += "<label class='checkbox-label'><input type='checkbox' value='" + MATERIAL_GROUPS[j] + "'>"
             + "<span>" + MATERIAL_GROUPS[j] + "</span><em class='filter-count'>" + soChatLieu + "</em></label>";
    }
    html += "</div></div>";

    // Màu sắc
    html += "<div class='filter-group'><h4 class='filter-group-title'>Màu sắc</h4><div class='filter-colors' id='divFilterColor'>";
    for(var k = 0; k < COLOR_GROUPS.length; k++){
        var soMau = demTheoTruong(dsGoc, "color_group", COLOR_GROUPS[k].name);
        if(soMau == 0) continue;
        html += "<label class='color-label' title='" + COLOR_GROUPS[k].name + " (" + soMau + ")'>"
             + "<input type='checkbox' value='" + COLOR_GROUPS[k].name + "'>"
             + "<span class='color-swatch' style='background:" + COLOR_GROUPS[k].swatch + "'></span>"
             + "<span class='color-name'>" + COLOR_GROUPS[k].name + "</span></label>";
    }
    html += "</div></div>";

    // Thương hiệu
    html += "<div class='filter-group'><h4 class='filter-group-title'>Thương hiệu</h4>";
    html += "<select id='cboFilterBrand' class='input'>" + taoOptionThuongHieu(dsGoc) + "</select></div>";

    // Còn hàng
    html += "<div class='filter-group filter-group-last'><label class='checkbox-label'>";
    html += "<input type='checkbox' id='chkFilterInStock'><span>Chỉ hiện sản phẩm còn hàng</span></label></div>";
    html += "<button type='button' class='btn btn-outline btn-full filter-apply-button' onclick='applyFilterPanel()'>Áp dụng bộ lọc</button>";

    document.getElementById(containerId).innerHTML = html;
}

function demTheoGia(ds, khoang){
    var dem = 0;
    for(var i = 0; i < ds.length; i++){
        if(trongKhoangGia(ds[i].price, khoang)) dem++;
    }
    return dem;
}

function trongKhoangGia(gia, khoang){
    if(!khoang) return true;
    var phan = khoang.split("-");
    return Number(gia) >= Number(phan[0]) && Number(gia) < Number(phan[1]);
}

function demTheoTruong(ds, truong, giaTri){
    var dem = 0;
    for(var i = 0; i < ds.length; i++){
        var giaTriSanPham = ds[i][truong];
        if(truong == "material_group")
            giaTriSanPham = getCatalogMaterialGroup(ds[i]);
        else if(truong == "color_group")
            giaTriSanPham = getCatalogColorGroup(ds[i]);
        if(giaTriSanPham == giaTri) dem++;
    }
    return dem;
}

function taoOptionDanhMuc(){
    var categories = getTable("categories");
    var html = "<option value=''>Tất cả danh mục</option>";
    for(var i = 0; i < categories.length; i++){
        html += "<option value='" + categories[i].id + "'>" + categories[i].name + "</option>";
    }
    return html;
}

function taoOptionThuongHieu(ds){
    var dem = {};
    var dsTen = [];
    for(var i = 0; i < ds.length; i++){
        var b = ds[i].brand;
        if(!b) continue;
        if(!dem[b]){ dem[b] = 0; dsTen.push(b); }
        dem[b]++;
    }
    dsTen.sort(function(a, b){ return a.localeCompare(b, "vi"); });
    var html = "<option value=''>Tất cả thương hiệu</option>";
    for(var j = 0; j < dsTen.length; j++)
        html += "<option value='" + dsTen[j] + "'>" + dsTen[j] + " (" + dem[dsTen[j]] + ")</option>";
    return html;
}

/* ---------------- Đọc / ghi trạng thái lọc ---------------- */

function getCheckedValues(containerId){
    var kq = [];
    var boxes = document.getElementById(containerId).getElementsByTagName("input");
    for(var i = 0; i < boxes.length; i++){
        if(boxes[i].checked) kq.push(boxes[i].value);
    }
    return kq;
}

function setCheckedValues(containerId, values){
    var boxes = document.getElementById(containerId).getElementsByTagName("input");
    for(var i = 0; i < boxes.length; i++)
        boxes[i].checked = values.indexOf(boxes[i].value) >= 0;
}

function getFilterState(){
    var radPrice = document.querySelector("input[name='radPrice']:checked");
    return {
        q: document.getElementById("txtFilterSearch").value.trim(),
        price: radPrice ? radPrice.value : "",
        category: document.getElementById("cboFilterCategory").value,
        materials: getCheckedValues("divFilterMaterial"),
        colors: getCheckedValues("divFilterColor"),
        brand: document.getElementById("cboFilterBrand").value,
        inStock: document.getElementById("chkFilterInStock").checked,
        sort: document.getElementById("cboFilterSort").value
    };
}

function copyFilterState(state){
    return {
        q: state.q || "",
        price: state.price || "",
        category: state.category || "",
        materials: (state.materials || []).slice(),
        colors: (state.colors || []).slice(),
        brand: state.brand || "",
        inStock: state.inStock == true,
        sort: state.sort || ""
    };
}

function getAppliedFilterState(){
    return copyFilterState(appliedFilterState || getFilterState());
}

function commitFilterState(){
    appliedFilterState = copyFilterState(getFilterState());
}

function applyFilterPanel(){
    onFilterChange();
    if(window.matchMedia("(max-width: 900px)").matches)
        document.getElementById("filterPanel").classList.remove("open");
}

function setFilterState(state){
    appliedFilterState = copyFilterState(state);
    document.getElementById("txtFilterSearch").value = state.q || "";
    var radios = document.getElementsByName("radPrice");
    var coGia = false;
    for(var i = 0; i < radios.length; i++){
        radios[i].checked = radios[i].value == (state.price || "");
        if(radios[i].checked) coGia = true;
    }
    if(!coGia) radios[0].checked = true;
    document.getElementById("cboFilterCategory").value = state.category || "";
    if(document.getElementById("cboFilterCategory").value != (state.category || ""))
        document.getElementById("cboFilterCategory").value = "";
    setCheckedValues("divFilterMaterial", state.materials || []);
    setCheckedValues("divFilterColor", state.colors || []);
    document.getElementById("cboFilterBrand").value = state.brand || "";
    if(document.getElementById("cboFilterBrand").value != (state.brand || ""))
        document.getElementById("cboFilterBrand").value = "";
    document.getElementById("chkFilterInStock").checked = state.inStock == true;
    if(state.sort) document.getElementById("cboFilterSort").value = state.sort;
}

// Đọc bộ lọc từ địa chỉ trang (vd. products.html?q=ghe&material=Gỗ,Da&price=1000000-3000000)
function readFilterParams(){
    var materials = getParam("material");
    var colors = getParam("color");
    return {
        q: getParam("q"),
        price: getParam("price"),
        category: getParam("category"),
        materials: materials ? materials.split(",") : [],
        colors: colors ? colors.split(",") : [],
        brand: getParam("brand"),
        inStock: getParam("stock") == "1",
        sort: getParam("sort")
    };
}

// Tạo phần ?... của địa chỉ từ bộ lọc; extra là các tham số riêng của trang
function filterStateToQuery(state, extra, defaultSort){
    var params = extra ? extra.slice() : [];
    if(state.q) params.push("q=" + encodeURIComponent(state.q));
    if(state.price) params.push("price=" + state.price);
    if(state.category) params.push("category=" + state.category);
    if(state.materials.length > 0) params.push("material=" + encodeURIComponent(state.materials.join(",")));
    if(state.colors.length > 0) params.push("color=" + encodeURIComponent(state.colors.join(",")));
    if(state.brand) params.push("brand=" + encodeURIComponent(state.brand));
    if(state.inStock) params.push("stock=1");
    if(state.sort && state.sort != defaultSort) params.push("sort=" + state.sort);
    return params.length > 0 ? "?" + params.join("&") : "";
}

/* ---------------- Lọc và sắp xếp ---------------- */

function getCategoryWithChildren(categoryId){
    var ids = [String(categoryId)];
    var categories = getTable("categories");
    for(var i = 0; i < categories.length; i++){
        if(String(categories[i].parent_id) == String(categoryId)) ids.push(String(categories[i].id));
    }
    return ids;
}

function filterProductList(ds, state){
    var dsDanhMuc = state.category ? getCategoryWithChildren(state.category) : [];
    var kq = [];
    for(var i = 0; i < ds.length; i++){
        var p = ds[i];
        if(!trongKhoangGia(p.price, state.price)) continue;
        if(state.category && dsDanhMuc.indexOf(String(p.category_id)) < 0) continue;
        if(state.materials.length > 0 && state.materials.indexOf(getCatalogMaterialGroup(p)) < 0) continue;
        if(state.colors.length > 0 && state.colors.indexOf(getCatalogColorGroup(p)) < 0) continue;
        if(state.brand && p.brand != state.brand) continue;
        if(state.inStock && !(Number(p.stock_quantity) > 0)) continue;
        if(state.q){
            p._diem = diemTimKiem(p, state.q);
            if(p._diem == 0) continue;
        } else {
            p._diem = 0;
        }
        kq.push(p);
    }
    return kq;
}

// getSoldMap() và getRatingMap() nằm ở js/services/products.js (dùng chung cho thẻ sản phẩm)

// sort: default | newest | bestseller | rating | price-asc | price-desc | name-asc | grade
// Món hết hàng luôn xếp cuối để khách thấy món mua được trước.
function sortProductList(ds, sort, tuKhoa){
    var daBan = sort == "bestseller" ? getSoldMap() : {};
    var danhGia = sort == "rating" ? getRatingMap() : {};
    var thuTuTinhTrang = { "Like New": 1, "Good": 2, "Fair": 3 };
    for(var i = 0; i < ds.length; i++) ds[i]._viTri = i;

    ds.sort(function(a, b){
        var hetA = Number(a.stock_quantity) > 0 ? 0 : 1;
        var hetB = Number(b.stock_quantity) > 0 ? 0 : 1;
        if(hetA != hetB) return hetA - hetB;

        var ss = 0;
        if(sort == "price-asc") ss = Number(a.price) - Number(b.price);
        else if(sort == "price-desc") ss = Number(b.price) - Number(a.price);
        else if(sort == "name-asc") ss = a.name.localeCompare(b.name, "vi");
        else if(sort == "newest") ss = String(b.created_at || b.id).localeCompare(String(a.created_at || a.id)) || String(b.id).localeCompare(String(a.id));
        else if(sort == "bestseller") ss = (daBan[b.id] || 0) - (daBan[a.id] || 0);
        else if(sort == "rating"){
            var ra = danhGia[a.id] || { score: 0, count: 0 };
            var rb = danhGia[b.id] || { score: 0, count: 0 };
            ss = (rb.score - ra.score) || (rb.count - ra.count);
        }
        else if(sort == "grade") ss = (thuTuTinhTrang[a.condition_grade] || 4) - (thuTuTinhTrang[b.condition_grade] || 4);

        // Khi đang tìm kiếm: cùng thứ tự thì món khớp tên hơn lên trước
        if(ss == 0 && tuKhoa) ss = (b._diem || 0) - (a._diem || 0);
        if(ss == 0) ss = a._viTri - b._viTri;
        return ss;
    });
    return ds;
}

/* ---------------- Nhãn bộ lọc đang chọn ---------------- */

function renderActiveFilterTags(containerId, state, extraTags){
    var container = document.getElementById(containerId);
    container.innerHTML = "";
    var tags = extraTags ? extraTags.slice() : [];

    if(state.q) tags.push({ label: "Từ khóa: " + state.q, remove: "document.getElementById(\"txtFilterSearch\").value=\"\"" });
    if(state.price){
        for(var i = 0; i < PRICE_RANGES.length; i++){
            if(PRICE_RANGES[i].value == state.price)
                tags.push({ label: "Giá: " + PRICE_RANGES[i].label, remove: "document.getElementsByName(\"radPrice\")[0].checked=true" });
        }
    }
    if(state.category)
        tags.push({ label: "Danh mục: " + getCategoryNameForTag(state.category), remove: "document.getElementById(\"cboFilterCategory\").value=\"\"" });
    for(var m = 0; m < state.materials.length; m++)
        tags.push({ label: "Chất liệu: " + state.materials[m], remove: "boChonOLoc(\"divFilterMaterial\",\"" + state.materials[m] + "\")" });
    for(var c = 0; c < state.colors.length; c++)
        tags.push({ label: "Màu: " + state.colors[c], remove: "boChonOLoc(\"divFilterColor\",\"" + state.colors[c] + "\")" });
    if(state.brand)
        tags.push({ label: "Thương hiệu: " + state.brand, remove: "document.getElementById(\"cboFilterBrand\").value=\"\"" });
    if(state.inStock)
        tags.push({ label: "Còn hàng", remove: "document.getElementById(\"chkFilterInStock\").checked=false" });

    for(var t = 0; t < tags.length; t++){
        var chip = document.createElement("span");
        chip.className = "active-tag-chip";
        chip.setAttribute("onclick", tags[t].remove + ";onFilterChange()");
        chip.setAttribute("title", "Bỏ lọc này");
        chip.innerHTML = tags[t].label + " <span class='material-symbols-outlined'>close</span>";
        container.appendChild(chip);
    }
}

function getCategoryNameForTag(categoryId){
    var category = findById("categories", categoryId);
    return category ? category.name : categoryId;
}

function boChonOLoc(containerId, giaTri){
    var boxes = document.getElementById(containerId).getElementsByTagName("input");
    for(var i = 0; i < boxes.length; i++){
        if(boxes[i].value == giaTri) boxes[i].checked = false;
    }
}

function resetFilterPanel(){
    setFilterState({ q: "", price: "", category: "", materials: [], colors: [], brand: "", inStock: false, sort: "" });
    if(typeof resetPageFilters == "function") resetPageFilters();   // phần lọc riêng của trang
    onFilterChange();
}

// Ô tìm kiếm: đợi khách ngừng gõ 300ms mới lọc
var filterSearchTimer = null;
function onFilterSearchInput(){
    clearTimeout(filterSearchTimer);
    filterSearchTimer = setTimeout(function(){ onFilterChange(); }, 300);
}

// Điện thoại: bấm nút "Bộ lọc" để mở / đóng khung lọc
function toggleFilterPanel(){
    document.getElementById("filterPanel").classList.toggle("open");
}

/* ---------------- Phân trang ---------------- */

function renderFilterPagination(containerId, page, pageCount){
    var nav = document.getElementById(containerId);
    nav.innerHTML = "";
    if(pageCount <= 1) return;
    var html = "";
    if(page > 1) html += taoNutTrang("Trước", page - 1, false);
    for(var i = 1; i <= pageCount; i++){
        if(i == 1 || i == pageCount || Math.abs(i - page) <= 1)
            html += taoNutTrang(i, i, i == page);
        else if(i == page - 2 || i == page + 2)
            html += "<span class='catalog-page-dots'>...</span>";
    }
    if(page < pageCount) html += taoNutTrang("Tiếp", page + 1, false);
    nav.innerHTML = html;
}

function taoNutTrang(nhan, trang, dangChon){
    return "<button type='button' class='catalog-page-link" + (dangChon ? " active" : "") + "'"
         + (dangChon ? " aria-current='page'" : "")
         + " onclick='goToFilterPage(" + trang + ")'>" + nhan + "</button>";
}
