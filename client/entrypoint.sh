#!/bin/sh

# Substituir a variável PORT no arquivo de configuração do Nginx
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Iniciar o Nginx
exec nginx -g 'daemon off;'