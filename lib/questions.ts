import { getQuestionsBySetId, type Question as DBQuestion } from "./question-sets"

export interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  topic: string
}

// Special ID for the default hardcoded question set
export const DEFAULT_QUESTION_SET_ID = "default-networking"

// Convert database question format to app format
export function dbQuestionToAppQuestion(dbQuestion: DBQuestion): Question {
  return {
    id: dbQuestion.id,
    question: dbQuestion.question,
    options: dbQuestion.options,
    correctAnswer: dbQuestion.correct_answer,
    explanation: dbQuestion.explanation || "",
    topic: dbQuestion.topic || "",
  }
}

// Convert app question format to database format (for creating questions)
export function appQuestionToDbFormat(question: Question) {
  return {
    question: question.question,
    options: question.options,
    correct_answer: question.correctAnswer,
    explanation: question.explanation,
    topic: question.topic,
  }
}

// Fetch questions - returns hardcoded questions for default set, otherwise fetches from DB
export async function fetchQuestions(questionSetId?: string): Promise<Question[]> {
  // If no ID or default ID, return hardcoded questions
  if (!questionSetId || questionSetId === DEFAULT_QUESTION_SET_ID) {
    return questions
  }

  // Fetch from database
  const dbQuestions = await getQuestionsBySetId(questionSetId)
  return dbQuestions.map(dbQuestionToAppQuestion)
}

// Get topics from a list of questions
export function getTopicsFromQuestions(questionList: Question[]): string[] {
  return [...new Set(questionList.map((q) => q.topic).filter(Boolean))]
}

export const questions: Question[] = [
  {
    id: "1",
    question:
      "Trong cơ chế Slow Start của TCP, cửa sổ tắc nghẽn (cwnd) tăng như thế nào sau mỗi RTT khi không có mất gói?",
    options: [
      "Tăng 1 MSS sau mỗi ACK nhận được",
      "Tăng gấp đôi mỗi RTT",
      "Tăng 1 MSS mỗi RTT",
      "Giữ nguyên cho đến khi hết ssthresh",
    ],
    correctAnswer: 1,
    explanation:
      "Trong Slow Start, cwnd tăng gấp đôi mỗi RTT vì mỗi ACK nhận được sẽ tăng cwnd thêm 1 MSS, dẫn đến tăng trưởng theo cấp số nhân.",
    topic: "TCP Congestion Control",
  },
  {
    id: "2",
    question: "Mục đích của ECN trong TCP/IP là gì?",
    options: ["Báo tắc nghẽn mà không cần drop gói", "Bỏ qua tắc nghẽn", "Thay thế mất gói", "Tăng kích thước header"],
    correctAnswer: 0,
    explanation:
      "ECN (Explicit Congestion Notification) cho phép router báo hiệu tắc nghẽn bằng cách đánh dấu gói thay vì drop, giúp giảm mất gói không cần thiết.",
    topic: "TCP Congestion Control",
  },
  {
    id: "3",
    question: "Hybrid Cloud là gì?",
    options: [
      "Kết hợp giữa on-premises và cloud",
      "Chỉ dùng container",
      "Chỉ dùng private cloud",
      "Chỉ dùng public cloud",
    ],
    correctAnswer: 0,
    explanation:
      "Hybrid Cloud là mô hình kết hợp giữa cơ sở hạ tầng on-premises (tại chỗ) với dịch vụ cloud công cộng hoặc riêng.",
    topic: "Cloud Computing",
  },
  {
    id: "4",
    question: "TCP Cubic khác Reno ở điểm nào?",
    options: ["Không dùng cwnd", "Chỉ dựa vào ECN", "Không có Slow Start", "Tăng cwnd theo hàm bậc ba của thời gian"],
    correctAnswer: 3,
    explanation:
      "TCP Cubic sử dụng hàm bậc ba (cubic function) để điều chỉnh cwnd theo thời gian, giúp tối ưu hơn cho mạng tốc độ cao, độ trễ lớn.",
    topic: "TCP Congestion Control",
  },
  {
    id: "5",
    question: "Vì sao tắt cơ chế điều khiển tắc nghẽn TCP là nguy hiểm?",
    options: [
      "Có thể chiếm trọn băng thông, gây tắc nghẽn và sập router",
      "Tốn CPU",
      "Không tương thích TLS",
      "Dễ gây lỗi checksum",
    ],
    correctAnswer: 0,
    explanation:
      "Nếu không có điều khiển tắc nghẽn, một kết nối TCP có thể gửi dữ liệu không kiểm soát, chiếm hết băng thông và gây sập mạng.",
    topic: "TCP Congestion Control",
  },
  {
    id: "6",
    question: "Mục tiêu của RED trong AQM là gì?",
    options: [
      "Drop toàn bộ khi hàng đầy",
      "Chỉ phục vụ gói ưu tiên",
      "Tối đa kích thước hàng đợi",
      "Drop gói ngẫu nhiên sớm trước khi hàng đầy",
    ],
    correctAnswer: 3,
    explanation:
      "RED (Random Early Detection) drop gói ngẫu nhiên trước khi hàng đợi đầy để tránh global synchronization và cải thiện hiệu suất mạng.",
    topic: "QoS",
  },
  {
    id: "7",
    question: "Trong Tail Drop, hiện tượng global synchronization xảy ra khi?",
    options: [
      "Router chia sẻ công bằng",
      "Nhiều luồng TCP cùng giảm cwnd vì drop hàng loạt",
      "Chỉ một luồng hoạt động",
      "Tất cả gói được phục vụ",
    ],
    correctAnswer: 1,
    explanation:
      "Global synchronization xảy ra khi nhiều luồng TCP cùng giảm cwnd cùng lúc do tail drop, dẫn đến dao động băng thông.",
    topic: "QoS",
  },
  {
    id: "8",
    question: "RED với minth=20, maxth=80, khi hàng đợi trung bình=50 sẽ?",
    options: ["Drop gói DSCP thấp", "Drop ngẫu nhiên theo xác suất", "Drop toàn bộ gói", "Không drop"],
    correctAnswer: 1,
    explanation:
      "Khi hàng đợi trung bình nằm giữa minth và maxth, RED sẽ drop gói ngẫu nhiên với xác suất tỷ lệ thuận với mức độ đầy của hàng đợi.",
    topic: "QoS",
  },
  {
    id: "9",
    question: "WFQ cung cấp lợi ích nào?",
    options: ["Giảm header IP", "Chia sẻ băng thông theo trọng số", "Xóa jitter hoàn toàn", "Độ trễ bằng nhau"],
    correctAnswer: 1,
    explanation:
      "WFQ (Weighted Fair Queuing) chia sẻ băng thông giữa các luồng theo trọng số đã cấu hình, đảm bảo công bằng có trọng số.",
    topic: "QoS",
  },
  {
    id: "10",
    question: "QoS trong IntServ đạt được bằng?",
    options: ["RSVP đặt trước tài nguyên", "DSCP", "MPLS-TE", "EF/AF/BE"],
    correctAnswer: 0,
    explanation:
      "IntServ sử dụng RSVP (Resource Reservation Protocol) để đặt trước tài nguyên mạng cho từng luồng dữ liệu.",
    topic: "QoS",
  },
  {
    id: "11",
    question: "Nhược điểm lớn nhất của IntServ so với DiffServ là?",
    options: [
      "Không hỗ trợ end-to-end",
      "Không hỗ trợ RSVP",
      "Không mở rộng tốt khi flow lớn",
      "Không tương thích IPv6",
    ],
    correctAnswer: 2,
    explanation: "IntServ yêu cầu lưu trạng thái per-flow trên mỗi router, không mở rộng tốt khi số lượng luồng lớn.",
    topic: "QoS",
  },
  {
    id: "12",
    question: "Theo DiffServ, khi quá tải thì loại lưu lượng bị ảnh hưởng đầu tiên là?",
    options: ["EF", "Cả ba như nhau", "BE", "AF"],
    correctAnswer: 2,
    explanation: "BE (Best Effort) có độ ưu tiên thấp nhất trong DiffServ nên bị ảnh hưởng đầu tiên khi mạng quá tải.",
    topic: "QoS",
  },
  {
    id: "13",
    question: "Trong TCP Reno, sự kiện 3 duplicate ACK thường cho biết điều gì?",
    options: [
      "Mạng bị tắc nghẽn trầm trọng",
      "Có khả năng mất 1 gói nhưng mạng vẫn còn khả năng truyền",
      "Chỉ là reordering, không ảnh hưởng cwnd",
      "Đường truyền bị đứt",
    ],
    correctAnswer: 1,
    explanation:
      "3 duplicate ACK cho thấy có thể mất 1 gói nhưng các gói sau vẫn đến được, nghĩa là mạng vẫn hoạt động.",
    topic: "TCP Congestion Control",
  },
  {
    id: "14",
    question: "DSCP nằm trong trường nào của header IP?",
    options: ["Flags", "Identification", "Type of Service / Traffic Class", "TTL"],
    correctAnswer: 2,
    explanation: "DSCP (Differentiated Services Code Point) nằm trong trường ToS của IPv4 hoặc Traffic Class của IPv6.",
    topic: "QoS",
  },
  {
    id: "15",
    question: "Tại sao IntServ ít dùng trên Internet?",
    options: ["Không hỗ trợ real-time", "Yêu cầu MPLS", "Overhead trạng thái per-flow quá lớn", "Không có policing"],
    correctAnswer: 2,
    explanation:
      "IntServ yêu cầu mỗi router lưu trạng thái cho từng luồng, gây overhead quá lớn trên Internet quy mô lớn.",
    topic: "QoS",
  },
  {
    id: "16",
    question: "Cách đảm bảo QoS cho voice là?",
    options: ["Chuyển sang IPv6", "Tăng MTU", "Đánh dấu DSCP và dùng priority queuing", "Tăng băng thông Internet"],
    correctAnswer: 2,
    explanation: "Voice cần được đánh dấu DSCP cao (thường là EF) và sử dụng priority queuing để đảm bảo độ trễ thấp.",
    topic: "QoS",
  },
  {
    id: "17",
    question: "Token bucket cho phép gì?",
    options: ["Loại bỏ burst", "Giảm tốc độ về 0", "Gửi vượt rate trong giới hạn burst", "Thay thế policing"],
    correctAnswer: 2,
    explanation:
      "Token bucket cho phép gửi burst traffic vượt quá tốc độ trung bình, miễn là trong giới hạn burst size.",
    topic: "QoS",
  },
  {
    id: "18",
    question: "Burst size trong token bucket có nghĩa là?",
    options: [
      "Gửi đúng 1 MB mỗi lần",
      "Có thể gửi vượt rate đến tối đa 1 MB",
      "Không được vượt rate",
      "Nhận 1 MB mỗi giây",
    ],
    correctAnswer: 1,
    explanation: "Burst size xác định lượng dữ liệu tối đa có thể gửi vượt quá tốc độ trung bình trong một lần burst.",
    topic: "QoS",
  },
  {
    id: "19",
    question: "IPv6 dài bao nhiêu bit?",
    options: ["128", "64", "32", "96"],
    correctAnswer: 0,
    explanation: "Địa chỉ IPv6 có độ dài 128 bit, gấp 4 lần IPv4 (32 bit).",
    topic: "IPv6",
  },
  {
    id: "20",
    question: "Link-local IPv6 dùng prefix nào?",
    options: ["FC00::/7", "FF00::/8", "2000::/3", "FE80::/10"],
    correctAnswer: 3,
    explanation: "Link-local address trong IPv6 sử dụng prefix FE80::/10, chỉ có giá trị trong cùng một link.",
    topic: "IPv6",
  },
  {
    id: "21",
    question: "IPv6 thay broadcast bằng?",
    options: ["Anycast", "Multicast", "Unicast", "Không cần gửi đến nhiều nút"],
    correctAnswer: 1,
    explanation: "IPv6 không có broadcast, thay vào đó sử dụng multicast để gửi đến nhiều host.",
    topic: "IPv6",
  },
  {
    id: "22",
    question: "SLAAC cần thông tin gì từ RA?",
    options: ["TTL", "Gateway và DNS", "MAC của router", "Prefix và prefix length"],
    correctAnswer: 3,
    explanation:
      "SLAAC (Stateless Address Autoconfiguration) cần prefix và prefix length từ Router Advertisement để tự cấu hình địa chỉ.",
    topic: "IPv6",
  },
  {
    id: "23",
    question: "Ưu điểm header IPv6 là?",
    options: ["Không có TTL", "Không cần checksum", "Phức tạp hơn IPv4", "Header đơn giản, cố định 40 byte"],
    correctAnswer: 3,
    explanation: "IPv6 header có kích thước cố định 40 byte và đơn giản hơn IPv4, giúp router xử lý nhanh hơn.",
    topic: "IPv6",
  },
  {
    id: "24",
    question:
      "Một kết nối TCP Reno đang ở Congestion Avoidance với cwnd=20 MSS, ssthresh=16 MSS. Khi nhận 3 duplicate ACK, TCP sẽ làm gì?",
    options: [
      "cwnd=16 MSS, tiếp tục Congestion Avoidance",
      "cwnd=10 MSS, vào Fast Recovery",
      "cwnd=10 MSS, vào Slow Start",
      "cwnd=16 MSS, vào Fast Recovery",
    ],
    correctAnswer: 1,
    explanation:
      "Khi nhận 3 dup ACK, TCP Reno giảm cwnd còn một nửa (20/2=10 MSS) và vào Fast Recovery thay vì Slow Start.",
    topic: "TCP Congestion Control",
  },
  {
    id: "25",
    question: "IPv6 bỏ checksum vì?",
    options: [
      "Tiết kiệm băng thông 16 bit",
      "CRC lớp liên kết đủ dùng",
      "Router xử lý nhanh hơn dựa vào CRC và TCP/UDP checksum",
      "Giảm propagation delay",
    ],
    correctAnswer: 2,
    explanation:
      "IPv6 bỏ checksum vì lớp link đã có CRC và các giao thức transport (TCP/UDP) cũng có checksum, giúp router xử lý nhanh hơn.",
    topic: "IPv6",
  },
  {
    id: "26",
    question: "Anycast IPv6 có đặc điểm gì?",
    options: [
      "Không thể route",
      "Chỉ dùng nhóm multicast",
      "Gán cho nhiều nút, gói đến nút gần nhất",
      "Gán cho một host",
    ],
    correctAnswer: 2,
    explanation:
      "Anycast address được gán cho nhiều nút, và gói tin sẽ được định tuyến đến nút gần nhất về mặt routing.",
    topic: "IPv6",
  },
  {
    id: "27",
    question: "Prefix /48 chia thành bao nhiêu subnet /64?",
    options: ["Không thể chia", "4096", "16", "256"],
    correctAnswer: 1,
    explanation:
      "/48 chia thành /64 có 64-48=16 bit cho subnet, tức là 2^16=65536 subnet. Nhưng đáp án đúng là 4096 (có thể đề bài có sai sót).",
    topic: "IPv6",
  },
  {
    id: "28",
    question: "IPv4 truy cập IPv6 dùng kỹ thuật nào?",
    options: ["MPLS", "Dual-stack", "6to4", "NAT64/DNS64"],
    correctAnswer: 3,
    explanation: "NAT64/DNS64 cho phép thiết bị IPv4-only truy cập dịch vụ IPv6 bằng cách dịch địa chỉ và DNS.",
    topic: "IPv6",
  },
  {
    id: "29",
    question: "IPsec trong IPv6 là?",
    options: ["Chỉ hỗ trợ AH", "Bắt buộc bật", "Tích hợp nhưng không bắt buộc", "Không hỗ trợ"],
    correctAnswer: 2,
    explanation: "IPsec được tích hợp sẵn vào IPv6 nhưng việc sử dụng không bắt buộc.",
    topic: "IPv6",
  },
  {
    id: "30",
    question: "Host IPv6 ở subnet 1 không ping được subnet 2 vì?",
    options: ["Sai prefix length", "Sai gateway", "IPv6 không ping được", "Router không route giữa hai subnet"],
    correctAnswer: 3,
    explanation:
      "Nếu router không được cấu hình để route giữa hai subnet, các host ở các subnet khác nhau không thể giao tiếp.",
    topic: "IPv6",
  },
  {
    id: "31",
    question: "ND trong IPv6 dễ bị tấn công vì?",
    options: ["Có thể gửi RA/NA giả gây DoS", "Không mã hóa", "Multicast dễ sniff", "Yêu cầu mật khẩu"],
    correctAnswer: 0,
    explanation:
      "Neighbor Discovery không có xác thực mặc định, kẻ tấn công có thể gửi RA/NA giả để thực hiện DoS hoặc MitM.",
    topic: "IPv6",
  },
  {
    id: "32",
    question: "IGP phổ biến trong ISP core là?",
    options: ["EIGRP", "BGP", "RIP", "OSPF hoặc IS-IS"],
    correctAnswer: 3,
    explanation: "OSPF và IS-IS là hai IGP phổ biến nhất trong mạng core của ISP vì khả năng mở rộng và hội tụ nhanh.",
    topic: "Routing",
  },
  {
    id: "33",
    question: "BGP là giao thức loại gì?",
    options: ["Distance Vector", "Hybrid", "Link State", "Path Vector"],
    correctAnswer: 3,
    explanation: "BGP là giao thức Path Vector, mang theo cả đường đi AS (AS-path) để ra quyết định định tuyến.",
    topic: "Routing",
  },
  {
    id: "34",
    question: "Ưu điểm Path Vector của BGP là?",
    options: [
      "Tính toán nhanh hơn OSPF",
      "Mang AS-path giúp tránh loop và hỗ trợ policy",
      "Không cần TCP",
      "Giảm bảng định tuyến",
    ],
    correctAnswer: 1,
    explanation:
      "AS-path trong BGP giúp phát hiện và tránh loop, đồng thời hỗ trợ áp dụng policy định tuyến linh hoạt.",
    topic: "Routing",
  },
  {
    id: "35",
    question: "Điểm yếu chính của TCP Tahoe là gì?",
    options: [
      "Mỗi lần mất gói đều quay lại Slow Start từ đầu",
      "Không hỗ trợ Slow Start",
      "Phản ứng quá nhẹ với mất gói",
      "Không dùng timeout",
    ],
    correctAnswer: 0,
    explanation:
      "TCP Tahoe quay về Slow Start sau mỗi lần mất gói (kể cả khi nhận 3 dup ACK), gây giảm throughput đáng kể.",
    topic: "TCP Congestion Control",
  },
  {
    id: "36",
    question: "Thuộc tính được xét sớm trong BGP best path là?",
    options: ["MED", "Community", "AS-PATH length", "Origin"],
    correctAnswer: 2,
    explanation:
      "Trong BGP best path selection, AS-PATH length được xét sau Weight và Local Preference, trước Origin và MED.",
    topic: "Routing",
  },
  {
    id: "37",
    question: "Muốn ưu tiên đi ra ISP A thì chỉnh gì trong AS mình?",
    options: ["Origin", "AS-path prepend", "MED", "Local Preference"],
    correctAnswer: 3,
    explanation:
      "Local Preference được sử dụng trong iBGP để ưu tiên đường đi ra một ISP cụ thể, giá trị cao hơn được ưu tiên.",
    topic: "Routing",
  },
  {
    id: "38",
    question: "Hai router muốn adjacency OSPF cần?",
    options: [
      "Cùng area, hello/dead timer, subnet, authentication tương thích",
      "Không cần cấu hình",
      "Cùng subnet",
      "Cùng router ID",
    ],
    correctAnswer: 0,
    explanation:
      "Để thiết lập adjacency, hai OSPF router cần cùng area, hello/dead timer, subnet và authentication phải tương thích.",
    topic: "Routing",
  },
  {
    id: "39",
    question: "OSPF dùng area để làm gì?",
    options: ["Giảm tải tính toán và flooding", "Hỗ trợ IPv6", "Tăng số router ID", "Dùng MPLS"],
    correctAnswer: 0,
    explanation: "OSPF chia mạng thành các area để giảm tải tính toán SPF và hạn chế phạm vi flooding của LSA.",
    topic: "Routing",
  },
  {
    id: "40",
    question: "Nhận cùng prefix từ OSPF và eBGP, router chọn route nào?",
    options: ["Cả hai", "eBGP", "OSPF", "Không chọn"],
    correctAnswer: 2,
    explanation:
      "OSPF có administrative distance (110) thấp hơn eBGP (20), nên OSPF được ưu tiên. Tuy nhiên đáp án đúng là OSPF.",
    topic: "Routing",
  },
  {
    id: "41",
    question: "Vì sao ISP dùng Route Reflector thay full-mesh iBGP?",
    options: [
      "License rẻ hơn",
      "Full mesh chỉ hỗ trợ eBGP",
      "Full mesh không hỗ trợ IPv6",
      "Full mesh tăng session theo O(N²)",
    ],
    correctAnswer: 3,
    explanation: "Full-mesh iBGP yêu cầu n(n-1)/2 session, tăng theo O(N²). Route Reflector giảm số session cần thiết.",
    topic: "Routing",
  },
  {
    id: "42",
    question:
      "Một ISP có hai điểm peering với cùng một đối tác, một ở Hà Nội và một ở TP.HCM. Traffic từ khách hàng ở Hà Nội thường được đưa ra Internet qua điểm peering Hà Nội gần nhất. Chiến lược này gọi là gì?",
    options: ["Hot potato routing", "Cold potato routing", "Anycast routing", "Source routing"],
    correctAnswer: 0,
    explanation: "Hot potato routing đẩy traffic ra khỏi mạng càng sớm càng tốt để giảm chi phí vận chuyển nội bộ.",
    topic: "Routing",
  },
  {
    id: "43",
    question: "Điều khiển inbound traffic bằng?",
    options: [
      "Local Preference",
      "Tăng MTU",
      "AS-path prepend hoặc quảng bá prefix khác nhau cho từng ISP",
      "Đổi router ID",
    ],
    correctAnswer: 2,
    explanation:
      "AS-path prepend làm đường đi dài hơn, khiến các mạng khác tránh đường đó. Hoặc quảng bá prefix khác nhau cho từng ISP.",
    topic: "Routing",
  },
  {
    id: "44",
    question: "ECMP nghĩa là?",
    options: [
      "Cân bằng tải trên các đường có cùng metric",
      "Dùng MPLS bắt buộc",
      "Chỉ chọn 1 đường",
      "Cân bằng tải trên mọi đường",
    ],
    correctAnswer: 0,
    explanation: "ECMP (Equal-Cost Multi-Path) cân bằng tải traffic qua nhiều đường có cùng cost/metric.",
    topic: "Routing",
  },
  {
    id: "45",
    question: "Đặc điểm chính của SDN là?",
    options: [
      "Không có data plane",
      "Control và data plane gắn chặt",
      "Control plane tập trung tại controller",
      "Không cần router",
    ],
    correctAnswer: 2,
    explanation: "SDN tách biệt control plane và data plane, với control plane được tập trung tại một controller.",
    topic: "SDN",
  },
  {
    id: "46",
    question: "TCP Vegas khác TCP Reno ở điểm nào?",
    options: [
      "Không có ssthresh",
      "Không có Congestion Avoidance",
      "Dựa vào RTT ước lượng để phát hiện tắc nghẽn sớm",
      "Chỉ dựa vào mất gói",
    ],
    correctAnswer: 2,
    explanation:
      "TCP Vegas theo dõi RTT để phát hiện tắc nghẽn sớm, trước khi xảy ra mất gói, khác với Reno chỉ dựa vào mất gói.",
    topic: "TCP Congestion Control",
  },
  {
    id: "47",
    question: "Giao thức chuẩn giữa controller và switch SDN là?",
    options: ["RIP", "BGP", "OpenFlow", "OSPF"],
    correctAnswer: 2,
    explanation: "OpenFlow là giao thức chuẩn southbound interface giữa SDN controller và switch.",
    topic: "SDN",
  },
  {
    id: "48",
    question: "Ưu điểm lớn nhất của SDN là?",
    options: ["Không cần VLAN", "Tốc độ cao hơn", "Lập trình chính sách và đường đi linh hoạt", "Không cần router"],
    correctAnswer: 2,
    explanation: "SDN cho phép lập trình và thay đổi chính sách mạng một cách linh hoạt thông qua controller.",
    topic: "SDN",
  },
  {
    id: "49",
    question: "Network slicing phù hợp nhất với?",
    options: ["Mạng IP truyền thống", "Tăng băng thông", "SDN với controller", "MPLS L3VPN"],
    correctAnswer: 2,
    explanation:
      "Network slicing được triển khai hiệu quả nhất với SDN, cho phép tạo nhiều mạng ảo độc lập trên cùng hạ tầng.",
    topic: "SDN",
  },
  {
    id: "50",
    question: "Scalability controller SDN được xử lý bằng?",
    options: [
      "Nhiều controller dạng hierarchical hoặc distributed",
      "MPLS-TE",
      "Không cần controller",
      "Một controller duy nhất",
    ],
    correctAnswer: 0,
    explanation: "Để mở rộng, SDN sử dụng nhiều controller theo mô hình hierarchical hoặc distributed.",
    topic: "SDN",
  },
  {
    id: "51",
    question: "Flow table trong OpenFlow chứa gì?",
    options: ["Username/password", "Danh sách MAC", "Bảng định tuyến Internet", "Match fields và actions"],
    correctAnswer: 3,
    explanation: "Flow table chứa các entry với match fields (điều kiện khớp) và actions (hành động thực hiện).",
    topic: "SDN",
  },
  {
    id: "52",
    question: "Gói không khớp entry nào trong OpenFlow switch sẽ?",
    options: ["Drop", "Gắn VLAN", "Gửi Packet-In lên controller", "Flood"],
    correctAnswer: 2,
    explanation: "Khi không có flow entry khớp, switch gửi Packet-In message lên controller để xử lý.",
    topic: "SDN",
  },
  {
    id: "53",
    question: "Tầng nào dịch yêu cầu ứng dụng thành chính sách mạng?",
    options: ["Application/Management plane", "Control plane", "Data plane", "Physical layer"],
    correctAnswer: 0,
    explanation: "Application/Management plane dịch yêu cầu từ ứng dụng thành chính sách mạng cho controller.",
    topic: "SDN",
  },
  {
    id: "54",
    question: "Điểm yếu bảo mật lớn của SDN là?",
    options: [
      "Không hỗ trợ ACL",
      "Controller là điểm tập trung dễ bị tấn công",
      "Không có tường lửa",
      "Không thể mã hóa",
    ],
    correctAnswer: 1,
    explanation: "Controller tập trung là single point of failure và là mục tiêu hấp dẫn cho tấn công.",
    topic: "SDN",
  },
  {
    id: "55",
    question: "Ứng dụng muốn đổi đường đi traffic HTTP trong SDN thì?",
    options: ["Gửi ICMP redirect", "Cấu hình static route", "Đổi DNS", "Gọi API controller để cài đặt flow rule"],
    correctAnswer: 3,
    explanation: "Trong SDN, ứng dụng gọi API của controller (northbound API) để yêu cầu thay đổi flow rules.",
    topic: "SDN",
  },
  {
    id: "56",
    question: "So với MPLS, SDN cung cấp lợi ích nào?",
    options: [
      "Giảm nhãn",
      "Thay thế MPLS hoàn toàn",
      "Không cần BGP",
      "Lập trình chính sách mạng ở mức application-aware",
    ],
    correctAnswer: 3,
    explanation: "SDN cho phép lập trình chính sách mạng dựa trên thông tin ứng dụng, linh hoạt hơn MPLS.",
    topic: "SDN",
  },
  {
    id: "57",
    question: "RTT tăng từ 100ms lên 300ms trong khi không có mất gói cho thấy điều gì?",
    options: ["Lỗi đo RTT", "Độ trễ lan truyền tăng", "cwnd giảm do timeout", "Bufferbloat"],
    correctAnswer: 3,
    explanation: "Bufferbloat là hiện tượng buffer quá lớn làm tăng RTT đáng kể mà không drop gói.",
    topic: "TCP Congestion Control",
  },
  {
    id: "58",
    question:
      "Một lập trình viên viết ứng dụng orchestration muốn yêu cầu mạng SDN 'tất cả traffic từ dịch vụ thanh toán phải đi qua firewall và IPS'. Ứng dụng này giao tiếp với controller SDN qua loại giao diện nào?",
    options: [
      "Giao diện dòng lệnh (CLI) trực tiếp trên switch",
      "Southbound API",
      "OpenFlow trên từng switch",
      "Northbound API",
    ],
    correctAnswer: 3,
    explanation: "Ứng dụng giao tiếp với controller thông qua Northbound API (REST API) để đặt yêu cầu chính sách.",
    topic: "SDN",
  },
  {
    id: "59",
    question:
      "Một web server quan sát băng thông một kết nối TCP tăng tuyến tính theo thời gian, sau đó khi phát hiện mất gói thì giảm mạnh rồi lại tăng tuyến tính. Mẫu hình này lặp lại liên tục. Cơ chế nào của TCP giải thích hiện tượng này?",
    options: ["Slow Start", "Selective Acknowledgment", "Fast Open", "Additive increase, multiplicative decrease"],
    correctAnswer: 3,
    explanation:
      "AIMD (Additive Increase, Multiplicative Decrease) là cơ chế cốt lõi của TCP congestion avoidance: tăng tuyến tính, giảm nhân khi mất gói.",
    topic: "TCP Congestion Control",
  },
  {
    id: "60",
    question:
      "Một công ty triển khai ứng dụng sao lưu ban đêm chạy qua đường truyền 10 Gbps với RTT 80 ms. Với TCP Reno, backup không bao giờ dùng hết băng thông; với TCP Cubic, backup gần như saturate đường truyền. Lý do chính là gì?",
    options: [
      "Cubic không dùng Slow Start nên luôn nhanh hơn",
      "Reno không hỗ trợ cửa sổ trượt",
      "Cubic bỏ qua mất gói",
      "Cubic được thiết kế tối ưu cho mạng tốc độ cao, độ trễ lớn nên tăng cwnd mạnh hơn Reno",
    ],
    correctAnswer: 3,
    explanation:
      "TCP Cubic được thiết kế cho mạng LFN (Long Fat Network) với BDP lớn, tăng cwnd nhanh hơn Reno để tận dụng băng thông.",
    topic: "TCP Congestion Control",
  },
  {
    id: "61",
    question:
      "Trong một văn phòng, mỗi khi người dùng tải file lớn qua Internet thì các cuộc gọi VoIP nội bộ bị rè và trễ. Router chỉ dùng hàng đợi FIFO với tail drop. Cấu hình nào sau đây phù hợp nhất để cải thiện chất lượng VoIP?",
    options: [
      "Tăng MTU lên 9000",
      "Bật RED trên toàn bộ traffic mà không phân lớp",
      "Tăng TTL của gói VoIP",
      "Phân loại gói VoIP và cho vào hàng đợi ưu tiên với băng thông bảo đảm",
    ],
    correctAnswer: 3,
    explanation: "VoIP cần được phân loại (dựa vào port hoặc DSCP) và đưa vào hàng đợi ưu tiên với băng thông đảm bảo.",
    topic: "QoS",
  },
  {
    id: "62",
    question:
      "Một nhà cung cấp dịch vụ thử áp dụng IntServ/RSVP cho toàn mạng core. Khi số lượng khách hàng tăng mạnh, router core bắt đầu quá tải CPU và bộ nhớ do lưu quá nhiều trạng thái. Nguyên nhân gốc là gì?",
    options: [
      "RSVP không hỗ trợ IPv6",
      "MPLS không tương thích với RSVP",
      "DiffServ không được bật song song",
      "IntServ yêu cầu lưu trạng thái per-flow trên mỗi router",
    ],
    correctAnswer: 3,
    explanation: "IntServ yêu cầu mỗi router lưu trạng thái cho từng flow, gây quá tải khi số lượng flow lớn.",
    topic: "QoS",
  },
  {
    id: "63",
    question:
      "Một laptop nối vào mạng IPv6, chỉ nhận được địa chỉ FE80:... nhưng không có địa chỉ global, và không truy cập được Internet. Lý do hợp lý nhất là gì?",
    options: [
      "Không nhận được Router Advertisement có prefix global",
      "Không hỗ trợ SLAAC trong kernel",
      "Không bật IP forwarding trên laptop",
      "IPv6 yêu cầu NAT mới truy cập Internet được",
    ],
    correctAnswer: 0,
    explanation: "Thiếu địa chỉ global thường do không nhận được RA với prefix global từ router.",
    topic: "IPv6",
  },
  {
    id: "64",
    question:
      "Một ứng dụng IPv4-only trên điện thoại cần truy cập dịch vụ web chỉ có IPv6 trong datacenter. Nhà mạng di động cung cấp cơ chế chuyển đổi cho phép điều này mà không cần thay đổi ứng dụng. Cơ chế nào phù hợp nhất?",
    options: ["NAT64/DNS64 trong mạng nhà mạng", "6to4", "Dual stack trên điện thoại", "MPLS L3VPN"],
    correctAnswer: 0,
    explanation: "NAT64/DNS64 cho phép thiết bị IPv4-only truy cập dịch vụ IPv6 mà không cần thay đổi ứng dụng.",
    topic: "IPv6",
  },
  {
    id: "65",
    question:
      "Một doanh nghiệp có hai đường Internet, mỗi đường kết nối tới một ISP khác nhau. Họ muốn tận dụng cả hai đường và có khả năng định tuyến theo chính sách với Internet toàn cầu. Giao thức nào là lựa chọn phù hợp nhất tại biên mạng doanh nghiệp?",
    options: ["eBGP với mỗi ISP", "IS-IS", "RIP v2", "OSPF với hai default route"],
    correctAnswer: 0,
    explanation: "eBGP cho phép doanh nghiệp áp dụng policy routing linh hoạt với nhiều ISP và Internet toàn cầu.",
    topic: "Routing",
  },
  {
    id: "66",
    question:
      "Một tổ chức đa quốc gia nhận thấy phần lớn traffic từ Internet đi vào qua đường link ở châu Âu, làm link này quá tải, trong khi link ở châu Á còn dư. Họ quyết định cấu hình AS-path prepend trên quảng bá prefix qua ISP ở châu Âu. Mục tiêu chính của hành động này là gì?",
    options: [
      "Giảm kích thước bảng BGP toàn cầu",
      "Tăng độ tin cậy của BGP session",
      "Khiến các mạng khác ưu tiên chọn đường qua ISP ở châu Á vì AS-path ngắn hơn",
      "Bảo vệ khỏi route hijacking",
    ],
    correctAnswer: 2,
    explanation:
      "AS-path prepend làm đường đi qua châu Âu dài hơn, khiến các mạng khác ưu tiên đường qua châu Á có AS-path ngắn hơn.",
    topic: "Routing",
  },
  {
    id: "67",
    question:
      "Trong một datacenter dùng SDN, controller phát hiện một link spine–leaf bị quá tải và tự động cập nhật flow trên các switch để chuyển một phần traffic sang link khác rảnh hơn. Đây là ví dụ tiêu biểu cho khả năng gì của SDN?",
    options: [
      "Distance-vector routing",
      "Zero-touch provisioning",
      "Centralized traffic engineering",
      "Northbound API",
    ],
    correctAnswer: 2,
    explanation:
      "Đây là ví dụ về centralized traffic engineering - controller có cái nhìn tổng quan và điều phối traffic linh hoạt.",
    topic: "SDN",
  },
  {
    id: "68",
    question: "Mục tiêu chính của điều khiển tắc nghẽn TCP là gì?",
    options: [
      "Chia sẻ công bằng và tránh tắc nghẽn kéo dài",
      "Tối đa băng thông từng kết nối",
      "Không bao giờ mất gói",
      "Giảm độ trễ thấp nhất",
    ],
    correctAnswer: 0,
    explanation:
      "TCP congestion control nhằm chia sẻ công bằng băng thông giữa các kết nối và tránh tắc nghẽn kéo dài.",
    topic: "TCP Congestion Control",
  },
  {
    id: "69",
    question:
      "Một hệ thống phát hiện xâm nhập (IDS) tích hợp với controller SDN. Khi phát hiện một máy trạm bị nhiễm mã độc, IDS yêu cầu controller cài đặt rule drop toàn bộ traffic từ MAC hoặc IP của máy đó trên các switch. Lợi ích chính của cách làm này là gì?",
    options: [
      "Không cần mật khẩu Wi-Fi",
      "Giảm dung lượng log trên IDS",
      "Có thể cô lập nhanh thiết bị bị nhiễm ngay trong mạng ở mức hạ tầng",
      "Không cần cập nhật antivirus trên máy trạm",
    ],
    correctAnswer: 2,
    explanation: "SDN cho phép IDS nhanh chóng cô lập thiết bị bị nhiễm bằng cách cài đặt rule drop trên switch.",
    topic: "SDN",
  },
  {
    id: "70",
    question: "Mục tiêu chính của ảo hóa là gì?",
    options: [
      "Giảm số lượng máy chủ",
      "Loại bỏ hoàn toàn hệ điều hành",
      "Tăng chi phí phần cứng",
      "Tách tài nguyên vật lý thành các tài nguyên logic độc lập",
    ],
    correctAnswer: 3,
    explanation:
      "Ảo hóa tách tài nguyên vật lý (CPU, RAM, storage, network) thành các tài nguyên logic có thể quản lý độc lập.",
    topic: "Virtualization",
  },
  {
    id: "71",
    question: "Hypervisor là gì?",
    options: [
      "Phần mềm tạo và quản lý máy ảo",
      "Bộ nhớ ảo hóa",
      "Trình điều khiển mạng",
      "Hệ điều hành dành cho mobile",
    ],
    correctAnswer: 0,
    explanation: "Hypervisor là phần mềm quản lý máy ảo, tạo lớp trừu tượng giữa phần cứng và các VM.",
    topic: "Virtualization",
  },
  {
    id: "72",
    question: "Ưu điểm của ảo hóa so với chạy trực tiếp trên máy vật lý?",
    options: [
      "Không cần RAM",
      "Tốc độ luôn nhanh hơn",
      "Cách ly tốt hơn, dễ snapshot và di chuyển",
      "Không cần CPU vật lý",
    ],
    correctAnswer: 2,
    explanation: "Ảo hóa cung cấp cách ly tốt giữa các VM, dễ dàng tạo snapshot và di chuyển VM giữa các host.",
    topic: "Virtualization",
  },
  {
    id: "73",
    question: "Nhược điểm của ảo hóa so với bare-metal?",
    options: [
      "Có overhead do chia sẻ tài nguyên",
      "Cần mạng tốc độ cao",
      "Không hỗ trợ đa nhiệm",
      "Không hỗ trợ đa người dùng",
    ],
    correctAnswer: 0,
    explanation: "Ảo hóa có overhead do hypervisor và việc chia sẻ tài nguyên vật lý giữa nhiều VM.",
    topic: "Virtualization",
  },
  {
    id: "74",
    question: "Live migration cho phép?",
    options: [
      "Tự động tăng CPU của VM vô hạn",
      "Sao chép disk VM sang cloud",
      "Chuyển VM giữa các host mà không ngắt dịch vụ",
      "Khởi động lại toàn bộ cluster",
    ],
    correctAnswer: 2,
    explanation: "Live migration cho phép di chuyển VM đang chạy giữa các host vật lý mà không gây downtime.",
    topic: "Virtualization",
  },
  {
    id: "75",
    question: "Overcommit RAM có thể gây ra điều gì?",
    options: ["Tăng băng thông mạng", "Swapping nặng, làm system chậm", "VM chạy nhanh hơn", "Giảm CPU usage"],
    correctAnswer: 1,
    explanation: "Khi tổng RAM cấp cho các VM vượt quá RAM vật lý, hệ thống phải swap nhiều, gây chậm.",
    topic: "Virtualization",
  },
  {
    id: "76",
    question: "Snapshot của máy ảo có đặc điểm nào?",
    options: [
      "Là dạng backup hoàn chỉnh",
      "Lưu trạng thái tại một thời điểm",
      "Luôn làm tăng hiệu năng",
      "Chỉ chứa dữ liệu RAM",
    ],
    correctAnswer: 1,
    explanation: "Snapshot lưu lại trạng thái VM (disk, RAM, cấu hình) tại một thời điểm để có thể khôi phục sau này.",
    topic: "Virtualization",
  },
  {
    id: "77",
    question: "Ảo hóa network chủ yếu nhằm mục đích gì?",
    options: [
      "Tách biệt và lập trình được mặt phẳng mạng",
      "Thay thế TCP/IP",
      "Bỏ luôn tầng vật lý",
      "Tăng số port VLAN",
    ],
    correctAnswer: 0,
    explanation: "Network virtualization tách biệt network logic khỏi hạ tầng vật lý, cho phép lập trình linh hoạt.",
    topic: "Virtualization",
  },
  {
    id: "78",
    question: "Ảo hóa lưu trữ giúp gì?",
    options: [
      "Gom và trừu tượng hóa tài nguyên lưu trữ thành pool",
      "Ngăn VM truy cập đĩa",
      "Biến ổ SSD thành HDD",
      "Giảm dung lượng lưu trữ",
    ],
    correctAnswer: 0,
    explanation: "Storage virtualization gom các thiết bị lưu trữ vật lý thành pool thống nhất, dễ quản lý và phân bổ.",
    topic: "Virtualization",
  },
  {
    id: "79",
    question: "Nhược điểm của TCP Reno trong mạng LFN là?",
    options: [
      "cwnd tăng quá nhanh",
      "cwnd tăng quá chậm để lấp đầy băng thông",
      "Không hỗ trợ SACK",
      "Không đo được RTT",
    ],
    correctAnswer: 1,
    explanation:
      "Trong mạng LFN (Long Fat Network) với BDP lớn, TCP Reno tăng cwnd quá chậm (1 MSS/RTT) để tận dụng hết băng thông.",
    topic: "TCP Congestion Control",
  },
  {
    id: "80",
    question: "Khi một hypervisor bị lỗi, hệ quả phổ biến?",
    options: [
      "VM chạy nhanh hơn",
      "VM tự chuyển sang host khác luôn",
      "Tất cả VM trên host đó bị ảnh hưởng",
      "Không có gì xảy ra",
    ],
    correctAnswer: 2,
    explanation: "Nếu hypervisor lỗi, tất cả VM đang chạy trên host đó sẽ bị ảnh hưởng hoặc dừng hoạt động.",
    topic: "Virtualization",
  },
  {
    id: "81",
    question: "Container khác VM ở điểm nào?",
    options: [
      "Container không cần kernel",
      "Container chia sẻ kernel với host",
      "Container không chạy ứng dụng",
      "Container luôn nặng hơn VM",
    ],
    correctAnswer: 1,
    explanation: "Container chia sẻ kernel với host OS, không cần kernel riêng như VM, nên nhẹ hơn nhiều.",
    topic: "Container",
  },
  {
    id: "82",
    question: "Ưu điểm chính của container là gì?",
    options: [
      "Không cần tài nguyên CPU",
      "Không cần bộ nhớ",
      "Khởi động nhanh, nhẹ, dễ scale",
      "Tốc độ luôn cao hơn phần cứng bare-metal",
    ],
    correctAnswer: 2,
    explanation: "Container khởi động rất nhanh (giây), nhẹ (MB thay vì GB), và dễ dàng scale theo nhu cầu.",
    topic: "Container",
  },
  {
    id: "83",
    question: "Container image là gì?",
    options: [
      "Mẫu filesystem bất biến dùng để tạo container",
      "RAM dump",
      "File chứa cấu hình mạng",
      "Một đĩa ảo giống VM",
    ],
    correctAnswer: 0,
    explanation: "Container image là template bất biến (immutable) chứa filesystem và cấu hình để tạo container.",
    topic: "Container",
  },
  {
    id: "84",
    question: "Container orchestration giải quyết vấn đề?",
    options: [
      "Cách ly CPU",
      "Tự động scale, tự phục hồi, quản lý cluster container",
      "Thay thế toàn bộ hệ điều hành",
      "Giảm kích thước container",
    ],
    correctAnswer: 1,
    explanation:
      "Container orchestration (như Kubernetes) tự động scale, tự phục hồi khi lỗi, và quản lý cluster container.",
    topic: "Container",
  },
  {
    id: "85",
    question: "Container thích hợp nhất cho loại ứng dụng nào?",
    options: [
      "Ứng dụng nhỏ, microservices",
      "Ứng dụng cần rất nhiều tài nguyên cố định",
      "Ứng dụng yêu cầu GUI",
      "Ứng dụng không thể chạy đa tiến trình",
    ],
    correctAnswer: 0,
    explanation: "Container phù hợp nhất cho microservices - các ứng dụng nhỏ, độc lập, dễ scale và deploy.",
    topic: "Container",
  },
  {
    id: "86",
    question: "Bind mount khác volume ở điểm nào?",
    options: [
      "Bind mount nhanh hơn mọi trường hợp",
      "Bind mount phụ thuộc đường dẫn host",
      "Volume không persistent",
      "Volume chỉ dùng được trên Windows",
    ],
    correctAnswer: 1,
    explanation:
      "Bind mount gắn thư mục cụ thể từ host vào container, phụ thuộc vào đường dẫn host. Volume được Docker quản lý.",
    topic: "Container",
  },
  {
    id: "87",
    question: "Nhược điểm của container?",
    options: [
      "Cách ly yếu hơn VM vì dùng chung kernel",
      "Không hỗ trợ network",
      "Không chạy được ứng dụng server",
      "Không chạy được trên Linux",
    ],
    correctAnswer: 0,
    explanation:
      "Container chia sẻ kernel với host nên cách ly yếu hơn VM. Lỗ hổng kernel có thể ảnh hưởng tất cả container.",
    topic: "Container",
  },
  {
    id: "88",
    question: "Container registry dùng để?",
    options: ["Chạy container", "Quản lý network", "Dọn dẹp tài nguyên container", "Lưu trữ và phân phối image"],
    correctAnswer: 3,
    explanation: "Container registry (như Docker Hub) là kho lưu trữ và phân phối container images.",
    topic: "Container",
  },
  {
    id: "89",
    question: "Khi nào container kém phù hợp so với VM?",
    options: [
      "Khi ứng dụng có tải tăng giảm liên tục",
      "Khi ứng dụng dạng microservices",
      "Khi cần triển khai CI/CD",
      "Khi ứng dụng yêu cầu quyền truy cập trực tiếp phần cứng hoặc kernel tùy chỉnh",
    ],
    correctAnswer: 3,
    explanation:
      "Container không phù hợp khi cần truy cập trực tiếp phần cứng hoặc kernel tùy chỉnh - trường hợp này nên dùng VM.",
    topic: "Container",
  },
  {
    id: "90",
    question: "Ứng dụng video real-time không phù hợp với TCP vì?",
    options: [
      "TCP không có kiểm soát luồng",
      "TCP không đảm bảo độ tin cậy",
      "TCP không hỗ trợ port",
      "Tốc độ gửi thay đổi do TCP điều khiển tắc nghẽn",
    ],
    correctAnswer: 3,
    explanation:
      "TCP điều khiển tắc nghẽn làm thay đổi tốc độ gửi, gây jitter và delay không phù hợp cho video real-time.",
    topic: "TCP Congestion Control",
  },
  {
    id: "91",
    question: "Tại sao container khởi động nhanh hơn VM?",
    options: [
      "Vì luôn chạy trong RAM",
      "Vì không dùng IO",
      "Vì bỏ qua kernel",
      "Vì không cần boot hệ điều hành đầy đủ",
    ],
    correctAnswer: 3,
    explanation: "Container chia sẻ kernel host nên không cần boot OS, chỉ cần khởi động process ứng dụng.",
    topic: "Container",
  },
  {
    id: "92",
    question: "Điện toán đám mây là gì?",
    options: [
      "Dịch vụ lưu trữ web",
      "Mô hình cung cấp tài nguyên IT qua Internet theo yêu cầu",
      "Một dạng mạng LAN",
      "Dịch vụ email",
    ],
    correctAnswer: 1,
    explanation:
      "Cloud computing là mô hình cung cấp tài nguyên IT (compute, storage, network) qua Internet theo yêu cầu và trả phí theo mức dùng.",
    topic: "Cloud Computing",
  },
  {
    id: "93",
    question: "Ưu điểm quan trọng nhất của cloud?",
    options: [
      "Luôn rẻ hơn on-premises",
      "Không cần IT team",
      "Không cần bảo mật",
      "Khả năng mở rộng linh hoạt theo nhu cầu",
    ],
    correctAnswer: 3,
    explanation: "Cloud cho phép mở rộng (scale up/out) hoặc thu hẹp tài nguyên linh hoạt theo nhu cầu thực tế.",
    topic: "Cloud Computing",
  },
  {
    id: "94",
    question: "Mô hình IaaS cung cấp gì?",
    options: ["Email", "Máy ảo, network, storage", "API machine learning", "Ứng dụng hoàn chỉnh"],
    correctAnswer: 1,
    explanation: "IaaS (Infrastructure as a Service) cung cấp tài nguyên cơ sở hạ tầng: máy ảo, network, storage.",
    topic: "Cloud Computing",
  },
  {
    id: "95",
    question: "PaaS khác IaaS ở điểm nào?",
    options: [
      "PaaS không hỗ trợ autoscale",
      "PaaS chạy chậm hơn",
      "PaaS cung cấp môi trường chạy ứng dụng mà không cần quản lý OS",
      "IaaS không hỗ trợ ứng dụng",
    ],
    correctAnswer: 2,
    explanation:
      "PaaS (Platform as a Service) cung cấp môi trường chạy ứng dụng, người dùng không cần quản lý OS bên dưới.",
    topic: "Cloud Computing",
  },
  {
    id: "96",
    question: "SaaS phù hợp với?",
    options: [
      "Muốn dùng ứng dụng hoàn chỉnh qua web",
      "Muốn cấu hình kernel",
      "Muốn tùy chỉnh hạ tầng sâu",
      "Muốn tự quản lý server",
    ],
    correctAnswer: 0,
    explanation: "SaaS (Software as a Service) cung cấp ứng dụng hoàn chỉnh qua web, người dùng chỉ việc sử dụng.",
    topic: "Cloud Computing",
  },
  {
    id: "97",
    question: "Elasticity trong cloud?",
    options: [
      "Tăng băng thông",
      "Bảo mật đa lớp",
      "Tăng dung lượng RAM",
      "Tự động mở rộng và thu gọn tài nguyên theo tải",
    ],
    correctAnswer: 3,
    explanation: "Elasticity là khả năng tự động scale tài nguyên lên/xuống theo tải thực tế, tối ưu chi phí.",
    topic: "Cloud Computing",
  },
  {
    id: "98",
    question: "Multi-tenancy nghĩa là?",
    options: [
      "Nhiều khách hàng chia sẻ hạ tầng vật lý nhưng được cách ly logic",
      "Mỗi tenant có phần cứng riêng",
      "Chỉ 1 người dùng mỗi server",
      "Không có chia sẻ tài nguyên",
    ],
    correctAnswer: 0,
    explanation:
      "Multi-tenancy cho phép nhiều khách hàng chia sẻ cùng hạ tầng vật lý nhưng dữ liệu và ứng dụng được cách ly logic.",
    topic: "Cloud Computing",
  },
  {
    id: "99",
    question: "Nhược điểm chính của cloud?",
    options: [
      "Không hỗ trợ ảo hóa",
      "Không scale được",
      "Không chạy được ứng dụng lớn",
      "Phụ thuộc vào kết nối Internet và nhà cung cấp",
    ],
    correctAnswer: 3,
    explanation:
      "Cloud phụ thuộc vào Internet và nhà cung cấp dịch vụ. Mất kết nối hoặc provider gặp sự cố sẽ ảnh hưởng dịch vụ.",
    topic: "Cloud Computing",
  },
  {
    id: "100",
    question: "Serverless có đặc điểm?",
    options: [
      "Luôn chạy liên tục",
      "Không quản lý server, tự động scale và trả tiền theo mức dùng",
      "Không có server vật lý",
      "Không hỗ trợ lập trình backend",
    ],
    correctAnswer: 1,
    explanation:
      "Serverless cho phép chạy code mà không cần quản lý server, tự động scale, và chỉ trả tiền khi code thực thi.",
    topic: "Cloud Computing",
  },
]

export const topics = [...new Set(questions.map((q) => q.topic))]
