import { ConversationRepository } from '../repository/ConversationRepository'
import Conversation from '../db/entity/ConversationEntity'
import { MessageRepository } from '../repository/MessageRepository'

const conversationRepository = new ConversationRepository()
const messageRepository = new MessageRepository()

function generateTitle(filters: Conversation['filters']): string {
  const { dateRange, keywords, industry, source } = filters ?? {}

  const rawDate = Array.isArray(dateRange) && dateRange.length > 0 ? dateRange[0] : ''
  const date = /^\d{4}-\d{2}$/.test(rawDate)
    ? rawDate.replace('-', '年') + '月'
    : ''

  const keywordPart = keywords?.join('、') ?? ''
  const industryPart = industry ?? ''
  const sourcePart = source?.join('、') ?? ''

  return `${date}${keywordPart && keywordPart + '、'}${industryPart}${sourcePart && '' + sourcePart}新聞摘要`
}

export const createConversation = async (
  filters: Conversation['filters']
): Promise<{
  conversationId: number
  title: string
  createdAt: Date
  message: string
  response: string
}> => {
  const title = generateTitle(filters)
  const conversation = await conversationRepository.createConversation(title, filters)

  // ❗ 直接把查詢條件轉成 JSON string
  const userMessage = `查詢條件：\n${JSON.stringify(filters, null, 2)}`
  await messageRepository.saveMessage(conversation.id, 'user', userMessage)

  const ragResponse = await callPythonRagService(userMessage)
  await messageRepository.saveMessage(conversation.id, 'assistant', ragResponse)

  return {
    conversationId: conversation.id,
    title: conversation.title,
    createdAt: conversation.created_at,
    message: userMessage,
    response: ragResponse,
  }
}


export const getAllConversations = async (): Promise<
  { id: number; title: string; createdAt: Date }[]
> => {
  const conversations = await conversationRepository.findAll()
  return conversations.map(({ id, title, created_at }) => ({
    id,
    title,
    createdAt: created_at,
  }))
}

export const getConversationById = async (
  id: number
): Promise<Conversation | null> => {
  return conversationRepository.findById(id)
}

export const handleMessageInConversation = async (
  conversationId: number,
  message: string
): Promise<{ conversationId: number; message: string; response: string }> => {
  await messageRepository.saveMessage(conversationId, 'user', message)

  const ragResponse = await callPythonRagService(message)

  await messageRepository.saveMessage(conversationId, 'assistant', ragResponse)

  return {
    conversationId,
    message,
    response: ragResponse,
  }
}

export const getConversationDetail = async (
  id: number
): Promise<{
  id: number
  title: string
  messages: { role: 'user' | 'assistant'; content: string }[]
}> => {
  const conversation = await conversationRepository.findById(id)
  if (!conversation) throw new Error('Conversation not found')

  const messages = await messageRepository.findByConversation(id)

  return {
    id: conversation.id,
    title: conversation.title,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  }
}

export const deleteConversation = async (id: number): Promise<boolean> => {
  const conversation = await conversationRepository.findById(id)
  if (!conversation) return false

  await messageRepository.softDeleteByConversation(id)
  await conversationRepository.softDeleteById(id)

  return true
}


const callPythonRagService = async (query: string): Promise<string> => {
  // TODO: 換成實際 HTTP 請求
  return `已修改完成`
}
