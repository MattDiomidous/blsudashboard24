SELECT * 
FROM users;


SELECT SUBSTRING(SUBSTRING_INDEX(file_path, 'uploads', -1), 2) AS uploaded_info
FROM "capstone_2324_blsu"."materials";

