/* =====================================================================
   ROOMCRAFT - Sản phẩm yêu thích (wishlist.html)
   Người phụ trách: Nguyên Khôi; Bảo Duy thêm nút "Thêm vào giỏ" và thông báo (BPMN 5, UC1.5)
   - Mỗi thẻ có 2 nút: Xem chi tiết / Thêm vào giỏ (hết hàng thì khóa nút).
   - Thêm vào giỏ: kiểm tra tồn kho bằng addToCart() (services/cart.js), báo thành công
     kèm link sang Giỏ hàng; món vẫn giữ trong danh sách yêu thích.
   - Bỏ khỏi yêu thích (nút tim): báo "Đã bỏ" kèm nút Hoàn tác.
   Thông báo dùng showRoomToast() trong components/room-card.js.
   ===================================================================== */

var lastRemoved = null;        // { productId, viTri } của món vừa bỏ, để Hoàn tác

function initPage(){
    if(requireLogin() == false)
        return;
    renderHeader("");
    renderFooter();
    renderChatbot();
    renderWishlist();
}

function renderWishlist(){
    var user = getCurrentUser();
    var wishlists = getObject("wishlists") || {};
    var ids = wishlists[user.id] || [];
    var products = getActiveProducts();
    var grid = document.getElementById("wishlistGrid");
    var visibleCount = 0;
    grid.innerHTML = "";

    for(var i = 0; i < ids.length; i++){
        for(var j = 0; j < products.length; j++){
            if(products[j].id == ids[i]){
                grid.appendChild(createWishlistCard(products[j]));
                visibleCount++;
                break;
            }
        }
    }

    document.getElementById("wishlistCount").textContent = visibleCount + " sản phẩm đã lưu";
    if(visibleCount == 0)
        document.getElementById("emptyWishlist").classList.remove("hidden");
    else
        document.getElementById("emptyWishlist").classList.add("hidden");
}

// Thẻ sản phẩm dùng chung + đổi nút tim thành "Bỏ khỏi yêu thích" + thêm nút "Thêm vào giỏ"
function createWishlistCard(product){
    var card = createProductCard(product);

    var removeButton = card.querySelector(".btn-wishlist");
    if(removeButton){
        removeButton.setAttribute("title", "Bỏ khỏi yêu thích");
        removeButton.setAttribute("aria-label", "Bỏ " + product.name + " khỏi yêu thích");
        removeButton.onclick = function(event){
            event.preventDefault();
            event.stopPropagation();
            removeWishlistProduct(product.id);
        };
    }

    var actions = card.querySelector(".product-card-actions");
    if(actions){
        actions.classList.add("wishlist-actions");
        var btnCart = document.createElement("button");
        btnCart.type = "button";
        if(Number(product.stock_quantity) > 0){
            btnCart.className = "btn";
            btnCart.innerHTML = "<span class='material-symbols-outlined'>shopping_bag</span>Thêm vào giỏ";
            btnCart.setAttribute("aria-label", "Thêm " + product.name + " vào giỏ hàng");
            btnCart.onclick = function(){
                addWishlistToCart(product.id);
            };
        }
        else{
            btnCart.className = "btn btn-light";
            btnCart.disabled = true;
            btnCart.textContent = product.product_type === "USED" ? "Đã bán" : "Hết hàng";
        }
        actions.appendChild(btnCart);
    }
    return card;
}

// BPMN 5 nhánh "Thêm vào giỏ": còn hàng -> cập nhật giỏ + báo thành công; lỗi (hết hàng, vượt tồn kho) -> báo lỗi
function addWishlistToCart(productId){
    var loi = addToCart(productId, 1);
    var sp = findById("products", productId);
    if(loi != ""){
        alert(loi);
        renderWishlist();          // tồn kho có thể vừa đổi: vẽ lại để khóa nút nếu đã hết hàng
        return;
    }
    showRoomToast("<span class='material-symbols-outlined'>check_circle</span>Đã thêm \"" + roomEscape(sp.name)
        + "\" vào giỏ hàng <a href='cart.html'>Xem giỏ hàng</a>");
}

// BPMN 5 nhánh "Xóa sản phẩm": cập nhật wishlist + báo đã bỏ (có nút Hoàn tác)
function removeWishlistProduct(productId){
    var user = getCurrentUser();
    var wishlists = getObject("wishlists") || {};
    var ids = wishlists[user.id] || [];
    var updated = [];
    var viTri = -1;
    for(var i = 0; i < ids.length; i++){
        if(ids[i] != productId)
            updated.push(ids[i]);
        else
            viTri = i;
    }
    wishlists[user.id] = updated;
    saveObject("wishlists", wishlists);
    updateWishCount();
    renderWishlist();

    lastRemoved = { productId: productId, viTri: viTri };
    var sp = findById("products", productId);
    showRoomToast("<span class='material-symbols-outlined'>heart_minus</span>Đã bỏ \"" + roomEscape(sp ? sp.name : productId)
        + "\" khỏi yêu thích <a href='javascript:undoRemoveWishlist()'>Hoàn tác</a>");
}

// Đưa món vừa bỏ về lại đúng vị trí cũ trong danh sách
function undoRemoveWishlist(){
    if(lastRemoved == null)
        return;
    var user = getCurrentUser();
    var wishlists = getObject("wishlists") || {};
    var ids = wishlists[user.id] || [];
    if(ids.indexOf(lastRemoved.productId) < 0){
        var viTri = lastRemoved.viTri;
        if(viTri < 0 || viTri > ids.length)
            viTri = ids.length;
        ids.splice(viTri, 0, lastRemoved.productId);
    }
    wishlists[user.id] = ids;
    saveObject("wishlists", wishlists);
    lastRemoved = null;
    updateWishCount();
    renderWishlist();
    showRoomToast("<span class='material-symbols-outlined'>favorite</span>Đã khôi phục vào danh sách yêu thích");
}
