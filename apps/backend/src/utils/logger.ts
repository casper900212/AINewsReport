/* eslint-disable require-await */
/* eslint-disable @typescript-eslint/ban-types */
import { Request, Response } from 'express'
import winston from 'winston'
import { config } from '../config'

// logger.error('logger console error')     // 0
// logger.warn('logger console warn')       // 1
// logger.info('logger console info')       // 2
// logger.http('logger console http')       // 3
// logger.verbose('logger console verbose') // 4
// logger.debug('logger console debug')     // 5
// logger.silly('logger console debug')     // 6
const { transports, format, createLogger } = winston

const transportsConfig = {
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.align(),
    format.printf((info) => `${info.timestamp} - ${info.level}: ${info.message}`),
  ),
}

const logger = createLogger({
  level: config.debugLogging ? 'debug' : config.isProdMode ? 'warn' : 'info',
  silent: config.silentLogging,
  transports: [
    // - Write to all logs with specified level to console.
    new transports.Console(transportsConfig),
  ],
})

const logWithExpress = () => {
  winston.configure({
    level: config.debugLogging ? 'debug' : config.isProdMode ? 'warn' : 'info',
    transports: [
      //
      // - Write all logs error (and below) to `error.log`.
      // new transports.File({ filename: 'error.log', level: 'error' }),
      //
      // - Write to all logs with specified level to console.
      new transports.Console(transportsConfig),
    ],
  })

  return async (req: Request, res: Response, next: Function): Promise<void> => {
    const start = new Date().getTime()

    // koa used. This could be change by user, don't trust it. If need real ip, try to get it form tcp layer.
    const remoteAddr = req.ips.length > 0 ? req.ips[0] : req.ip
    const remoteUser = req.ips.length > 0 ? req.ips : ''
    const contentLength = req.headers['content-length'] || 0
    const httpReferer = req.headers.referer || ''
    const userAgent = req.headers['user-agent'] || ''

    next()

    const ms = new Date().getTime() - start

    let logLevel: string
    if (res.statusCode >= 500) {
      logLevel = 'error'
    } else if (res.statusCode >= 400) {
      logLevel = 'warn'
    } else {
      logLevel = 'info'
    }

    const resMsg = `${remoteAddr} - ${remoteUser} - "${req.method} ${req.originalUrl} ${req.httpVersion} ${res.statusCode} ${contentLength} "-"${httpReferer}" "${userAgent}" ${ms}ms`

    winston.log(logLevel, resMsg)
  }
}

export { logger, logWithExpress }
