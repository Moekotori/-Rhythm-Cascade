// ============================================================
// game-hit-engine.js - 高性能判定引擎 (TypedArray + 位运算)
// ============================================================

const HitEngine = {
    // Note 状态位掩码
    FLAG_PROCESSED: 1,
    FLAG_HIT: 2,
    FLAG_HOLD: 4,
    FLAG_HOLDING: 8,
    FLAG_HOLD_HIT: 16,
    
    // 判定等级常量
    JUDGE_MISS: 0,
    JUDGE_BAD: 1,
    JUDGE_GOOD: 2,
    JUDGE_GREAT: 3,
    JUDGE_PERFECT: 4,
    JUDGE_MARVELOUS: 5,
    
    // TypedArray 存储
    noteTimes: null,
    noteEndTimes: null,
    noteCols: null,
    noteFlags: null,
    noteCount: 0,
    
    // 列索引
    colStart: new Uint32Array(4),
    colEnd: new Uint32Array(4),
    colCursor: new Uint32Array(4),
    
    // 预分配结果对象
    result: { grade: 0, timing: 0, noteIdx: -1 },
    
    init: function(maxNotes) {
        maxNotes = maxNotes || 10000;
        this.noteTimes = new Float64Array(maxNotes);
        this.noteEndTimes = new Float64Array(maxNotes);
        this.noteCols = new Uint8Array(maxNotes);
        this.noteFlags = new Uint8Array(maxNotes);
        this.noteCount = 0;
    },
    
    buildFromNotes: function(notes) {
        var byCol = [[], [], [], []];
        for (var i = 0; i < notes.length; i++) {
            var n = notes[i];
            byCol[n.col].push({
                time: n.time,
                endTime: n.endTime || n.time,
                isHold: n.isHold,
                originalIdx: i
            });
        }
        
        for (var col = 0; col < 4; col++) {
            byCol[col].sort(function(a, b) { return a.time - b.time; });
        }
        
        var idx = 0;
        for (var col = 0; col < 4; col++) {
            this.colStart[col] = idx;
            for (var j = 0; j < byCol[col].length; j++) {
                var n = byCol[col][j];
                this.noteTimes[idx] = n.time;
                this.noteEndTimes[idx] = n.endTime;
                this.noteCols[idx] = col;
                this.noteFlags[idx] = n.isHold ? this.FLAG_HOLD : 0;
                idx++;
            }
            this.colEnd[col] = idx;
            this.colCursor[col] = this.colStart[col];
        }
        this.noteCount = idx;
    },
    
    reset: function() {
        for (var i = 0; i < this.noteCount; i++) {
            this.noteFlags[i] &= this.FLAG_HOLD;
        }
        for (var col = 0; col < 4; col++) {
            this.colCursor[col] = this.colStart[col];
        }
    },
    
    checkHit: function(col, currentTime, windows) {
        var start = this.colCursor[col];
        var end = this.colEnd[col];
        var bestIdx = -1;
        var bestDiff = 999999;
        
        for (var i = start; i < end; i++) {
            var flags = this.noteFlags[i];
            if (flags & this.FLAG_PROCESSED) continue;
            if ((flags & this.FLAG_HOLD) && (flags & this.FLAG_HOLD_HIT)) continue;
            
            var noteTime = this.noteTimes[i];
            var diff = noteTime - currentTime;
            
            if (diff > windows.MISS) break;
            if (diff < -windows.MISS) {
                if (i === this.colCursor[col]) this.colCursor[col] = i + 1;
                continue;
            }
            
            var absDiff = diff < 0 ? -diff : diff;
            if (absDiff < bestDiff) {
                bestDiff = absDiff;
                bestIdx = i;
                if (absDiff <= windows.MARVELOUS) break;
            }
        }
        
        if (bestIdx === -1) {
            this.result.grade = -1;
            this.result.noteIdx = -1;
            return this.result;
        }
        
        var grade = this.JUDGE_MISS;
        if (bestDiff <= windows.MARVELOUS) grade = this.JUDGE_MARVELOUS;
        else if (bestDiff <= windows.PERFECT) grade = this.JUDGE_PERFECT;
        else if (bestDiff <= windows.GREAT) grade = this.JUDGE_GREAT;
        else if (bestDiff <= windows.GOOD) grade = this.JUDGE_GOOD;
        else if (bestDiff <= windows.BAD) grade = this.JUDGE_BAD;
        
        var diff = this.noteTimes[bestIdx] - currentTime;
        var flags = this.noteFlags[bestIdx];
        
        if (flags & this.FLAG_HOLD) {
            if (grade === this.JUDGE_MISS) {
                this.noteFlags[bestIdx] |= this.FLAG_PROCESSED;
            } else {
                this.noteFlags[bestIdx] |= this.FLAG_HOLD_HIT | this.FLAG_HOLDING | this.FLAG_HIT;
            }
        } else {
            this.noteFlags[bestIdx] |= this.FLAG_PROCESSED;
            if (grade !== this.JUDGE_MISS) {
                this.noteFlags[bestIdx] |= this.FLAG_HIT;
            }
        }
        
        this.result.grade = grade;
        this.result.timing = diff;
        this.result.noteIdx = bestIdx;
        return this.result;
    },
    
    checkRelease: function(col, currentTime, windows) {
        var start = this.colStart[col];
        var end = this.colEnd[col];
        
        for (var i = start; i < end; i++) {
            var flags = this.noteFlags[i];
            if ((flags & this.FLAG_HOLDING) && !(flags & this.FLAG_PROCESSED)) {
                this.noteFlags[i] &= ~this.FLAG_HOLDING;
                var endTime = this.noteEndTimes[i];
                var diff = currentTime - endTime;
                
                this.result.noteIdx = i;
                this.result.timing = diff;
                
                if (diff < -windows.GOOD) {
                    this.noteFlags[i] |= this.FLAG_PROCESSED;
                    this.result.grade = this.JUDGE_MISS;
                } else {
                    this.noteFlags[i] |= this.FLAG_PROCESSED;
                    this.result.grade = this.JUDGE_PERFECT;
                }
                return this.result;
            }
        }
        
        this.result.noteIdx = -1;
        return this.result;
    },
    
    checkAutoMiss: function(currentTime, missWindow) {
        var missedNotes = [];
        for (var col = 0; col < 4; col++) {
            var start = this.colCursor[col];
            var end = this.colEnd[col];
            
            for (var i = start; i < end; i++) {
                var flags = this.noteFlags[i];
                if (flags & this.FLAG_PROCESSED) continue;
                if ((flags & this.FLAG_HOLD) && (flags & this.FLAG_HOLD_HIT)) continue;
                
                var noteTime = this.noteTimes[i];
                if (currentTime > noteTime + missWindow) {
                    this.noteFlags[i] |= this.FLAG_PROCESSED;
                    missedNotes.push({ col: col, idx: i });
                    if (i === this.colCursor[col]) this.colCursor[col] = i + 1;
                } else {
                    break;
                }
            }
        }
        return missedNotes;
    },
    
    isProcessed: function(idx) { return (this.noteFlags[idx] & this.FLAG_PROCESSED) !== 0; },
    isHit: function(idx) { return (this.noteFlags[idx] & this.FLAG_HIT) !== 0; },
    isHolding: function(idx) { return (this.noteFlags[idx] & this.FLAG_HOLDING) !== 0; },
    isHold: function(idx) { return (this.noteFlags[idx] & this.FLAG_HOLD) !== 0; },
    isHoldHit: function(idx) { return (this.noteFlags[idx] & this.FLAG_HOLD_HIT) !== 0; },
    getTime: function(idx) { return this.noteTimes[idx]; },
    getEndTime: function(idx) { return this.noteEndTimes[idx]; },
    getCol: function(idx) { return this.noteCols[idx]; }
};

HitEngine.init(15000);
