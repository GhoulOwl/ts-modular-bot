import { logger } from "../../core/logger.js";
import { ModuleContext } from "../../core/module-registry.js";
import { MusicService } from "./music.service.js";

export default class MusicModule {
    service: MusicService;

    constructor(ctx: ModuleContext) {
        this.service = new MusicService({ ts: ctx.ts, router: ctx.router, events: ctx.events });
    }

    async init() {
        this.service.registerCommands();
    }

    async start() {
        this.service.start();
        logger.info("Music 模块已启动");
    }

    async stop() {
        await this.service.stop();
        logger.info("Music 模块已停止");
    }
}
