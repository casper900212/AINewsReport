import { ConversationRepository } from '../repository/ConversationRepository'
import { Conversation } from '../db/entity/ConversationEntity'

const conversationRepository = new ConversationRepository()

export const createConversation = async (title: string): Promise<Conversation> => {
  return await conversationRepository.createConversation(title)
}
