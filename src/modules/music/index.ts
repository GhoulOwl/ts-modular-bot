import { logger } from "../../core/logger.js";
import { MusicService } from "./music.service.js";

export default class MusicModule {
    ts: any;
    service: MusicService;

    constructor(ts: any) {
        this.ts = ts;
        this.service = new MusicService(ts);
    }

    async start() {
        logger.info("Music 模块已启动");
    }
}