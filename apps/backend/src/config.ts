import dotenv from 'dotenv'
import crypto from 'crypto'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'

dotenv.config({ path: '.env' })

export interface Config {
  isProdMode: boolean
  isDevMode: boolean
  isTestMode: boolean
  port: number
  debugLogging: boolean
  silentLogging: boolean
  jwtSecret: string
  jwtExpiresIn: string | number
}

let isProdMode = false
let isDevMode = false
let isTestMode = false

switch (process.env.NODE_ENV) {
  case 'production':
    isProdMode = true
    break
  case 'development':
    isDevMode = true
    break
  case 'testing':
    isTestMode = true
    break
}

const config: Config = {
  isProdMode,
  isDevMode,
  isTestMode,
  port: +(process.env.PORT || 3000),
  debugLogging: !isProdMode,
  silentLogging: isProdMode,
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(99).toString('base64'),
  jwtExpiresIn: process.env.JWT_EXPIRE || '24h',
}

const dbConfig: PostgresConnectionOptions = {
  type: 'postgres',
  host: process.env.TYPEORM_HOST || 'localhost',
  port: Number(process.env.TYPEORM_PORT) || 5432,
  username: process.env.TYPEORM_USERNAME || 'user',
  password: process.env.TYPEORM_PASSWORD || 'pass',
  database: process.env.TYPEORM_DATABASE || 'project',
  synchronize: Boolean(process.env.TYPEORM_SYNCHRONIZE) || true,
  entities: [
    isDevMode ? 'src/db/entity/*.ts!(Base.ts)' : 'dist/db/entity/*.js!(Base.js)',
    isDevMode ? 'src/db/entity/**/*.ts!(Base.ts)' : 'dist/db/entity/**/*.js!(Base.js)',
  ],
  migrations: [isDevMode ? 'src/db/migration/*.ts' : 'dist/db/migration/*.js'],
}

export { config, dbConfig }
