import { ConversationRepository } from '../repository/ConversationRepository'
import { Conversation } from '../db/entity/ConversationEntity'
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
): Promise<Conversation> => {
  const title = generateTitle(filters)
  return await conversationRepository.createConversation(title, filters)
}

export const getAllConversations = async (): Promise<
  { id: string; title: string; createdAt: Date }[]
> => {
  const conversations = await conversationRepository.findAll()
  return conversations.map(({ id, title, createdAt }) => ({
    id,
    title,
    createdAt,
  }))
}

export const getConversationById = async (
  id: string
): Promise<Conversation | null> => {
  return conversationRepository.findById(id)
}

export const handleMessageInConversation = async (
  conversationId: string,
  message: string
): Promise<{ conversationId: string; message: string; response: string }> => {
  // 儲存使用者訊息
  await messageRepository.saveMessage(conversationId, 'user', message)

  // 呼叫 RAG 模型
  const ragResponse = await callPythonRagService(message)

  // 儲存 assistant 回覆
  await messageRepository.saveMessage(conversationId, 'assistant', ragResponse)

  return {
    conversationId,
    message,
    response: ragResponse,
  }
}

export const getConversationDetail = async (
  id: string
): Promise<{
  id: string
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

const callPythonRagService = async (query: string): Promise<string> => {
  // TODO: 換成實際 HTTP 請求
  return `接RAG的回答`
}

export const deleteConversation = async (id: string): Promise<boolean> => {
  const conversation = await conversationRepository.findById(id)
  if (!conversation) return false

  await messageRepository.deleteByConversation(id)
  await conversationRepository.deleteById(id)

  return true
}
