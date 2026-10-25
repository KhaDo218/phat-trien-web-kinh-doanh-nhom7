/* =====================================================================
   ROOMCRAFT - Quản lý đánh giá (admin/reviews.html)
   Người phụ trách: Như Huyền
   Việc cần làm: Ẩn / xóa đánh giá, tìm kiếm và lọc số sao.
   ===================================================================== */

var searchDebounceTimer = null;

function initPage(){
    if(requireAdmin() == false)
        return;

    renderAdminSidebar("reviews");
    ensureDemoReviews();
    renderTable();
}

// Khởi tạo dữ liệu đánh giá mẫu phong phú nếu chưa có trong localStorage
function ensureDemoReviews(){
    var reviews = getTable("reviews");
    if(reviews && reviews.length > 0)
        return;

    var demoReviews = [
        {
            id: 1,
            user_id: 2,
            product_id: "used-001",
            rating: 5,
            comment: "Ghế ăn gỗ sồi Like New nhận về đẹp hơn mong đợi! Gỗ chắc nịch, không trầy xước gì đáng kể, đóng gói cẩn thận.",
            review_image_url: null,
            is_hidden: false,
            created_at: "2026-10-18T10:30:00"
        },
        {
            id: 2,
            user_id: 3,
            product_id: "used-002",
            rating: 5,
            comment: "Sofa da cognac BoConcept chất lượng tuyệt vời, da thật mềm mượt có patina rất vintage. Tiết kiệm được hơn 15 triệu so với mua mới!",
            review_image_url: null,
            is_hidden: false,
            created_at: "2026-10-19T14:15:00"
        },
        {
            id: 3,
            user_id: 4,
            product_id: "used-003",
            rating: 4,
            comment: "Bàn trà tròn gỗ xoài rất hợp với thảm phòng khách nhà mình. Mặt bàn có vết xước dăm nhỏ nhưng đúng như mô tả trung thực của shop.",
            review_image_url: null,
            is_hidden: false,
            created_at: "2026-10-20T08:45:00"
        },
        {
            id: 4,
            user_id: 5,
            product_id: "product-coastal-fiona-loveseat-01",
            rating: 5,
            comment: "Sofa đôi Fiona xinh xắn, tính năng xem 3D xoay thử góc phòng trước khi mua rất trực quan, giao hàng đúng hẹn.",
            review_image_url: null,
            is_hidden: false,
            created_at: "2026-10-21T16:20:00"
        },
        {
            id: 5,
            user_id: 6,
            product_id: "used-007",
            rating: 3,
            comment: "Bàn ăn mở rộng kéo dài dùng tốt, tuy nhiên mặt bàn hơi nhiều vết ố nhiệt hơn mình tưởng tượng, cần chà nhám lại một chút.",
            review_image_url: null,
            is_hidden: false,
            created_at: "2026-10-22T09:10:00"
        },
        {
            id: 6,
            user_id: 3,
            product_id: "used-005",
            rating: 1,
            comment: "SP spam qu@ng c@o link xau: truy cap ngay http://spam-website.example de nhan qua tang lua dao...",
            review_image_url: null,
            is_hidden: true, // Đã bị ẩn vi phạm
            created_at: "2026-10-22T19:00:00"
        },
        {
            id: 7,
            user_id: 2,
            product_id: "used-004",
            rating: 5,
            comment: "Ghế bành xoay Julius ngồi cực kỳ sướng lưng, cơ chế xoay 360 độ êm ru, màu nâu cognac nhìn rất sang.",
            review_image_url: null,
            is_hidden: false,
            created_at: "2026-10-23T11:40:00"
        },
        {
            id: 8,
            user_id: 5,
            product_id: "used-009",
            rating: 4,
            comment: "Bàn làm việc Merriton chân đồng thau chắc chắn, 2 ngăn kéo trượt nhẹ, bề mặt trắng tinh tươm.",
            review_image_url: null,
            is_hidden: false,
            created_at: "2026-10-23T15:25:00"
        }
    ];
    saveTable("reviews", demoReviews);
}

function onSearchChange(){
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(function(){
        renderTable();
    }, 200);
}

function renderTable(){
    var reviews = getTable("reviews");
    var products = getTable("products");
    var users = getTable("users");

    // Tạo maps tra cứu nhanh
    var prodMap = {};
    for(var p = 0; p < products.length; p++){
        prodMap[products[p].id] = products[p];
    }
    var userMap = {};
    for(var u = 0; u < users.length; u++){
        userMap[users[u].id] = users[u];
    }

    // Tính toán số liệu thống kê
    var total = reviews.length;
    var sumRating = 0;
    var visibleCount = 0;
    var hiddenCount = 0;

    for(var i = 0; i < reviews.length; i++){
        var rev = reviews[i];
        sumRating += Number(rev.rating) || 5;
        if(rev.is_hidden === true){
            hiddenCount++;
        } else {
            visibleCount++;
        }
    }
    var avg = total > 0 ? (sumRating / total).toFixed(1) : "0.0";

    document.getElementById("statTotalReviews").textContent = total;
    document.getElementById("statAvgRating").textContent = avg + " ★";
    document.getElementById("statVisibleReviews").textContent = visibleCount;
    document.getElementById("statHiddenReviews").textContent = hiddenCount;

    // Lọc theo thanh công cụ
    var q = (document.getElementById("txtSearchReview").value || "").trim().toLowerCase();
    var filterRating = document.getElementById("slFilterRating").value;
    var filterStatus = document.getElementById("slFilterStatus").value;

    var filtered = reviews.filter(function(r){
        if(q){
            var prod = prodMap[r.product_id];
            var usr = userMap[r.user_id];
            var prodName = prod ? (prod.name || "").toLowerCase() : "";
            var userName = usr ? (usr.full_name || "").toLowerCase() : "";
            var userEmail = usr ? (usr.email || "").toLowerCase() : "";
            var comment = (r.comment || "").toLowerCase();
            if(prodName.indexOf(q) < 0 && userName.indexOf(q) < 0 && userEmail.indexOf(q) < 0 && comment.indexOf(q) < 0){
                return false;
            }
        }
        if(filterRating && String(r.rating) !== String(filterRating)) return false;
        if(filterStatus === "visible" && r.is_hidden === true) return false;
        if(filterStatus === "hidden" && r.is_hidden !== true) return false;
        return true;
    });

    var tbody = document.getElementById("tbReviews");
    var emptyDiv = document.getElementById("divEmpty");
    tbody.innerHTML = "";

    if(filtered.length === 0){
        emptyDiv.classList.remove("hidden");
        return;
    }
    emptyDiv.classList.add("hidden");

    for(var idx = 0; idx < filtered.length; idx++){
        var r = filtered[idx];
        var tr = document.createElement("tr");

        var prod = prodMap[r.product_id];
        var usr = userMap[r.user_id];

        var prodImg = (prod && prod.images && prod.images.length > 0) ? asset(prod.images[0]) : "";
        var prodName = prod ? prod.name : r.product_id;
        var userName = usr ? (usr.full_name || usr.email) : ("User #" + r.user_id);
        var userEmail = usr ? usr.email : "";

        // Tạo chuỗi sao
        var starsStr = "";
        for(var s = 1; s <= 5; s++){
            starsStr += (s <= r.rating) ? "★" : "☆";
        }

        var statusBadge = (r.is_hidden === true)
            ? "<span class='badge badge-out'>Đã ẩn</span>"
            : "<span class='badge badge-stock'>Hiển thị</span>";

        var toggleBtnText = (r.is_hidden === true) ? "Hiện" : "Ẩn";
        var toggleIcon = (r.is_hidden === true) ? "visibility" : "visibility_off";

        var html = "";
        html += "<td><code>#" + r.id + "</code></td>";
        html += "<td>"
              + "  <div class='prod-preview'>"
              + "    <img src='" + prodImg + "' alt=''>"
              + "    <div class='prod-preview-text'>"
              + "      <strong title='" + prodName + "'>" + prodName + "</strong>"
              + "      <span>Mã: " + r.product_id + "</span>"
              + "    </div>"
              + "  </div>"
              + "</td>";
        html += "<td><strong>" + userName + "</strong><br><small class='text-secondary'>" + userEmail + "</small></td>";
        html += "<td><span class='rating-stars'>" + starsStr + "</span><span class='rating-num'>(" + r.rating + ")</span></td>";
        html += "<td><div class='comment-text'>" + (r.comment || "<em class='text-secondary'>Không có nhận xét viết</em>") + "</div></td>";
        html += "<td>" + formatDate(r.created_at || "2026-10-20") + "</td>";
        html += "<td>" + statusBadge + "</td>";
        html += "<td class='actions-cell'>"
              + "  <button type='button' class='btn btn-outline btn-sm' onclick='toggleHideReview(" + r.id + ")' title='" + (r.is_hidden ? "Hiện lại đánh giá" : "Ẩn đánh giá vi phạm") + "'>"
              + "    <span class='material-symbols-outlined'>" + toggleIcon + "</span> " + toggleBtnText
              + "  </button>"
              + "  <button type='button' class='btn btn-outline btn-danger btn-sm' onclick='deleteReview(" + r.id + ")' title='Xóa đánh giá vĩnh viễn'>"
              + "    <span class='material-symbols-outlined'>delete</span>"
              + "  </button>"
              + "</td>";

        tr.innerHTML = html;
        tbody.appendChild(tr);
    }
}

function toggleHideReview(reviewId){
    var reviews = getTable("reviews");
    for(var i = 0; i < reviews.length; i++){
        if(reviews[i].id === reviewId){
            reviews[i].is_hidden = !reviews[i].is_hidden;
            break;
        }
    }
    saveTable("reviews", reviews);
    renderTable();
}

function deleteReview(reviewId){
    if(!confirm("Bạn có chắc chắn muốn XÓA vĩnh viễn đánh giá #" + reviewId + " không?")){
        return;
    }
    var reviews = getTable("reviews");
    var filtered = reviews.filter(function(r){
        return r.id !== reviewId;
    });
    saveTable("reviews", filtered);
    alert("Đã xóa đánh giá #" + reviewId + " thành công!");
    renderTable();
}
