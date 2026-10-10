const fs = require('fs')

// The statistics kiosk reads the legacy TadeoT backend, not the API in this
// repository. AppHost passes its URL in STATISTICS_API_URL.
const cfg = {
  apiBaseUrl: process.env.STATISTICS_API_URL || 'https://tadeot.htl-leonding.ac.at/tadeot-api',
}

fs.writeFileSync(
  'src/environments/environment.development.ts',
  `export const environment = { apiBaseUrl: '${cfg.apiBaseUrl}', production: false }\n`
)
