// ============================================================
// game-utils.js - 工具函数
// ============================================================

// Toast 通知
function showToast(title, message, type, duration) {
    message = message || '';
    type = type || 'info';
    duration = duration || 3000;
    
    var container = document.getElementById('toast-container');
    if (!container) return;
    
    var toast = document.createElement('div');
    toast.className = 'toast-item' + (type === 'success' ? ' toast-success' : type === 'error' ? ' toast-error' : '');
    
    var html = '';
    if (title) html += '<div class="toast-title">' + title + '</div>';
    if (message) html += '<div class="toast-message">' + message + '</div>';
    toast.innerHTML = html;
    
    container.appendChild(toast);
    
    setTimeout(function() {
        toast.classList.add('toast-out');
        setTimeout(function() { toast.remove(); }, 300);
    }, duration);
}

// 颜色处理
function lightenColor(hex, percent) {
    var num = parseInt(hex.replace('#',''), 16);
    var r = Math.min(255, ((num >> 16) & 255) + Math.round(2.55 * percent));
    var g = Math.min(255, ((num >> 8) & 255) + Math.round(2.55 * percent));
    var b = Math.min(255, (num & 255) + Math.round(2.55 * percent));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function darkenColor(hex, percent) {
    var num = parseInt(hex.replace('#',''), 16);
    var r = Math.max(0, ((num >> 16) & 255) - Math.round(2.55 * percent));
    var g = Math.max(0, ((num >> 8) & 255) - Math.round(2.55 * percent));
    var b = Math.max(0, (num & 255) - Math.round(2.55 * percent));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function brightenColor(hex, percent) {
    // 更强烈的亮化，向白色混合
    var num = parseInt(hex.replace('#',''), 16);
    var r = (num >> 16) & 255;
    var g = (num >> 8) & 255;
    var b = num & 255;
    var factor = percent / 100;
    r = Math.min(255, Math.round(r + (255 - r) * factor));
    g = Math.min(255, Math.round(g + (255 - g) * factor));
    b = Math.min(255, Math.round(b + (255 - b) * factor));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function tintColor(base, factor) {
    if (factor >= 1) return base;
    var num = parseInt(base.replace('#',''), 16);
    var r = (num >> 16) & 255;
    var g = (num >> 8) & 255;
    var b = num & 255;
    r = Math.round(r * factor);
    g = Math.round(g * factor);
    b = Math.round(b * factor);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToRgba(hex, alpha) {
    var num = parseInt(hex.replace('#',''), 16);
    var r = (num >> 16) & 255;
    var g = (num >> 8) & 255;
    var b = num & 255;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

// 绘制圆角矩形路径
function drawRoundedRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// 数学工具
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
}

// 格式化时间 (ms -> mm:ss)
function formatTime(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    s = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

// 格式化分数
function formatScore(score) {
    return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 计算准确率
function calculateAccuracy(stats) {
    var total = stats.marvelous + stats.perfect + stats.great + stats.good + stats.bad + stats.miss;
    if (total === 0) return 100;
    
    var weighted = 
        stats.marvelous * 100 +
        stats.perfect * 100 +
        stats.great * 66.67 +
        stats.good * 33.33 +
        stats.bad * 0 +
        stats.miss * 0;
    
    return weighted / total;
}

// 判定评级
function getRank(accuracy) {
    if (accuracy >= 100) return 'SS';
    if (accuracy >= 95) return 'S';
    if (accuracy >= 90) return 'A';
    if (accuracy >= 80) return 'B';
    if (accuracy >= 70) return 'C';
    return 'D';
}
