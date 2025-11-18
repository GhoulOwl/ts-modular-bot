import { logger } from "./logger.js";

export class ModuleRegistry {
    modules = new Map();
    ts: any;
    constructor(tsClient: any) { this.ts = tsClient; }

    async load(name: string) {
        logger.info(`加载模块：${name}`);
        const mod = await import(`../modules/${name}/index.js`);
        const instance = new mod.default(this.ts);
        this.modules.set(name, instance);
    }

    async startAll() {
        for (const m of this.modules.values()) {
            if (m.start) await m.start();
        }
    }
}