CREATE TABLE IF NOT EXISTS addresses (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(120),
    phone      VARCHAR(15),
    line1      TEXT         NOT NULL,
    pincode    VARCHAR(10)  NOT NULL,
    is_default BOOLEAN      NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS carts (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_items (
    id             BIGSERIAL PRIMARY KEY,
    cart_id        BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    menu_item_id   BIGINT NOT NULL REFERENCES menu_items(id),
    quantity       INT    NOT NULL DEFAULT 1,
    UNIQUE (cart_id, menu_item_id)
);

CREATE TABLE IF NOT EXISTS orders (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT      REFERENCES users(id),
    address_snapshot    JSONB       NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    subtotal_paise      BIGINT      NOT NULL,
    delivery_fee_paise  BIGINT      NOT NULL,
    total_paise         BIGINT      NOT NULL,
    payment_method      VARCHAR(20),
    special_note        TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id    BIGINT       REFERENCES menu_items(id),
    name_snapshot   VARCHAR(200) NOT NULL,
    price_snapshot  BIGINT       NOT NULL,
    quantity        INT          NOT NULL
);
