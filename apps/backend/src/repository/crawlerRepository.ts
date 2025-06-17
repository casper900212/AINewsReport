import { CreateCrawlerModel, UpdateCrawlerModel } from 'models'
import Crawler from '../db/entity/Crawler'
import { appDataSource } from '../utils/dbHelper'
import { NotFoundError } from '../utils/errors'

export const crawlerRepository = appDataSource.getRepository(Crawler).extend({
  async getCrawlerList () {
    const crawlers = await this.find({
      select: ['id', 'name', 'scriptFilename', 'enabled', 'lastRun'],
    })
    return crawlers
  },

  async getEnabledCrawlerList () {
    const crawlers = await this.find({
      select: ['id', 'name', 'scriptFilename', 'lastRun'],
      where: { enabled: true },
    })
    return crawlers
  },

  async getCrawlerById (id: number) {
    const crawler = await this.findOne({
      where: { id },
    })

    if (!crawler) {
      throw new NotFoundError(`Crawler with id ${id} not found`)
    }

    return crawler
  },

  async createCrawler (payload: CreateCrawlerModel) {
    const newCrawler = this.create()

    newCrawler.name = payload.name
    newCrawler.scriptFilename = payload.scriptFilename
    newCrawler.enabled = payload.enabled

    return await this.save(newCrawler)
  },

  async updateCrawlerById (id: number, payload: UpdateCrawlerModel) {
    const crawler = await this.getCrawlerById(id)

    crawler.name = payload.name || crawler.name
    crawler.enabled = payload.enabled !== undefined ? payload.enabled : crawler.enabled

    return await this.save(crawler)
  },

  async updateCrawlerLastRun (id: number, lastRun: Date) {
    const crawler = await this.getCrawlerById(id)

    crawler.lastRun = lastRun

    return await this.save(crawler)
  },

  async deleteCrawlerById (id: number) {
    const crawler = await this.getCrawlerById(id)

    return await this.remove(crawler)
  },
})
