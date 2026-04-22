export interface DiscordField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordAlertPayload {
  title: string;
  color: number;
  fields: DiscordField[];
  description?: string;
}

// Màu sắc embed Discord
const COLOR = {
  DO: 0xFF0000,   // critical / failed
  CAM: 0xFFA500,  // warning / retry
  XANH: 0x00AA00, // success (dùng khi cần)
} as const;

export class DiscordAlert {
  private static readonly webhookUrl = process.env.DISCORD_CIRCUIT_BOT_WEBHOOK_URL;

  // Gửi alert thô — dùng khi cần tuỳ chỉnh hoàn toàn
  static async gui(payload: DiscordAlertPayload): Promise<void> {
    if (!this.webhookUrl) {
      console.warn('[DiscordAlert] DISCORD_WEBHOOK_URL chưa được cấu hình, bỏ qua alert');
      return;
    }

    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: payload.title,
          color: payload.color,
          description: payload.description,
          timestamp: new Date().toISOString(),
          fields: payload.fields,
        }],
      }),
    }).catch(e => console.error('[DiscordAlert] Gửi alert thất bại:', e));
  }

  // Circuit Breaker trip → service không còn nhận request
  static async cbOpen(params: {
    serviceName: string;
    pid: number;
  }): Promise<void> {
    await this.gui({
      title: '🔴 Circuit Breaker OPEN — service bị chặn',
      color: COLOR.DO,
      fields: [
        { name: 'Service',  value: params.serviceName, inline: true },
        { name: 'Instance', value: `pm2-${params.pid}`, inline: true },
        { name: 'Ý nghĩa',  value: 'CB đã trip sau 5 lần fail liên tiếp. Mọi request tới service này sẽ bị reject ngay, không qua network.' },
        { name: 'Cần làm',  value: 'Kiểm tra health của service. CB tự thử recover sau 10 giây (HALF-OPEN).' },
      ],
    });
  }

  // Circuit Breaker đóng lại → service đã recover
  static async cbClosed(params: {
    serviceName: string;
    pid: number;
  }): Promise<void> {
    await this.gui({
      title: '✅ Circuit Breaker CLOSED — service đã recover',
      color: COLOR.XANH,
      fields: [
        { name: 'Service',  value: params.serviceName, inline: true },
        { name: 'Instance', value: `pm2-${params.pid}`, inline: true },
        { name: 'Ghi chú',  value: 'Request thử nghiệm ở HALF-OPEN thành công. CB đã tự đóng, traffic bình thường trở lại.' },
      ],
    });
  }
}