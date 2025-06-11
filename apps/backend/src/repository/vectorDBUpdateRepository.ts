import VectorDBUpdate from '../db/entity/VectorDBUpdate'
import { appDataSource } from '../utils/dbHelper'

export const vectorDBUpdateRepository = appDataSource.getRepository(VectorDBUpdate).extend({
  async logUpdate () {
    return await this.save(this.create())
  },

  async getLatestUpdate () {
    const [latestUpdate] = await this.find({
      select: ['updatedAt'],
      order: { updatedAt: 'DESC' },
      take: 1,
    })

    return latestUpdate || null
  },
})
