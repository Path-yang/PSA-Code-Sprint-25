-- SQLite schema for ticketing system
-- Works identically on local dev and Vercel deployment

CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number TEXT UNIQUE NOT NULL, -- 7-digit ticket number (0000001, 0000002, etc.)
    alert_text TEXT NOT NULL,
    diagnosis_data TEXT NOT NULL,  -- JSON string
    edited_diagnosis TEXT,          -- JSON string for user edits
    status TEXT DEFAULT 'active',   -- 'active', 'closed', or 'deleted'
    notes TEXT,
    custom_fields TEXT DEFAULT '{}', -- JSON string for custom key-value pairs
    deletion_reason TEXT,           -- Reason for deletion (soft delete)
    deleted_at TEXT,                -- When ticket was soft deleted
    created_at TEXT DEFAULT (datetime('now')),
    closed_at TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);

