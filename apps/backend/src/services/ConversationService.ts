import { ConversationRepository } from "../repository/ConversationRepository";
import Conversation from "../db/entity/ConversationEntity";
import { MessageRepository } from "../repository/MessageRepository";

const conversationRepository = new ConversationRepository();
const messageRepository = new MessageRepository();

function generateTitle(filters: Conversation["filters"]): string {
  const { dateRange, keywords, industry, source } = filters ?? {};

  const rawDate =
    Array.isArray(dateRange) && dateRange.length > 0 ? dateRange[0] : "";
  const date = /^\d{4}-\d{2}$/.test(rawDate)
    ? rawDate.replace("-", "年") + "月"
    : "";

  const keywordPart = keywords?.join("、") ?? "";
  const industryPart = industry ?? "";
  const sourcePart = source?.join("、") ?? "";

  return `${date}${keywordPart && keywordPart + "、"}${industryPart}${sourcePart && "" + sourcePart}新聞摘要`;
}

export const createConversation = async (
  filters: Conversation["filters"]
): Promise<{
  conversationId: number;
  title: string;
  createdAt: Date;
  message: string;
  response: string;
}> => {
  const title = generateTitle(filters);
  const conversation = await conversationRepository.createConversation(
    title,
    filters
  );

  const userMessage = `查詢條件：\n${JSON.stringify(filters, null, 2)}`;
  await messageRepository.saveMessage(conversation.id, "user", userMessage);

  // 儲存系統訊息（固定文字）
  await messageRepository.saveMessage(
    conversation.id,
    "assistant",
    "已修改完成"
  );

  // 呼叫 RAG 回應（human 角色）
  const ragResponse = await callPythonRagService(userMessage);
  await messageRepository.saveMessage(conversation.id, "human", ragResponse);

  return {
    conversationId: conversation.id,
    title: conversation.title,
    createdAt: conversation.created_at,
    message: userMessage,
    response: ragResponse,
  };
};

export const getAllConversations = async (): Promise<
  { id: number; title: string; createdAt: Date }[]
> => {
  const conversations = await conversationRepository.findAll();
  return conversations.map(({ id, title, created_at }) => ({
    id,
    title,
    createdAt: created_at,
  }));
};

export const getConversationById = async (
  id: number
): Promise<Conversation | null> => {
  return conversationRepository.findById(id);
};

export const handleMessageInConversation = async (
  conversationId: number,
  message: string
): Promise<{ conversationId: number; message: string; response: string }> => {
  // 儲存 user 訊息
  await messageRepository.saveMessage(conversationId, "user", message);

  // 儲存固定 assistant 回應
  await messageRepository.saveMessage(
    conversationId,
    "assistant",
    "已修改完成"
  );

  // 🔍 讀取整段對話紀錄
  const allMessages =
    await messageRepository.findByConversation(conversationId);

  // 取得所有 user 訊息（依照原始順序）
  const userMessages = allMessages
    .filter((m) => m.role === "user")
    .map((m) => `[user]\n${m.content}`);

  // 取得最新一筆 human 回應（倒序找第一筆）
  const latestHuman = [...allMessages]
    .reverse()
    .find((m) => m.role === "human");

  const fullQuery = [
    ...userMessages,
    latestHuman ? `[human]\n${latestHuman.content}` : "",
  ].join("\n\n");

  // 呼叫 RAG
  const ragResponse = await callPythonRagService(fullQuery);

  // 儲存 human 回應
  await messageRepository.saveMessage(conversationId, "human", ragResponse);

  return {
    conversationId,
    message,
    response: ragResponse,
  };
};

export const getConversationDetail = async (
  id: number
): Promise<{
  id: number;
  title: string;
  messages: { role: "user" | "assistant" | "human"; content: string }[];
}> => {
  const conversation = await conversationRepository.findById(id);
  if (!conversation) throw new Error("Conversation not found");

  const messages = await messageRepository.findByConversation(id);

  return {
    id: conversation.id,
    title: conversation.title,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };
};

export const deleteConversation = async (id: number): Promise<boolean> => {
  const conversation = await conversationRepository.findById(id);
  if (!conversation) return false;

  await messageRepository.softDeleteByConversation(id);
  await conversationRepository.softDeleteById(id);

  return true;
};

const callSystemService = async (query: string): Promise<string> => {
  const autoMessage = "已修改完成";
  const ragAnswer = await callPythonRagService(query);
  return `${autoMessage}\n\n---\n\n${ragAnswer}`;
};

const callPythonRagService = async (query: string): Promise<string> => {
  console.log('Query=========', query)
  try {
    console.log("[DEBUG] 傳送給 RAG 的 query:\n", query); // ← 加這一行
    const response = await fetch("http://localhost:8000/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        top_k: 3,
      }),
    });

    if (!response.ok) {
      console.error(
        "RAG server 錯誤：",
        response.status,
        await response.text()
      );
      return "系統錯誤，請稍後再試";
    }

    const data = (await response.json()) as {
      answer: string;
      sources?: string[];
    };

    if (typeof data.answer === "string") {
      return data.answer;
    } else {
      console.warn("RAG 回應格式異常：", data);
      return "RAG 回傳格式有誤";
    }
  } catch (err) {
    console.error("連接 RAG server 失敗：", err);
    return "系統無法連線至 RAG server";
  }
};
