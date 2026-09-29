CREATE TABLE IF NOT EXISTS payments (
    id                   BIGSERIAL PRIMARY KEY,
    order_id             BIGINT       NOT NULL REFERENCES orders(id) UNIQUE,
    razorpay_order_id    VARCHAR(100) UNIQUE,
    razorpay_payment_id  VARCHAR(100),
    razorpay_signature   VARCHAR(255),
    amount_paise         BIGINT       NOT NULL,
    currency             VARCHAR(10)  NOT NULL DEFAULT 'INR',
    status               VARCHAR(30)  NOT NULL DEFAULT 'CREATED',
    method               VARCHAR(20),
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_razorpay_order ON payments(razorpay_order_id);
