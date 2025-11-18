import { TeamSpeakClient } from "./teamspeak-client.js";
import { EventBus } from "./event-bus.js";
import { logger } from "./logger.js";

export type CommandContext = {
    args: string[];
    raw: string;
    event: any;
};

type CommandHandler = (ctx: CommandContext) => Promise<void> | void;

type CommandMeta = { handler: CommandHandler; description?: string };

export class CommandRouter {
    private commands = new Map<string, CommandMeta>();
    private prefix: string;
    private ts: TeamSpeakClient;
    private bus: EventBus;

    constructor(ts: TeamSpeakClient, bus: EventBus, prefix = "/") {
        this.ts = ts;
        this.bus = bus;
        this.prefix = prefix;
    }

    register(command: string, handler: CommandHandler, description?: string) {
        this.commands.set(command.toLowerCase(), { handler, description });
        logger.info(`注册命令: ${this.prefix}${command}`);
    }

    async handleMessage(event: any) {
        const msg: string = event.msg || "";
        if (!msg.startsWith(this.prefix)) return;
        const trimmed = msg.slice(this.prefix.length).trim();
        if (!trimmed) return;
        const [command, ...args] = trimmed.split(/\s+/);
        const meta = this.commands.get(command.toLowerCase());
        if (!meta) {
            await this.ts.respond(event, `未知命令：${command}`);
            return;
        }
        const ctx: CommandContext = { args, raw: trimmed, event };
        try {
            await meta.handler(ctx);
            this.bus.emit("command:handled", { command, args });
        } catch (err: any) {
            logger.error(`命令执行失败 ${command}: ${err.message}`);
            await this.ts.respond(event, `命令执行失败：${err.message || err}`);
        }
    }

    helpText() {
        const lines = Array.from(this.commands.entries()).map(([name, meta]) => {
            const desc = meta.description ? ` — ${meta.description}` : "";
            return `${this.prefix}${name}${desc}`;
        });
        return lines.join("\n");
    }
}
