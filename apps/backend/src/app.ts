import express from 'express'
import cors from 'cors'
import 'reflect-metadata'
import swaggerUi from 'swagger-ui-express'
import { RegisterRoutes } from './routes/routes'
import { connectDatabase } from './utils/dbHelper'
import { errorHandler } from './utils/errors'
import { logWithExpress } from './utils/logger'

const app = express()

// Cors domain
app.use(cors())

// Logger middleware
app.use(logWithExpress())

// Enable bodyParser
app.use(express.json())

// Public folder
app.use(express.static('public'))

// Route of swagger docs
app.use(
  '/api/v1/swagger-html',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: {
      url: '/swagger.json',
    },
  }),
)

// Connect to DB
app.use(connectDatabase())

// Routes of controller
RegisterRoutes(app)

// Error handler middleware
app.use(errorHandler())

export default app
