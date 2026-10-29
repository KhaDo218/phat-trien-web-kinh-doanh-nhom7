/* =====================================================================
   ROOMCRAFT - Sản phẩm yêu thích (wishlist.html)
   Người phụ trách: Nguyên Khôi
   ===================================================================== */

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
                var card = createProductCard(products[j]);
                var removeButton = card.querySelector(".btn-wishlist");
                if(removeButton){
                    removeButton.setAttribute("title", "Bỏ khỏi yêu thích");
                    removeButton.setAttribute("aria-label", "Bỏ " + products[j].name + " khỏi yêu thích");
                    removeButton.onclick = function(productId){
                        return function(event){
                            event.preventDefault();
                            event.stopPropagation();
                            removeWishlistProduct(productId);
                        };
                    }(products[j].id);
                }
                grid.appendChild(card);
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

function removeWishlistProduct(productId){
    var user = getCurrentUser();
    var wishlists = getObject("wishlists") || {};
    var ids = wishlists[user.id] || [];
    var updated = [];
    for(var i = 0; i < ids.length; i++){
        if(ids[i] != productId)
            updated.push(ids[i]);
    }
    wishlists[user.id] = updated;
    saveObject("wishlists", wishlists);
    updateWishCount();
    renderWishlist();
}
