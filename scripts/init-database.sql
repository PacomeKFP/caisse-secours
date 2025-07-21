-- Create database tables and initial setup
-- This script should be run after setting up your PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for transaction types
CREATE TYPE transaction_type AS ENUM ('DEPOT', 'RETRAIT');

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    matricule TEXT UNIQUE NOT NULL,
    nom TEXT NOT NULL,
    telephone TEXT NOT NULL,
    solde DECIMAL(15,2) DEFAULT 0,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    montant DECIMAL(15,2) NOT NULL,
    type transaction_type NOT NULL,
    raison TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE
);

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    montant_total DECIMAL(15,2) NOT NULL,
    montant_commission DECIMAL(15,2) NOT NULL,
    label TEXT NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
    annee INTEGER NOT NULL CHECK (annee >= 2020),
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    UNIQUE(client_id, mois, annee)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date_creation ON transactions(date_creation);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_commissions_mois_annee ON commissions(mois, annee);
CREATE INDEX IF NOT EXISTS idx_commissions_client_id ON commissions(client_id);

-- Create trigger to update modification dates
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_modtime BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_transactions_modtime BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_commissions_modtime BEFORE UPDATE ON commissions FOR EACH ROW EXECUTE FUNCTION update_modified_column();
