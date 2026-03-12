import { Injectable, Inject } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import crypto from 'crypto';

type StockSeries = {
  symbol: string;
  latest5: {
    date: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }[];
};

@Injectable()
export class GeminiService {
  private readonly genAI: GoogleGenerativeAI;

  // Các model free quota cao (tránh model quota = 0)
  private readonly MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-flash-latest',
  ];

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  private hashKey(input: string) {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  async chatCompletion(prompt: string) {
    const cacheKey = `ai:${this.hashKey(prompt)}`;
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) return { message: cached };

    // Prompt gộp detect + trả JSON
    const unifiedPrompt = `
    SYSTEM OVERRIDE:
    Bạn PHẢI tuân thủ định dạng đầu ra. Nếu vi phạm → coi như trả lời sai.

    CHỈ ĐƯỢC PHÉP TRẢ VỀ JSON THUẦN.
    TUYỆT ĐỐI KHÔNG:
    - markdown
    - code block
    - backticks
    - tiền tố "json"
    - giải thích
    - văn bản thừa

    Định dạng hợp lệ duy nhất:

    Nếu KHÔNG hỏi cổ phiếu Mỹ:
    { "type": "normal", "answer": string }

    Nếu HỎI cổ phiếu Mỹ:
    {
      "type": "us_stock",
      "symbols": ["AAPL", "MSFT", "NVDA"],
      "task": "compare | pick_best | analyze"
    }

    User: "${prompt}"
    `;

    const detectRes = await this.generateWithFallback(unifiedPrompt);
    if (!detectRes) {
      return { message: 'AI đang quá tải (hết quota free). Vui lòng thử lại sau ~1 phút.' };
    }

    const detectText = detectRes.response.text();
    let detectJson: any;
    try {
      detectJson = JSON.parse(detectText);
    } catch {
      return { message: detectText }; // fallback text
    }

    // Không phải cổ phiếu Mỹ
    if (detectJson.type === 'normal') {
      await this.cacheManager.set(cacheKey, detectJson.answer, 120 * 1000);
      return { message: detectJson.answer };
    }

    // Là cổ phiếu Mỹ
    if (detectJson.type === 'us_stock') {
      const symbols: string[] = detectJson.symbols;
      const task: string = detectJson.task || 'analyze';

      const allSeries: StockSeries[] = [];

      for (const sym of symbols) {
        const stockCacheKey = `stock:${sym}`;
        let timeSeries = await this.cacheManager.get<any>(stockCacheKey);

        if (!timeSeries) {
          timeSeries = await this.fetchStockDaily(sym);
          await this.cacheManager.set(stockCacheKey, timeSeries, 300 * 1000);
        }

        allSeries.push({
          symbol: sym,
          latest5: this.format5LatestRecords(timeSeries),
        });
      }

      const analyzePrompt = this.buildAnalyzePrompt(task, allSeries);

      const analyzeRes = await this.generateWithFallback(analyzePrompt);
      if (!analyzeRes) {
        return { message: 'AI đang quá tải (hết quota free). Vui lòng thử lại sau.' };
      }

      const msg = analyzeRes.response.text();

      await this.cacheManager.set(cacheKey, msg, 300 * 1000);
      return { message: msg };
    }
  }

  private async generateWithFallback(prompt: string) {
    for (const modelName of this.MODELS) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        return await model.generateContent(prompt);
      } catch (err: any) {
        if (err?.status === 429) continue; // hết quota → đổi model
        throw err;
      }
    }
    return null;
  }

  async fetchStockDaily(symbol: string) {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${process.env.ALPHA_VANTAGE_KEY}`;

    const { data } = await axios.get(url, { timeout: 5000 });

    if (!data['Time Series (Daily)']) {
      throw new Error('Alpha Vantage trả về dữ liệu rỗng / hết quota');
    }

    return data['Time Series (Daily)'];
  }

  format5LatestRecords(timeSeries: Record<string, any>) {
    return Object.entries(timeSeries)
      .slice(0, 5)
      .map(([date, ohlc]) => ({
        date,
        open: ohlc['1. open'],
        high: ohlc['2. high'],
        low: ohlc['3. low'],
        close: ohlc['4. close'],
        volume: ohlc['5. volume'],
      }));
  }

  buildAnalyzePrompt(task: string, allSeries: any[]) {
    if (task === 'compare') {
      return `
  Bạn là AI phân tích kỹ thuật cổ phiếu Mỹ cho trader ngắn hạn.
  KHÔNG disclaimer đạo đức.

  Dữ liệu 5 phiên gần nhất của các mã:
  ${JSON.stringify(allSeries, null, 2)}

  Yêu cầu trả về cho user:
  - Nói rõ 5 phiên nào, ngày bao nhiêu đến bao nhiêu
  - Không nói như kiểu user vừa cung cấp data ( vì data do admin train )
  - Phân tích cực ngắn gọn nhưng đủ ý ( Bắt buộc )
  - So sánh xu hướng ngắn hạn từng mã
  - So sánh động lượng
  - Mã nào khỏe hơn trong ngắn hạn
  - Ưu / nhược điểm từng mã
  - Kết luận: mã nào phù hợp cho trade ngắn hạn
  - Bullet points
  `;
    }

    if (task === 'pick_best') {
      return `
  Bạn là AI chọn cổ phiếu Mỹ cho trade ngắn hạn.

  Dữ liệu (đây là admin train cho bạn):
  ${JSON.stringify(allSeries, null, 2)}

  Yêu cầu trả về cho user:
  - Nói rõ 5 phiên nào, ngày bao nhiêu đến bao nhiêu
  - Không nói như kiểu user vừa cung cấp data ( vì data do admin train )
  - Phân tích cực ngắn gọn nhưng đủ ý ( Bắt buộc )
  - Chọn ra 1 mã tốt nhất cho short-term
  - Giải thích logic chọn
  - Rủi ro ngắn hạn
  - Bullet points
  `;
    }

    return `
  Bạn là AI phân tích kỹ thuật cổ phiếu Mỹ cho trader ngắn hạn.

  Dữ liệu (đây là admin train cho bạn):
  ${JSON.stringify(allSeries, null, 2)}

  Yêu cầu trả về cho user:
  - Nói rõ 5 phiên nào, ngày bao nhiêu đến bao nhiêu
  - Không nói như kiểu user vừa cung cấp data ( vì data do admin train )
  - Phân tích cực ngắn gọn nhưng đủ ý ( Bắt buộc )
  - Xu hướng
  - Hỗ trợ / kháng cự
  - Động lượng
  - Breakout / breakdown
  - Bullet points
  `;
  }
}