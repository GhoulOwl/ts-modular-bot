import { logger } from "../../core/logger.js";

export class MusicService {
    ts: any;

    constructor(ts: any) { this.ts = ts; }

    async play(keyword: string) {
        logger.info(`请求播放：${keyword}`);
    }
}