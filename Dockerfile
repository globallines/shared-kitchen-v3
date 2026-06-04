FROM php:8.2-apache

# PHP extensions the app uses (pdo_mysql for DB, mbstring for text helpers)
RUN apt-get update && apt-get install -y libonig-dev \
 && docker-php-ext-install pdo_mysql mbstring \
 && rm -rf /var/lib/apt/lists/*

# App code
COPY . /var/www/html/
WORKDIR /var/www/html

# Writable uploads dir (ephemeral on Railway; existing media served from PHOTO_BASE_URL)
RUN mkdir -p uploads/menu uploads/bills uploads/recipes

# Serve with PHP's built-in web server on Railway's $PORT (avoids Apache MPM issues)
CMD ["sh","-c","php -S 0.0.0.0:${PORT:-8080} router.php"]
