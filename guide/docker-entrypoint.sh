#!/bin/sh

mkdir -p /usr/share/nginx/html/assets

echo "BACKEND_URL: ${BACKEND_URL}"

# Write env.js file
cat <<EOF > /usr/share/nginx/html/assets/env.js
(function (window) {
  window.__env = window.__env || {};
  window.__env.backendURL = "${BACKEND_URL}";
})(this);
EOF

exec "$@"
