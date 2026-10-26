/* =====================================================================
   ROOMCRAFT - services/cart.js (giỏ hàng)
   Người phụ trách: Phương Anh
   Dữ liệu: getObject("carts") = { user_id: [ {product_id, quantity} ] }
            khách chưa đăng nhập dùng khóa "guest" (header.js đang đếm theo cách này)
   Các hàm:
     getCartKey()                       khóa giỏ của người đang dùng ("guest" hoặc user_id)
     getCart()                          mảng [{product_id, quantity}] của giỏ hiện tại
     saveCart(items)                    lưu giỏ + cập nhật số trên icon giỏ hàng
     addToCart(productId, soLuong)      thêm vào giỏ, trả về "" nếu được, ngược lại là câu báo lỗi
     updateQuantity(productId, soLuong) đổi số lượng, trả về "" hoặc câu báo lỗi
     removeFromCart(productId), clearCart()
     cleanCart()                        bỏ sản phẩm không còn bán, hạ số lượng nếu vượt tồn kho
     getCartTotal()                     tạm tính (không tính món đã hết hàng)
     hasOutOfStockItem()                true nếu trong giỏ có món hết hàng
   Số lượng không vượt stock_quantity.
   ===================================================================== */

function getCartKey(){
    var session = getSession();
    if(session == null)
        return "guest";
    return session.user_id;
}

function getCart(){
    var carts = getObject("carts");
    var key = getCartKey();
    if(carts == null || carts[key] == null)
        return [];
    return carts[key];
}

function saveCart(items){
    var carts = getObject("carts");
    if(carts == null)
        carts = {};
    carts[getCartKey()] = items;
    saveObject("carts", carts);
    updateCartCount();          // cập nhật số trên icon giỏ hàng ở header
}

// Tìm vị trí của sản phẩm trong giỏ, không có trả về -1
function findCartIndex(items, productId){
    for(var i = 0; i < items.length; i++){
        if(items[i].product_id == productId)
            return i;
    }
    return -1;
}

function addToCart(productId, soLuong){
    var p = findById("products", productId);
    if(p == null || p.is_active == false)
        return "Sản phẩm không tồn tại!";
    if(p.stock_quantity <= 0)
        return "Sản phẩm đã hết hàng!";
    var items = getCart();
    var viTri = findCartIndex(items, productId);
    var daCo = 0;
    if(viTri >= 0)
        daCo = Number(items[viTri].quantity);
    if(daCo + soLuong > p.stock_quantity)
        return "Trong kho chỉ còn " + p.stock_quantity + " sản phẩm!";
    if(viTri >= 0)
        items[viTri].quantity = daCo + soLuong;
    else
        items.push({ product_id: productId, quantity: soLuong });
    saveCart(items);
    return "";
}

function updateQuantity(productId, soLuong){
    var p = findById("products", productId);
    if(p == null)
        return "Sản phẩm không tồn tại!";
    if(soLuong < 1)
        return "Số lượng tối thiểu là 1. Bấm Xóa nếu không muốn mua nữa!";
    if(soLuong > p.stock_quantity)
        return "Trong kho chỉ còn " + p.stock_quantity + " sản phẩm!";
    var items = getCart();
    var viTri = findCartIndex(items, productId);
    if(viTri < 0)
        return "Sản phẩm không có trong giỏ!";
    items[viTri].quantity = soLuong;
    saveCart(items);
    return "";
}

function removeFromCart(productId){
    var items = getCart();
    var moi = [];
    for(var i = 0; i < items.length; i++){
        if(items[i].product_id != productId)
            moi.push(items[i]);
    }
    saveCart(moi);
}

function clearCart(){
    saveCart([]);
}

// Dọn giỏ trước khi hiển thị: bỏ món đã bị xóa/ẩn, hạ số lượng nếu kho giảm
function cleanCart(){
    var items = getCart();
    var moi = [];
    for(var i = 0; i < items.length; i++){
        var p = findById("products", items[i].product_id);
        if(p == null || p.is_active == false)
            continue;
        if(p.stock_quantity > 0 && items[i].quantity > p.stock_quantity)
            items[i].quantity = p.stock_quantity;
        moi.push(items[i]);
    }
    saveCart(moi);
}

function getCartTotal(){
    var items = getCart();
    var tong = 0;
    for(var i = 0; i < items.length; i++){
        var p = findById("products", items[i].product_id);
        if(p != null && p.stock_quantity > 0)
            tong = tong + p.price * items[i].quantity;
    }
    return tong;
}

function hasOutOfStockItem(){
    var items = getCart();
    for(var i = 0; i < items.length; i++){
        var p = findById("products", items[i].product_id);
        if(p != null && p.stock_quantity <= 0)
            return true;
    }
    return false;
}
