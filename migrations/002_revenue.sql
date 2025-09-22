-- Revenue Tracking and Analytics
-- This schema tracks subscriptions, purchases, and revenue analytics

-- Users table for customer management
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Videos table for content management
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  thumbnail TEXT,
  duration INTEGER, -- in seconds
  price_cents INTEGER DEFAULT 0, -- pay-per-view price in cents
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscription plans and tracking
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  processor VARCHAR(50) NOT NULL, -- 'stripe', 'epoch', 'ccbill'
  processor_id VARCHAR(255) NOT NULL UNIQUE,
  plan_type VARCHAR(50) NOT NULL, -- 'monthly', 'yearly', 'lifetime'
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'unpaid'
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  canceled_at TIMESTAMP NULL,
  trial_start TIMESTAMP NULL,
  trial_end TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Individual video purchases (pay-per-view)
CREATE TABLE purchases (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  processor VARCHAR(50) NOT NULL,
  processor_id VARCHAR(255) NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL, -- 'succeeded', 'failed', 'refunded', 'disputed'
  refunded_at TIMESTAMP NULL,
  refund_amount_cents INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payment processor webhooks log
CREATE TABLE webhook_logs (
  id SERIAL PRIMARY KEY,
  processor VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  webhook_id VARCHAR(255),
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Revenue analytics views
CREATE VIEW daily_revenue AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as transaction_count,
  SUM(amount_cents) as total_cents,
  AVG(amount_cents) as average_cents,
  processor
FROM (
  SELECT created_at, amount_cents, processor FROM subscriptions WHERE status = 'active'
  UNION ALL
  SELECT created_at, amount_cents, processor FROM purchases WHERE status = 'succeeded'
) revenue_sources
GROUP BY DATE(created_at), processor
ORDER BY date DESC;

-- Monthly recurring revenue view
CREATE VIEW monthly_recurring_revenue AS
SELECT 
  DATE_TRUNC('month', current_period_start) as month,
  COUNT(*) as active_subscriptions,
  SUM(CASE WHEN plan_type = 'monthly' THEN amount_cents ELSE 0 END) as monthly_revenue_cents,
  SUM(CASE WHEN plan_type = 'yearly' THEN amount_cents/12 ELSE 0 END) as yearly_normalized_monthly_cents,
  processor
FROM subscriptions 
WHERE status = 'active'
GROUP BY DATE_TRUNC('month', current_period_start), processor
ORDER BY month DESC;

-- Top selling videos view
CREATE VIEW top_videos AS
SELECT 
  v.id,
  v.title,
  COUNT(p.id) as purchase_count,
  SUM(p.amount_cents) as total_revenue_cents,
  AVG(p.amount_cents) as average_price_cents
FROM videos v
LEFT JOIN purchases p ON v.id = p.video_id AND p.status = 'succeeded'
GROUP BY v.id, v.title
ORDER BY total_revenue_cents DESC NULLS LAST;

-- Customer lifetime value view
CREATE VIEW customer_lifetime_value AS
SELECT 
  u.id as user_id,
  u.email,
  COALESCE(SUM(s.amount_cents), 0) + COALESCE(SUM(p.amount_cents), 0) as total_spent_cents,
  COUNT(DISTINCT s.id) as subscription_count,
  COUNT(DISTINCT p.id) as purchase_count,
  u.created_at as customer_since
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
LEFT JOIN purchases p ON u.id = p.user_id AND p.status = 'succeeded'
GROUP BY u.id, u.email, u.created_at
ORDER BY total_spent_cents DESC;

-- Indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_processor_id ON subscriptions(processor_id);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_video_id ON purchases(video_id);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_webhook_logs_processor ON webhook_logs(processor, processed);

-- Triggers for updated_at
CREATE TRIGGER update_subscriptions_updated_at 
BEFORE UPDATE ON subscriptions 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to calculate churn rate
CREATE OR REPLACE FUNCTION calculate_churn_rate(months_back INTEGER DEFAULT 1)
RETURNS DECIMAL AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  churned_customers INTEGER;
  total_customers INTEGER;
BEGIN
  end_date := DATE_TRUNC('month', CURRENT_DATE);
  start_date := end_date - INTERVAL '1 month' * months_back;
  
  -- Count customers who canceled in the period
  SELECT COUNT(*) INTO churned_customers
  FROM subscriptions
  WHERE canceled_at >= start_date AND canceled_at < end_date;
  
  -- Count total active customers at start of period
  SELECT COUNT(*) INTO total_customers
  FROM subscriptions
  WHERE current_period_start <= start_date AND 
        (canceled_at IS NULL OR canceled_at > start_date);
  
  IF total_customers = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((churned_customers::DECIMAL / total_customers) * 100, 2);
END;
$$ LANGUAGE plpgsql;