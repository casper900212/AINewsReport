import Schedule from '../db/entity/Schedule'
import { appDataSource } from '../utils/dbHelper'

export const scheduleRepository = appDataSource.getRepository(Schedule).extend({
  async getSchedule () {
    const [schedule] = await this.find({
      order: { id: 'ASC' },
      take: 1,
    })

    return schedule
  },

  async createSchedule (cron: string) {
    const schedule = this.create({ cron })
    return await this.save(schedule)
  },

  async upsertSchedule (cron: string) {
    const schedule = await this.getSchedule()
    if (schedule) {
      schedule.cron = cron
      return await this.save(schedule)
    }

    return await this.createSchedule(cron)
  },
})
