import { appDataSource } from '../utils/dbHelper'
import { Conversation } from '../db/entity/ConversationEntity'
import { Repository } from 'typeorm'

export class ConversationRepository {
  private repo: Repository<Conversation>

  constructor() {
    this.repo = appDataSource.getRepository(Conversation)
  }

  async createConversation(title: string): Promise<Conversation> {
    const conversation = this.repo.create({ title })
    return await this.repo.save(conversation)
  }
}
