-- ============================================================================
-- SEED ALL DATABASE DATA
-- ============================================================================
-- 
-- This file runs all seed data files in the correct order.
-- It ensures proper foreign key relationships are maintained.
--
-- Usage: Run this after creating the database schema
-- ============================================================================

-- ============================================================================
-- STEP 1: SEED CATEGORIES
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

-- ============================================================================
-- STEP 2: SEED DATA SOURCES
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

-- ============================================================================
-- STEP 3: SEED STATISTICS
-- ============================================================================

-- Clear existing statistics (optional - comment out if you want to keep existing)
-- DELETE FROM statistics;

-- Insert sample statistics
INSERT INTO "statistics" ("ra_number", "category_id", "data_source_id", "name", "description", "sub_measure", "calculation", "unit", "available_since", "data_quality", "provenance", "is_active") VALUES

-- ECONOMY STATISTICS (category_id = 1)
('RA-ECON-001', 1, 1, 'Gross Domestic Product (GDP)', 'Total economic output of goods and services produced within a state', 'Real GDP', 'Sum of all economic activity', 'Millions of dollars', '2020', 'official', 'BEA State GDP data', 1),
('RA-ECON-002', 1, 2, 'Unemployment Rate', 'Percentage of labor force that is unemployed and actively seeking work', 'Seasonally Adjusted', 'Unemployed / Labor Force * 100', 'Percentage', '2020', 'official', 'BLS Local Area Unemployment Statistics', 1),
('RA-ECON-003', 1, 1, 'Personal Income per Capita', 'Average personal income divided by population', 'Total Personal Income', 'Personal Income / Population', 'Dollars', '2020', 'official', 'BEA Personal Income by State', 1),
('RA-ECON-004', 1, 2, 'Employment Growth Rate', 'Year-over-year change in total employment', 'Total Nonfarm Employment', '(Current Year - Previous Year) / Previous Year * 100', 'Percentage', '2020', 'official', 'BLS Current Employment Statistics', 1),
('RA-ECON-005', 1, 1, 'Median Household Income', 'Middle value of household income distribution', 'Household Income', '50th percentile of income distribution', 'Dollars', '2020', 'official', 'Census Bureau American Community Survey', 1),

-- EDUCATION STATISTICS (category_id = 2)
('RA-EDU-001', 2, 5, 'High School Graduation Rate', 'Percentage of students who graduate from high school within 4 years', '4-Year Cohort Rate', 'Graduates / Cohort * 100', 'Percentage', '2020', 'official', 'Department of Education Common Core of Data', 1),
('RA-EDU-002', 2, 5, 'College Enrollment Rate', 'Percentage of high school graduates who enroll in college', 'Immediate College Enrollment', 'College Enrollees / High School Graduates * 100', 'Percentage', '2020', 'official', 'Department of Education National Center for Education Statistics', 1),
('RA-EDU-003', 2, 5, 'Student-Teacher Ratio', 'Average number of students per teacher in public schools', 'Public K-12 Schools', 'Total Students / Total Teachers', 'Ratio', '2020', 'official', 'Department of Education Common Core of Data', 1),
('RA-EDU-004', 2, 5, 'Per-Pupil Spending', 'Total education spending divided by number of students', 'Public K-12 Education', 'Total Education Spending / Total Students', 'Dollars', '2020', 'official', 'Department of Education National Center for Education Statistics', 1),
('RA-EDU-005', 2, 5, 'NAEP Reading Scores', 'Average National Assessment of Educational Progress reading scores', '4th Grade Reading', 'Average scaled score', 'Scaled Score', '2020', 'official', 'Department of Education National Assessment of Educational Progress', 1),

-- HEALTH STATISTICS (category_id = 3)
('RA-HEALTH-001', 3, 4, 'Life Expectancy', 'Average number of years a person is expected to live', 'At Birth', 'Statistical calculation from mortality data', 'Years', '2020', 'official', 'CDC National Center for Health Statistics', 1),
('RA-HEALTH-002', 3, 4, 'Infant Mortality Rate', 'Number of infant deaths per 1,000 live births', 'Under 1 Year', 'Infant Deaths / Live Births * 1000', 'Deaths per 1,000 births', '2020', 'official', 'CDC National Vital Statistics System', 1),
('RA-HEALTH-003', 3, 4, 'Uninsured Rate', 'Percentage of population without health insurance', 'All Ages', 'Uninsured Population / Total Population * 100', 'Percentage', '2020', 'official', 'Census Bureau American Community Survey', 1),
('RA-HEALTH-004', 3, 4, 'Obesity Rate', 'Percentage of adults with BMI of 30 or higher', 'Adults 18+', 'Obese Adults / Total Adults * 100', 'Percentage', '2020', 'official', 'CDC Behavioral Risk Factor Surveillance System', 1),
('RA-HEALTH-005', 3, 4, 'Mental Health Provider Rate', 'Number of mental health providers per 100,000 population', 'Psychiatrists and Psychologists', 'Mental Health Providers / Population * 100000', 'Providers per 100,000', '2020', 'official', 'Health Resources and Services Administration', 1),

-- INFRASTRUCTURE STATISTICS (category_id = 4)
('RA-INFRA-001', 4, 8, 'Road Quality Index', 'Composite measure of road condition and safety', 'Interstate and State Highways', 'Weighted average of road condition factors', 'Index (0-100)', '2020', 'official', 'Department of Transportation Federal Highway Administration', 1),
('RA-INFRA-002', 4, 8, 'Broadband Access Rate', 'Percentage of households with high-speed internet access', '25+ Mbps Download', 'Households with Broadband / Total Households * 100', 'Percentage', '2020', 'official', 'Federal Communications Commission', 1),
('RA-INFRA-003', 4, 8, 'Bridge Condition', 'Percentage of bridges rated as structurally deficient', 'All Public Bridges', 'Structurally Deficient Bridges / Total Bridges * 100', 'Percentage', '2020', 'official', 'Department of Transportation Federal Highway Administration', 1),
('RA-INFRA-004', 4, 8, 'Public Transit Ridership', 'Annual public transit trips per capita', 'All Public Transit', 'Total Transit Trips / Population', 'Trips per capita', '2020', 'official', 'Department of Transportation Federal Transit Administration', 1),
('RA-INFRA-005', 4, 8, 'Airport Accessibility', 'Number of commercial airports per million population', 'Commercial Service Airports', 'Airports / Population * 1000000', 'Airports per million', '2020', 'official', 'Department of Transportation Federal Aviation Administration', 1),

-- ENVIRONMENT STATISTICS (category_id = 5)
('RA-ENV-001', 5, 7, 'Air Quality Index', 'Composite measure of air pollution levels', 'PM2.5 and Ozone', 'Weighted average of pollutant concentrations', 'Index (0-500)', '2020', 'official', 'Environmental Protection Agency Air Quality System', 1),
('RA-ENV-002', 5, 7, 'Renewable Energy Production', 'Percentage of electricity from renewable sources', 'Solar, Wind, Hydro, Biomass', 'Renewable Generation / Total Generation * 100', 'Percentage', '2020', 'official', 'Energy Information Administration', 1),
('RA-ENV-003', 5, 7, 'Water Quality Index', 'Composite measure of surface water quality', 'Rivers and Lakes', 'Weighted average of water quality parameters', 'Index (0-100)', '2020', 'official', 'Environmental Protection Agency Water Quality Assessment', 1),
('RA-ENV-004', 5, 7, 'Greenhouse Gas Emissions', 'Total CO2 equivalent emissions per capita', 'All Sectors', 'Total Emissions / Population', 'Metric tons CO2e per capita', '2020', 'official', 'Environmental Protection Agency Greenhouse Gas Inventory', 1),
('RA-ENV-005', 5, 7, 'Protected Land Area', 'Percentage of state land in protected areas', 'Parks and Wildlife Areas', 'Protected Area / Total Land Area * 100', 'Percentage', '2020', 'official', 'Department of Interior Protected Areas Database', 1);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check categories
SELECT 'Categories' as table_name, COUNT(*) as record_count FROM categories
UNION ALL
SELECT 'Data Sources', COUNT(*) FROM data_sources
UNION ALL
SELECT 'Statistics', COUNT(*) FROM statistics;

-- Show statistics with category and data source names
SELECT 
    s.id,
    s.ra_number,
    s.name,
    c.name as category_name,
    ds.name as data_source_name,
    s.unit,
    s.data_quality
FROM statistics s
JOIN categories c ON s.category_id = c.id
JOIN data_sources ds ON s.data_source_id = ds.id
ORDER BY c.sort_order, s.name
LIMIT 10;

-- ============================================================================
-- SEEDING COMPLETE
-- ============================================================================
--
-- Database has been seeded with:
-- ✅ 10 categories
-- ✅ 15 data sources  
-- ✅ 25 statistics (5 per category)
--
-- Your Results America application now has sample data to work with! 