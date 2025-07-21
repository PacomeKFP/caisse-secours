-- Insert sample data for testing
-- Run this after the initial database setup

-- Insert sample clients
INSERT INTO clients (matricule, nom, telephone, solde) VALUES
('CLI001', 'Jean Dupont', '+33123456789', 25000.00),
('CLI002', 'Marie Martin', '+33987654321', 18500.50),
('CLI003', 'Pierre Durand', '+33456789123', 32000.75),
('CLI004', 'Sophie Bernard', '+33789123456', 12000.00),
('CLI005', 'Michel Petit', '+33321654987', 45000.25);

-- Insert sample transactions (deposits and withdrawals)
-- Get client IDs for reference
WITH client_ids AS (
    SELECT id, matricule FROM clients WHERE matricule IN ('CLI001', 'CLI002', 'CLI003', 'CLI004', 'CLI005')
)
INSERT INTO transactions (montant, type, client_id, date_creation) 
SELECT 
    CASE 
        WHEN random() < 0.7 THEN (random() * 10000 + 1000)::decimal(15,2)  -- Deposits
        ELSE (random() * 2000 + 100)::decimal(15,2)   -- Withdrawals
    END,
    CASE 
        WHEN random() < 0.7 THEN 'DEPOT'::transaction_type
        ELSE 'RETRAIT'::transaction_type
    END,
    c.id,
    CURRENT_TIMESTAMP - (random() * interval '90 days')
FROM client_ids c
CROSS JOIN generate_series(1, 5);  -- 5 transactions per client

-- Update client balances based on transactions
UPDATE clients 
SET solde = (
    SELECT COALESCE(
        SUM(CASE 
            WHEN t.type = 'DEPOT' THEN t.montant 
            ELSE -t.montant 
        END), 0)
    FROM transactions t 
    WHERE t.client_id = clients.id
);
