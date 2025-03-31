ALTER TABLE events
ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')); 