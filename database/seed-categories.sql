-- ============================================================================
-- SEED CATEGORIES DATA
-- ============================================================================
-- 
-- This file contains sample data for the categories table.
-- Categories are used to organize statistics and measures.
--
-- Usage: Run this after creating the database schema
-- ============================================================================

-- Clear existing categories (optional - comment out if you want to keep existing)
-- DELETE FROM categories;

-- Insert sample categories
INSERT INTO "categories" ("name", "description", "icon", "sort_order", "is_active") VALUES
('Economy', 'Economic indicators and financial metrics including GDP, employment, income, and business activity', 'chart-line', 1, 1),
('Education', 'Educational outcomes, enrollment rates, graduation rates, and academic performance metrics', 'graduation-cap', 2, 1),
('Health', 'Healthcare access, outcomes, public health indicators, and medical statistics', 'heart', 3, 1),
('Infrastructure', 'Transportation, utilities, broadband, and physical infrastructure metrics', 'road', 4, 1),
('Environment', 'Environmental quality, sustainability, energy, and natural resource indicators', 'leaf', 5, 1),
('Public Safety', 'Crime rates, law enforcement, emergency services, and safety statistics', 'shield', 6, 1),
('Housing', 'Housing affordability, availability, quality, and market indicators', 'home', 7, 1),
('Demographics', 'Population characteristics, age distribution, diversity, and migration patterns', 'users', 8, 1),
('Government', 'Government efficiency, transparency, fiscal management, and public services', 'building', 9, 1),
('Technology', 'Digital access, innovation, tech adoption, and digital infrastructure', 'wifi', 10, 1);

-- Verify the insertions
SELECT 
    id,
    name,
    description,
    icon,
    sort_order,
    is_active
FROM categories 
ORDER BY sort_order, name; 