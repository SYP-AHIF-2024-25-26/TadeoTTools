const fs = require('fs')

// The registration kiosk talks to the legacy TadeoT backend, not to the API in
// this repository. AppHost passes its URL in REGISTRATION_API_URL.
const cfg = {
  apiBaseUrl: process.env.REGISTRATION_API_URL || 'https://tadeot.htl-leonding.ac.at/tadeot-api',
}

fs.writeFileSync(
  'src/environments/environment.development.ts',
  `export const environment = { apiBaseUrl: '${cfg.apiBaseUrl}', production: false }\n`
)
