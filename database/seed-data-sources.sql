-- ============================================================================
-- SEED DATA SOURCES
-- ============================================================================
-- 
-- This file contains sample data for the data_sources table.
-- Data sources track where statistics come from.
--
-- Usage: Run this after creating the database schema
-- ============================================================================

-- Clear existing data sources (optional - comment out if you want to keep existing)
-- DELETE FROM data_sources;

-- Insert sample data sources
INSERT INTO "data_sources" ("name", "description", "url", "is_active") VALUES
('Bureau of Economic Analysis (BEA)', 'Federal agency providing comprehensive economic statistics including GDP, personal income, and industry data', 'https://www.bea.gov', 1),
('Bureau of Labor Statistics (BLS)', 'Federal agency providing labor market data, employment statistics, and price indexes', 'https://www.bls.gov', 1),
('US Census Bureau', 'Federal agency providing demographic, economic, and geographic data about the United States', 'https://www.census.gov', 1),
('Centers for Disease Control (CDC)', 'Federal agency providing public health data, disease statistics, and health outcomes', 'https://www.cdc.gov', 1),
('Department of Education', 'Federal agency providing educational statistics, outcomes, and policy data', 'https://www.ed.gov', 1),
('Federal Bureau of Investigation (FBI)', 'Federal agency providing crime statistics and law enforcement data', 'https://www.fbi.gov', 1),
('Environmental Protection Agency (EPA)', 'Federal agency providing environmental data, air quality, and sustainability metrics', 'https://www.epa.gov', 1),
('Department of Transportation (DOT)', 'Federal agency providing transportation infrastructure and safety data', 'https://www.transportation.gov', 1),
('Department of Housing and Urban Development (HUD)', 'Federal agency providing housing market data and affordability metrics', 'https://www.hud.gov', 1),
('National Center for Health Statistics (NCHS)', 'Federal agency providing detailed health statistics and vital records', 'https://www.cdc.gov/nchs', 1),
('Results America', 'Custom data collection and analysis for state-level policy outcomes', 'https://resultsamerica.org', 1),
('State Data Centers', 'Network of state-level data centers providing local statistics and indicators', 'https://www.census.gov/about/partners/sdc.html', 1),
('American Community Survey (ACS)', 'Census Bureau program providing detailed demographic and economic data', 'https://www.census.gov/programs-surveys/acs', 1),
('Current Population Survey (CPS)', 'Joint Census Bureau and BLS survey providing labor force and demographic data', 'https://www.census.gov/programs-surveys/cps.html', 1),
('National Vital Statistics System', 'CDC system providing birth, death, and health statistics', 'https://www.cdc.gov/nchs/nvss/index.htm', 1);

-- Verify the insertions
SELECT 
    id,
    name,
    description,
    url,
    is_active
FROM data_sources 
ORDER BY name; 