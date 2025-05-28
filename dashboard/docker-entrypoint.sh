#!/bin/sh

API_URL=${API_URL:-/}

echo "Setting API_URL to: ${API_URL}"

cat <<EOF > /usr/share/nginx/html/admin/env.js
(function (window) {
  window.__env = window.__env || {};
  window.__env.backendURL = "${API_URL}";
})(this);
EOF

exec nginx -g "daemon off;"
