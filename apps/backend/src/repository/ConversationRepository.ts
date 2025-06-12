import { appDataSource } from '../utils/dbHelper'
import { Conversation } from '../db/entity/ConversationEntity'
import { Repository } from 'typeorm'

export class ConversationRepository {
  private repo: Repository<Conversation>

  constructor() {
    this.repo = appDataSource.getRepository(Conversation)
  }

  async createConversation(
    title: string,
    filters: Conversation['filters']
  ): Promise<Conversation> {
    const conversation = this.repo.create({ title, filters })
    return await this.repo.save(conversation)
  }

  async findAll(): Promise<Conversation[]> {
    return await this.repo.find({
      order: { createdAt: 'DESC' },
    })
  }

  async findById(id: string): Promise<Conversation | null> {
    return await this.repo.findOneBy({ id })
  }
}
