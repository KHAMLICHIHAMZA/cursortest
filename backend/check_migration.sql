-- Vérifier que les nouveaux champs existent
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Booking' 
AND column_name IN ('depositRequired', 'depositAmount', 'preparationTimeMinutes', 'lateFeeAmount');

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Agency' 
AND column_name = 'preparationTimeMinutes';

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Client' 
AND column_name = 'licenseExpiryDate';

SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'Invoice';


