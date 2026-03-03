#!/bin/sh

mkdir -p /usr/share/nginx/html/assets

echo "BACKEND_URL: ${BACKEND_URL}"
echo "KEYCLOAK_REDIRECT_URI: ${KEYCLOAK_REDIRECT_URI}"

# Write env.js file
cat <<EOF > /usr/share/nginx/html/assets/env.js
(function (window) {
  window.__env = window.__env || {};
  window.__env.backendURL = "${BACKEND_URL}";
  window.__env.keycloakRedirectUri = "${KEYCLOAK_REDIRECT_URI}";
})(this);
EOF

# If BASE_HREF is set, replace the value in index.html
if [ -n "$BASE_HREF" ]; then
  echo "Updating base href to $BASE_HREF"
  sed -i 's|<base href="[^"]*">|<base href="'"$BASE_HREF"'">|g' /usr/share/nginx/html/index.html
fi

# Start Nginx
exec "$@"
