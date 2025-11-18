import axios, { AxiosInstance } from "axios";
import { logger } from "../../core/logger.js";

export type TS3State = { playing?: boolean; state?: string; track?: any };

export class TS3AudioBotController {
    baseUrl: string;
    private client: AxiosInstance;

    constructor(url: string, timeout = 8000) {
        this.baseUrl = url.replace(/\/$/, "");
        this.client = axios.create({ baseURL: this.baseUrl, timeout });
    }

    private async post(path: string, body: any = {}, action = "请求") {
        try {
            await this.client.post(path, body);
        } catch (err: any) {
            logger.error(`TS3AudioBot ${action}失败: ${err.message || err}`);
            throw new Error(`TS3AudioBot ${action}失败`);
        }
    }

    async play(url: string) {
        await this.post("/api/play", { url }, "播放");
    }

    async stop() {
        await this.post("/api/stop", {}, "停止");
    }

    async pause() {
        await this.post("/api/pause", {}, "暂停");
    }

    async resume() {
        await this.post("/api/resume", {}, "继续");
    }

    async state(): Promise<TS3State | null> {
        try {
            const { data } = await this.client.get("/api/state");
            return data;
        } catch (err: any) {
            logger.warn(`获取 TS3AudioBot 状态失败: ${err.message || err}`);
            return null;
        }
    }
}
