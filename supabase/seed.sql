-- 1. Inserir Restaurante "Moendo" (Vinculado ao perfil existente)
INSERT INTO public.restaurants (
    id, name, slug, cuisine_type, image_url, description, 
    waiter_call_enabled, whatsapp_phone, whatsapp_enabled, whatsapp_custom_message,
    min_order_value, background_light, background_night, user_id,
    open, is_open_for_orders, online_payment, table_ordering, online_ordering_enabled,
    delivery_enabled, delivery_max_distance, delivery_base_fee, delivery_fee_per_km,
    address, latitude, longitude
) VALUES (
    'f63b27be-683a-4ef8-a0c5-59b3b85bc7df',
    'Moendo',
    'moendo',
    'Contemporânea',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    'Bem-vindo ao Moendo! Sabor, sofisticação e qualidade incomparável em cada detalhe.',
    true,
    '+5511999999999',
    true,
    'Olá! Gostaria de fazer um pedido no Moendo.',
    15.00,
    '#fcf8f2',
    '#1c1815',
    '550e8400-e29b-41d4-a716-446655440000',
    true,
    true,
    true,
    true,
    true,
    true,
    8.0,
    5.00,
    2.50,
    'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    -23.5616,
    -46.6560
) ON CONFLICT (id) DO NOTHING;

-- 3. Inserir Horários de Funcionamento (Segunda a Domingo)
INSERT INTO public.restaurant_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
VALUES 
    ('f63b27be-683a-4ef8-a0c5-59b3b85bc7df', 0, '11:30', '23:00', false), -- Domingo
    ('f63b27be-683a-4ef8-a0c5-59b3b85bc7df', 1, '11:30', '23:00', false), -- Segunda
    ('f63b27be-683a-4ef8-a0c5-59b3b85bc7df', 2, '11:30', '23:00', false), -- Terça
    ('f63b27be-683a-4ef8-a0c5-59b3b85bc7df', 3, '11:30', '23:00', false), -- Quarta
    ('f63b27be-683a-4ef8-a0c5-59b3b85bc7df', 4, '11:30', '23:30', false), -- Quinta
    ('f63b27be-683a-4ef8-a0c5-59b3b85bc7df', 5, '11:30', '00:00', false), -- Sexta
    ('f63b27be-683a-4ef8-a0c5-59b3b85bc7df', 6, '11:30', '00:00', false)  -- Sábado
ON CONFLICT (id) DO NOTHING;

-- 4. Inserir Categorias do Cardápio
INSERT INTO public.categories (id, name, image_url, restaurant_id, position)
VALUES 
    ('c201df34-2e63-455b-80a2-25de377038be', 'Entradas & Couvert', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=200', 'f63b27be-683a-4ef8-a0c5-59b3b85bc7df', 1),
    ('c202df34-2e63-455b-80a2-25de377038be', 'Pratos Principais', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=200', 'f63b27be-683a-4ef8-a0c5-59b3b85bc7df', 2),
    ('c203df34-2e63-455b-80a2-25de377038be', 'Sobremesas', 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=80&w=200', 'f63b27be-683a-4ef8-a0c5-59b3b85bc7df', 3),
    ('c204df34-2e63-455b-80a2-25de377038be', 'Bebidas & Drinks', 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=200', 'f63b27be-683a-4ef8-a0c5-59b3b85bc7df', 4)
ON CONFLICT (id) DO NOTHING;

-- 5. Inserir Pratos (Dishes)
INSERT INTO public.dishes (
    id, name, description, price, image_url, category_id, restaurant_id, 
    is_featured, is_available, tags, ingredients, allergens, portion
) VALUES 
    (
        'd101ef34-2e63-455b-80a2-25de377038be',
        'Couvert Artístico',
        'Cesta com pães artesanais de fermentação natural, patê de ervas finas, caponata de berinjela e manteiga temperada.',
        24.00,
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400',
        'c201df34-2e63-455b-80a2-25de377038be',
        'f63b27be-683a-4ef8-a0c5-59b3b85bc7df',
        true, true, ARRAY['entrada', 'artesanal'],
        'Farinha de trigo, água, sal, fermento biológico, berinjela, azeite, ervas finas, manteiga',
        'Contém Glúten, Contém Lactose',
        'Serve até 2 pessoas'
    ),
    (
        'd102ef34-2e63-455b-80a2-25de377038be',
        'Risoto Caprese',
        'Cremoso risoto de arroz arbóreo com tomate cereja confitado, mussarela de búfala fresca, finalizado com pesto de manjericão e raspas de limão siciliano.',
        52.00,
        'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&q=80&w=400',
        'c202df34-2e63-455b-80a2-25de377038be',
        'f63b27be-683a-4ef8-a0c5-59b3b85bc7df',
        true, true, ARRAY['popular', 'vegetariano'],
        'Arroz arbóreo, caldo de legumes, queijo parmesão, mussarela de búfala, tomate cereja confitado, manjericão, azeite de oliva, limão siciliano',
        'Contém Lactose, Sem Glúten',
        'Serve 1 pessoa (350g)'
    ),
    (
        'd103ef34-2e63-455b-80a2-25de377038be',
        'Aranccine de Paella (5 und)',
        'Deliciosos bolinhos fritos de arroz de paella recheados com camarão e lula picados, servidos com maionese caseira de açafrão.',
        48.00,
        'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=400',
        'c201df34-2e63-455b-80a2-25de377038be',
        'f63b27be-683a-4ef8-a0c5-59b3b85bc7df',
        true, true, ARRAY['popular', 'frutos-do-mar'],
        'Arroz, camarão, lula, mexilhões, farinha de trigo, ovos, panko, açafrão, temperos da casa',
        'Contém Glúten, Contém Frutos do Mar, Contém Ovos',
        'Porção de 5 unidades'
    ),
    (
        'd104ef34-2e63-455b-80a2-25de377038be',
        'Picanha na Brasa',
        'Corte nobre de picanha grelhada na churrasqueira, servida com arroz biro-biro, farofa rica de ovos e vinagrete clássico.',
        78.00,
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400',
        'c202df34-2e63-455b-80a2-25de377038be',
        'f63b27be-683a-4ef8-a0c5-59b3b85bc7df',
        false, true, ARRAY['churrasco', 'premium'],
        'Picanha, arroz, bacon, ovos, batata palha, cebola, tomate, pimentão, farinha de mandioca',
        'Contém Ovos, Contém Glúten (na farofa)',
        'Serve 1 pessoa (400g de carne)'
    ),
    (
        'd105ef34-2e63-455b-80a2-25de377038be',
        'Tiramisu da Casa',
        'Clássica sobremesa italiana montada em camadas de biscoito inglês embebido em café espresso e licor Amaretto, entremeadas por creme aveludado de queijo Mascarpone e cacau em pó.',
        22.00,
        'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=80&w=400',
        'c203df34-2e63-455b-80a2-25de377038be',
        'f63b27be-683a-4ef8-a0c5-59b3b85bc7df',
        true, true, ARRAY['sobremesa', 'italiana'],
        'Queijo mascarpone, creme de leite, ovos frescos, açúcar, biscoito champagne, café espresso, licor amaretto, cacau em pó puro',
        'Contém Lactose, Contém Glúten, Contém Ovos',
        'Serve 1 pessoa (150g)'
    ),
    (
        'd106ef34-2e63-455b-80a2-25de377038be',
        'Caipirinha de Limão',
        'Tradicional caipirinha brasileira preparada com cachaça envelhecida premium, limão taiti fresco macerado e açúcar orgânico.',
        18.00,
        'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=400',
        'c204df34-2e63-455b-80a2-25de377038be',
        'f63b27be-683a-4ef8-a0c5-59b3b85bc7df',
        false, true, ARRAY['happy-hour', 'drink'],
        'Cachaça envelhecida, limão taiti, açúcar, gelo moído',
        'Sem Alergênicos',
        'Copo de 300ml'
    )
ON CONFLICT (id) DO NOTHING;

-- 6. Inserir Mapeamento Prato <-> Categoria (dish_categories)
INSERT INTO public.dish_categories (dish_id, category_id, position)
VALUES 
    ('d101ef34-2e63-455b-80a2-25de377038be', 'c201df34-2e63-455b-80a2-25de377038be', 1),
    ('d102ef34-2e63-455b-80a2-25de377038be', 'c202df34-2e63-455b-80a2-25de377038be', 1),
    ('d103ef34-2e63-455b-80a2-25de377038be', 'c201df34-2e63-455b-80a2-25de377038be', 2),
    ('d104ef34-2e63-455b-80a2-25de377038be', 'c202df34-2e63-455b-80a2-25de377038be', 2),
    ('d105ef34-2e63-455b-80a2-25de377038be', 'c203df34-2e63-455b-80a2-25de377038be', 1),
    ('d106ef34-2e63-455b-80a2-25de377038be', 'c204df34-2e63-455b-80a2-25de377038be', 1)
ON CONFLICT (dish_id, category_id) DO NOTHING;

-- 7. Inserir Grupo de Complementos (ex: Acompanhamentos ou Adicionais de bebidas)
INSERT INTO public.complement_groups (id, title, description, required, max_selections, restaurant_id)
VALUES 
    (
        'a001df34-2e63-455b-80a2-25de377038be',
        'Opções de Destilado',
        'Selecione a base alcoólica da sua caipirinha',
        true,
        1,
        'f63b27be-683a-4ef8-a0c5-59b3b85bc7df'
    )
ON CONFLICT (id) DO NOTHING;

-- 8. Inserir Complementos
INSERT INTO public.complements (
    id, group_id, name, description, price, image_url, ingredients, position, is_active
) VALUES 
    (
        'b001df34-2e63-455b-80a2-25de377038be',
        'a001df34-2e63-455b-80a2-25de377038be',
        'Cachaça Premium (Tradicional)',
        'Cachaça nacional de alambique envelhecida em tonéis de carvalho.',
        0.00,
        '',
        'Cachaça premium',
        1,
        true
    ),
    (
        'b002df34-2e63-455b-80a2-25de377038be',
        'a001df34-2e63-455b-80a2-25de377038be',
        'Vodka Importada (Caipirovska)',
        'Substituição do destilado por vodka sueca importada.',
        4.00,
        '',
        'Vodka importada',
        2,
        true
    ),
    (
        'b003df34-2e63-455b-80a2-25de377038be',
        'a001df34-2e63-455b-80a2-25de377038be',
        'Sake Nacional (Caipisaquê)',
        'Substituição do destilado por saquê nacional leve.',
        2.00,
        '',
        'Saquê nacional',
        3,
        true
    )
ON CONFLICT (id) DO NOTHING;

-- 9. Inserir Relacionamento Prato <-> Grupo de Complementos (Caipirinha -> Destilados)
INSERT INTO public.dish_complement_groups (dish_id, complement_group_id, position)
VALUES 
    ('d106ef34-2e63-455b-80a2-25de377038be', 'a001df34-2e63-455b-80a2-25de377038be', 1)
ON CONFLICT (dish_id, complement_group_id) DO NOTHING;
