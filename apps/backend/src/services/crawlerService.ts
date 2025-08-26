import { CreateCrawlerModel, RunCrawlerModel, UpdateCrawlerModel } from '../models/crawlerModel'
import { crawlerRepository } from '../repository/crawlerRepository'
import { logger } from '../utils/logger'
import { enableScheduleById, removeSchedule, runJobByName } from '../utils/scheduleManager'
// eslint-disable-next-line import/no-cycle
import { getSchedule } from './scheduleService'

export const createCrawler = async (payload: CreateCrawlerModel) => {
  const crawler = await crawlerRepository.createCrawler(payload)
  return crawler
}

export const getCrawlerById = async (id: number) => {
  const crawler = await crawlerRepository.getCrawlerById(id)
  return crawler
}

export const getEnabledCrawlerList = async () => {
  const crawlers = await crawlerRepository.getEnabledCrawlerList()
  return crawlers
}

export const getCrawlerList = async () => {
  const crawlers = await crawlerRepository.getCrawlerList()
  return crawlers
}

export const updateCrawler = async (id: number, payload: UpdateCrawlerModel) => {
  const crawler = await crawlerRepository.updateCrawlerById(id, payload)

  if (payload.enabled) {
    const schedule = await getSchedule()

    if (schedule?.cron) {
      await enableScheduleById(schedule.cron, crawler)
    }
  }

  return crawler
}

export const deleteCrawler = async (id: number) => {
  const removedCrawler = await crawlerRepository.deleteCrawlerById(id)

  await removeSchedule(removedCrawler.name)

  return removedCrawler
}

export const executeCrawler = async (id: number, payload: RunCrawlerModel) => {
  const { name } = await getCrawlerById(id)

  logger.info(`Executing crawler: ${name}, start date: ${payload.start}, end date: ${payload.end}.`)
  // TODO: 呼叫 python 爬蟲腳本
  await runJobByName(name)

  const fakeResponse = { count: 100 }
  await crawlerRepository.updateCrawlerLastRun(id, new Date())

  return { count: fakeResponse.count, status: 'success' }
}
