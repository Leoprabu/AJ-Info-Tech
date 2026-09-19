CREATE DATABASE IF NOT EXISTS ajinfotech;
USE ajinfotech;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100), username VARCHAR(50) UNIQUE,
  password VARCHAR(255), email VARCHAR(100), mobile VARCHAR(20),
  role VARCHAR(30) DEFAULT 'institute_admin',
  photo LONGTEXT, permissions TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  logo LONGTEXT, name VARCHAR(150), address TEXT, email VARCHAR(100),
  mobile VARCHAR(20), alt_mobile VARCHAR(20), website VARCHAR(100),
  gstin VARCHAR(30), pan VARCHAR(20), upi_id VARCHAR(60),
  gst_percent DECIMAL(5,2) DEFAULT 18, footer_note VARCHAR(255),
  sign_image LONGTEXT, seal_image LONGTEXT
);

CREATE TABLE IF NOT EXISTS banks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bank_name VARCHAR(100), branch_name VARCHAR(100),
  ifsc VARCHAR(20), account_no VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_name VARCHAR(100), fees DECIMAL(10,2), duration_days INT,
  current_offer VARCHAR(150),
  status ENUM('active','inactive') DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS institute_enquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  enquiry_date DATE, name VARCHAR(100), mobile VARCHAR(20), course VARCHAR(100),
  source VARCHAR(30), ref_name VARCHAR(100), follow_up_date DATE,
  status ENUM('new','follow-up','converted') DEFAULT 'new',
  remark TEXT, converted TINYINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_no VARCHAR(25), student_type VARCHAR(10) DEFAULT 'new',
  photo LONGTEXT, name VARCHAR(100), father_name VARCHAR(100), mother_name VARCHAR(100),
  occupation VARCHAR(80), dob DATE, gender VARCHAR(10), mobile VARCHAR(20), email VARCHAR(100),
  course_id INT, aadhar VARCHAR(25), address TEXT, qualification VARCHAR(100),
  batch_timing VARCHAR(80), in_charge TEXT,
  full_fees DECIMAL(10,2), offer_fees DECIMAL(10,2), joined_date DATE
);

CREATE TABLE IF NOT EXISTS trainers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id VARCHAR(25), name VARCHAR(100), mobile VARCHAR(20), email VARCHAR(100),
  address TEXT, aadhar VARCHAR(25), qualification VARCHAR(100), join_date DATE,
  salary DECIMAL(10,2), photo LONGTEXT,
  status ENUM('active','inactive') DEFAULT 'active', remarks TEXT
);

CREATE TABLE IF NOT EXISTS institute_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT, receipt_no VARCHAR(20), amount DECIMAL(10,2), amount_words TEXT,
  method VARCHAR(20), pay_date DATE, remark TEXT
);

CREATE TABLE IF NOT EXISTS certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  certificate_no VARCHAR(25), name VARCHAR(100), course VARCHAR(100),
  certificate_image LONGTEXT, completed_date DATE,
  issued TINYINT DEFAULT 0, receiver_name VARCHAR(100),
  receiver_mobile VARCHAR(20), issue_date DATE
);

CREATE TABLE IF NOT EXISTS alumni (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_no VARCHAR(25), name VARCHAR(100), course VARCHAR(100),
  mobile VARCHAR(20), joined_date DATE, completed_date DATE
);

CREATE TABLE IF NOT EXISTS it_enquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  enquiry_date DATE, company_name VARCHAR(150), name VARCHAR(100), mobile VARCHAR(20),
  project VARCHAR(200), source VARCHAR(30), ref_name VARCHAR(100), follow_up_date DATE,
  status ENUM('new','follow-up','converted') DEFAULT 'new',
  remark TEXT, converted TINYINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(150), client_name VARCHAR(100), project VARCHAR(200),
  mobile VARCHAR(20), email VARCHAR(100), aadhar VARCHAR(25), address TEXT,
  gst VARCHAR(30), monthly_pay DECIMAL(10,2),
  status ENUM('active','inactive') DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS it_staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id VARCHAR(25), name VARCHAR(100), mobile VARCHAR(20), email VARCHAR(100),
  address TEXT, aadhar VARCHAR(25), qualification VARCHAR(100), join_date DATE,
  salary DECIMAL(10,2), photo LONGTEXT,
  status ENUM('active','inactive') DEFAULT 'active', remarks TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(25), project_name VARCHAR(200), company_name VARCHAR(150),
  client_id INT, payment_type ENUM('installment','monthly') DEFAULT 'installment',
  project_value DECIMAL(12,2), monthly_amount DECIMAL(10,2), installments INT DEFAULT 3,
  start_date DATE, status VARCHAR(20) DEFAULT 'planning', remarks TEXT
);

CREATE TABLE IF NOT EXISTS it_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT, receipt_no VARCHAR(20), amount DECIMAL(12,2), amount_words TEXT,
  method VARCHAR(20), pay_date DATE, remark TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expense_date DATE, category VARCHAR(60), description TEXT, amount DECIMAL(10,2),
  method VARCHAR(20), paid_to VARCHAR(100), voucher_no VARCHAR(25), remark TEXT
);

CREATE TABLE IF NOT EXISTS other_income (
  id INT AUTO_INCREMENT PRIMARY KEY,
  income_date DATE, source VARCHAR(60), description TEXT, amount DECIMAL(10,2),
  method VARCHAR(20), received_from VARCHAR(100), remark TEXT
);