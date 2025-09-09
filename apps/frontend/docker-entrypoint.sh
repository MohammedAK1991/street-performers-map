#!/bin/sh
set -e

# Replace environment variables in nginx config if they exist
if [ -n "$API_URL" ]; then
    sed -i "s|\${API_URL}|$API_URL|g" /etc/nginx/nginx.conf
fi

if [ -n "$WS_URL" ]; then
    sed -i "s|\${WS_URL}|$WS_URL|g" /etc/nginx/nginx.conf
fi

# If no environment variables are set, remove proxy sections
if [ -z "$API_URL" ]; then
    sed -i '/location \/api\//,/}/d' /etc/nginx/nginx.conf
fi

if [ -z "$WS_URL" ]; then
    sed -i '/location \/ws\//,/}/d' /etc/nginx/nginx.conf
fi

exec "$@"