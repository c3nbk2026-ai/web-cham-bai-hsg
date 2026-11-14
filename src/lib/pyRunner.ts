/**
 * Bộ chạy code Python trong luồng riêng (public/py-worker.js).
 *  - Vòng lặp vô hạn / quá giờ: dừng luồng, tạo luồng mới. Trang không bị treo.
 *  - Thời gian tải Python KHÔNG tính vào thời gian chạy bài.
 */
export type RunStatus = 'OK' | 'RE' | 'TLE';

export interface RunResult {
    status: RunStatus;
    out: string;
    err?: string;
    ms: number;
}

const LOAD_TIMEOUT_MS = 120_000; // mạng yếu: cho tối đa 2 phút để tải Python lần đầu

export class PyRunner {
    private worker: Worker | null = null;
    private ready: Promise<void> | null = null;
    private seq = 0;

    private spawn() {
        this.worker = new Worker('/py-worker.js');
        const w = this.worker;
        this.ready = new Promise<void>((resolve, reject) => {
            const id = ++this.seq;
            const timer = setTimeout(() => reject(new Error('Tải Python quá lâu, em kiểm tra mạng rồi thử lại.')), LOAD_TIMEOUT_MS);
            const onMsg = (e: MessageEvent) => {
                if (e.data?.id !== id) return;
                clearTimeout(timer);
                w.removeEventListener('message', onMsg);
                if (e.data.type === 'ready') resolve();
                else reject(new Error('Không tải được Python: ' + (e.data.err || '')));
            };
            w.addEventListener('message', onMsg);
            w.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Không khởi động được trình chạy Python.')); }, { once: true });
            w.postMessage({ id, type: 'warmup' });
        });
        this.ready.catch(() => this.kill());
    }

    private kill() {
        try { this.worker?.terminate(); } catch {}
        this.worker = null;
        this.ready = null;
    }

    /** Tải sẵn Python (gọi khi mở trang để lúc chấm không phải chờ). */
    async warmup(): Promise<void> {
        if (!this.worker) this.spawn();
        await this.ready;
    }

    /**
     * Chạy code với 1 bộ dữ liệu vào.
     * limitMs: giới hạn thời gian chạy. Quá giới hạn → TLE.
     */
    async run(code: string, input: string, pName: string, limitMs: number): Promise<RunResult> {
        await this.warmup();
        const w = this.worker!;
        const id = ++this.seq;
        // Chờ thêm một chút ngoài giới hạn để bù thời gian chuẩn bị; quá mức này thì dừng hẳn luồng
        const hardStop = Math.round(limitMs * 1.5) + 1000;

        return new Promise<RunResult>((resolve) => {
            const timer = setTimeout(() => {
                w.removeEventListener('message', onMsg);
                this.kill(); // code còn đang chạy (lặp vô hạn?): dừng luồng, lần sau tạo luồng mới
                resolve({ status: 'TLE', out: '', ms: hardStop });
            }, hardStop);
            const onMsg = (e: MessageEvent) => {
                if (e.data?.id !== id) return;
                clearTimeout(timer);
                w.removeEventListener('message', onMsg);
                const ms = Number(e.data.ms) || 0;
                if (e.data.type === 'load-error') {
                    this.kill();
                    resolve({ status: 'RE', out: '', err: 'Không tải được Python: ' + (e.data.err || ''), ms: 0 });
                } else if (!e.data.ok) {
                    resolve({ status: 'RE', out: e.data.out || '', err: e.data.err || 'Lỗi chạy code', ms });
                } else if (ms > limitMs) {
                    resolve({ status: 'TLE', out: e.data.out || '', ms });
                } else {
                    resolve({ status: 'OK', out: e.data.out || '', ms });
                }
            };
            w.addEventListener('message', onMsg);
            w.postMessage({ id, type: 'run', code, input, pName });
        });
    }

    dispose() { this.kill(); }
}
