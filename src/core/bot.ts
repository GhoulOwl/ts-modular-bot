import { TeamSpeakClient } from "./teamspeak-client.js";
import { ModuleRegistry } from "./module-registry.js";
import { CommandRouter } from "./command-router.js";
import { EventBus } from "./event-bus.js";
import { loadAppConfig, loadModuleConfig } from "./config.js";
import { logger } from "./logger.js";

export class BotCore {
    ts!: TeamSpeakClient;
    modules!: ModuleRegistry;
    router!: CommandRouter;
    events!: EventBus;

    async init() {
        logger.info("初始化核心系统…");
        this.events = new EventBus();
        this.ts = new TeamSpeakClient();
        const appCfg = loadAppConfig();
        this.router = new CommandRouter(this.ts, this.events, appCfg.prefix || "/");
        this.modules = new ModuleRegistry(this.ts, this.router, this.events);

        this.router.register("help", (ctx) => this.ts.respond(ctx.event, this.router.helpText()), "显示命令列表");

        const modulesCfg = loadModuleConfig() || {};
        for (const [name, enabled] of Object.entries(modulesCfg)) {
            if (enabled) await this.modules.load(name);
        }

        this.ts.onTextMessage((e) => this.router.handleMessage(e));
    }

    async start() {
        await this.ts.connect();
        await this.modules.startAll();
        logger.info("Bot Core 启动完成");
    }
}
