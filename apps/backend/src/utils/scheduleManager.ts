/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/naming-convention */
import Bree from 'bree'
import path from 'path'
import Crawler from '../db/entity/Crawler'
import { logger } from './logger'

/**
 * Configuration for default job folder and file.
 * Example job files include `new-file.js` and `hello.js`.
 */
const crawlerJobFolder = 'jobs'
const defaultJobFile = 'new-file.js'
const defaultJobPath = path.join(__dirname, crawlerJobFolder, defaultJobFile)

const bree = new Bree({
  root: false, // Disable default jobs directory
  jobs: [],
})

/**
 * Executes a job by name.
 */
export const runJobByName = async (name: string) => {
  try {
    await bree.run(name)
    logger.info(`[ScheduleManager] Job executed successfully: ${name}`)
  } catch (error) {
    logger.error(`[ScheduleManager] Failed to execute job: ${name}, error: ${error}`)
  }
}

/**
 * Adds and starts a schedule.
 */
const addAndStartSchedule = async (config: { name: string; cron: string; path: string }) => {
  await bree.add(config)
  await bree.start(config.name)
  logger.info(`[ScheduleManager] Schedule added and started: ${config.name}`)
}

/**
 * Removes a schedule by name.
 */
export const removeSchedule = async (name: string) => {
  try {
    await bree.remove(name)
  } catch {
    logger.info(`[ScheduleManager] No schedule found to remove: ${name}`)
  }
}

/**
 * Handles schedule creation for a list of crawlers.
 */
const handleScheduleCreation = async (cron: string, crawlers: Crawler[], options: { isInit: boolean } = { isInit: false }) => {
  for (const crawler of crawlers) {
    if (!options.isInit) await removeSchedule(crawler.name)

    const scheduleConfig = {
      name: crawler.name,
      cron,
      path: defaultJobPath,
    }

    await addAndStartSchedule(scheduleConfig)
  }
}

/**
 * Starts schedules with provided cron and crawlers.
 */
export const startSchedule = async (
  cron: string,
  crawlers: Crawler[],
  options: { isInit: boolean } = { isInit: false },
) => {
  await handleScheduleCreation(cron, crawlers, options)
}

/**
 * Enables a schedule for a specific crawler by ID.
 */
export const enableScheduleById = async (cron: string, crawler: Crawler) => {
  await removeSchedule(crawler.name)

  if (crawler.enabled && cron) {
    const scheduleConfig = {
      name: crawler.name,
      cron,
      path: defaultJobPath,
    }

    await addAndStartSchedule(scheduleConfig)
  } else {
    logger.info('[ScheduleManager] No schedule found in DB or crawler is not enabled.')
  }
}
