import { logger } from "./logger.js";
import { CommandRouter } from "./command-router.js";
import { EventBus } from "./event-bus.js";

export type ModuleContext = {
    ts: any;
    router: CommandRouter;
    events: EventBus;
};

export class ModuleRegistry {
    modules = new Map<string, any>();
    ts: any;
    router: CommandRouter;
    events: EventBus;

    constructor(tsClient: any, router: CommandRouter, events: EventBus) {
        this.ts = tsClient;
        this.router = router;
        this.events = events;
    }

    async load(name: string) {
        logger.info(`加载模块：${name}`);
        try {
            const mod = await import(`../modules/${name}/index.js`);
            const instance = new mod.default({ ts: this.ts, router: this.router, events: this.events } as ModuleContext);
            if (instance.init) await instance.init();
            this.modules.set(name, instance);
        } catch (err: any) {
            logger.error(`模块 ${name} 加载失败：${err.message || err}`);
        }
    }

    async unload(name: string) {
        const mod = this.modules.get(name);
        if (!mod) return;
        if (mod.stop) await mod.stop();
        this.modules.delete(name);
        logger.info(`模块已卸载：${name}`);
    }

    async startAll() {
        for (const [name, m] of this.modules.entries()) {
            try {
                if (m.start) await m.start();
                logger.info(`模块启动成功：${name}`);
            } catch (err: any) {
                logger.error(`模块 ${name} 启动失败：${err.message || err}`);
            }
        }
    }
}
