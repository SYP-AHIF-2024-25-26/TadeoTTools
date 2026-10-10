#!/bin/sh

echo "BACKEND_URL: ${BACKEND_URL}"

# Write env.js file. It sits next to index.html rather than in assets/, because the
# service worker checks the hash of every file in assets/ and this one changes per deployment.
cat <<EOF > /usr/share/nginx/html/env.js
(function (window) {
  window.__env = window.__env || {};
  window.__env.backendURL = "${BACKEND_URL}";
})(this);
EOF

exec "$@"
