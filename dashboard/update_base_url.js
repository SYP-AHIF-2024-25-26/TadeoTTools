const fs = require('fs')

const cfg = {
  apiBaseUrl: (process.env.services__api__https__0 || process.env.services__api__http__0) + '/v1',
}

fs.writeFileSync(
  'src/environments/environment.development.ts',
  `export const environment = { apiBaseUrl: '${cfg.apiBaseUrl}', production: false }\n`
)
