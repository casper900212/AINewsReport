import { appDataSource } from '../utils/dbHelper'
import { Message } from '../db/entity/MessageEntity'
import { Repository } from 'typeorm'

export class MessageRepository {
  private repo: Repository<Message>

  constructor() {
    this.repo = appDataSource.getRepository(Message)
  }

  async saveMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<Message> {
    const message = this.repo.create({ conversationId, role, content })
    return this.repo.save(message)
  }

  async findByConversation(conversationId: string): Promise<Message[]> {
    return this.repo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    })
  }
}