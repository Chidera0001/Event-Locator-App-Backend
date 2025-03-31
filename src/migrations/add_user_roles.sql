ALTER TABLE users
ADD COLUMN role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')); 