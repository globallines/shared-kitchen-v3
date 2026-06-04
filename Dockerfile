FROM php:8.2-apache

# MySQL PDO driver (apache image already bundles the PHP runtime + extensions tooling)
RUN docker-php-ext-install pdo_mysql

# App code
COPY . /var/www/html/
WORKDIR /var/www/html

# Writable uploads dir (ephemeral on Railway; existing media served from PHOTO_BASE_URL)
RUN mkdir -p uploads/menu uploads/bills uploads/recipes

# Serve with PHP's built-in web server on Railway's $PORT (avoids Apache MPM issues)
CMD ["sh","-c","php -S 0.0.0.0:${PORT:-8080} router.php"]
