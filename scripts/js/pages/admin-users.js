/* =====================================================================
   ROOMCRAFT - Quản lý người dùng (admin/users.html)
   Người phụ trách: Như Huyền
   Việc cần làm: Khóa / mở tài khoản (is_active), tìm kiếm và lọc.
   ===================================================================== */

var searchDebounceTimer = null;

function initPage(){
    if(requireAdmin() == false)
        return;

    renderAdminSidebar("users");
    renderTable();
}

function onSearchChange(){
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(function(){
        renderTable();
    }, 200);
}

function renderTable(){
    var users = getTable("users");
    var roles = getTable("roles");
    var currentAdmin = getCurrentUser();

    // Map roleId -> roleName
    var roleMap = {};
    for(var r = 0; r < roles.length; r++){
        roleMap[roles[r].id] = roles[r].name;
    }

    // Tính toán số liệu thống kê
    var total = users.length;
    var activeCount = 0;
    var lockedCount = 0;
    var adminCount = 0;

    for(var i = 0; i < users.length; i++){
        var u = users[i];
        if(u.is_active === false){
            lockedCount++;
        } else {
            activeCount++;
        }
        var roleName = roleMap[u.role_id] || "User";
        if(roleName === "Admin") adminCount++;
    }

    document.getElementById("statTotalUsers").textContent = total;
    document.getElementById("statActiveUsers").textContent = activeCount;
    document.getElementById("statLockedUsers").textContent = lockedCount;
    document.getElementById("statAdminUsers").textContent = adminCount;

    // Lọc theo thanh công cụ
    var q = (document.getElementById("txtSearchUser").value || "").trim().toLowerCase();
    var filterRole = document.getElementById("slFilterRole").value;
    var filterStatus = document.getElementById("slFilterStatus").value;

    var filtered = users.filter(function(user){
        if(q){
            var matchName = (user.full_name || "").toLowerCase().indexOf(q) >= 0;
            var matchEmail = (user.email || "").toLowerCase().indexOf(q) >= 0;
            var matchPhone = (user.phone || "").toLowerCase().indexOf(q) >= 0;
            if(!matchName && !matchEmail && !matchPhone) return false;
        }

        var rName = roleMap[user.role_id] || "User";
        if(filterRole && rName !== filterRole) return false;

        if(filterStatus === "active" && user.is_active === false) return false;
        if(filterStatus === "locked" && user.is_active !== false) return false;

        return true;
    });

    var tbody = document.getElementById("tbUsers");
    var emptyDiv = document.getElementById("divEmpty");
    tbody.innerHTML = "";

    if(filtered.length === 0){
        emptyDiv.classList.remove("hidden");
        return;
    }
    emptyDiv.classList.add("hidden");

    for(var idx = 0; idx < filtered.length; idx++){
        var user = filtered[idx];
        var tr = document.createElement("tr");

        var isMe = currentAdmin && (String(currentAdmin.id) === String(user.id));
        var userRole = roleMap[user.role_id] || "User";
        var isRoleAdmin = (userRole === "Admin");

        // Chữ cái đầu tên làm avatar
        var initials = (user.full_name || user.email).charAt(0).toUpperCase();

        var avatarCls = isRoleAdmin ? "user-avatar-circle admin-avatar" : "user-avatar-circle";

        var statusBadge = (user.is_active !== false)
            ? "<span class='badge badge-stock'>Hoạt động</span>"
            : "<span class='badge badge-out'>Bị khóa</span>";

        var actionHtml = "";
        if(isMe){
            actionHtml = "<span class='text-secondary' style='font-size:12px; font-style:italic;'>Tài khoản hiện tại</span>";
        } else if(user.is_active !== false){
            actionHtml = "<button type='button' class='btn btn-outline btn-lock btn-sm' onclick='toggleLockUser(" + user.id + ", false)'>"
                       + "  <span class='material-symbols-outlined'>lock</span> Khóa tài khoản"
                       + "</button>";
        } else {
            actionHtml = "<button type='button' class='btn btn-outline btn-unlock btn-sm' onclick='toggleLockUser(" + user.id + ", true)'>"
                       + "  <span class='material-symbols-outlined'>lock_open</span> Mở khóa"
                       + "</button>";
        }

        var html = "";
        html += "<td><code>#" + user.id + "</code></td>";
        html += "<td>"
              + "  <div class='user-cell'>"
              + "    <div class='" + avatarCls + "'>" + initials + "</div>"
              + "    <div class='user-info-text'>"
              + "      <strong>" + (user.full_name || "—") + "</strong>"
              + (isMe ? " <span class='user-badge-current'>Bạn</span>" : "")
              + "    </div>"
              + "  </div>"
              + "</td>";
        html += "<td>" + user.email + "</td>";
        html += "<td>" + (user.phone || "<span class='text-secondary'>Chưa có</span>") + "</td>";
        html += "<td><span class='badge " + (isRoleAdmin ? "badge-stock" : "") + "'>" + (isRoleAdmin ? "Quản trị viên" : "Khách hàng") + "</span></td>";
        html += "<td>" + formatDate(user.created_at || "2026-10-01") + "</td>";
        html += "<td>" + statusBadge + "</td>";
        html += "<td class='actions-cell'>" + actionHtml + "</td>";

        tr.innerHTML = html;
        tbody.appendChild(tr);
    }
}

function toggleLockUser(userId, makeActive){
    var users = getTable("users");
    var target = null;
    for(var i = 0; i < users.length; i++){
        if(users[i].id === userId){
            target = users[i];
            break;
        }
    }

    if(!target){
        alert("Không tìm thấy người dùng!");
        return;
    }

    var targetName = target.full_name || target.email;
    var confirmMsg = makeActive
        ? "Bạn có chắc chắn muốn MỞ KHÓA tài khoản của '" + targetName + "' không?"
        : "Bạn có chắc chắn muốn KHÓA tài khoản của '" + targetName + "' không?\n\nNgười dùng này sẽ không thể đăng nhập vào RoomCraft.";

    if(!confirm(confirmMsg)){
        return;
    }

    target.is_active = makeActive;
    saveTable("users", users);

    alert("Đã " + (makeActive ? "mở khóa" : "khóa") + " tài khoản '" + targetName + "' thành công!");
    renderTable();
}

// ===================== Xuất JSON =====================
function openExport(){
    document.getElementById("exportModal").className = "modal";
    fillExport();
}

function fillExport(){
    var bang = document.getElementById("cboExport").value;
    document.getElementById("txtExport").value = JSON.stringify(getTable(bang), null, 2);
}

function copyExport(){
    var o = document.getElementById("txtExport");
    o.select();
    if(navigator.clipboard != null){
        navigator.clipboard.writeText(o.value).then(function(){
            alert("Đã sao chép " + document.getElementById("cboExport").value + ".json");
        }, function(){
            document.execCommand("copy");
        });
    }
    else{
        document.execCommand("copy");
        alert("Đã sao chép.");
    }
}

function closeExport(){
    document.getElementById("exportModal").className = "modal hidden";
}

function closeExportOutside(e){
    if(e.target.id == "exportModal")
        closeExport();
}
