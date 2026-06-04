-- Shared Kitchen Database Schema v2

CREATE TABLE IF NOT EXISTS families (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    head_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin','family','cook','driver') NOT NULL,
    family_id INT NULL,
    phone VARCHAR(20),
    diet_pref VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category ENUM('Veg','Chicken','Mutton','Fish','Egg','Snacks','Breakfast','Other') NOT NULL,
    cuisine VARCHAR(50) DEFAULT 'Indian',
    description TEXT,
    ingredients TEXT,
    diet_tags VARCHAR(255),
    photo VARCHAR(255),
    color_theme VARCHAR(20) DEFAULT 'fi-default',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cuisine (cuisine),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS meal_requirements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    family_id INT NOT NULL,
    user_id INT NOT NULL,
    meal_type ENUM('Breakfast','Lunch','Dinner','Snacks') NOT NULL,
    menu_item_id INT NULL,
    custom_dish VARCHAR(200),
    special_request VARCHAR(255),
    people INT NOT NULL DEFAULT 1,
    spice_level ENUM('Mild','Medium','Spicy') DEFAULT 'Medium',
    notes TEXT,
    status ENUM('pending','accepted','prepared') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL,
    INDEX idx_date (date),
    INDEX idx_family_date (family_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requirement_id INT NULL,
    menu_item_id INT NULL,
    user_id INT NOT NULL,
    family_id INT NOT NULL,
    date DATE NOT NULL,
    rating TINYINT NOT NULL,
    comment TEXT,
    improvement VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL,
    INDEX idx_menu (menu_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    purchased_by INT NOT NULL,
    category ENUM('Vegetables','Chicken','Mutton','Fish','Rice','Dal','Oil','Spices','Milk','Other') NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    quantity VARCHAR(50),
    amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    bill_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchased_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    family_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    mode VARCHAR(50),
    notes TEXT,
    recorded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    cuisine VARCHAR(50) DEFAULT 'Indian',
    difficulty ENUM('Easy','Medium','Hard') DEFAULT 'Easy',
    time_min INT DEFAULT 30,
    servings INT DEFAULT 4,
    description TEXT,
    steps TEXT,
    notes TEXT,
    video_url VARCHAR(500),
    photo VARCHAR(255),
    color_theme VARCHAR(20) DEFAULT 'fi-default',
    diet_tags VARCHAR(255),
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_cuisine (cuisine)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    qty DECIMAL(10,2),
    unit VARCHAR(20),
    sort_order INT DEFAULT 0,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS recipe_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    rating TINYINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS health_profiles (
    user_id INT PRIMARY KEY,
    age INT,
    gender ENUM('male','female','other'),
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    activity_level ENUM('sedentary','light','moderate','active') DEFAULT 'moderate',
    food_pref ENUM('veg','nonveg','vegan') DEFAULT 'nonveg',
    allergies VARCHAR(255),
    target_protein_g INT,
    target_calories INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS menu_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    family_id INT NOT NULL,
    meal_type ENUM('Breakfast','Lunch','Dinner','Snacks') NOT NULL,
    menu_item_id INT NULL,
    custom_dish VARCHAR(200),
    people INT DEFAULT 1,
    status ENUM('draft','requested','confirmed','shopping','prepared') DEFAULT 'draft',
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL,
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS shopping_list (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_date DATE NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    category VARCHAR(50),
    qty_needed VARCHAR(50),
    is_purchased TINYINT(1) DEFAULT 0,
    actual_qty VARCHAR(50),
    actual_amount DECIMAL(10,2),
    purchased_by INT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (plan_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
