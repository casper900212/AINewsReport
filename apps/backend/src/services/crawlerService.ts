import { CreateCrawlerModel, UpdateCrawlerModel } from '../models/crawlerModel'
import { userRepository } from '../repository/crawlerRepository'

export const createCrawler = async (payload: CreateCrawlerModel) => {
  const crawler = await userRepository.createCrawler(payload)
  return crawler
}

export const getCrawlerList = async () => {
  const crawlers = await userRepository.getCrawlerList()
  return crawlers
}

export const updateCrawler = async (id: number, payload: UpdateCrawlerModel) => {
  return await userRepository.updateCrawlerById(id, payload)
}

export const deleteCrawler = async (id: number) => {
  return await userRepository.deleteCrawlerById(id)
}

export const executeCrawler = async (id: number) => {
  // TODO: 呼叫 python 爬蟲腳本
  const fakeResponse = { count: 100 }
  await userRepository.updateCrawlerLastRun(id, new Date())

  return { count: fakeResponse.count, status: 'success' }
}
