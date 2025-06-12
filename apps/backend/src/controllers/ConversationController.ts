import { Body, Controller, Post, Response, Route, Tags } from 'tsoa'
import { sendOk } from '../utils/routeHelper'
import { createConversation } from '../services/ConversationService'

// 直接在 Controller 裡定義 Request / Response Interface（如果沒 models）
interface CreateConversationRequest {
  title: string
}

interface CreateConversationResponse {
  id: string
  title: string
  createdAt: Date
}

@Tags('Conversations')
@Route('conversations')
export class ConversationController extends Controller {
  /**
   * @summary 建立新的對話
   */
  @Post('/')
  @Response<CreateConversationResponse>(200)
  @Response<{ error: string }>(400, 'Expected error')
  @Response<{ error: string }>(500, 'Unexpected error')
  public async createConversation (
    @Body() requestBody: CreateConversationRequest,
  ): Promise<{ data: CreateConversationResponse }> {
    const conversation = await createConversation(requestBody.title)
    return sendOk({
      data: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt
      }
    })
  }
}
