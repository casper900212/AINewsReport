import { appDataSource } from '../utils/dbHelper'
import { Repository } from 'typeorm'
import Conversation from '../db/entity/ConversationEntity'

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
      order: { created_at: 'DESC' }, 
    })
  }

  async findById(id: number): Promise<Conversation | null> {
    return await this.repo.findOneBy({ id })
  }

  async softDeleteById(id: number): Promise<void> {
    await this.repo.softDelete({ id })
  }
}
