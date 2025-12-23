// ============================================================
// crash-logger.js - 游戏崩溃日志记录系统
// ============================================================

const CrashLogger = {
    init() {
        // 捕获全局未捕获的异常
        window.addEventListener('error', (event) => {
            this.handleError(event.error || event.message, 'Global Error');
        });
        
        // 捕获未处理的 Promise 拒绝
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, 'Unhandled Rejection');
        });

        console.log("CrashLogger initialized.");
    },

    handleError(error, source = 'Unknown') {
        // 防止递归报错
        if (this.isHandlingError) return;
        this.isHandlingError = true;

        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `crash_log_${timestamp}.txt`;
            
            let logContent = `=== RHYTHM GAME CRASH LOG ===\n`;
            logContent += `Time: ${new Date().toLocaleString()}\n`;
            logContent += `Source: ${source}\n`;
            logContent += `Error: ${error}\n`;
            
            if (error && error.stack) {
                logContent += `\n=== STACK TRACE ===\n${error.stack}\n`;
            }
            
            logContent += `\n=== SYSTEM INFO ===\n`;
            logContent += `User Agent: ${navigator.userAgent}\n`;
            logContent += `Screen: ${window.screen.width}x${window.screen.height}\n`;
            logContent += `URL: ${window.location.href}\n`;
            
            logContent += `\n=== GAME STATE ===\n`;
            if (typeof Config !== 'undefined') {
                try {
                    logContent += `Config: ${JSON.stringify(Config, null, 2)}\n`;
                } catch (e) {
                    logContent += `Config: [Error serializing config]\n`;
                }
            }
            
            // 尝试获取游戏实例状态 (假设 game 变量存在于全局)
            if (typeof game !== 'undefined' && game) {
                try {
                    logContent += `Game State: ${game.gameState}\n`;
                    logContent += `Audio Time: ${game.audioCtx ? game.audioCtx.currentTime : 'N/A'}\n`;
                    logContent += `Notes Count: ${game.notes ? game.notes.length : 'N/A'}\n`;
                    logContent += `Active Keys: ${JSON.stringify(game.activeKeys)}\n`;
                } catch (e) {
                    logContent += `Game State: [Error capturing state]\n`;
                }
            }

            // 触发下载
            // this.downloadLog(logContent, filename);
            
            // 尝试在页面上显示
            this.showCrashUI(error, logContent, filename);

        } catch (loggingError) {
            console.error("Failed to generate crash log:", loggingError);
        } finally {
            this.isHandlingError = false;
        }
    },

    downloadLog(content, filename) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    showCrashUI(error, logContent, filename) {
        // 如果页面上还没有崩溃提示，创建一个
        if (document.getElementById('crash-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'crash-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); color: #fff; z-index: 99999;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: monospace; text-align: center; padding: 20px;
        `;
        
        overlay.innerHTML = `
            <h1 style="color: #ff5555; font-size: 32px;">GAME CRASHED</h1>
            <p style="font-size: 18px; margin-bottom: 20px;">An unexpected error occurred.</p>
            <div style="background: #333; padding: 15px; border-radius: 5px; max-width: 80%; overflow: auto; text-align: left; margin-bottom: 20px;">
                <pre style="margin: 0; color: #ffaaaa;">${error}\n${error && error.stack ? error.stack : ''}</pre>
            </div>
            <div style="display: flex; gap: 15px;">
                <button id="btn-download-log" style="padding: 10px 20px; font-size: 18px; cursor: pointer; background: #4CAF50; color: #fff; border: none; border-radius: 5px;">Download Log</button>
                <button onclick="window.location.reload()" style="padding: 10px 20px; font-size: 18px; cursor: pointer; background: #fff; color: #000; border: none; border-radius: 5px;">Reload Game</button>
            </div>
        `;
        
        document.body.appendChild(overlay);

        // 绑定下载事件
        document.getElementById('btn-download-log').onclick = () => {
            this.downloadLog(logContent, filename);
        };
    }
};

// 自动初始化
CrashLogger.init();
