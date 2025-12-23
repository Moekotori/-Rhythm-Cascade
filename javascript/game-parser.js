// ============================================================
// game-parser.js - osu! 谱面解析器
// ============================================================

// 解析 TimingPoints (红线/绿线)
function parseTimingPoints(content) {
    var lines = content.split('\n');
    var timingPoints = [];
    var inTimingPoints = false;
    var baseBPM = 120;
    
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line === '[TimingPoints]') { inTimingPoints = true; continue; }
        if (inTimingPoints && line.startsWith('[')) break;
        if (!inTimingPoints || line === '' || line.startsWith('//')) continue;
        
        var parts = line.split(',');
        if (parts.length < 2) continue;
        
        var time = parseFloat(parts[0]);
        var beatLength = parseFloat(parts[1]);
        var uninherited = parts.length > 6 ? parts[6] === '1' : (beatLength > 0);
        
        var bpm = 0;
        var sv = 1.0;
        
        if (uninherited) {
            bpm = 60000 / beatLength;
            baseBPM = bpm;
            sv = 1.0;
        } else {
            sv = Math.max(0.1, Math.min(10, -100 / beatLength));
            bpm = baseBPM;
        }
        
        timingPoints.push({
            time: time,
            beatLength: beatLength,
            bpm: bpm,
            sv: sv,
            uninherited: uninherited
        });
    }
    
    timingPoints.sort(function(a, b) { return a.time - b.time; });
    
    if (timingPoints.length === 0) {
        timingPoints.push({ time: 0, beatLength: 500, bpm: 120, sv: 1.0, uninherited: true });
    }
    
    return timingPoints;
}

// 预计算每个时刻的累积视觉位置
function buildSVPositionMap(timingPoints) {
    var positionMap = [];
    var currentPos = 0;
    var currentSV = 1.0;
    var lastTime = 0;
    
    if (timingPoints.length === 0 || timingPoints[0].time > 0) {
        positionMap.push({ time: 0, position: 0, sv: 1.0 });
    }
    
    for (var i = 0; i < timingPoints.length; i++) {
        var tp = timingPoints[i];
        var duration = tp.time - lastTime;
        currentPos += duration * currentSV;
        
        positionMap.push({
            time: tp.time,
            position: currentPos,
            sv: tp.sv
        });
        
        currentSV = tp.sv;
        lastTime = tp.time;
    }
    
    return positionMap;
}

// 根据时间获取视觉位置 (二分查找)
function getPositionAtTime(svPositionMap, time) {
    if (!svPositionMap || svPositionMap.length === 0) {
        return time;
    }
    
    var left = 0;
    var right = svPositionMap.length - 1;
    
    while (left < right) {
        var mid = Math.floor((left + right + 1) / 2);
        if (svPositionMap[mid].time <= time) {
            left = mid;
        } else {
            right = mid - 1;
        }
    }
    
    var tp = svPositionMap[left];
    var duration = time - tp.time;
    return tp.position + duration * tp.sv;
}

// 解析 osu HitObjects
function parseOsuHitObjects(content, svPositionMap) {
    var lines = content.split('\n');
    var notes = [];
    var inHitObjects = false;
    var columnCount = 4;
    
    // 获取列数
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('CircleSize:')) {
            columnCount = parseInt(lines[i].split(':')[1].trim());
            break;
        }
    }
    
    // 解析 HitObjects
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line === '[HitObjects]') { inHitObjects = true; continue; }
        if (!inHitObjects || line === '') continue;
        
        var parts = line.split(',');
        if (parts.length < 4) continue;
        
        var x = parseInt(parts[0]);
        var time = parseInt(parts[2]);
        var type = parseInt(parts[3]);
        var col = Math.floor(x * columnCount / 512);
        col = Math.max(0, Math.min(columnCount - 1, col));
        if (columnCount > 4) col = col % 4;
        
        var note = {
            time: time,
            col: col,
            hit: false,
            processed: false,
            isHold: false,
            endTime: 0,
            holding: false,
            holdHit: false,
            position: 0,
            endPosition: 0
        };
        
        if ((type & 128) > 0) {
            note.isHold = true;
            note.endTime = parseInt(parts[5].split(':')[0]);
        }
        
        notes.push(note);
    }
    
    // 排序
    notes.sort(function(a, b) { return a.time - b.time; });
    
    // 计算视觉位置
    for (var i = 0; i < notes.length; i++) {
        var note = notes[i];
        note.position = getPositionAtTime(svPositionMap, note.time);
        if (note.isHold) {
            note.endPosition = getPositionAtTime(svPositionMap, note.endTime);
        }
    }
    
    return notes;
}

// 解析 osu 元数据
function parseOsuMetadata(content) {
    var lines = content.split('\n');
    var metadata = {
        title: 'Unknown',
        artist: 'Unknown',
        version: '',
        creator: '',
        audioFile: ''
    };
    
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.startsWith('Title:')) metadata.title = line.substring(6).trim();
        else if (line.startsWith('Artist:')) metadata.artist = line.substring(7).trim();
        else if (line.startsWith('Version:')) metadata.version = line.substring(8).trim();
        else if (line.startsWith('Creator:')) metadata.creator = line.substring(8).trim();
        else if (line.startsWith('AudioFilename:')) metadata.audioFile = line.substring(14).trim();
    }
    
    return metadata;
}

// 生成程序化谱面
function generateProceduralNotes(svPositionMap, startTime, endTime, density) {
    startTime = startTime || 2000;
    endTime = endTime || 90000;
    density = density || 0.2;
    
    var notes = [];
    
    for (var t = startTime; t < endTime; t += 125) {
        if (Math.random() < density) {
            var isHold = Math.random() < 0.2;
            var note = {
                time: t,
                col: Math.floor(Math.random() * 4),
                hit: false,
                processed: false,
                isHold: isHold,
                endTime: isHold ? t + 200 + Math.random() * 500 : 0,
                holding: false,
                holdHit: false,
                position: getPositionAtTime(svPositionMap, t),
                endPosition: 0
            };
            if (note.isHold) {
                note.endPosition = getPositionAtTime(svPositionMap, note.endTime);
            }
            notes.push(note);
        }
    }
    
    return notes;
}
