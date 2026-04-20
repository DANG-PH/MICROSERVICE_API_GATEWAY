// pdf-parse là CommonJS module không có default export chuẩn
// dùng require thay vì import để tránh lỗi TypeScript
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');
import fs from 'fs';

/**
 * Đọc PDF và cắt thành các chunks nhỏ.
 *
 * @param filePath  Đường dẫn đến file PDF
 * @param chunkSize Số từ mỗi chunk (default 500)
 * @param overlap   Số từ overlap giữa 2 chunk liền kề (default 50)
 *
 * Tại sao overlap?
 * Nếu câu quan trọng nằm ở ranh giới giữa chunk_1 và chunk_2,
 * không có overlap thì câu đó bị cắt đứt, mất ngữ nghĩa.
 * Overlap đảm bảo câu đó xuất hiện đầy đủ trong ít nhất 1 chunk.
 */
export async function chunkPdf(
  filePath: string,
  chunkSize = 500,
  overlap = 50,
): Promise<string[]> {
  const buffer = fs.readFileSync(filePath);
  const { text } = await pdfParse(buffer);

  // Tách theo whitespace để đếm "từ"
  // Với tài liệu kỹ thuật tiếng Việt/Anh lẫn lộn thì đây đủ dùng
  const words = text.split(/\s+/).filter(Boolean);

  const chunks: string[] = [];
  let i = 0;

  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    chunks.push(chunk);
    i += chunkSize - overlap; // tiến lên chunkSize - overlap từ
  }

  return chunks;
}