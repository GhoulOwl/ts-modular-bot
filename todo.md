# TODO — TS Modular Bot v1.0

基于当前项目代码结构整理
作者：刘文杰

---

## 📌 P0 — 必须完成（核心可运行）

> 完成这些任务后，Bot 能成功连接 TeamSpeak，并加载音乐模块。

### 1. Core 核心层

* [ ] 完善 `TeamSpeakClient`

  * [ ] 监听频道消息事件（textmessage）
  * [ ] 自动重连机制
  * [ ] 心跳保持（keepalive）
* [ ] 实现 `CommandRouter`

  * [ ] 命令分发（/play、/stop 等）
  * [ ] 判断消息前缀
* [ ] 完成 `EventBus`

  * [ ] 模块事件广播
  * [ ] TS3AudioBot 播放事件订阅
* [ ] logger 优化（info/debug/error）
* [ ] 配置加载：支持 ENV 覆盖 YAML

### 2. ModuleRegistry

* [ ] 模块动态加载/卸载
* [ ] 加载失败的错误提示
* [ ] 模块生命周期（init/start/stop）

---

## 🎵 P1 — 必须完成（音乐模块）

> 完成后将具备完整网易云音乐播放能力。

### 3. 网易云 API Adapter（NCMAdapter）

* [ ] `/search`：关键词搜索歌曲
* [ ] `/song/url`：获取播放 URL
* [ ] 错误处理：无版权/链接失效/API 超时
* [ ] 添加缓存（减少重复请求）

### 4. TS3AudioBot Controller

* [ ] `/api/play`：推送音频 URL
* [ ] `/api/pause`
* [ ] `/api/resume`
* [ ] `/api/stop`
* [ ] `/api/state`：监控播放状态
* [ ] 异常自动恢复

### 5. 播放队列 Queue

* [ ] `/add` 添加到队列
* [ ] `/del <index>` 删除队列项
* [ ] `/clear` 清空队列
* [ ] 自动下一首
* [ ] 队列空时自动停止
* [ ] `/list` 查看队列

### 6. MusicService

* [ ] `/play <关键词>`：搜索 → 播放
* [ ] `/play id <id>`：直接播放指定歌曲
* [ ] `/pause`
* [ ] `/resume`
* [ ] `/stop`
* [ ] `/skip`
* [ ] `/now`：查看当前播放信息
* [ ] 加入封面、歌名、作者等信息展示

### 7. 用户反馈优化

* [ ] 播放成功提示
* [ ] 队列提示
* [ ] 搜索失败提示
* [ ] 链接解析失败提示
* [ ] TS3AudioBot 离线提示

---

## 🌱 P2 — 后续扩展

> 为未来的功能做铺垫。

### 8. 模块扩展能力

* [ ] 模块热加载
* [ ] 模块健康检查
* [ ] Module 间事件共享

### 9. 命令增强

* [ ] `/help` 自动生成帮助菜单
* [ ] 参数解析增强
* [ ] 模糊指令匹配（/p 自动识别 play）

### 10. Identity Module（Bot 身份管理）

* [ ] 修改昵称
* [ ] 频道移动
* [ ] 入频道自动介绍

### 11. 错误恢复

* [ ] TS3AudioBot 异常恢复
* [ ] 网易云链接重新获取
* [ ] 队列异常跳过下一首

---

## 🚀 P3 — 可选升级（未来版本）

### 12. TTS + LLM 模块

* [ ] LLM 聊天（Ollama + Qwen3）
* [ ] Whisper 语音识别
* [ ] CosyVoice / GPT-SoVITS 音色合成
* [ ] “说话机器人” → 音频推送到 TS

### 13. Web 控制面板（Nuxt）

* [ ] 实时播放器界面
* [ ] 队列管理
* [ ] 模块开关
* [ ] 日志查看
* [ ] Bot 状态监控

---

## 🏁 推荐开发顺序

```
P0 → P1（确保音乐模块可播放） → P2（扩展能力） → P3（AI语音）
```

完成 P1 后，机器人将具备完整的 **网易云音乐播放能力 + 队列管理 + 基础播控**。

---
