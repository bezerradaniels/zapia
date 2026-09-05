-- Migração: Subsistema de Opções e Variantes Multi-Eixo para Produtos
-- Criação de tabelas relacionais com isolamento multi-tenant (store_id) e constraints.

-- 1. Eixos de Opções (ex: Cor, Tamanho, Material)
CREATE TABLE IF NOT EXISTS product_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_option_name UNIQUE (store_id, product_id, name)
);

CREATE INDEX IF NOT EXISTS idx_product_options_lookup ON product_options (store_id, product_id, position);

-- 2. Valores das Opções (ex: Preto, Branco, P, M, G)
CREATE TABLE IF NOT EXISTS product_option_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_option_id UUID NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
    value VARCHAR(100) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    color_hex VARCHAR(7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_option_value UNIQUE (product_option_id, value)
);

CREATE INDEX IF NOT EXISTS idx_product_option_values_lookup ON product_option_values (product_option_id, position);

-- 3. Variantes Compráveis (Unidades Físicas / Combinações)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100),
    price_in_cents INT NOT NULL CHECK (price_in_cents >= 0),
    promo_price_in_cents INT CHECK (promo_price_in_cents IS NULL OR promo_price_in_cents < price_in_cents),
    cost_in_cents INT CHECK (cost_in_cents IS NULL OR cost_in_cents >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    reserved_stock INT NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0 AND reserved_stock <= stock),
    weight_grams INT DEFAULT 0,
    width_cm INT DEFAULT 0,
    height_cm INT DEFAULT 0,
    depth_cm INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    combination_hash VARCHAR(64) NOT NULL,
    archived_at TIMESTAMPTZ,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_variant_combination UNIQUE (store_id, product_id, combination_hash)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_store_variant_sku 
ON product_variants (store_id, sku) 
WHERE sku IS NOT NULL AND archived_at IS NULL;

-- 4. Associação de Variante com Valores de Opções
CREATE TABLE IF NOT EXISTS product_variant_values (
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    option_value_id UUID NOT NULL REFERENCES product_option_values(id) ON DELETE RESTRICT,
    PRIMARY KEY (variant_id, option_value_id)
);

CREATE INDEX IF NOT EXISTS idx_variant_values_val ON product_variant_values (option_value_id, variant_id);

-- 5. Row Level Security (RLS)
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_values ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública para Vitrine
CREATE POLICY "Public read product_options" ON product_options
    FOR SELECT USING (true);

CREATE POLICY "Public read product_option_values" ON product_option_values
    FOR SELECT USING (true);

CREATE POLICY "Public read product_variants" ON product_variants
    FOR SELECT USING (is_active = true AND archived_at IS NULL);

CREATE POLICY "Public read product_variant_values" ON product_variant_values
    FOR SELECT USING (true);

-- Políticas de Escrita para Membros da Loja
CREATE POLICY "Store members manage product_options" ON product_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM store_members
            WHERE store_members.store_id = product_options.store_id
            AND store_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Store members manage product_option_values" ON product_option_values
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM store_members
            WHERE store_members.store_id = product_option_values.store_id
            AND store_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Store members manage product_variants" ON product_variants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM store_members
            WHERE store_members.store_id = product_variants.store_id
            AND store_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Store members manage product_variant_values" ON product_variant_values
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM product_variants
            JOIN store_members ON store_members.store_id = product_variants.store_id
            WHERE product_variants.id = product_variant_values.variant_id
            AND store_members.user_id = auth.uid()
        )
    );
