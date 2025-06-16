import { Body, Controller, Get, Path, Post, Response, Route, Tags, Delete} from "tsoa";
import { sendOk } from "../utils/routeHelper";
import {
  createConversation,
  getAllConversations,
  handleMessageInConversation,
  getConversationDetail,
  deleteConversation,
} from "../services/ConversationService";

interface CreateConversationRequest {
  filters: {
    industry?: string;
    keywords?: string[];
    source?: string[];
    dateRange?: string[];
  };
}

interface CreateConversationResponse {
  id: string;
  title: string;
  createdAt: Date;
}

interface ConversationSummary {
  id: string;
  title: string;
  createdAt: Date;
}

interface PostMessageRequest {
  message: string;
}

interface PostMessageResponse {
  conversationId: string;
  message: string;
  response: string;
}

interface GetConversationResponse {
  id: string;
  title: string;
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
}

@Tags("Conversations")
@Route("conversations")
export class ConversationController extends Controller {
  /**
   * @summary 建立新的對話（根據 filters 自動產生標題）
   */
  @Post("/")
  @Response<CreateConversationResponse>(200)
  @Response<{ error: string }>(400, "Invalid request")
  @Response<{ error: string }>(500, "Server error")
  public async createConversation(
    @Body() requestBody: CreateConversationRequest
  ): Promise<{ data: CreateConversationResponse }> {
    if (!requestBody.filters) {
      this.setStatus(400);
      return { data: null as any };
    }

    const conversation = await createConversation(requestBody.filters);
    return sendOk({
      data: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
      },
    });
  }

  /**
   * @summary 取得所有對話列表
   */
  @Get("/")
  @Response<ConversationSummary[]>(200)
  public async getConversations(): Promise<{ data: ConversationSummary[] }> {
    const conversations = await getAllConversations();
    return sendOk({ data: conversations });
  }

  /**
   * @summary 在對話中新增訊息並回傳 RAG 回應
   */
  @Post("{id}")
  public async postMessageToConversation(
    @Path() id: string,
    @Body() body: PostMessageRequest
  ): Promise<{ data: PostMessageResponse }> {
    const result = await handleMessageInConversation(id, body.message);
    return sendOk({ data: result });
  }

  /**
   * @summary 根據 ID 取得完整對話（含訊息）
   */
  @Get("{id}")
  public async getConversationDetail(
    @Path() id: string
  ): Promise<{ data: GetConversationResponse }> {
    const result = await getConversationDetail(id);
    return sendOk({ data: result });
  }

  @Delete("{id}")
  @Response<{ message: string }>(200)
  @Response<{ error: string }>(404, "Conversation not found")
  public async deleteConversation(
    @Path() id: string
  ): Promise<{ message: string }> {
    const success = await deleteConversation(id);
    if (!success) {
      this.setStatus(404);
      return { error: "Conversation not found" } as any;
    }
    return { message: "Conversation deleted" };
  }
}
