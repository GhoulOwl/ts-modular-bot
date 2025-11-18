import { BotCore } from "./core/bot.js";
import { logger } from "./core/logger.js";

async function bootstrap() {
    logger.info("启动 TS Modular Bot...");
    const core = new BotCore();
    await core.init();
    await core.start();
    logger.info("机器人已启动。");
}

bootstrap();