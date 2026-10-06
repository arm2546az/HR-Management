-- =====================================================================
-- ระบบบริหารทรัพยากรบุคคล VN GROUP HRMS (MySQL Database Schema & Seed Data)
-- สำหรับ: โรงเรียนสอนขับรถวีเอ็น (สาขาเมืองกำแพงเพชร & สาขาท่ามะเขือ)
-- ไฟล์: vn_hrms_database.sql
-- รองรับ: MySQL 5.7+ / MySQL 8.0+ / MariaDB 10.3+ (phpMyAdmin, MySQL Workbench)
-- Character Set: utf8mb4 / Collation: utf8mb4_unicode_ci
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+07:00";

-- สร้างฐานข้อมูล (กรณีต้องการสร้างใหม่)
CREATE DATABASE IF NOT EXISTS `vn_group_hrms` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `vn_group_hrms`;

-- ---------------------------------------------------------------------
-- 1. ตารางข้อมูลบริษัท / สาขา (companies)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `companies`;
CREATE TABLE `companies` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL COMMENT 'ชื่อสาขาเต็ม',
  `short_name` VARCHAR(100) NOT NULL COMMENT 'ชื่อย่อสาขา',
  `code` VARCHAR(50) NOT NULL COMMENT 'รหัสสาขา เช่น VN-KPP, VN-TMK',
  `address` TEXT NOT NULL COMMENT 'ที่อยู่สาขา',
  `phone` VARCHAR(50) NOT NULL COMMENT 'เบอร์โทรศัพท์',
  `tax_id` VARCHAR(50) NOT NULL COMMENT 'เลขประจำตัวผู้เสียภาษี',
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `lat` DECIMAL(10, 8) DEFAULT NULL,
  `lng` DECIMAL(11, 8) DEFAULT NULL,
  `radius_meters` INT NOT NULL DEFAULT 250,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_company_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางสาขาโรงเรียนสอนขับรถวีเอ็น';

-- ข้อมูลเริ่มต้น: สาขา
INSERT INTO `companies` (`id`, `name`, `short_name`, `code`, `address`, `phone`, `tax_id`, `status`, `lat`, `lng`, `radius_meters`) VALUES
('c1', 'โรงเรียนสอนขับรถวีเอ็น (สาขาเมืองกำแพงเพชร)', 'VN กำแพงเพชร', 'VN-KPP', '128 หมู่ 6 ต.สระแก้ว อ.เมืองกำแพงเพชร จ.กำแพงเพชร 62000', '055-711-889', '0625561001234', 'ACTIVE', 16.48280000, 99.52270000, 250),
('c2', 'โรงเรียนสอนขับรถวีเอ็น (สาขาท่ามะเขือ)', 'VN ท่ามะเขือ', 'VN-TMK', '45/2 หมู่ 2 ต.ท่ามะเขือ อ.คลองขลุง จ.กำแพงเพชร 62120', '055-781-456', '0625561001235', 'ACTIVE', 16.32110000, 99.78920000, 250);

-- ---------------------------------------------------------------------
-- 2. ตารางนโยบายและระเบียบบริษัท (company_policies)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `company_policies`;
CREATE TABLE `company_policies` (
  `id` VARCHAR(50) NOT NULL,
  `company_id` VARCHAR(50) NOT NULL COMMENT 'รหัสสาขา หรือ ALL',
  `title` VARCHAR(255) NOT NULL COMMENT 'หัวข้อนโยบาย',
  `content` TEXT NOT NULL COMMENT 'เนื้อหารายละเอียด',
  `effective_date` DATE NOT NULL COMMENT 'วันที่มีผลบังคับใช้',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_policy_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='นโยบายและข้อบังคับสาขา';

INSERT INTO `company_policies` (`id`, `company_id`, `title`, `content`, `effective_date`) VALUES
('pol-1', 'c1', 'นโยบายความปลอดภัยของยานพาหนะฝึกสอน', 'ครูฝึกสอนต้องตรวจเช็คลมยาง น้ำมันเครื่อง และเบรกทุกวันก่อนเริ่มสอน', '2026-01-01'),
('pol-2', 'c1', 'นโยบายการบันทึกเวลาและการลางาน', 'การลากิจต้องยื่นล่วงหน้าอย่างน้อย 1 วันทำการ และเข้างานสายเกิน 08:15 น. จะงดเบี้ยขยันประจำเดือน', '2026-01-01'),
('pol-3', 'c2', 'นโยบายการบริการลูกค้าและนักเรียนขับรถสาขาท่ามะเขือ', 'เน้นความสุภาพและความปลอดภัย 100% ในสนามฝึกสอนท่ามะเขือ', '2026-01-01');

-- ---------------------------------------------------------------------
-- 3. ตารางแผนกงาน (departments)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `id` VARCHAR(50) NOT NULL,
  `company_id` VARCHAR(50) NOT NULL COMMENT 'สังกัดสาขา',
  `name` VARCHAR(150) NOT NULL COMMENT 'ชื่อแผนก',
  `code` VARCHAR(50) NOT NULL COMMENT 'รหัสแผนก',
  `manager_id` VARCHAR(50) DEFAULT NULL COMMENT 'รหัสหัวหน้าแผนก',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_dept_company` (`company_id`),
  CONSTRAINT `fk_dept_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='แผนกงาน';

INSERT INTO `departments` (`id`, `company_id`, `name`, `code`, `manager_id`) VALUES
('d1', 'c1', 'ฝ่ายบริหารและธุรการ', 'ADM', NULL),
('d2', 'c1', 'ฝ่ายครูฝึกสอนขับรถยนต์และจักรยานยนต์', 'INS', NULL),
('d3', 'c1', 'ฝ่ายอบรมและสอบใบขับขี่', 'EXM', NULL),
('d4', 'c1', 'ฝ่ายซ่อมบำรุงและดูแลยานพาหนะ', 'MNT', NULL),
('d5', 'c2', 'ฝ่ายบริหารและธุรการ (สาขาท่ามะเขือ)', 'TMK-ADM', NULL),
('d6', 'c2', 'ฝ่ายครูฝึกสอนขับรถ (สาขาท่ามะเขือ)', 'TMK-INS', NULL);

-- ---------------------------------------------------------------------
-- 4. ตารางตำแหน่งงาน (positions)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `positions`;
CREATE TABLE `positions` (
  `id` VARCHAR(50) NOT NULL,
  `department_id` VARCHAR(50) NOT NULL COMMENT 'สังกัดแผนก',
  `name` VARCHAR(150) NOT NULL COMMENT 'ชื่อตำแหน่ง',
  `level` VARCHAR(50) NOT NULL COMMENT 'ระดับตำแหน่ง เช่น Executive, Supervisor, Staff',
  `base_salary_min` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `base_salary_max` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pos_department` (`department_id`),
  CONSTRAINT `fk_pos_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตำแหน่งงานและกระบอกเงินเดือน';

INSERT INTO `positions` (`id`, `department_id`, `name`, `level`, `base_salary_min`, `base_salary_max`) VALUES
('p1', 'd1', 'ประธานกรรมการ / ผู้จัดการใหญ่', 'Executive', 60000.00, 100000.00),
('p2', 'd1', 'ผู้จัดการฝ่ายทรัพยากรบุคคล', 'Manager', 35000.00, 50000.00),
('p3', 'd1', 'เจ้าหน้าที่ธุรการและต้อนรับ', 'Staff', 16000.00, 22000.00),
('p4', 'd2', 'หัวหน้าฝ่ายครูฝึกสอน', 'Supervisor', 28000.00, 40000.00),
('p5', 'd2', 'ครูฝึกสอนขับรถยนต์', 'Senior Staff', 20000.00, 28000.00),
('p6', 'd2', 'ครูฝึกสอนขับรถจักรยานยนต์', 'Staff', 18000.00, 25000.00),
('p7', 'd3', 'เจ้าหน้าที่ทดสอบภาคทฤษฎีและปฏิบัติ', 'Staff', 18000.00, 24000.00),
('p8', 'd4', 'ช่างเทคนิคซ่อมบำรุงยานยนต์', 'Staff', 18000.00, 26000.00),
('p9', 'd6', 'หัวหน้าครูฝึกสอน (สาขาท่ามะเขือ)', 'Supervisor', 28000.00, 38000.00),
('p10', 'd6', 'ครูฝึกสอนขับรถ (สาขาท่ามะเขือ)', 'Staff', 19000.00, 26000.00);

-- ---------------------------------------------------------------------
-- 5. ตารางพนักงาน (employees)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` VARCHAR(50) NOT NULL,
  `employee_code` VARCHAR(50) NOT NULL COMMENT 'รหัสพนักงาน เช่น VN-KPP-001',
  `first_name` VARCHAR(100) NOT NULL COMMENT 'ชื่อจริง',
  `last_name` VARCHAR(100) NOT NULL COMMENT 'นามสกุล',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT 'ชื่อเล่น',
  `avatar_url` VARCHAR(255) DEFAULT NULL COMMENT 'รูปโปรไฟล์',
  `phone` VARCHAR(50) NOT NULL COMMENT 'เบอร์โทร',
  `email` VARCHAR(150) NOT NULL COMMENT 'อีเมล',
  `id_card_number` VARCHAR(20) NOT NULL COMMENT 'เลขบัตรประชาชน 13 หลัก',
  `birth_date` DATE NOT NULL COMMENT 'วันเกิด',
  `company_id` VARCHAR(50) NOT NULL COMMENT 'รหัสสาขาที่ประจำ',
  `department_id` VARCHAR(50) NOT NULL COMMENT 'รหัสแผนก',
  `position_name` VARCHAR(150) NOT NULL COMMENT 'ชื่อตำแหน่งงาน',
  `base_salary` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'เงินเดือนพื้นฐาน',
  `position_allowance` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'เงินประจำตำแหน่ง/ค่าครองชีพ',
  `hire_date` DATE NOT NULL COMMENT 'วันที่เริ่มงาน',
  `probation_end_date` DATE DEFAULT NULL COMMENT 'วันที่สิ้นสุดทดลองงาน',
  `employment_status` ENUM('PROBATION', 'ACTIVE', 'PENDING_START', 'RESIGNED', 'TERMINATED') NOT NULL DEFAULT 'PROBATION',
  `work_shift` VARCHAR(100) NOT NULL DEFAULT '08:00 - 17:00 (อังคาร-อาทิตย์)',
  `approver_id` VARCHAR(50) DEFAULT NULL COMMENT 'รหัสพนักงานผู้มีอำนาจอนุมัติ',
  `bank_name` VARCHAR(100) DEFAULT 'ธนาคารกสิกรไทย',
  `bank_account_no` VARCHAR(50) DEFAULT NULL,
  `resignation_date` DATE DEFAULT NULL,
  `resignation_reason` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_emp_code` (`employee_code`),
  KEY `fk_emp_company` (`company_id`),
  KEY `fk_emp_dept` (`department_id`),
  CONSTRAINT `fk_emp_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  CONSTRAINT `fk_emp_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางประวัติพนักงาน';

-- ---------------------------------------------------------------------
-- 6. ตารางสิทธิและโควตาวันลาพนักงาน (employee_leave_quotas)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `employee_leave_quotas`;
CREATE TABLE `employee_leave_quotas` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `employee_id` VARCHAR(50) NOT NULL,
  `leave_type` ENUM('SICK', 'PERSONAL', 'ANNUAL', 'MATERNITY', 'MILITARY', 'TRAINING') NOT NULL COMMENT 'ประเภทการลา',
  `entitled_days` DECIMAL(5,1) NOT NULL DEFAULT 0.0 COMMENT 'สิทธิลาตามกฎหมาย/นโยบาย (วัน)',
  `used_days` DECIMAL(5,1) NOT NULL DEFAULT 0.0 COMMENT 'ใช้ไปแล้ว (วัน)',
  `pending_days` DECIMAL(5,1) NOT NULL DEFAULT 0.0 COMMENT 'อยู่ระหว่างรออนุมัติ (วัน)',
  `carried_over_days` DECIMAL(5,1) NOT NULL DEFAULT 0.0 COMMENT 'ยกยอดมาจากปีก่อน (วัน)',
  `remaining_days` DECIMAL(5,1) NOT NULL DEFAULT 0.0 COMMENT 'คงเหลือ (วัน)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_emp_leave_type` (`employee_id`, `leave_type`),
  CONSTRAINT `fk_quota_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='โควตาวันลาของพนักงาน';

-- ---------------------------------------------------------------------
-- 7. ตารางบัญชีผู้ใช้งานระบบและสิทธิ์การเข้าถึง (users)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(50) NOT NULL,
  `employee_id` VARCHAR(50) DEFAULT NULL COMMENT 'เชื่อมโยงพนักงาน (ถ้ามี)',
  `username` VARCHAR(100) NOT NULL COMMENT 'ชื่อเข้าสู่ระบบ',
  `password` VARCHAR(255) NOT NULL COMMENT 'รหัสผ่าน',
  `role` ENUM('SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE') NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `assigned_company_ids` TEXT NOT NULL COMMENT 'สาขาที่มีสิทธิ์เข้าถึง (JSON หรือ c1,c2)',
  `allowed_departments` TEXT DEFAULT NULL COMMENT 'แผนกที่ดูแล',
  `last_login` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='บัญชีผู้ใช้งานระบบ HRMS';

-- ข้อมูลเริ่มต้น: บัญชีผู้ใช้งานระบบตามสิทธิ์และรหัสผ่านที่กำหนด
INSERT INTO `users` (`id`, `employee_id`, `username`, `password`, `role`, `is_active`, `assigned_company_ids`, `allowed_departments`, `last_login`) VALUES
('u-superadmin', NULL, 'superadmin', '01092569', 'SUPER_ADMIN', 1, '["c1", "c2"]', NULL, '2026-10-06 08:30:12'),
('u-hrmanager', NULL, 'HR manager', '02092569', 'HR_MANAGER', 1, '["c1", "c2"]', NULL, '2026-10-06 08:45:00'),
('u-depthead-tmk', NULL, 'หัวหน้าแผนก (สาขาท่ามะเขือ)', '62120', 'DEPARTMENT_HEAD', 1, '["c2"]', '["d5", "d6"]', '2026-10-06 08:15:22'),
('u-depthead-kpp', NULL, 'หัวหน้าแผนก (สาขาเมืองกำแพงเพชร)', '62000', 'DEPARTMENT_HEAD', 1, '["c1"]', '["d1", "d2", "d3", "d4"]', '2026-10-06 08:15:22'),
('u-employee-tmk', NULL, 'พนักงาน (สาขาท่ามะเขือ)', '01470', 'EMPLOYEE', 1, '["c2"]', '["d6"]', '2026-10-06 07:55:10'),
('u-employee-kpp', NULL, 'พนักงาน (สาขาเมืองกำแพงเพชร)', '963852', 'EMPLOYEE', 1, '["c1"]', '["d2"]', '2026-10-06 07:55:10');

-- ---------------------------------------------------------------------
-- 8. ตารางคำขอลาหยุดและการทำ OT (unified_requests)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `unified_requests`;
CREATE TABLE `unified_requests` (
  `id` VARCHAR(50) NOT NULL,
  `request_code` VARCHAR(50) NOT NULL COMMENT 'รหัสคำขอ เช่น REQ-202610-001',
  `company_id` VARCHAR(50) NOT NULL COMMENT 'สาขาที่เกิดคำขอ',
  `employee_id` VARCHAR(50) NOT NULL COMMENT 'ผู้ยื่นคำขอ',
  `request_type` ENUM('LEAVE', 'OT') NOT NULL COMMENT 'ประเภทคำขอ (ลา หรือ OT)',
  `leave_type` ENUM('SICK', 'PERSONAL', 'ANNUAL', 'MATERNITY', 'MILITARY', 'TRAINING') DEFAULT NULL COMMENT 'ประเภทการลา',
  `is_half_day` TINYINT(1) NOT NULL DEFAULT 0,
  `half_day_period` ENUM('MORNING', 'AFTERNOON') DEFAULT NULL,
  `start_date` DATETIME NOT NULL COMMENT 'วันเวลาเริ่มต้น',
  `end_date` DATETIME NOT NULL COMMENT 'วันเวลาสิ้นสุด',
  `days_count` DECIMAL(5,1) NOT NULL DEFAULT 0.0 COMMENT 'จำนวนวันลา',
  `ot_hours` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'จำนวนชั่วโมง OT',
  `ot_multiplier` DECIMAL(4,2) NOT NULL DEFAULT 1.50 COMMENT 'อัตราคูณ OT เช่น 1.5, 3.0',
  `reason` TEXT NOT NULL COMMENT 'เหตุผลการขอ',
  `attachment_name` VARCHAR(255) DEFAULT NULL COMMENT 'ชื่อไฟล์แนบ (เช่น ใบรับรองแพทย์)',
  `status` ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `current_step` INT NOT NULL DEFAULT 1,
  `approver_id` VARCHAR(50) DEFAULT NULL COMMENT 'ผู้อนุมัติ',
  `approved_at` DATETIME DEFAULT NULL,
  `approver_comment` TEXT DEFAULT NULL,
  `rejected_reason` TEXT DEFAULT NULL,
  `cancelled_reason` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_req_code` (`request_code`),
  KEY `idx_req_comp` (`company_id`),
  KEY `idx_req_emp` (`employee_id`),
  KEY `idx_req_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ศูนย์รวมคำขอลาและคำขอ OT';

-- ---------------------------------------------------------------------
-- 9. ตารางประวัติการลงเวลาเข้า-ออกงาน (attendance_records)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `attendance_records`;
CREATE TABLE `attendance_records` (
  `id` VARCHAR(50) NOT NULL,
  `company_id` VARCHAR(50) NOT NULL,
  `employee_id` VARCHAR(50) NOT NULL,
  `date` DATE NOT NULL COMMENT 'วันที่ทำงาน (YYYY-MM-DD)',
  `clock_in` TIME DEFAULT NULL COMMENT 'เวลาเข้างาน',
  `clock_out` TIME DEFAULT NULL COMMENT 'เวลาออกงาน',
  `clock_in_location` VARCHAR(255) DEFAULT NULL COMMENT 'พิกัด GPS เข้างาน',
  `clock_out_location` VARCHAR(255) DEFAULT NULL COMMENT 'พิกัด GPS ออกงาน',
  `status` ENUM('ON_TIME', 'LATE', 'EARLY_LEAVE', 'NEEDS_CHECK', 'INCOMPLETE') NOT NULL DEFAULT 'ON_TIME',
  `work_shift` VARCHAR(100) DEFAULT '08:00 - 17:00 (อังคาร-อาทิตย์)',
  `notes` TEXT DEFAULT NULL,
  `correction_requested` TINYINT(1) NOT NULL DEFAULT 0,
  `correction_reason` TEXT DEFAULT NULL,
  `requested_clock_in` TIME DEFAULT NULL,
  `requested_clock_out` TIME DEFAULT NULL,
  `correction_status` ENUM('NONE', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'NONE',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_emp_date` (`employee_id`, `date`),
  KEY `idx_att_comp` (`company_id`),
  KEY `idx_att_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ประวัติการลงเวลาทำงาน';

-- ---------------------------------------------------------------------
-- 10. ตารางวันหยุดประจำปี / วันหยุดตามประเพณี (holidays)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `holidays`;
CREATE TABLE `holidays` (
  `id` VARCHAR(50) NOT NULL,
  `company_id` VARCHAR(50) NOT NULL DEFAULT 'ALL' COMMENT 'รหัสสาขา หรือ ALL',
  `date` DATE NOT NULL COMMENT 'วันที่หยุด (YYYY-MM-DD)',
  `name` VARCHAR(255) NOT NULL COMMENT 'ชื่อวันหยุด',
  `is_traditional` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = วันหยุดตามประเพณี',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_holiday_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='วันหยุดประจำปีตามกฎหมายคุ้มครองแรงงาน';

-- ข้อมูลเริ่มต้น: วันหยุดตามประเพณี 15 วันประจำปี 2026
INSERT INTO `holidays` (`id`, `company_id`, `date`, `name`, `is_traditional`) VALUES
('h1', 'ALL', '2026-01-01', 'วันขึ้นปีใหม่', 1),
('h2', 'ALL', '2026-03-03', 'วันมาฆบูชา', 1),
('h3', 'ALL', '2026-04-06', 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราชและวันที่ระลึกมหาจักรีบรมราชวงศ์', 1),
('h4', 'ALL', '2026-04-13', 'วันสงกรานต์', 1),
('h5', 'ALL', '2026-04-14', 'วันสงกรานต์', 1),
('h6', 'ALL', '2026-04-15', 'วันสงกรานต์', 1),
('h7', 'ALL', '2026-05-01', 'วันแรงงานแห่งชาติ', 1),
('h8', 'ALL', '2026-05-04', 'วันฉัตรมงคล', 1),
('h9', 'ALL', '2026-07-28', 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว', 1),
('h10', 'ALL', '2026-08-12', 'วันแม่แห่งชาติ', 1),
('h11', 'ALL', '2026-10-13', 'วันนวมินทรมหาราช', 1),
('h12', 'ALL', '2026-10-23', 'วันปิยมหาราช', 1),
('h13', 'ALL', '2026-12-05', 'วันพ่อแห่งชาติ', 1),
('h14', 'ALL', '2026-12-10', 'วันรัฐธรรมนูญ', 1),
('h15', 'ALL', '2026-12-31', 'วันสิ้นปี', 1);

-- ---------------------------------------------------------------------
-- 11. ตารางรอบการจ่ายเงินเดือน (payroll_cycles)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `payroll_cycles`;
CREATE TABLE `payroll_cycles` (
  `id` VARCHAR(50) NOT NULL,
  `company_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL COMMENT 'ชื่อรอบเงินเดือน เช่น รอบเดือนตุลาคม 2026',
  `cycle_month` INT NOT NULL COMMENT 'เดือน 1-12',
  `cycle_year` INT NOT NULL COMMENT 'ปี ค.ศ.',
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `pay_date` DATE NOT NULL COMMENT 'กำหนดจ่ายเงิน',
  `status` ENUM('DRAFT', 'CALCULATED', 'PENDING_REVIEW', 'APPROVED', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `total_net_pay` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `total_tax` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `total_social_security` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `employee_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payroll_comp` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='รอบการคำนวณเงินเดือน';

-- ---------------------------------------------------------------------
-- 12. ตารางสลิปเงินเดือนรายบุคคล (payroll_snapshots)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `payroll_snapshots`;
CREATE TABLE `payroll_snapshots` (
  `id` VARCHAR(50) NOT NULL,
  `payroll_cycle_id` VARCHAR(50) NOT NULL,
  `employee_id` VARCHAR(50) NOT NULL,
  `company_id` VARCHAR(50) NOT NULL,
  `base_salary` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `position_allowance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `ot_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `incentive_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `bonus_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `other_earnings` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_earnings` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'รวมรายรับ',
  `social_security` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'หักประกันสังคม (สูงสุด 750)',
  `tax_withholding` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'หัก ณ ที่จ่าย ภ.ง.ด.1',
  `student_loan` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'หัก กยศ.',
  `late_penalty` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'หักมาสาย',
  `absence_deduction` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'หักขาดงาน',
  `other_deductions` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_deductions` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'รวมรายจ่ายหัก',
  `net_salary` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'เงินเดือนสุทธิ',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cycle_emp` (`payroll_cycle_id`, `employee_id`),
  KEY `fk_snap_employee` (`employee_id`),
  CONSTRAINT `fk_snap_cycle` FOREIGN KEY (`payroll_cycle_id`) REFERENCES `payroll_cycles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='สลิปเงินเดือนรายบุคคล e-Slip';

-- ---------------------------------------------------------------------
-- 13. ตารางประกาศข่าวสารองค์กร (company_announcements)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `company_announcements`;
CREATE TABLE `company_announcements` (
  `id` VARCHAR(50) NOT NULL,
  `company_id` VARCHAR(50) NOT NULL DEFAULT 'ALL' COMMENT 'รหัสสาขา หรือ ALL',
  `title` VARCHAR(255) NOT NULL COMMENT 'หัวข้อประกาศ',
  `content` TEXT NOT NULL COMMENT 'เนื้อหาประกาศ',
  `priority` ENUM('NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
  `published_at` DATETIME NOT NULL,
  `published_by` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ann_comp` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ข่าวสารและประกาศภายในองค์กร';

-- ---------------------------------------------------------------------
-- 14. ตารางบันทึกประวัติการใช้งานระบบ (audit_logs)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` VARCHAR(50) NOT NULL,
  `timestamp` DATETIME NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `user_role` VARCHAR(50) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `module` VARCHAR(100) NOT NULL,
  `ip_address` VARCHAR(50) NOT NULL,
  `details` TEXT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_log_time` (`timestamp`),
  KEY `idx_log_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='บันทึกประวัติความปลอดภัยและการทำงาน';

-- ---------------------------------------------------------------------
-- 15. ตารางการแจ้งเตือนระบบ (system_notifications)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `system_notifications`;
CREATE TABLE `system_notifications` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) DEFAULT NULL COMMENT 'ผู้รับแจ้งเตือน หรือ NULL สำหรับทุกคน',
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR') NOT NULL DEFAULT 'INFO',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='การแจ้งเตือนระบบ';

-- ---------------------------------------------------------------------
-- 16. ตารางเอกสารสัญญาและประวัติพนักงาน (employee_documents)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `employee_documents`;
CREATE TABLE `employee_documents` (
  `id` VARCHAR(50) NOT NULL,
  `employee_id` VARCHAR(50) NOT NULL,
  `type` ENUM('CONTRACT', 'WARNING_LETTER', 'RESIGNATION', 'ID_COPY', 'CERTIFICATE', 'OTHER') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_size` VARCHAR(50) NOT NULL,
  `uploaded_at` DATETIME NOT NULL,
  `uploaded_by` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_doc_emp` (`employee_id`),
  CONSTRAINT `fk_doc_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='เอกสารแนบและสัญญาจ้างพนักงาน';

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- สิ้นสุดคำสั่ง SQL สำหรับ VN GROUP HRMS
-- =====================================================================
