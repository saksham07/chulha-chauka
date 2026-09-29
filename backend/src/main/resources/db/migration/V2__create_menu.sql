CREATE TABLE IF NOT EXISTS categories (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(80)  NOT NULL UNIQUE,
    icon       VARCHAR(20),
    sort_order INT          NOT NULL DEFAULT 0,
    active     BOOLEAN      NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS menu_items (
    id            BIGSERIAL PRIMARY KEY,
    category_id   BIGINT      NOT NULL REFERENCES categories(id),
    name          VARCHAR(200) NOT NULL,
    description   TEXT,
    price_paise   BIGINT      NOT NULL,
    image_url     TEXT,
    is_veg        BOOLEAN     NOT NULL DEFAULT true,
    is_available  BOOLEAN     NOT NULL DEFAULT true,
    is_bestseller BOOLEAN     NOT NULL DEFAULT false,
    sort_order    INT         NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);

CREATE TABLE IF NOT EXISTS delivery_config (
    id                  BIGSERIAL PRIMARY KEY,
    delivery_fee_paise  BIGINT NOT NULL DEFAULT 3000,
    min_order_paise     BIGINT NOT NULL DEFAULT 0,
    estimated_minutes   INT    NOT NULL DEFAULT 40
);

INSERT INTO delivery_config (delivery_fee_paise, min_order_paise, estimated_minutes)
VALUES (3000, 0, 40)
ON CONFLICT DO NOTHING;
