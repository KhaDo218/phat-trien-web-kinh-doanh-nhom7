-- ============================================================
-- ROOMCRAFT – SCRIPT TẠO CƠ SỞ DỮ LIỆU (MySQL 8.0.16 trở lên)
-- Nhóm 7 – Phát triển Web Kinh Doanh
--
-- Ghi chú:
--   - Đây là thiết kế CSDL ở Chương 3 (mục 3.4). Khi chạy web, dữ liệu
--     được lưu bằng JSON và localStorage theo đúng cấu trúc các bảng này.
--   - Giá tiền tính bằng VND nên dùng DECIMAL(15,0) (không có phần lẻ).
--   - Bảng được tạo theo thứ tự phụ thuộc khóa ngoại: bảng cha trước,
--     bảng con sau.
--   - Không đặt CHECK lên cột khóa ngoại (MySQL không cho phép CHECK trên
--     cột có ON UPDATE CASCADE).
--   - Chạy lại từ đầu: bỏ dấu "--" ở dòng DROP DATABASE bên dưới.
-- ============================================================

-- DROP DATABASE IF EXISTS doanweb_db;

CREATE DATABASE IF NOT EXISTS doanweb_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE doanweb_db;


-- ============================================================
-- 1. NHÓM TÀI KHOẢN
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
  id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name  VARCHAR(50)  NOT NULL,

  CONSTRAINT pk_roles PRIMARY KEY (id),
  CONSTRAINT uq_roles_name UNIQUE (name),
  CONSTRAINT chk_roles_name CHECK (name IN ('User', 'Admin'))
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS users (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_id          INT UNSIGNED NOT NULL,
  full_name        VARCHAR(255) NULL,
  email            VARCHAR(255) NOT NULL,
  phone            VARCHAR(20)  NULL,
  password_hash    VARCHAR(255) NULL,      -- NULL với tài khoản chỉ đăng nhập bằng Google
  google_id        VARCHAR(255) NULL,      -- mã định danh (sub) do Google Identity Services trả về
  avatar_url       VARCHAR(500) NULL,
  default_address  TEXT         NULL,
  is_verified      BOOLEAN      NOT NULL DEFAULT FALSE,  -- đã xác minh OTP (mô phỏng)
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,   -- FALSE = bị Admin khóa
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_users PRIMARY KEY (id),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT uq_users_phone UNIQUE (phone),
  CONSTRAINT uq_users_google_id UNIQUE (google_id),
  CONSTRAINT chk_users_login CHECK (
    password_hash IS NOT NULL OR google_id IS NOT NULL
  ),

  CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;


-- Mã OTP đăng ký và link đặt lại mật khẩu (mô phỏng, không gửi email thật).
-- Lưu theo email vì lúc đăng ký tài khoản chưa tồn tại.
CREATE TABLE IF NOT EXISTS verification_codes (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email       VARCHAR(255) NOT NULL,
  code        VARCHAR(64)  NOT NULL,      -- 6 số OTP hoặc token của link đặt lại
  purpose     VARCHAR(20)  NOT NULL,
  expires_at  DATETIME     NOT NULL,
  is_used     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_verification_codes PRIMARY KEY (id),
  CONSTRAINT chk_verification_codes_purpose CHECK (
    purpose IN ('REGISTER', 'RESET_PASSWORD')
  ),
  INDEX idx_verification_codes_email (email)
) ENGINE=InnoDB;


-- ============================================================
-- 2. NHÓM CATALOG
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_id  INT UNSIGNED NULL,           -- NULL = danh mục cha; có giá trị = danh mục con
  name       VARCHAR(100) NOT NULL,

  CONSTRAINT pk_categories PRIMARY KEY (id),
  CONSTRAINT uq_categories_name UNIQUE (name),

  CONSTRAINT fk_categories_parent
    FOREIGN KEY (parent_id) REFERENCES categories(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS styles (
  id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name  VARCHAR(100) NOT NULL,

  CONSTRAINT pk_styles PRIMARY KEY (id),
  CONSTRAINT uq_styles_name UNIQUE (name)
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS products (
  id              VARCHAR(100)  NOT NULL,
  category_id     INT UNSIGNED  NOT NULL,   -- danh mục con của sản phẩm
  style_id        INT UNSIGNED  NOT NULL,   -- phong cách chính
  name            VARCHAR(255)  NOT NULL,
  brand           VARCHAR(100)  NULL,
  price           DECIMAL(15,0) NOT NULL,   -- giá bán (VND)
  original_price  DECIMAL(15,0) NULL,       -- giá gốc trước giảm (VND)
  dimensions      VARCHAR(255)  NULL,
  material        VARCHAR(255)  NULL,
  color           VARCHAR(100)  NULL,
  description     TEXT          NULL,
  model_3d_url    VARCHAR(500)  NULL,       -- đường dẫn file .glb, NULL nếu không có 3D
  stock_quantity  INT UNSIGNED  NOT NULL DEFAULT 0,
  product_type    VARCHAR(10)   NOT NULL DEFAULT 'NEW',
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,  -- FALSE = Admin ẩn sản phẩm
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_products PRIMARY KEY (id),
  CONSTRAINT chk_products_price CHECK (price >= 0),
  CONSTRAINT chk_products_original_price CHECK (
    original_price IS NULL OR original_price >= price
  ),
  CONSTRAINT chk_products_type CHECK (product_type IN ('NEW', 'USED')),

  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_products_style
    FOREIGN KEY (style_id) REFERENCES styles(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  INDEX idx_products_type (product_type)
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS product_images (
  product_id  VARCHAR(100)     NOT NULL,
  image_url   VARCHAR(500)     NOT NULL,
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 1,   -- 1 = ảnh đại diện

  CONSTRAINT pk_product_images PRIMARY KEY (product_id, image_url),

  CONSTRAINT fk_product_images_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;


-- Thông tin riêng của đồ cũ (Marketplace do Admin đăng).
-- Quan hệ 1–1 với products (chỉ sản phẩm có product_type = 'USED').
CREATE TABLE IF NOT EXISTS used_product_details (
  product_id       VARCHAR(100) NOT NULL,
  condition_grade  VARCHAR(20)  NOT NULL,
  usage_time       VARCHAR(50)  NULL,       -- ví dụ: '6 tháng', '2 năm'
  condition_note   TEXT         NULL,

  CONSTRAINT pk_used_product_details PRIMARY KEY (product_id),
  CONSTRAINT chk_used_product_details_condition CHECK (
    condition_grade IN ('Like New', 'Good', 'Fair')
  ),

  CONSTRAINT fk_used_product_details_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;


-- ============================================================
-- 3. NHÓM TRẢI NGHIỆM PHÒNG (SHOP THE ROOM)
-- ============================================================

CREATE TABLE IF NOT EXISTS rooms (
  id           VARCHAR(100) NOT NULL,
  style_id     INT UNSIGNED NOT NULL,
  name         VARCHAR(255) NOT NULL,
  image_url    VARCHAR(500) NOT NULL,
  description  TEXT         NULL,

  CONSTRAINT pk_rooms PRIMARY KEY (id),

  CONSTRAINT fk_rooms_style
    FOREIGN KEY (style_id) REFERENCES styles(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS room_hotspots (
  room_id     VARCHAR(100) NOT NULL,
  image_url   VARCHAR(500) NOT NULL,   -- góc chụp (ảnh của phòng) mà điểm được gắn lên
  product_id  VARCHAR(100) NOT NULL,
  position_x  FLOAT        NOT NULL,   -- % theo chiều ngang ảnh phòng
  position_y  FLOAT        NOT NULL,   -- % theo chiều dọc ảnh phòng

  CONSTRAINT pk_room_hotspots PRIMARY KEY (room_id, image_url, product_id),
  CONSTRAINT chk_room_hotspots_x CHECK (position_x >= 0 AND position_x <= 100),
  CONSTRAINT chk_room_hotspots_y CHECK (position_y >= 0 AND position_y <= 100),

  CONSTRAINT fk_room_hotspots_room
    FOREIGN KEY (room_id) REFERENCES rooms(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_room_hotspots_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;


-- ============================================================
-- 4. NHÓM TƯƠNG TÁC: WISHLIST, ĐÁNH GIÁ, GIỎ HÀNG
-- ============================================================

CREATE TABLE IF NOT EXISTS wishlists (
  user_id     INT UNSIGNED NOT NULL,
  product_id  VARCHAR(100) NOT NULL,

  CONSTRAINT pk_wishlists PRIMARY KEY (user_id, product_id),

  CONSTRAINT fk_wishlists_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_wishlists_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS reviews (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id           INT UNSIGNED NOT NULL,
  product_id        VARCHAR(100) NOT NULL,
  rating            TINYINT      NOT NULL,
  comment           TEXT         NULL,
  review_image_url  VARCHAR(500) NULL,
  is_hidden         BOOLEAN      NOT NULL DEFAULT FALSE,   -- TRUE = Admin ẩn
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_reviews PRIMARY KEY (id),
  CONSTRAINT uq_reviews_user_product UNIQUE (user_id, product_id),
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),

  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_reviews_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS carts (
  id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id  INT UNSIGNED NOT NULL,

  CONSTRAINT pk_carts PRIMARY KEY (id),
  CONSTRAINT uq_carts_user UNIQUE (user_id),

  CONSTRAINT fk_carts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS cart_items (
  cart_id     INT UNSIGNED NOT NULL,
  product_id  VARCHAR(100) NOT NULL,
  quantity    INT UNSIGNED NOT NULL,

  CONSTRAINT pk_cart_items PRIMARY KEY (cart_id, product_id),
  CONSTRAINT chk_cart_items_quantity CHECK (quantity > 0),

  CONSTRAINT fk_cart_items_cart
    FOREIGN KEY (cart_id) REFERENCES carts(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_cart_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;


-- ============================================================
-- 5. NHÓM ĐẶT HÀNG
-- ============================================================

CREATE TABLE IF NOT EXISTS shipping_methods (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name            VARCHAR(100)  NOT NULL,
  fee             DECIMAL(15,0) NOT NULL,
  estimated_time  VARCHAR(50)   NULL,      -- ví dụ: '3–5 ngày'
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,

  CONSTRAINT pk_shipping_methods PRIMARY KEY (id),
  CONSTRAINT uq_shipping_methods_name UNIQUE (name),
  CONSTRAINT chk_shipping_methods_fee CHECK (fee >= 0)
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS coupons (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  code             VARCHAR(50)   NOT NULL,
  discount_type    VARCHAR(10)   NOT NULL,   -- PERCENT: giảm %, FIXED: giảm số tiền
  discount_value   DECIMAL(15,0) NOT NULL,
  min_order_value  DECIMAL(15,0) NOT NULL DEFAULT 0,
  expires_at       DATETIME      NULL,       -- NULL = không hết hạn
  is_active        BOOLEAN       NOT NULL DEFAULT TRUE,

  CONSTRAINT pk_coupons PRIMARY KEY (id),
  CONSTRAINT uq_coupons_code UNIQUE (code),
  CONSTRAINT chk_coupons_type CHECK (discount_type IN ('PERCENT', 'FIXED')),
  CONSTRAINT chk_coupons_value CHECK (
    discount_value > 0
    AND (discount_type <> 'PERCENT' OR discount_value <= 100)
  ),
  CONSTRAINT chk_coupons_min_order CHECK (min_order_value >= 0)
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS orders (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id             INT UNSIGNED  NOT NULL,
  shipping_method_id  INT UNSIGNED  NOT NULL,
  coupon_id           INT UNSIGNED  NULL,
  shipping_name       VARCHAR(255)  NOT NULL,
  shipping_phone      VARCHAR(20)   NOT NULL,
  shipping_address    TEXT          NOT NULL,
  payment_method      VARCHAR(20)   NOT NULL,
  status              VARCHAR(20)   NOT NULL DEFAULT 'Confirmed',
  subtotal            DECIMAL(15,0) NOT NULL,             -- tổng tiền hàng
  shipping_fee        DECIMAL(15,0) NOT NULL DEFAULT 0,
  discount_amount     DECIMAL(15,0) NOT NULL DEFAULT 0,
  total_amount        DECIMAL(15,0) NOT NULL,             -- subtotal + shipping_fee - discount_amount
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT pk_orders PRIMARY KEY (id),
  CONSTRAINT chk_orders_payment_method CHECK (
    payment_method IN ('COD', 'Bank Transfer', 'E-wallet')
  ),
  CONSTRAINT chk_orders_status CHECK (
    status IN ('Confirmed', 'Packing', 'Shipping', 'Delivered', 'Cancelled')
  ),
  CONSTRAINT chk_orders_amounts CHECK (
    subtotal >= 0
    AND shipping_fee >= 0
    AND discount_amount >= 0
    AND total_amount = subtotal + shipping_fee - discount_amount
    AND total_amount >= 0
  ),

  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orders_shipping_method
    FOREIGN KEY (shipping_method_id) REFERENCES shipping_methods(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orders_coupon
    FOREIGN KEY (coupon_id) REFERENCES coupons(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  INDEX idx_orders_status (status),
  INDEX idx_orders_created_at (created_at)
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS order_details (
  order_id    INT UNSIGNED  NOT NULL,
  product_id  VARCHAR(100)  NOT NULL,
  quantity    INT UNSIGNED  NOT NULL,
  unit_price  DECIMAL(15,0) NOT NULL,   -- giá tại thời điểm đặt hàng

  CONSTRAINT pk_order_details PRIMARY KEY (order_id, product_id),
  CONSTRAINT chk_order_details_quantity CHECK (quantity > 0),
  CONSTRAINT chk_order_details_price CHECK (unit_price >= 0),

  CONSTRAINT fk_order_details_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_order_details_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;


-- ============================================================
-- 6. NHÓM CHATBOT (chỉ dùng khi chatbot trả lời bằng bộ câu hỏi
--    cấu hình sẵn; nếu dùng API thì có thể bỏ bảng này)
-- ============================================================

CREATE TABLE IF NOT EXISTS chatbot_faqs (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  topic      VARCHAR(20)  NOT NULL,
  keywords   VARCHAR(255) NOT NULL,   -- các từ khóa, cách nhau bằng dấu phẩy
  answer     TEXT         NOT NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,

  CONSTRAINT pk_chatbot_faqs PRIMARY KEY (id),
  CONSTRAINT chk_chatbot_faqs_topic CHECK (
    topic IN ('PRODUCT', 'STYLE', 'POLICY', 'SHIPPING', 'RETURN')
  )
) ENGINE=InnoDB;


-- ============================================================
-- 7. DỮ LIỆU KHỞI TẠO CỐ ĐỊNH
-- ============================================================

INSERT IGNORE INTO roles (name) VALUES ('User'), ('Admin');

INSERT IGNORE INTO styles (name) VALUES
  ('Bohemian'),
  ('Coastal'),
  ('Farmhouse'),
  ('Glam'),
  ('Mid-century Modern'),
  ('Scandinavian'),
  ('Traditional');

-- Tài khoản Admin được tạo sẵn (không đăng ký qua web).
-- Thay chuỗi '<hash>' bằng mật khẩu đã băm trước khi chạy.
-- INSERT INTO users (role_id, full_name, email, password_hash, is_verified)
-- VALUES ((SELECT id FROM roles WHERE name = 'Admin'),
--         'Quản trị viên', 'admin@roomcraft.vn', '<hash>', TRUE);


-- ============================================================
-- KIỂM TRA SAU KHI CHẠY (kết quả mong đợi: 19 bảng)
-- ============================================================


