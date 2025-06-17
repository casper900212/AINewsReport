import cors from 'cors'
import express from 'express'
import 'reflect-metadata'
import swaggerUi from 'swagger-ui-express'
import { RegisterRoutes } from './routes/routes'
import { connectDatabase } from './utils/dbHelper'
import { errorHandler } from './utils/errors'
import { logWithExpress } from './utils/logger'
import { startBreeSchedule } from './utils/scheduleManager'

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

// Routes of controller
RegisterRoutes(app)

// Error handler middleware
app.use(errorHandler())

async function startApp () {
  try {
    await connectDatabase() // 先連接 DB
    await startBreeSchedule() // 再啟動排程
  } catch (err) {
    console.error('❌ Failed to start app:', err)
    process.exit(1)
  }
}

startApp().catch((err) => {
  console.error('❌ Unhandled error while starting app:', err)
})

export default app
