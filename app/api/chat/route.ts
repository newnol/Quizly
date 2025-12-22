import { consumeStream, convertToModelMessages, streamText, type UIMessage } from "ai"

export const maxDuration = 30

const systemPrompt = `Bạn là một giảng viên chuyên về Mạng Máy Tính. Bạn giúp sinh viên hiểu rõ các khái niệm về:
- TCP/IP và các giao thức tầng Transport
- Quality of Service (QoS) và quản lý băng thông
- IPv6 và quá trình chuyển đổi từ IPv4
- Routing (OSPF, BGP, MPLS)
- Software-Defined Networking (SDN) và OpenFlow
- Virtualization và Container (Docker, Kubernetes)
- Cloud Computing và các mô hình dịch vụ

Quy tắc:
1. Giải thích ngắn gọn, dễ hiểu, sử dụng ví dụ thực tế
2. Nếu người dùng hỏi về một câu quiz cụ thể, giải thích tại sao đáp án đúng là đúng và các đáp án sai là sai
3. Sử dụng tiếng Việt để trả lời
4. Nếu cần minh họa bằng sơ đồ, mô tả chi tiết để người dùng có thể hình dung
5. Khuyến khích người dùng đặt thêm câu hỏi nếu chưa hiểu`

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const prompt = convertToModelMessages(messages)

  const result = streamText({
    model: "openai/gpt-4o-mini",
    system: systemPrompt,
    messages: prompt,
    abortSignal: req.signal,
    maxOutputTokens: 2000,
  })

  return result.toUIMessageStreamResponse({
    consumeSseStream: consumeStream,
  })
}
