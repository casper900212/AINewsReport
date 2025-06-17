import { scheduleRepository } from '../repository/scheduleRepository'
import { startSchedule } from '../utils/scheduleManager'
import { getEnabledCrawlerList } from './crawlerService'

export const upsertSchedule = async (cron: string) => {
  const newSchedule = await scheduleRepository.upsertSchedule(cron)

  const crawlers = await getEnabledCrawlerList()
  if (crawlers && crawlers.length > 0) {
    await startSchedule(newSchedule.cron, crawlers)
  }

  return newSchedule
}

export const getSchedule = async () => {
  return await scheduleRepository.getSchedule()
}
