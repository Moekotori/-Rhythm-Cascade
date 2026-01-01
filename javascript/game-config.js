// ============================================================
// game-config.js - 游戏配置与判定系统
// ============================================================

const Config = {
    scrollSpeed: 2.0, 
    baseSpeedPixels: 0.6, 
    offset: 0,
    hitPosition: 85,
    scrollDirection: 'down', // 'down' = 下落式 (默认), 'up' = 上升式
    laneCover: {
        enabled: false,
        type: 'hidden', // 'hidden' = Hidden+ (遮住顶部), 'sudden' = Sudden+ (遮住底部)
        height: 30 // 遮挡高度百分比 (0-80)
    },
    hpEnabled: false,
    hpDifficulty: 2, // 0-5
    keybinds: ['KeyD', 'KeyF', 'KeyJ', 'KeyK'],
    keyDisplay: ['D', 'F', 'J', 'K'],
    keybinds_sys: { restart: 'Backquote', hideCombo: 'Backslash' },
    keyDisplay_sys: { restart: '`', hideCombo: '\\' },
    skin: 'CIRCLE', 
    difficulty: 2,
    tailJudgement: false,
    enableFever: true,
    enableHitSounds: false,
    enableOffsetHint: false,
    inputLatencyCompensation: 0, // 输入延迟补偿 (ms)，用于抵消触控/键盘事件延迟
    autoPauseOnBlur: true, // 窗口失去焦点时自动暂停
    backgroundDim: 0,
    laneBrightness: 100,
    volume: 100, // 音量 (0-100)
    maxFps: 120,
    showFPS: false,
    showHitErrorBar: true, // 新增：打击误差条开关
    showJudgeText: true,   // 新增：判定文字开关
    showFastLate: true,    // 新增：Fast/Late 提示开关
    noteColors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    audioPrewarm: true,
    autoOffsetSuggest: true,
    hideJudgeLine: false,
    customRate: 1.0,
    mods: {
        EZ: false, NF: false, HT: false,
        HR: false, SD: false, PF: false, DT: false, NC: false,
        HD: false, FI: false, FL: false,
        AT: false, CR: false, MR: false, NP: false
    },

    load() {
        const saved = localStorage.getItem('rc_sakura_config_v11');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // 防御性合并：只合并已知属性，或者对关键属性进行校验
                Object.assign(this, parsed);
            } catch (e) {
                console.error("Config load error:", e);
            }
        }
        
        // 关键属性校验与修正
        if (!Number.isFinite(this.hitPosition)) this.hitPosition = 85;
        this.hitPosition = Math.max(0, Math.min(100, this.hitPosition));

        // 滚动速度校验
        if (!Number.isFinite(this.scrollSpeed) || this.scrollSpeed <= 0) {
            this.scrollSpeed = 2.0;
        }
        this.scrollSpeed = Math.max(0.5, Math.min(10.0, this.scrollSpeed));

        // 偏移量校验
        if (!Number.isFinite(this.offset)) {
            this.offset = 0;
        }
        // 限制 offset 范围，防止极端值导致判定完全失效 (-500ms 到 +500ms)
        this.offset = Math.max(-500, Math.min(500, this.offset));

        if (typeof this.scrollDirection !== 'string' || (this.scrollDirection !== 'up' && this.scrollDirection !== 'down')) {
            this.scrollDirection = 'down';
        }

        if (!Array.isArray(this.noteColors) || this.noteColors.length !== 4) {
            this.noteColors = ['#FF9AA2', '#B5EAD7', '#B5EAD7', '#FF9AA2'];
        }
        if (typeof this.smoothTrail !== 'number' || this.smoothTrail < 0) this.smoothTrail = 0;
        this.smoothTrail = Math.min(0.3, this.smoothTrail);
        if (typeof this.audioPrewarm !== 'boolean') this.audioPrewarm = true;
        if (typeof this.autoOffsetSuggest !== 'boolean') this.autoOffsetSuggest = true;
        if (typeof this.autoPauseOnBlur !== 'boolean') this.autoPauseOnBlur = true;
        if (typeof this.customRate !== 'number') this.customRate = 1.0;
        this.customRate = Math.max(0.5, Math.min(2.0, this.customRate));
        if (typeof this.hpEnabled !== 'boolean') this.hpEnabled = false;
        if (!isFinite(this.hpDifficulty)) this.hpDifficulty = 2;
        this.hpDifficulty = Math.max(0, Math.min(5, this.hpDifficulty));
        if (typeof this.volume !== 'number') this.volume = 100;
        this.volume = Math.max(0, Math.min(100, this.volume));
    },
    save() {
        localStorage.setItem('rc_sakura_config_v11', JSON.stringify(this));
    }
};

// 判定窗口表
const JUDGE_WINDOWS_TABLE = {
    1: { MARVELOUS: 33.75, PERFECT: 67.5, GREAT: 135, GOOD: 202.5, BAD: 236.25, MISS: 270 },
    2: { MARVELOUS: 30.0, PERFECT: 60.0, GREAT: 120, GOOD: 180, BAD: 210, MISS: 240 },
    3: { MARVELOUS: 26.1, PERFECT: 52.2, GREAT: 104.4, GOOD: 156.6, BAD: 182.7, MISS: 208.8 },
    4: { MARVELOUS: 22.5, PERFECT: 45, GREAT: 90, GOOD: 135, BAD: 157.5, MISS: 180 },
    5: { MARVELOUS: 18.9, PERFECT: 37.8, GREAT: 75.6, GOOD: 113.4, BAD: 132.3, MISS: 151.2 },
    6: { MARVELOUS: 14.85, PERFECT: 29.7, GREAT: 59.4, GOOD: 89.1, BAD: 103.95, MISS: 118.8 },
    7: { MARVELOUS: 11.25, PERFECT: 22.5, GREAT: 45, GOOD: 67.5, BAD: 78.75, MISS: 90 },
    8: { MARVELOUS: 7.425, PERFECT: 14.85, GREAT: 29.7, GOOD: 44.55, BAD: 51.975, MISS: 59.4 }
};

const JUDGE_DESCRIPTIONS = {
    1: "J1 - 超级宽松 (入门)",
    2: "J2 - 宽松",
    3: "J3 - 稍宽松", 
    4: "J4 - 标准",
    5: "J5 - 稍严格",
    6: "J6 - 严格",
    7: "J7 - 竞技级",
    8: "J8 - 极限"
};

const DEFAULT_NOTE_COLORS = ['#FF9AA2', '#B5EAD7', '#B5EAD7', '#FF9AA2'];
const INPUT_BUFFER_MS = 35;
const OFFSET_HINT_SAMPLES = 18;
const OFFSET_HINT_THRESHOLD = 8;
const MIN_KEY_INTERVAL_MS = 12;

let cachedWindows = null;
let cachedWindowsKey = '';

function getWindows(jLevel) {
    const level = Math.max(1, Math.min(8, Math.round(jLevel)));
    const key = level + '-' + Config.mods.HR + '-' + Config.mods.EZ;
    if (cachedWindowsKey === key && cachedWindows) return cachedWindows;
    
    const baseWindows = JUDGE_WINDOWS_TABLE[level];
    let modScale = 1.0;
    if (Config.mods.HR) modScale *= 0.8;
    if (Config.mods.EZ) modScale *= 1.2;

    cachedWindows = {
        MARVELOUS: baseWindows.MARVELOUS * modScale,
        PERFECT: baseWindows.PERFECT * modScale,
        GREAT: baseWindows.GREAT * modScale,
        GOOD: baseWindows.GOOD * modScale,
        BAD: baseWindows.BAD * modScale,
        MISS: baseWindows.MISS * modScale
    };
    cachedWindowsKey = key;
    return cachedWindows;
}

function getJudgeDescription(jLevel) {
    const level = Math.max(1, Math.min(8, Math.round(jLevel)));
    return JUDGE_DESCRIPTIONS[level] || JUDGE_DESCRIPTIONS[4];
}

function invalidateWindowsCache() {
    cachedWindows = null;
    cachedWindowsKey = '';
}

function getNoteColors() {
    if (!Array.isArray(Config.noteColors)) return DEFAULT_NOTE_COLORS;
    return Config.noteColors.map(function(c, i) { 
        return c || DEFAULT_NOTE_COLORS[i] || DEFAULT_NOTE_COLORS[0]; 
    });
}

Config.load();
