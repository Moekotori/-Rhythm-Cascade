# 🌸 Rhythm Cascade

> 一款可爱风格的网页端 4K 下落式音游，支持 osu!mania 谱面导入

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Canvas](https://img.shields.io/badge/Canvas-2D-brightgreen)
![License](https://img.shields.io/badge/License-MIT-pink)

<p align="center">
  <img src="https://img.shields.io/badge/🎮_4K_Rhythm_Game-FF85A2?style=for-the-badge" alt="4K Rhythm Game">
  <img src="https://img.shields.io/badge/🎵_osu!mania_Support-A8E6CF?style=for-the-badge" alt="osu!mania Support">
</p>

## ✨ 特性

### 🎮 游戏功能
- **4K 下落式音游** - 经典的四轨道玩法
- **osu!mania 谱面支持** - 直接导入 `.osz` 文件即可游玩
- **多种判定难度** - J1 ~ J9 九档判定窗口，满足不同水平玩家
- **丰富的 Mod 系统** - EZ、HR、DT、HT、HD、FL、AT 等多种游戏修改器
- **LN (长条) 支持** - 完整的长按音符判定系统
- **BAD 判定系统** - 更细致的判定反馈

### 🎨 视觉定制
- **8 种音符皮肤** - BAR / DJMAX / ARROW / CIRCLE / DIAMOND / PILL / NEON / RETRO
- **自定义音符颜色** - 四轨道独立颜色设置
- **背景亮度调节** - 0-100% 背景昏暗度
- **轨道亮度调节** - 自定义轨道可见度
- **可爱 UI 风格** - 粉嫩配色，萌系设计 🌷

### ⚡ 性能优化
- **高刷新率支持** - 最高可解锁 1000+ FPS，突破 VSync 限制
- **零重影渲染** - 针对高刷屏优化，移除所有 shadowBlur
- **高性能判定引擎** - 列索引 + 二分查找，毫秒级响应
- **desynchronized Canvas** - 降低输入延迟

### 🎵 音频系统
- **HitSound 支持** - 自动从谱面加载打击音效
- **音频偏移校准** - ±200ms 手动/自动偏移调节
- **变速播放** - 0.5x ~ 2.0x 自定义播放速率
- **谱面结束后音乐继续** - 沉浸式体验

## 🚀 快速开始

### 在线游玩
直接打开 `index.html` 即可在浏览器中运行，无需安装任何依赖。

### 本地部署
```bash
# 克隆仓库
git clone https://github.com/你的用户名/rhythm-cascade.git

# 进入目录
cd rhythm-cascade

# 用浏览器打开
start index.html  # Windows
open index.html   # macOS
xdg-open index.html  # Linux
```

### 使用本地服务器（可选）
```bash
# Python
python -m http.server 8080

# Node.js
npx serve .

# VS Code Live Server 插件
```

## 🎹 操作说明

### 默认按键
| 轨道 | 按键 |
|:----:|:----:|
| 1 | D |
| 2 | F |
| 3 | J |
| 4 | K |

### 系统快捷键
| 功能 | 按键 |
|------|------|
| 重新开始 | ` (反引号) |
| 隐藏 Combo | \\ (反斜杠) |
| 暂停 | Esc |
| 全屏 | F11 |
| 调节尺寸 | 鼠标滚轮 |

> 💡 所有按键都可以在设置中自定义

## 🎯 判定系统

### 判定等级
| 等级 | 说明 | 颜色 |
|------|------|------|
| ✦ MARVELOUS | 完美命中 | 🌈 彩虹 |
| ✦ PERFECT | 极好 | 💛 金色 |
| ✦ GREAT | 很好 | 💚 绿色 |
| ✦ GOOD | 良好 | 💙 蓝色 |
| ✦ BAD | 较差 | 🤍 灰色 |
| ✦ MISS | 失误 | ❤️ 红色 |

### 判定难度 (J1-J9)
| 难度 | 说明 | 适合人群 |
|------|------|----------|
| J1 | 最宽松 | 新手入门 |
| J2-J3 | 宽松 | 休闲玩家 |
| J4 | 标准 | 普通玩家 |
| J5-J6 | 严格 | 进阶玩家 |
| J7-J8 | 非常严格 | 高手玩家 |
| J9 | 最严格 | 挑战极限 |

## 🔧 Mod 说明

### 🟢 降低难度
| Mod | 名称 | 效果 | 倍率 |
|-----|------|------|------|
| EZ | Easy | 判定窗口 ×1.4 | 0.5x |
| NF | No Fail | 不会失败 | 0.5x |
| HT | Half Time | 0.75x 速度 | 0.3x |

### 🔴 增加难度
| Mod | 名称 | 效果 | 倍率 |
|-----|------|------|------|
| HR | Hard Rock | 判定窗口 ×0.8 | 1.06x |
| SD | Sudden Death | 断连即死 | 1.0x |
| PF | Perfect | 非 Perfect 即死 | 1.0x |
| DT | Double Time | 1.5x 速度 | 1.12x |
| NC | Nightcore | 1.5x 速度 + 变调 | 1.12x |

### 🟡 视觉修改
| Mod | 名称 | 效果 |
|-----|------|------|
| HD | Hidden | 音符渐隐 |
| FI | Fade In | 音符渐显 |
| FL | Flashlight | 手电筒模式 |

### 🟣 特殊
| Mod | 名称 | 效果 |
|-----|------|------|
| AT | Auto | 自动游玩 |
| CR | Custom Rate | 自定义速率 (0.5x-2.0x) |
| MR | Mirror | 镜像翻转 |
| NP | No Pause | 禁止暂停 |

## 📁 导入谱面

### 支持格式
- `.osz` - osu! 谱面包
- `.zip` - 包含 `.osu` 文件的压缩包

### 导入步骤
1. 下载 osu!mania 4K 谱面 (`.osz` 格式)
2. 点击主界面的 **IMPORT MAP (.osz)** 按钮
3. 选择下载的谱面文件
4. 等待 Toast 提示加载完成
5. 点击 **START GAME** 开始游玩！

### 谱面下载推荐
- [osu! 官网 - Mania 谱面](https://osu.ppy.sh/beatmapsets?m=3&sort=plays_desc)
- 筛选条件：Mode = osu!mania, Keys = 4K

> ⚠️ 仅支持 **4K** 谱面，其他 Key 数谱面可能无法正常游玩

## ⚙️ 设置选项

### 游戏设置
| 选项 | 范围 | 说明 |
|------|------|------|
| Scroll Speed | 0.5 ~ 5.0 | 音符下落速度 |
| Hit Position | 50% ~ 95% | 判定线位置 |
| Audio Offset | -200ms ~ +200ms | 音频偏移校准 |
| Judgement | J1 ~ J9 | 判定难度 |
| Max FPS | 60 ~ 解锁 | 帧率限制 |

### 视觉设置
| 选项 | 说明 |
|------|------|
| Note Skin | 8 种皮肤可选 |
| Note Colors | 四轨道独立颜色 |
| Background Dim | 背景昏暗度 |
| Lane Brightness | 轨道亮度 |
| Hide Judge Line | 隐藏判定线 |

### 音频设置
| 选项 | 说明 |
|------|------|
| HitSounds | 打击音效开关 |
| Audio Prewarm | 音频预热（减少延迟） |
| Offset Hint | 偏移提示 |
| Auto Offset | 自动检测系统延迟 |

## 🛠️ 技术栈

```
┌─────────────────────────────────────────┐
│  Frontend                               │
├─────────────────────────────────────────┤
│  • HTML5 Canvas 2D                      │
│  • Vanilla JavaScript (ES6+)            │
│  • CSS3 (Animations, Flexbox, Grid)     │
├─────────────────────────────────────────┤
│  APIs                                   │
├─────────────────────────────────────────┤
│  • Web Audio API (低延迟音频)            │
│  • requestAnimationFrame / setTimeout   │
│  • Keyboard Events                      │
├─────────────────────────────────────────┤
│  Libraries                              │
├─────────────────────────────────────────┤
│  • JSZip (谱面解压)                      │
└─────────────────────────────────────────┘
```

## 🌐 浏览器兼容性

| 浏览器 | 支持情况 |
|--------|----------|
| Chrome 80+ | ✅ 推荐 |
| Edge 80+ | ✅ 推荐 |
| Firefox 75+ | ✅ 支持 |
| Safari 14+ | ⚠️ 部分支持 |
| IE | ❌ 不支持 |

## 🐛 常见问题

### Q: 音符和音乐对不上？
A: 在设置中调整 **Audio Offset**。如果总是 LATE，增加正 offset；如果总是 FAST，增加负 offset。

### Q: 帧率被锁定在显示器刷新率？
A: 将 Max FPS 设置为高于显示器刷新率的值（如 480），或点击"解锁"按钮。

### Q: 导入谱面失败？
A: 确保：
- 谱面是 `.osz` 或 `.zip` 格式
- 谱面包含 `.osu` 文件
- 网络正常（需要加载 JSZip）

### Q: 没有声音？
A: 点击页面任意位置以解锁浏览器的音频播放限制。

## 📝 更新日志

### v1.0.0 (2024)
- 🎮 完整的 4K 音游系统
- 🎵 osu!mania 谱面解析与播放
- 🎨 8 种可爱音符皮肤
- ⚡ 高刷新率优化（零重影）
- 🔧 完整 Mod 系统（14 种）
- 🎯 9 档判定难度
- 💕 可爱粉嫩 UI 风格
- 🔊 HitSound 系统
- 📊 详细成绩统计

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 随意使用、修改和分发

## 💖 致谢

- [osu!](https://osu.ppy.sh) - 优秀的谱面格式与社区
- [JSZip](https://stuk.github.io/jszip/) - 前端解压库
- 所有音游爱好者的支持 ❤️

---

<p align="center">
  <b>Made with 💕 by Moekotori</b>
</p>

<p align="center">
  🌸 Have fun playing! 🌸
</p>

<p align="center">
  <a href="#-rhythm-cascade">⬆️ 返回顶部</a>
</p>
