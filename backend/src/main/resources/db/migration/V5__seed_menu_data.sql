-- Insert Categories
INSERT INTO categories (name, icon, sort_order, active) VALUES
('Combos', '🍱', 1, true),
('Thali', '🥘', 2, true),
('Meals', '🍛', 3, true),
('Starter', '🧆', 4, true),
('Main Course', '🍲', 5, true),
('Bread', '🫓', 6, true),
('Rice', '🍚', 7, true),
('Snacks', '🍜', 8, true),
('Desserts', '🍮', 9, true)
ON CONFLICT (name) DO NOTHING;

-- Insert Menu Items
-- Combos
INSERT INTO menu_items (category_id, name, description, price_paise, image_url, is_veg, is_available, is_bestseller, sort_order)
VALUES
((SELECT id FROM categories WHERE name = 'Combos'), 'Matar Paneer with Ghee Roti', 'Rich matar paneer served with 4 soft ghee rotis.', 22900, '/assets/food/matar-paneer.png', true, true, true, 1),
((SELECT id FROM categories WHERE name = 'Combos'), 'Matar Paneer with Jeera Rice', 'Homestyle matar paneer with fragrant jeera rice.', 19900, '/assets/food/matar-paneer.png', true, true, false, 2),
((SELECT id FROM categories WHERE name = 'Combos'), 'Combo for 2', 'A comforting homestyle spread made to share.', 39900, '/assets/food/thali.png', true, true, false, 3),
((SELECT id FROM categories WHERE name = 'Combos'), 'Combo for 4', 'A generous family meal for four.', 74900, '/assets/food/thali.png', true, true, false, 4)
ON CONFLICT DO NOTHING;

-- Thali
INSERT INTO menu_items (category_id, name, description, price_paise, image_url, is_veg, is_available, is_bestseller, sort_order)
VALUES
((SELECT id FROM categories WHERE name = 'Thali'), 'Special Veg Thali', 'A complete vegetarian meal with variety of dishes.', 19900, '/assets/food/thali.png', true, true, true, 1),
((SELECT id FROM categories WHERE name = 'Thali'), 'Desi Thali', 'Simple, hearty and full of ghar ka swaad.', 16900, '/assets/food/thali.png', true, true, false, 2),
((SELECT id FROM categories WHERE name = 'Thali'), 'Deluxe Paneer Thali', 'A richer thali for paneer lovers.', 24900, '/assets/food/thali.png', true, true, false, 3)
ON CONFLICT DO NOTHING;

-- Meals
INSERT INTO menu_items (category_id, name, description, price_paise, image_url, is_veg, is_available, is_bestseller, sort_order)
VALUES
((SELECT id FROM categories WHERE name = 'Meals'), 'Fried Rice with Paneer Chilli', 'Perfect Indo-Chinese comfort combo.', 19900, '/assets/food/fried-rice-paneer.png', true, true, true, 1),
((SELECT id FROM categories WHERE name = 'Meals'), 'Rice with Kadhai Paneer', 'Fragrant rice with smoky, spicy paneer.', 18900, '/assets/food/matar-paneer.png', true, true, false, 2),
((SELECT id FROM categories WHERE name = 'Meals'), 'Shahi Paneer with 2 Paratha', 'Creamy shahi paneer with soft paratha.', 18900, '/assets/food/shahi-paneer.png', true, true, true, 3),
((SELECT id FROM categories WHERE name = 'Meals'), 'Paneer Bhurji with 2 Paratha', 'Spiced paneer bhurji with flaky paratha.', 17900, '/assets/food/shahi-paneer.png', true, true, false, 4),
((SELECT id FROM categories WHERE name = 'Meals'), 'Kadhi with Chawal', 'Comforting kadhi paired with steamed rice.', 14900, '/assets/food/thali.png', true, true, false, 5),
((SELECT id FROM categories WHERE name = 'Meals'), 'Aalu Bhujia with 2 Plain Paratha', 'Desi potato bhujia with warm paratha.', 13900, '/assets/food/shahi-paneer.png', true, true, false, 6),
((SELECT id FROM categories WHERE name = 'Meals'), 'Shahi Paneer with 4 Ghee Roti', 'Creamy paneer curry with ghee-brushed rotis.', 22900, '/assets/food/shahi-paneer.png', true, true, false, 7),
((SELECT id FROM categories WHERE name = 'Meals'), 'Poori with Sabji', 'Fluffy pooris with homestyle sabji.', 12900, '/assets/food/thali.png', true, true, false, 8)
ON CONFLICT DO NOTHING;

-- Starter
INSERT INTO menu_items (category_id, name, description, price_paise, image_url, is_veg, is_available, is_bestseller, sort_order)
VALUES
((SELECT id FROM categories WHERE name = 'Starter'), 'Paneer Chilli', 'Crispy paneer tossed in a spicy Indo-Chinese sauce.', 16900, '/assets/food/fried-rice-paneer.png', true, true, false, 1)
ON CONFLICT DO NOTHING;

-- Main Course
INSERT INTO menu_items (category_id, name, description, price_paise, image_url, is_veg, is_available, is_bestseller, sort_order)
VALUES
((SELECT id FROM categories WHERE name = 'Main Course'), 'Matar Paneer', 'Classic peas and paneer in a homestyle gravy.', 14900, '/assets/food/matar-paneer.png', true, true, false, 1),
((SELECT id FROM categories WHERE name = 'Main Course'), 'Shahi Paneer', 'Rich, creamy paneer curry with gentle spices.', 15900, '/assets/food/shahi-paneer.png', true, true, false, 2),
((SELECT id FROM categories WHERE name = 'Main Course'), 'Kadhai Paneer', 'Paneer with capsicum and aromatic kadhai masala.', 15900, '/assets/food/matar-paneer.png', true, true, false, 3),
((SELECT id FROM categories WHERE name = 'Main Course'), 'Dal Tadka', 'Yellow dal finished with a fragrant tadka.', 11900, '/assets/food/thali.png', true, true, false, 4),
((SELECT id FROM categories WHERE name = 'Main Course'), 'Paneer Chilli (MC)', 'Indo-Chinese paneer with peppers and onions.', 16900, '/assets/food/fried-rice-paneer.png', true, true, false, 5)
ON CONFLICT DO NOTHING;

-- Bread
INSERT INTO menu_items (category_id, name, description, price_paise, image_url, is_veg, is_available, is_bestseller, sort_order)
VALUES
((SELECT id FROM categories WHERE name = 'Bread'), 'Ghee Roti', 'Soft roti brushed with desi ghee.', 2000, '/assets/food/shahi-paneer.png', true, true, false, 1),
((SELECT id FROM categories WHERE name = 'Bread'), 'Plain Paratha', 'Crisp outside, soft inside.', 2500, '/assets/food/shahi-paneer.png', true, true, false, 2),
((SELECT id FROM categories WHERE name = 'Bread'), 'Sattu Paratha', 'Bihari favourite stuffed with seasoned sattu.', 4500, '/assets/food/shahi-paneer.png', true, true, false, 3),
((SELECT id FROM categories WHERE name = 'Bread'), 'Paneer Paratha', 'Paneer-stuffed paratha made fresh to order.', 6500, '/assets/food/shahi-paneer.png', true, true, false, 4),
((SELECT id FROM categories WHERE name = 'Bread'), 'Aloo Paratha', 'Classic potato-stuffed paratha.', 4500, '/assets/food/shahi-paneer.png', true, true, false, 5)
ON CONFLICT DO NOTHING;

-- Rice
INSERT INTO menu_items (category_id, name, description, price_paise, image_url, is_veg, is_available, is_bestseller, sort_order)
VALUES
((SELECT id FROM categories WHERE name = 'Rice'), 'Steamed Rice', 'Light and fluffy steamed rice.', 8900, '/assets/food/thali.png', true, true, false, 1),
((SELECT id FROM categories WHERE name = 'Rice'), 'Jeera Rice', 'Basmati rice tempered with cumin.', 9900, '/assets/food/thali.png', true, true, false, 2),
((SELECT id FROM categories WHERE name = 'Rice'), 'Veg Pulao', 'Fragrant rice cooked with seasonal vegetables.', 11900, '/assets/food/fried-rice-paneer.png', true, true, false, 3),
((SELECT id FROM categories WHERE name = 'Rice'), 'Basmati Rice', 'Aromatic long-grain basmati rice.', 9900, '/assets/food/thali.png', true, true, false, 4)
ON CONFLICT DO NOTHING;

-- Snacks
INSERT INTO menu_items (category_id, name, description, price_paise, image_url, is_veg, is_available, is_bestseller, sort_order)
VALUES
((SELECT id FROM categories WHERE name = 'Snacks'), 'Masala Maggie', 'Hot, spicy and comforting.', 6900, '/assets/food/cheese-maggie.png', true, true, false, 1),
((SELECT id FROM categories WHERE name = 'Snacks'), 'Cheese Maggie', 'Cheesy, delicious and comforting.', 9900, '/assets/food/cheese-maggie.png', true, true, true, 2),
((SELECT id FROM categories WHERE name = 'Snacks'), 'Desi Pasta', 'Indian-style masala pasta.', 9900, '/assets/food/fried-rice-paneer.png', true, true, false, 3),
((SELECT id FROM categories WHERE name = 'Snacks'), 'Masala Poha', 'Light, tasty and full of desi flavour.', 6900, '/assets/food/thali.png', true, true, false, 4)
ON CONFLICT DO NOTHING;

-- Desserts
INSERT INTO menu_items (category_id, name, description, price_paise, image_url, is_veg, is_available, is_bestseller, sort_order)
VALUES
((SELECT id FROM categories WHERE name = 'Desserts'), 'Shahi Kheer', 'Creamy rice pudding with a festive touch.', 8900, '/assets/food/thali.png', true, true, false, 1),
((SELECT id FROM categories WHERE name = 'Desserts'), 'Shahi Meethi Sewai', 'Sweet, creamy vermicelli dessert.', 8900, '/assets/food/thali.png', true, true, false, 2)
ON CONFLICT DO NOTHING;
