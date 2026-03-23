-- ============================================================
-- Seed Stripe Prices
-- Created: 2026-03-22
-- ============================================================

-- Insert the 3 pricing plans with actual Stripe Price IDs
INSERT INTO prices (stripe_price_id, stripe_product_id, product_name, unit_amount, currency, interval, interval_count, active)
VALUES
  -- Mensal: R$ 15,00/mês
  ('price_1TC6PBFz7A1qFfrQxpfZJMdU', 'prod_organiza_ai', 'Organiza.AI Mensal', 1500, 'brl', 'month', 1, true),

  -- Trimestral: R$ 30,00/trimestre (3 meses)
  ('price_1TC6PBFz7A1qFfrQtSPzk26x', 'prod_organiza_ai', 'Organiza.AI Trimestral', 3000, 'brl', 'month', 3, true),

  -- Anual: R$ 100,00/ano
  ('price_1TC6PBFz7A1qFfrQ8Na74XcQ', 'prod_organiza_ai', 'Organiza.AI Anual', 10000, 'brl', 'year', 1, true)
ON CONFLICT (stripe_price_id) DO UPDATE
SET
  unit_amount = EXCLUDED.unit_amount,
  active = EXCLUDED.active,
  updated_at = NOW();

-- Verify the insert
SELECT stripe_price_id, product_name, unit_amount, interval, interval_count, active
FROM prices
ORDER BY unit_amount ASC;
