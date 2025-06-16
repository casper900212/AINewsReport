import { appDataSource } from '../utils/dbHelper'
import { Message } from '../db/entity/MessageEntity'
import { Repository } from 'typeorm'
import Conversation from '../db/entity/ConversationEntity'

export class MessageRepository {
  private repo: Repository<Message>

  constructor() {
    this.repo = appDataSource.getRepository(Message)
  }

  async saveMessage(
    conversationId: number,
    role: 'user' | 'assistant',
    content: string
  ): Promise<Message> {
    const message = this.repo.create({
      conversation: { id: conversationId } as Conversation,
      role,
      content,
    })
    return this.repo.save(message)
  }

  async findByConversation(conversationId: number): Promise<Message[]> {
    return this.repo.find({
      where: { conversation: { id: conversationId } },
      order: { created_at: 'ASC' },
    })
  }

  async softDeleteByConversation(conversationId: number): Promise<void> {
    await this.repo.softDelete({ conversation: { id: conversationId } })
  }
}
