-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: May 16, 2025 at 12:12 PM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `governmentnutritionprogram`
--

-- --------------------------------------------------------

--
-- Table structure for table `contractors`
--

DROP TABLE IF EXISTS `contractors`;
CREATE TABLE IF NOT EXISTS `contractors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contractor_nic_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `agreement_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agreement_start_date` date DEFAULT NULL,
  `agreement_end_date` date DEFAULT NULL,
  `is_active` enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT 'yes',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `contractor_nic_number` (`contractor_nic_number`),
  UNIQUE KEY `contractor_nic_number_2` (`contractor_nic_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `contractors`
--
DROP TRIGGER IF EXISTS `after_contractor_update_sync_supporter_active`;
DELIMITER $$
CREATE TRIGGER `after_contractor_update_sync_supporter_active` AFTER UPDATE ON `contractors` FOR EACH ROW BEGIN
    -- Only update if the is_active status has actually changed
    IF OLD.is_active <> NEW.is_active THEN
        -- Update corresponding supporter if the contractor has one
        UPDATE supporters
        SET is_active = NEW.is_active
        WHERE contractor_id = NEW.id;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `daily_data`
--

DROP TABLE IF EXISTS `daily_data`;
CREATE TABLE IF NOT EXISTS `daily_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `female` int NOT NULL,
  `male` int NOT NULL,
  `total` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method_of_rice_received` enum('donated','purchased') COLLATE utf8mb4_unicode_ci DEFAULT 'purchased',
  `meal_recipe` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `number_of_eggs` int NOT NULL DEFAULT '0',
  `fruits` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `deo_details`
--

DROP TABLE IF EXISTS `deo_details`;
CREATE TABLE IF NOT EXISTS `deo_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `full_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nic_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tel_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT 'yes',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `nic_number` (`nic_number`),
  UNIQUE KEY `nic_number_2` (`nic_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gazette`
--

DROP TABLE IF EXISTS `gazette`;
CREATE TABLE IF NOT EXISTS `gazette` (
  `id` int NOT NULL AUTO_INCREMENT,
  `gazette_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `publish_date` date DEFAULT NULL,
  `file_path` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploader_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT 'yes',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `progress_reports`
--

DROP TABLE IF EXISTS `progress_reports`;
CREATE TABLE IF NOT EXISTS `progress_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `progress_report_month` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `progress_report_month` (`progress_report_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `supporters`
--

DROP TABLE IF EXISTS `supporters`;
CREATE TABLE IF NOT EXISTS `supporters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contractor_id` int NOT NULL,
  `supporter_nic_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supporter_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supporter_contact_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supporter_address` text COLLATE utf8mb4_unicode_ci,
  `is_active` enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT 'yes',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `supporter_nic_number` (`supporter_nic_number`),
  UNIQUE KEY `contractor_id` (`contractor_id`),
  UNIQUE KEY `supporter_nic_number_2` (`supporter_nic_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','deo','vo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin',
  `is_active` enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT 'yes',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `users`
--
DROP TRIGGER IF EXISTS `after_user_update_sync_deo_active`;
DELIMITER $$
CREATE TRIGGER `after_user_update_sync_deo_active` AFTER UPDATE ON `users` FOR EACH ROW BEGIN
    -- Only update if the is_active status has actually changed
    IF OLD.is_active <> NEW.is_active THEN
        -- Update corresponding deo_details if the user has one
        UPDATE deo_details
        SET is_active = NEW.is_active
        WHERE user_id = NEW.id;
    END IF;
END
$$
DELIMITER ;
DROP TRIGGER IF EXISTS `after_user_update_sync_vo_active`;
DELIMITER $$
CREATE TRIGGER `after_user_update_sync_vo_active` AFTER UPDATE ON `users` FOR EACH ROW BEGIN
     -- Only update if the is_active status has actually changed
    IF OLD.is_active <> NEW.is_active THEN
        -- Update corresponding vo_details if the user has one
        UPDATE vo_details
        SET is_active = NEW.is_active
        WHERE user_id = NEW.id;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `vouchers`
--

DROP TABLE IF EXISTS `vouchers`;
CREATE TABLE IF NOT EXISTS `vouchers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file_path` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vo_details`
--

DROP TABLE IF EXISTS `vo_details`;
CREATE TABLE IF NOT EXISTS `vo_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `full_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nic_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tel_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT 'yes',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `nic_number` (`nic_number`),
  UNIQUE KEY `nic_number_2` (`nic_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `deo_details`
--
ALTER TABLE `deo_details`
  ADD CONSTRAINT `deo_details_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `supporters`
--
ALTER TABLE `supporters`
  ADD CONSTRAINT `supporters_ibfk_1` FOREIGN KEY (`contractor_id`) REFERENCES `contractors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `vo_details`
--
ALTER TABLE `vo_details`
  ADD CONSTRAINT `vo_details_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
