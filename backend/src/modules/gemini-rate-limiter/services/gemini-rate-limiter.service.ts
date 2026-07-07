import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class GeminiRateLimiterService {
  private requestsThisMinute = 0;
  private requestsToday = 0;
  private minuteResetAt = Date.now() + 60_000;
  private dayResetAt = this.getNextMidnightPacific();

  // Tính thời điểm 00:00
  private getNextMidnightPacific(): number {
    const now = new Date();
    const pacific = new Date(
      now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
    );
    pacific.setHours(24, 0, 0, 0);
    return pacific.getTime();
  }

  // Kiểm tra xem bộ đếm nào đã hết hạn chưa và reset nó về 0
  private resetIfNeeded() {
    const now = Date.now();
    if (now >= this.minuteResetAt) {
      this.requestsThisMinute = 0;
      this.minuteResetAt = now + 60_000;
    }
    if (now >= this.dayResetAt) {
      this.requestsToday = 0;
      this.dayResetAt = this.getNextMidnightPacific();
    }
  }

  // Được gọi trước mỗi request lên Gemini
  checkAndConsume() {
    this.resetIfNeeded();
    if (this.requestsToday >= 500) {
      throw new HttpException(
        'Đã đạt giới hạn 500 request/ngày của Gemini free tier',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (this.requestsThisMinute >= 10) {
      throw new HttpException(
        'Đã đạt giới hạn 10 request/phút của Gemini free tier',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.requestsThisMinute++;
    this.requestsToday++;
  }

  // Trả về thông tin sử dụng cho user biết
  getUsage() {
    this.resetIfNeeded();
    return {
      minute: {
        used: this.requestsThisMinute,
        limit: 10,
        resetsIn: Math.ceil((this.minuteResetAt - Date.now()) / 1000),
      },
      day: {
        used: this.requestsToday,
        limit: 500,
        resetsAt: new Date(this.dayResetAt).toISOString(),
      },
    };
  }
}
