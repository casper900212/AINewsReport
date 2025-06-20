import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Response,
  Route,
  Tags,
  Delete,
} from "tsoa";
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
    type: string;
    number: number;
    industry?: string[];
    keywords?: string[];
    source?: string[];
    dateRange?: string;
  };
}

interface CreateConversationResponse {
  conversationId: number;
  title: string;
  createdAt: Date;
  message: string;
  response: string;
}

interface ConversationSummary {
  id: number;
  title: string;
  createdAt: Date;
}

interface PostMessageRequest {
  message: string;
}

interface PostMessageResponse {
  conversationId: number;
  message: string;
  response: string;
}

interface GetConversationResponse {
  id: number;
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
   * @summary 建立新的對話（並馬上回應 RAG 結果）
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

    const result = await createConversation(requestBody.filters);
    return sendOk({ data: result });
  }

  @Get("/")
  @Response<ConversationSummary[]>(200)
  public async getConversations(): Promise<{ data: ConversationSummary[] }> {
    const conversations = await getAllConversations();
    return sendOk({ data: conversations });
  }

  @Post("{id}")
  public async postMessageToConversation(
    @Path() id: number,
    @Body() body: PostMessageRequest
  ): Promise<{ data: PostMessageResponse }> {
    const result = await handleMessageInConversation(id, body.message);
    return sendOk({ data: result });
  }

  @Get("{id}")
  public async getConversationDetail(
    @Path() id: number
  ): Promise<{ data: GetConversationResponse }> {
    const result = await getConversationDetail(id);
    return sendOk({ data: result });
  }

  @Delete("{id}")
  @Response<{ message: string }>(200)
  @Response<{ error: string }>(404, "Conversation not found")
  public async deleteConversation(
    @Path() id: number
  ): Promise<{ message: string }> {
    const success = await deleteConversation(id);
    if (!success) {
      this.setStatus(404);
      return { error: "Conversation not found" } as any;
    }
    return { message: "Conversation deleted" };
  }
}
