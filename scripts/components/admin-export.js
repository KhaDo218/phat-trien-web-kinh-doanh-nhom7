/* =====================================================================
   ROOMCRAFT - admin-export.js (nút "Xuất JSON" dùng chung cho trang quản trị)
   Người phụ trách: Bảo Duy
   Dùng ở: admin/products.html, admin/categories.html, admin/marketplace.html
   (cùng cách làm với admin Phòng mẫu / Người dùng).

   Vì sao cần: thêm / sửa trên trang admin chỉ lưu trong localStorage của máy đang dùng.
   Muốn cả nhóm (và bản deploy) cùng thấy thì xuất JSON, chép đè vào data/json/<file>,
   tăng DATA_VERSION trong js/core/store.js rồi commit.

   Cách dùng trong trang admin:
     <script src="../components/admin-export.js"></script>
     <button type="button" class="btn btn-outline" onclick="openJsonExport(['products'])">Xuất JSON</button>
   Danh sách bảng xuất được: xem EXPORT_TABLES bên dưới.
   ===================================================================== */

// Lưu ý: store.js gộp đồ cũ vào chung bảng "products" (product_type = "USED"),
// nên khi xuất phải tách lại đúng 2 file như trong data/json.
var EXPORT_TABLES = {
    products:      { file: "products.json",      ten: "Sản phẩm mới", layDuLieu: function(){ return getProductsByType(false); } },
    used_products: { file: "used_products.json", ten: "Đồ cũ",        layDuLieu: function(){ return getProductsByType(true); } },
    categories:    { file: "categories.json",    ten: "Danh mục",     layDuLieu: function(){ return getTable("categories"); } }
};

function getProductsByType(laDoCu){
    var tatCa = getTable("products");
    var kq = [];
    for(var i = 0; i < tatCa.length; i++){
        var doCu = tatCa[i].product_type == "USED";
        if(doCu == laDoCu)
            kq.push(tatCa[i]);
    }
    return kq;
}

// Tạo cửa sổ xuất JSON (1 lần), dùng các class .modal có sẵn trong base.css
function createExportModal(){
    var modal = document.createElement("div");
    modal.id = "exportJsonModal";
    modal.className = "modal hidden";
    modal.onclick = function(e){
        if(e.target.id == "exportJsonModal")
            closeJsonExport();
    };
    modal.innerHTML =
          "<div class='modal-box' role='dialog' aria-modal='true' aria-labelledby='exportJsonTitle'>"
        + "  <div class='modal-head'>"
        + "    <div><p class='overline'>Dữ liệu đang lưu trong trình duyệt</p>"
        + "      <h2 class='headline-section' id='exportJsonTitle'>Xuất JSON</h2></div>"
        + "    <button type='button' class='btn-icon' onclick='closeJsonExport()' aria-label='Đóng'><span class='material-symbols-outlined'>close</span></button>"
        + "  </div>"
        + "  <div class='modal-body'>"
        + "    <p class='text-secondary' style='margin-bottom:16px;font-size:14px;'>Thay đổi trên trang quản trị chỉ lưu trong trình duyệt của máy này."
        + "      Muốn cả nhóm cùng thấy: tải file (hoặc sao chép) rồi chép đè vào <b>data/json/</b>, tăng <b>DATA_VERSION</b> trong js/core/store.js rồi commit.</p>"
        + "    <div style='display:flex;flex-wrap:wrap;gap:8px;align-items:center;'>"
        + "      <select class='input' id='cboExportJson' onchange='fillJsonExport()' style='max-width:260px;height:42px;'></select>"
        + "      <button type='button' class='btn' onclick='copyJsonExport()' style='height:42px;'><span class='material-symbols-outlined'>content_copy</span>Sao chép</button>"
        + "      <button type='button' class='btn btn-outline' onclick='downloadJsonExport()' style='height:42px;'><span class='material-symbols-outlined'>download</span>Tải file .json</button>"
        + "      <span class='text-secondary' id='lblExportJsonInfo' style='font-size:13px;'></span>"
        + "    </div>"
        + "    <textarea class='input' id='txtExportJson' readonly spellcheck='false'"
        + "      style='height:360px;margin-top:12px;font-family:Consolas,\"Courier New\",monospace;font-size:12px;line-height:18px;white-space:pre;'></textarea>"
        + "  </div>"
        + "</div>";
    document.body.appendChild(modal);
    document.addEventListener("keydown", function(e){
        if(e.key == "Escape")
            closeJsonExport();
    });
    return modal;
}

// dsBang: mảng tên bảng trong EXPORT_TABLES, vd. ["products"]
function openJsonExport(dsBang){
    var modal = document.getElementById("exportJsonModal");
    if(modal == null)
        modal = createExportModal();
    var html = "";
    for(var i = 0; i < dsBang.length; i++){
        var bang = EXPORT_TABLES[dsBang[i]];
        if(bang != null)
            html += "<option value='" + dsBang[i] + "'>" + bang.file + " (" + bang.ten + ")</option>";
    }
    document.getElementById("cboExportJson").innerHTML = html;
    modal.className = "modal";
    fillJsonExport();
}

function fillJsonExport(){
    var ma = document.getElementById("cboExportJson").value;
    var duLieu = EXPORT_TABLES[ma].layDuLieu();
    document.getElementById("txtExportJson").value = JSON.stringify(duLieu, null, 2);
    document.getElementById("lblExportJsonInfo").innerHTML = duLieu.length + " dòng";
}

function copyJsonExport(){
    var o = document.getElementById("txtExportJson");
    var tenFile = EXPORT_TABLES[document.getElementById("cboExportJson").value].file;
    o.select();
    if(navigator.clipboard != null){
        navigator.clipboard.writeText(o.value).then(function(){
            alert("Đã sao chép nội dung " + tenFile);
        }, function(){
            document.execCommand("copy");
            alert("Đã sao chép nội dung " + tenFile);
        });
    }
    else{
        document.execCommand("copy");
        alert("Đã sao chép nội dung " + tenFile);
    }
}

// Tải về đúng tên file trong data/json để chép đè cho nhanh
function downloadJsonExport(){
    var tenFile = EXPORT_TABLES[document.getElementById("cboExportJson").value].file;
    var noiDung = document.getElementById("txtExportJson").value;
    var blob = new Blob([noiDung], { type: "application/json" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = tenFile;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function(){ URL.revokeObjectURL(link.href); }, 1000);
}

function closeJsonExport(){
    var modal = document.getElementById("exportJsonModal");
    if(modal != null)
        modal.className = "modal hidden";
}
