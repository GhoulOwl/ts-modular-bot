import { CommandContext, CommandRouter } from "../../core/command-router.js";
import { EventBus } from "../../core/event-bus.js";
import { loadMusicConfig } from "../../core/config.js";
import { logger } from "../../core/logger.js";
import { TeamSpeakClient } from "../../core/teamspeak-client.js";
import { NCMAdapter, NcmSong } from "./ncm-adapter.js";
import { TS3AudioBotController } from "./ts3a-controller.js";

type Track = { id: string; name: string; artists: string[]; url: string; duration?: number };

export class MusicService {
    private ts: TeamSpeakClient;
    private router: CommandRouter;
    private events: EventBus;
    private ncm: NCMAdapter;
    private player: TS3AudioBotController;
    private queue: Track[] = [];
    private current?: Track;
    private isPlaying = false;
    private watcher?: NodeJS.Timeout;
    private announceQueue: boolean;
    private offlineNotified = false;
    private async safePlayer(action: () => Promise<any>, failMsg: string, event: any) {
        try {
            await action();
            return true;
        } catch (err: any) {
            logger.error(`${failMsg}: ${err.message || err}`);
            await this.ts.respond(event, `${failMsg}，请稍后重试`);
            return false;
        }
    }

    constructor(ctx: { ts: TeamSpeakClient; router: CommandRouter; events: EventBus; }) {
        this.ts = ctx.ts;
        this.router = ctx.router;
        this.events = ctx.events;
        const cfg = loadMusicConfig();
        this.ncm = new NCMAdapter(cfg.ncm.baseUrl, cfg.ncm.timeout);
        this.player = new TS3AudioBotController(cfg.ts3a.baseUrl, cfg.ts3a.timeout);
        this.announceQueue = cfg.queue?.announce ?? true;
    }

    registerCommands() {
        this.router.register("play", (ctx) => this.handlePlay(ctx), "搜索并播放歌曲");
        this.router.register("add", (ctx) => this.handleAdd(ctx), "添加到队列");
        this.router.register("del", (ctx) => this.handleDelete(ctx), "删除队列项");
        this.router.register("clear", (ctx) => this.handleClear(ctx), "清空队列");
        this.router.register("list", (ctx) => this.handleList(ctx), "查看队列");
        this.router.register("pause", (ctx) => this.handlePause(ctx), "暂停播放");
        this.router.register("resume", (ctx) => this.handleResume(ctx), "继续播放");
        this.router.register("stop", (ctx) => this.handleStop(ctx), "停止播放");
        this.router.register("skip", (ctx) => this.handleSkip(ctx), "跳过当前");
        this.router.register("now", (ctx) => this.handleNow(ctx), "查看当前播放");
    }

    start() {
        this.startWatcher();
    }

    async stop() {
        if (this.watcher) clearInterval(this.watcher);
        try { await this.player.stop(); } catch { /* ignore */ }
        this.queue = [];
        this.current = undefined;
        this.isPlaying = false;
    }

    private startWatcher() {
        if (this.watcher) clearInterval(this.watcher);
        this.watcher = setInterval(async () => {
            if (!this.isPlaying) return;
            const state = await this.player.state();
            if (!state) {
                if (!this.offlineNotified) {
                    this.offlineNotified = true;
                    await this.ts.respond({ targetmode: 3, target: 0 }, "TS3AudioBot 离线或未响应");
                }
                return;
            }
            this.offlineNotified = false;
            const playing = typeof state.playing === "boolean" ? state.playing : state.state !== "stopped";
            if (!playing) {
                this.isPlaying = false;
                await this.playNext();
            }
        }, 5000);
    }

    private async handlePlay(ctx: CommandContext) {
        if (!ctx.args.length) {
            await this.ts.respond(ctx.event, "用法：/play <关键词> 或 /play id <歌曲ID>");
            return;
        }
        const [first, ...rest] = ctx.args;
        let track: Track | null = null;
        if (first.toLowerCase() === "id" && rest[0]) {
            track = await this.fetchById(rest[0]);
        } else {
            track = await this.searchAndPick(ctx.args.join(" "));
        }
        if (!track) {
            await this.ts.respond(ctx.event, "没有找到可播放的歌曲");
            return;
        }
        await this.enqueue(track, true, ctx.event);
    }

    private async handleAdd(ctx: CommandContext) {
        if (!ctx.args.length) {
            await this.ts.respond(ctx.event, "用法：/add <关键词>");
            return;
        }
        const track = await this.searchAndPick(ctx.args.join(" "));
        if (!track) {
            await this.ts.respond(ctx.event, "没有找到可添加的歌曲");
            return;
        }
        await this.enqueue(track, !this.isPlaying, ctx.event);
    }

    private async handleDelete(ctx: CommandContext) {
        const idx = Number(ctx.args[0]) - 1;
        if (Number.isNaN(idx) || idx < 0 || idx >= this.queue.length) {
            await this.ts.respond(ctx.event, "用法：/del <队列序号>");
            return;
        }
        const [removed] = this.queue.splice(idx, 1);
        await this.ts.respond(ctx.event, `已删除：${removed.name}`);
    }

    private async handleClear(ctx: CommandContext) {
        this.queue = [];
        await this.ts.respond(ctx.event, "已清空队列");
    }

    private async handleList(ctx: CommandContext) {
        if (!this.queue.length) {
            await this.ts.respond(ctx.event, "队列为空");
            return;
        }
        const lines = this.queue.map((item, i) => `${i + 1}. ${item.name} - ${item.artists.join(", ")}`);
        await this.ts.respond(ctx.event, `队列：\n${lines.join("\n")}`);
    }

    private async handlePause(ctx: CommandContext) {
        if (await this.safePlayer(() => this.player.pause(), "暂停失败", ctx.event)) {
            this.isPlaying = false;
            await this.ts.respond(ctx.event, "已暂停播放");
        }
    }

    private async handleResume(ctx: CommandContext) {
        if (await this.safePlayer(() => this.player.resume(), "恢复播放失败", ctx.event)) {
            this.isPlaying = true;
            await this.ts.respond(ctx.event, "继续播放");
        }
    }

    private async handleStop(ctx: CommandContext) {
        if (await this.safePlayer(() => this.player.stop(), "停止失败", ctx.event)) {
            this.isPlaying = false;
            this.current = undefined;
            this.queue = [];
            await this.ts.respond(ctx.event, "已停止播放并清空队列");
        }
    }

    private async handleSkip(ctx: CommandContext) {
        await this.ts.respond(ctx.event, "切换下一首…");
        await this.playNext(ctx.event);
    }

    private async handleNow(ctx: CommandContext) {
        if (!this.current) {
            await this.ts.respond(ctx.event, "当前未播放歌曲");
            return;
        }
        await this.ts.respond(ctx.event, `正在播放：${this.describeTrack(this.current)}`);
    }

    private async enqueue(track: Track, autoPlay: boolean, event: any) {
        this.queue.push(track);
        if (this.announceQueue) {
            await this.ts.respond(event, `已加入队列：${this.describeTrack(track)}`);
        }
        if (!this.isPlaying && autoPlay) {
            await this.playNext(event);
        }
    }

    private async playNext(notifyEvent?: any) {
        const next = this.queue.shift();
        if (!next) {
            this.current = undefined;
            this.isPlaying = false;
            try { await this.player.stop(); } catch { /* ignore */ }
            if (notifyEvent) await this.ts.respond(notifyEvent, "队列已播放完毕");
            return;
        }
        try {
            await this.player.play(next.url);
            this.current = next;
            this.isPlaying = true;
            this.events.emit("music:play", next);
        } catch (err: any) {
            logger.error(`播放失败：${err.message || err}`);
            if (notifyEvent) await this.ts.respond(notifyEvent, `播放失败：${next.name}`);
            this.isPlaying = false;
        }
    }

    private async searchAndPick(keyword: string): Promise<Track | null> {
        const list = await this.ncm.search(keyword);
        if (!list.length) return null;
        const picked = list[0];
        const url = await this.ncm.getSongUrl(picked.id);
        return { ...picked, url };
    }

    private async fetchById(id: string): Promise<Track | null> {
        const detail = await this.ncm.getSongDetail(id);
        if (!detail) {
            return null;
        }
        const url = await this.ncm.getSongUrl(detail.id);
        return { ...detail, url };
    }

    private describeTrack(track: Track) {
        const artist = track.artists.join(", ") || "未知";
        return `${track.name} - ${artist}`;
    }
}
