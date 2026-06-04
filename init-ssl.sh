#!/bin/bash
set -e

DOMAIN=${1:-""}
EMAIL=${2:-""}

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "用法: ./init-ssl.sh <域名> <邮箱>"
    echo "示例: ./init-ssl.sh hexmayhem.com admin@hexmayhem.com"
    exit 1
fi

echo "=== 为 $DOMAIN 申请 SSL 证书 ==="

CONF_FILE="./nginx/conf.d/default.conf"

sed -i "s/server_name _;/server_name $DOMAIN;/g" "$CONF_FILE"

docker compose up -d nginx

sleep 3

docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

sed -i "s|/etc/letsencrypt/live/placeholder/|/etc/letsencrypt/live/$DOMAIN/|g" "$CONF_FILE"

docker compose restart nginx

echo ""
echo "=== SSL 证书申请成功！ ==="
echo "证书路径: /etc/letsencrypt/live/$DOMAIN/"
echo "证书会自动续期（certbot 容器每12小时检查一次）"
