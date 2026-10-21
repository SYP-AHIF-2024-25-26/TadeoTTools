const fs = require('fs')

// The cashier kiosk sells through the legacy TadeoT backend (AppHost passes its
// URL in CASHIER_API_URL) and asks the API in this repository only who may log in.
const cfg = {
  apiBaseUrl: process.env.CASHIER_API_URL || 'https://tadeot.htl-leonding.ac.at/tadeot-api',
  toolsApiBaseUrl: process.env.services__api__https__0 || process.env.services__api__http__0,
}

fs.writeFileSync(
  'src/environments/environment.development.ts',
  `export const environment = { apiBaseUrl: '${cfg.apiBaseUrl}', toolsApiBaseUrl: '${cfg.toolsApiBaseUrl}', production: false }\n`
)
