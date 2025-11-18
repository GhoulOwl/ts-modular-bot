import { TeamSpeakClient } from "./teamspeak-client.js";
import { ModuleRegistry } from "./module-registry.js";
import { loadModuleConfig } from "./config.js";
import { logger } from "./logger.js";

export class BotCore {
    ts!: TeamSpeakClient;
    modules!: ModuleRegistry;

    async init() {
        logger.info("初始化核心系统…");
        this.ts = new TeamSpeakClient();
        this.modules = new ModuleRegistry(this.ts);
        const config = loadModuleConfig();
        if (config.music) this.modules.load("music");
    }

    async start() {
        await this.ts.connect();
        await this.modules.startAll();
    }
}