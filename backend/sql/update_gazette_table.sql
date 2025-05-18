-- Update the gazette table to use url_data JSON column instead of file_path
ALTER TABLE gazette CHANGE COLUMN file_path url_data JSON NOT NULL;

-- Add a regular url column for backward compatibility
ALTER TABLE gazette ADD COLUMN url TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS
  (JSON_UNQUOTE(JSON_EXTRACT(url_data, '$.downloadURL'))) STORED;

-- If the table doesn't exist, create it with the correct structure
CREATE TABLE IF NOT EXISTS gazette (
  id int NOT NULL AUTO_INCREMENT,
  gazette_name varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  publish_date date DEFAULT NULL,
  url_data JSON NOT NULL,
  url text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS
    (JSON_UNQUOTE(JSON_EXTRACT(url_data, '$.downloadURL'))) STORED,
  uploader_name varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  is_active enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT 'yes',
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
