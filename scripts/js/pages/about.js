/* =====================================================================
   ROOMCRAFT - Trang Về RoomCraft (about.html)
   Dữ liệu: rc_rooms, rc_styles, rc_products (chỉ để đếm số liệu)
   ===================================================================== */

// Gọi sau khi loadData() nạp xong dữ liệu
function initPage(){
    renderHeader("gioi-thieu");
    renderFooter();
    renderChatbot();
    showAboutFigures();
    initAboutPanels();
    initAboutReveal();
}

// Số liệu trong khối lời hứa
function showAboutFigures(){
    var products = getTable("products");
    var soSanPham = 0;
    for(var i = 0; i < products.length; i++)
        if(products[i].is_active != false && products[i].product_type != "USED")
            soSanPham++;
    document.getElementById("abRooms").innerHTML = getTable("rooms").length;
    document.getElementById("abStyles").innerHTML = getTable("styles").length;
    document.getElementById("abProducts").innerHTML = soSanPham + "+";
}

// Bốn tấm ảnh: tấm đang rê chuột / chạm / focus thì mở rộng và hiện câu mô tả
function initAboutPanels(){
    var panels = document.querySelectorAll("#abPanels > li");
    function chon(li){
        for(var i = 0; i < panels.length; i++)
            panels[i].classList.toggle("active", panels[i] == li);
    }
    for(var i = 0; i < panels.length; i++){
        panels[i].addEventListener("mouseenter", function(){ chon(this); });
        panels[i].addEventListener("focus", function(){ chon(this); });
        panels[i].addEventListener("click", function(){ chon(this); });
    }
}

// Hiện dần khi cuộn tới
function initAboutReveal(){
    var items = document.querySelectorAll(".ab-hero-copy > *, .ab-hero-visual, .ab-process-head, .ab-panels, .ab-promise-inner > *");
    for(var i = 0; i < items.length; i++){
        items[i].classList.add("ab-reveal");
        items[i].style.transitionDelay = (i % 4) * 90 + "ms";
    }
    if(!("IntersectionObserver" in window)){
        for(var j = 0; j < items.length; j++)
            items[j].classList.add("is-visible");
        return;
    }
    var obs = new IntersectionObserver(function(entries){
        for(var k = 0; k < entries.length; k++)
            if(entries[k].isIntersecting){
                entries[k].target.classList.add("is-visible");
                obs.unobserve(entries[k].target);
            }
    }, { threshold: 0.15 });
    for(var n = 0; n < items.length; n++)
        obs.observe(items[n]);
}
