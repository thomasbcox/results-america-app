-- Migration: Add preferenceDirection column to statistics table
-- This column indicates whether higher or lower values are preferred for each metric

ALTER TABLE statistics ADD COLUMN preference_direction TEXT DEFAULT 'higher' CHECK (preference_direction IN ('higher', 'lower', 'neutral'));

-- Add index for efficient queries on preference direction
CREATE INDEX idx_statistics_preference_direction ON statistics(preference_direction);

-- Update existing statistics with appropriate preference directions
-- Higher is better for positive metrics
UPDATE statistics SET preference_direction = 'higher' 
WHERE name LIKE '%employment%' 
   OR name LIKE '%graduation%' 
   OR name LIKE '%literacy%' 
   OR name LIKE '%life expectancy%'
   OR name LIKE '%income%'
   OR name LIKE '%gdp%'
   OR name LIKE '%growth%'
   OR name LIKE '%access%'
   OR name LIKE '%coverage%';

-- Lower is better for negative metrics  
UPDATE statistics SET preference_direction = 'lower'
WHERE name LIKE '%unemployment%'
   OR name LIKE '%crime%'
   OR name LIKE '%poverty%'
   OR name LIKE '%dropout%'
   OR name LIKE '%mortality%'
   OR name LIKE '%death%'
   OR name LIKE '%injury%'
   OR name LIKE '%deficit%'
   OR name LIKE '%debt%';

-- Neutral for descriptive metrics
UPDATE statistics SET preference_direction = 'neutral'
WHERE name LIKE '%population%'
   OR name LIKE '%area%'
   OR name LIKE '%temperature%'
   OR name LIKE '%density%'
   OR name LIKE '%ratio%'; 