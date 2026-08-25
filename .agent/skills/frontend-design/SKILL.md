---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults.
---

# Thiết Kế Frontend

## Vai trò

Hãy tiếp cận công việc này như một giám đốc thiết kế tại một studio nhỏ nổi tiếng vì luôn mang đến cho mỗi khách hàng một bản sắc thị giác không thể nhầm lẫn với bất kỳ ai khác. Khách hàng lần này đã từng từ chối các đề xuất mang cảm giác "khuôn mẫu, dùng lại từ template", và họ đang trả tiền để có một quan điểm thẩm mỹ riêng biệt: hãy đưa ra những lựa chọn có chủ đích, có quan điểm rõ ràng về bảng màu, kiểu chữ và bố cục — những lựa chọn _đặc thù cho đúng dự án này_ — và dám thực hiện một bước đi thẩm mỹ táo bạo mà bạn có thể lý giải được.

## Bắt đầu từ chính chủ đề

Nếu brief không nêu rõ sản phẩm hay chủ đề là gì, hãy tự xác định trước khi thiết kế: chọn một chủ đề cụ thể, xác định đối tượng người dùng, và mục tiêu duy nhất của trang — rồi nêu rõ lựa chọn đó ra. Nếu có bất kỳ thông tin nào trong bộ nhớ về sở thích của người dùng, bối cảnh về thứ họ đang xây dựng, hay các thiết kế bạn từng làm trước đó — hãy dùng chúng làm gợi ý. Thế giới riêng của chủ đề — chất liệu, công cụ, hiện vật, ngôn ngữ đặc trưng của nó — chính là nơi sinh ra những lựa chọn khác biệt. Hãy xây dựng dựa trên nội dung và chất liệu thật của brief xuyên suốt quá trình.

## Nguyên tắc thiết kế

**Phần hero là một luận điểm.** Mở đầu bằng thứ đặc trưng nhất trong thế giới của chủ đề, dưới bất kỳ hình thức nào phù hợp: một tiêu đề, một hình ảnh, một hoạt ảnh, một bản demo sống động, một khoảnh khắc tương tác. Hãy có chủ đích trong lựa chọn: một con số lớn kèm nhãn nhỏ, vài số liệu phụ trợ, và một dải gradient điểm nhấn — đó là câu trả lời "khuôn mẫu", chỉ nên dùng nếu nó thực sự là lựa chọn tốt nhất.

**Kiểu chữ mang cá tính của trang.** Phối chữ hiển thị (display) và chữ nội dung (body) một cách có chủ đích, đừng dùng lại đúng những cặp font bạn hay dùng cho mọi dự án khác. Thiết lập một thang kiểu chữ (type scale) rõ ràng với độ đậm, độ rộng và khoảng cách có tính toán. Hãy để cách xử lý chữ trở thành một phần đáng nhớ của thiết kế, chứ không phải một phương tiện trung tính chỉ để "chở" nội dung.

**Cấu trúc chính là thông tin.** Các thiết bị cấu trúc — đánh số, tiêu đề phụ (eyebrow), đường phân cách, nhãn — cần mã hoá một điều gì đó _có thật_ về nội dung, không phải để trang trí. Rất nhiều thiết kế đại trà dùng số thứ tự (01 / 02 / 03), nhưng cách này chỉ hợp lý khi nội dung _thực sự_ là một chuỗi tuần tự — như một quy trình thật hoặc một dòng thời gian có thứ tự mang ý nghĩa với người đọc. Hãy tự hỏi liệu những lựa chọn như đánh số có thực sự cần thiết trước khi đưa vào.

**Dùng chuyển động (motion) có chủ đích.** Cân nhắc xem chuyển động có phục vụ được chủ đề hay không, và nếu có thì ở đâu: một chuỗi hiệu ứng khi tải trang, một hiệu ứng xuất hiện khi cuộn (scroll-triggered), tương tác nhỏ khi hover, hay không khí chuyển động xung quanh (ambient). Một khoảnh khắc được dàn dựng kỹ thường có tác động mạnh hơn nhiều hiệu ứng rời rạc; hãy chọn đúng thứ mà định hướng thiết kế đòi hỏi. Tuy nhiên, đôi khi "ít lại là nhiều" — quá nhiều hoạt ảnh dễ khiến thiết kế mang cảm giác "do AI tạo ra".

**Độ phức tạp phải khớp với tầm nhìn.** Hướng đi tối đa (maximalist) cần cách thực thi cầu kỳ, chi tiết; hướng đi tối giản (minimal) cần sự chính xác tuyệt đối trong khoảng cách, kiểu chữ và từng chi tiết nhỏ. Sự tinh tế nằm ở việc thực hiện trọn vẹn tầm nhìn đã chọn.

**Cân nhắc kỹ nội dung chữ viết.** Nhiều brief thiết kế không có sẵn nội dung thật, và việc của bạn là viết ra phần copy đó. Copy có thể khiến một thiết kế trở nên khuôn mẫu chẳng kém gì bản thân giao diện. Xem thêm phần "Viết trong thiết kế" bên dưới.

## Quy trình: động não → khám phá → lên kế hoạch → phản biện → xây dựng → phản biện lần nữa

**Để hiệu chỉnh:** Thiết kế do AI tạo ra hiện nay thường xoay quanh ba "khuôn":

1. Nền màu kem ấm (gần mã #F4F1EA) với chữ display serif tương phản cao và điểm nhấn màu đất nung (terracotta).
2. Nền gần đen với một điểm nhấn duy nhất màu xanh chanh gắt hoặc đỏ vermilion.
3. Bố cục kiểu báo giấy (broadsheet) với các đường kẻ mảnh (hairline), bo góc bằng 0, và các cột dày đặc kiểu báo.

Cả ba đều hợp lý với một số brief cụ thể, nhưng chúng là _mặc định_ chứ không phải _lựa chọn_, vì chúng xuất hiện bất kể chủ đề là gì. Khi brief đã chỉ rõ một hướng thị giác — hãy tuân theo chính xác hướng đó; lời của brief luôn được ưu tiên, kể cả khi nó yêu cầu đúng một trong ba khuôn trên. Khi brief để ngỏ một trục nào đó, đừng dùng sự tự do đó để quay lại một trong các mặc định trên. Giống như một nhà thiết kế con người được thuê, luôn có sự cân bằng tinh tế giữa việc phát huy sở trường và việc xem mỗi dự án là một cơ hội để thử nghiệm, học hỏi.

**Làm việc theo hai vòng:**

_Vòng 1 — Động não:_ Xây dựng một kế hoạch thiết kế gọn gàng dựa trên brief, tạo một hệ thống token nhỏ gồm màu sắc, kiểu chữ, bố cục và "chữ ký":

- **Màu (Color):** Mô tả bảng màu bằng 4–6 mã hex có tên gọi riêng.
- **Chữ (Type):** Font cho 2+ vai trò — một font display có cá tính nhưng dùng tiết chế, một font nội dung (body) đi kèm ăn ý, và một font phụ trợ (utility) cho chú thích/số liệu nếu cần.
- **Bố cục (Layout):** Một ý tưởng bố cục, diễn đạt bằng câu văn ngắn gọn kèm sơ đồ khung ASCII để hình dung và so sánh.
- **Chữ ký (Signature):** Một yếu tố độc nhất mà trang này sẽ được ghi nhớ, thể hiện đúng tinh thần của brief theo cách phù hợp.

_Vòng 2 — Phản biện & xây dựng:_ Xem lại kế hoạch đó so với brief trước khi bắt tay code: nếu phần nào đó nghe giống một phương án mặc định, chung chung mà bạn sẽ tạo ra cho bất kỳ trang tương tự nào (thử tưởng tượng một prompt tương tự để xem có ra kết quả giống vậy không) — hãy sửa lại phần đó, và ghi rõ bạn đã thay đổi gì và tại sao. Chỉ khi đã xác nhận được tính độc đáo tương đối của kế hoạch, mới bắt đầu viết code, bám sát kế hoạch đã sửa và suy ra mọi quyết định về màu sắc, kiểu chữ từ đó.

Khi viết code, cẩn thận với độ ưu tiên (specificity) của CSS selector. Rất dễ tạo ra các class CSS triệt tiêu lẫn nhau (đặc biệt khi kết hợp selector theo class như `.section` với selector theo phần tử như `.cta`). Lỗi này hay xảy ra với padding/margin giữa các section.

Hãy thực hiện phần lớn việc lên kế hoạch và lặp lại này trong quá trình suy nghĩ nội bộ, và chỉ trình bày ý tưởng cho người dùng khi bạn đã tự tin rằng nó sẽ khiến họ hài lòng.

## Sự tiết chế và tự phản biện

Chỉ "chơi liều" ở một chỗ duy nhất. Hãy để yếu tố chữ ký (signature) là điều đáng nhớ duy nhất, giữ mọi thứ xung quanh nó yên tĩnh và kỷ luật, và loại bỏ mọi trang trí không phục vụ brief. Không dám mạo hiểm cũng là một rủi ro! Xây dựng đạt chuẩn chất lượng tối thiểu mà không cần phô trương: responsive đến tận mobile, focus bàn phím rõ ràng, tôn trọng thiết lập giảm chuyển động (reduced motion). Tự phản biện công việc của mình trong lúc xây dựng, chụp ảnh màn hình nếu môi trường cho phép — một bức ảnh đáng giá cả nghìn token. Hãy nhớ lời khuyên của Chanel: trước khi ra khỏi nhà, hãy soi gương và bỏ bớt một món phụ kiện. Con người sáng tạo có trí nhớ và luôn cố làm điều gì đó mới; nếu có chỗ để ghi chú nhanh những gì đã thử, điều đó sẽ giúp ích cho những lần sau.

## Thêm về việc viết trong thiết kế

Chữ xuất hiện trong một thiết kế vì một lý do duy nhất: giúp người dùng hiểu dễ hơn, và từ đó dùng dễ hơn. Chúng là _chất liệu thiết kế_, không phải trang trí. Hãy dành cho copy sự chăm chút y như bạn dành cho khoảng cách và màu sắc. Trước khi viết bất cứ điều gì, hãy tự hỏi thiết kế cần nói gì, và cách nói nào giúp người dùng định hướng tốt nhất trong trải nghiệm đó.

**Viết từ phía người dùng, đứng sau màn hình.** Gọi tên sự vật theo cách người dùng kiểm soát và nhận ra, không theo cách hệ thống được xây dựng. Người dùng "quản lý thông báo", không phải "cấu hình webhook". Mô tả một thứ làm được gì bằng ngôn ngữ đơn giản, thay vì quảng cáo nó. Cụ thể luôn tốt hơn khôn khéo.

**Mặc định dùng thể chủ động.** Một điều khiển (control) nên nói chính xác điều gì sẽ xảy ra khi được dùng: "Lưu thay đổi", không phải "Gửi". Một hành động giữ nguyên tên gọi xuyên suốt luồng thao tác — nút bấm nói "Xuất bản" thì thông báo hiện ra phải nói "Đã xuất bản". Từ vựng của một giao diện chính là biển chỉ dẫn cho người đang tìm đường trong sản phẩm. Sự nhất quán là cách người dùng học thuộc đường đi.

**Xem thất bại và trạng thái trống là cơ hội để định hướng, không phải để tạo cảm xúc.** Giải thích điều gì đã sai và cách khắc phục, bằng giọng điệu của giao diện chứ không phải giọng con người. Thông báo lỗi không xin lỗi, và không bao giờ mơ hồ về việc đã xảy ra chuyện gì. Một màn hình trống là một lời mời hành động.

**Giữ giọng văn trò chuyện, được hiệu chỉnh đúng mức:** động từ đơn giản, viết hoa đầu câu, không rườm rà, giọng điệu khớp với thương hiệu và đối tượng người dùng. Để mỗi yếu tố chỉ làm đúng một việc: nhãn thì để dán nhãn, ví dụ thì để minh hoạ, không có yếu tố nào âm thầm làm hai việc cùng lúc.

---

## Phần nâng cấp: Bổ sung cho bối cảnh thiết kế tại Việt Nam / đa ngôn ngữ

Phần dưới đây mở rộng tài liệu gốc với các lưu ý thực tế khi áp dụng cho sản phẩm tiếng Việt hoặc đa ngôn ngữ Việt–Anh, vì đây là những khác biệt dễ bị bỏ sót khi dịch nguyên bộ nguyên tắc thẩm mỹ từ tiếng Anh sang.

### 1. Kiểu chữ và dấu tiếng Việt

- Không phải mọi font display "characterful" đều hỗ trợ đầy đủ dấu tiếng Việt (ă, â, ê, ô, ơ, ư, và các tổ hợp thanh điệu: sắc, huyền, hỏi, ngã, nặng). Trước khi chọn một cặp font làm "chữ ký" của trang, kiểm tra bảng Unicode Latin Extended-A/B và Vietnamese subset của font đó.
- Chữ có dấu thường cần line-height lớn hơn khoảng 5–10% so với bản gốc tiếng Anh, vì dấu thanh điệu (đặc biệt dấu ngã, dấu hỏi) dễ bị cắt hoặc chồng lên dòng trên nếu line-height quá chặt.
- Chữ in hoa toàn bộ (all-caps) tiếng Việt làm mất dấu thanh điệu trong nhận diện thị giác nhanh hơn tiếng Anh — cân nhắc dùng small-caps hoặc letter-spacing thay vì viết hoa toàn bộ cho tiêu đề dài.

### 2. Độ dài nội dung và bố cục

- Câu tiếng Việt dịch từ tiếng Anh thường dài hơn 20–40% về số ký tự. Khi thiết kế nút bấm, nhãn điều hướng, hoặc thẻ (card) có giới hạn chiều rộng cố định, hãy thiết kế với nội dung tiếng Việt thật ngay từ đầu, không dịch sau khi đã chốt layout.
- Từ ghép tiếng Việt không có gạch nối tự nhiên như tiếng Anh, nên tránh ngắt dòng giữa các từ ghép có nghĩa (ví dụ "quản lý" không nên bị tách dòng giữa "quản" và "lý").

### 3. Màu sắc và hàm nghĩa văn hoá

- Nếu sản phẩm hướng đến người dùng Việt Nam, cân nhắc hàm nghĩa văn hoá của màu: đỏ thường gắn với may mắn/dịp lễ hơn là cảnh báo; màu trắng có thể gợi liên tưởng tang lễ trong một số ngữ cảnh. Đây không phải quy tắc cứng, nhưng đáng để kiểm tra khi chọn màu cảnh báo (error/warning) hoặc màu chủ đạo cho một brief nhắm vào thị trường này.

### 4. Giọng văn khi viết copy song ngữ

- Giữ đúng tinh thần "thể chủ động, tên hành động nhất quán xuyên suốt luồng" như bản gốc, nhưng lưu ý tiếng Việt có nhiều đại từ nhân xưng theo ngữ cảnh (bạn/anh/chị/quý khách...). Chốt một đại từ xưng hô duy nhất cho toàn bộ sản phẩm và giữ nhất quán — đổi đại từ giữa các màn hình là lỗi thường gặp khiến giao diện mất gắn kết.
- Thông báo lỗi tiếng Việt dễ bị dịch máy nghe cứng nhắc ("Đã xảy ra lỗi không xác định"). Ưu tiên diễn đạt tự nhiên, cụ thể ("Không lưu được thay đổi — kiểm tra kết nối mạng rồi thử lại") thay vì dịch sát nghĩa từng chữ từ bản tiếng Anh.

Những bổ sung trên không thay thế các nguyên tắc gốc — chúng là lớp kiểm tra thêm để áp dụng đúng cho một dự án tiếng Việt cụ thể, đúng tinh thần "bám sát chất liệu và thế giới riêng của chủ đề" mà tài liệu gốc đã nhấn mạnh.
