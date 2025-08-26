import cors from 'cors'
import express from 'express'
import 'reflect-metadata'
import swaggerUi from 'swagger-ui-express'
import { RegisterRoutes } from './routes/routes'
import { getEnabledCrawlerList, getSchedule } from './services'
import { connectDatabase } from './utils/dbHelper'
import { errorHandler } from './utils/errors'
import { logWithExpress } from './utils/logger'
import { startSchedule } from './utils/scheduleManager'

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

    const [schedule, crawlers] = await Promise.all([
      getSchedule(),
      getEnabledCrawlerList(),
    ])

    if (schedule && crawlers && crawlers.length > 0) {
      await startSchedule(schedule.cron, crawlers, { isInit: true })
    } else {
      console.warn('⚠️ No crawlers or schedule configured. Skipping cron job setup.')
    }
  } catch (err) {
    console.error('❌ Failed to start app:', err)
    process.exit(1)
  }
}

startApp().catch((err) => {
  console.error('❌ Unhandled error while starting app:', err)
})

export default app
