FROM php:8.2-apache

# MySQL PDO driver
RUN docker-php-ext-install pdo_mysql

# Ensure exactly one Apache MPM (prefork, required by mod_php) + URL rewriting
RUN (a2dismod mpm_event mpm_worker 2>/dev/null || true) \
 && a2enmod mpm_prefork rewrite

# Honor .htaccess rules (security denies for includes/, *.sql, *.md) + quiet ServerName
RUN sed -ri 's/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf \
 && printf '\nServerName localhost\n' >> /etc/apache2/apache2.conf

# App code
COPY . /var/www/html/

# Writable uploads dir (ephemeral on Railway; existing media served from PHOTO_BASE_URL)
RUN mkdir -p /var/www/html/uploads/menu /var/www/html/uploads/bills /var/www/html/uploads/recipes \
 && chown -R www-data:www-data /var/www/html/uploads

# Railway provides $PORT at runtime; make Apache listen on it
CMD ["sh","-c","sed -i \"s/Listen 80/Listen ${PORT:-8080}/\" /etc/apache2/ports.conf && sed -i \"s/:80>/:${PORT:-8080}>/\" /etc/apache2/sites-available/000-default.conf && exec apache2-foreground"]
