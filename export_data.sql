-- Travectio Fleet Management System - Data Export Script
-- Use this script to export critical data for transfer

-- Export Users (Authentication and roles)
COPY (
  SELECT id, email, "firstName", "lastName", "isFounder", "isAdmin", "createdAt" 
  FROM users
) TO STDOUT WITH CSV HEADER;

-- Export Trucks (Fleet configuration)
COPY (
  SELECT * FROM trucks
) TO STDOUT WITH CSV HEADER;

-- Export Drivers
COPY (
  SELECT * FROM drivers
) TO STDOUT WITH CSV HEADER;

-- Export Loads (Historical freight data)
COPY (
  SELECT * FROM loads
) TO STDOUT WITH CSV HEADER;

-- Export Fuel Purchases (Expense tracking)
COPY (
  SELECT * FROM fuel_purchases
) TO STDOUT WITH CSV HEADER;

-- Export HOS Logs (Compliance data)
COPY (
  SELECT * FROM hos_logs
) TO STDOUT WITH CSV HEADER;

-- Export Truck Cost Breakdown (Cost analysis)
COPY (
  SELECT * FROM truck_cost_breakdown
) TO STDOUT WITH CSV HEADER;

-- Generate summary report
SELECT 
  'users' as table_name, COUNT(*) as record_count 
FROM users
UNION ALL
SELECT 'trucks', COUNT(*) FROM trucks
UNION ALL  
SELECT 'drivers', COUNT(*) FROM drivers
UNION ALL
SELECT 'loads', COUNT(*) FROM loads
UNION ALL
SELECT 'fuel_purchases', COUNT(*) FROM fuel_purchases
UNION ALL
SELECT 'hos_logs', COUNT(*) FROM hos_logs
UNION ALL
SELECT 'truck_cost_breakdown', COUNT(*) FROM truck_cost_breakdown;