import dotenv from 'dotenv'
import 'reflect-metadata'
import app from './app'
import { config } from './config'
import { logger } from './utils/logger'

dotenv.config({ path: '.env' })

logger.info(`Service environment run in: ${process.env.NODE_ENV}`)

// Start app server
app.listen(config.port)

logger.info(`Server running on port ${config.port}`)
logger.info(`You can visit the API document url on http://localhost:${config.port}/api/v1/swagger-html`)
