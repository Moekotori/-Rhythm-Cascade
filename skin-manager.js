// ============================================================
// skin-manager.js - Etterna/StepMania 皮肤加载器
// ============================================================

const SkinManager = {
    // 资源存储：按轨道索引 (0-3) 存储
    assets: {
        0: { tap: null, holdHead: null, holdBody: null, holdTail: null, receptor: null },
        1: { tap: null, holdHead: null, holdBody: null, holdTail: null, receptor: null },
        2: { tap: null, holdHead: null, holdBody: null, holdTail: null, receptor: null },
        3: { tap: null, holdHead: null, holdBody: null, holdTail: null, receptor: null }
    },

    // 缓存图片信息（用于处理动画帧，例如 4x1 的图）
    spriteInfo: new Map(),
    
    // 跟踪已创建的 Blob URLs 以便释放内存
    blobUrls: [],

    reset() {
        // 释放旧的 Blob URLs
        if (this.blobUrls) {
            this.blobUrls.forEach(url => URL.revokeObjectURL(url));
        }
        this.blobUrls = [];

        this.assets = {
            0: { tap: null, holdHead: null, holdBody: null, holdTail: null, receptor: null },
            1: { tap: null, holdHead: null, holdBody: null, holdTail: null, receptor: null },
            2: { tap: null, holdHead: null, holdBody: null, holdTail: null, receptor: null },
            3: { tap: null, holdHead: null, holdBody: null, holdTail: null, receptor: null }
        };
        this.spriteInfo = new Map();
    },

    // 核心方法：加载 Zip（分区块说明）
    async loadSkinFromZip(file) {
        try {
            this.reset(); // 清除旧皮肤
            const zip = await JSZip.loadAsync(file);

            // 0) 基本规则
            const validExtensions = ['.png', '.jpg', '.jpeg'];
            const mappings = [
                { key: 'tap', includes: ['tap note'] },
                { key: 'holdBody', includes: ['hold body active', 'hold body'] },
                { key: 'holdTail', includes: ['hold bottomcap active', 'hold bottomcap', 'hold tail'] },
                { key: 'holdHead', includes: ['hold head active', 'hold head'] },
                { key: 'receptor', includes: ['receptor', 'button'] }
            ];
            const sortedMappings = [...mappings].sort((a, b) => b.includes[0].length - a.includes[0].length);

            const fileNames = Object.keys(zip.files);

            for (const fileName of fileNames) {
                const lowerName = fileName.toLowerCase();

                // 1) 过滤无关文件
                if (!validExtensions.some(ext => lowerName.endsWith(ext))) continue;
                if (lowerName.includes('__macosx') || lowerName.startsWith('.')) continue;

                // 2) 检测资源类型
                const assetType = this.detectAssetType(lowerName, sortedMappings);
                if (!assetType) continue;

                // 3) 判定适用轨道
                const targetCols = this.detectTargetCols(lowerName);

                // 4) 读取并创建图片
                const blob = await zip.file(fileName).async('blob');
                const img = await this.createImageFromBlob(blob);
                if (!this.isImageValid(img)) {
                    console.warn(`Skipping invalid image: ${fileName}`);
                    continue;
                }

                // 5) 分析帧信息
                const frames = this.analyzeFrames(lowerName, img, assetType);
                const tailOrientation = assetType === 'holdTail' ? this.detectTailOrientation(img) : null;
                this.spriteInfo.set(img, { frames, frameHeight: img.naturalHeight / frames, tailOrientation, targetCols });

                // 6) 落盘到资源表
                this.storeAsset(targetCols, assetType, img);
            }

            console.log("Skin loaded!", this.assets);
            return true;
        } catch (e) {
            console.error("Skin load failed:", e);
            alert("Failed to load skin: " + e.message);
            return false;
        }
    },

    // --- 分区块工具 ---
    detectAssetType(lowerName, sortedMappings) {
        for (const map of sortedMappings) {
            if (map.includes.some(k => lowerName.includes(k))) return map.key;
        }
        return null;
    },

    detectTargetCols(lowerName) {
        if (lowerName.includes('left')) return [0];
        if (lowerName.includes('down')) return [1];
        if (lowerName.includes('up')) return [2];
        if (lowerName.includes('right')) return [3];
        return [0, 1, 2, 3];
    },

    isImageValid(img) {
        return img && img.naturalWidth > 0 && img.naturalHeight > 0;
    },

    analyzeFrames(lowerName, img, assetType) {
        let frames = 1;

        // 4x1 命名方式判定
        if (lowerName.includes('x')) {
            const match = lowerName.match(/(\d+)x(\d+)/);
            if (match) {
                const cols = parseInt(match[1]);
                const rows = parseInt(match[2]);
                if (cols === 1 && rows > 1) frames = rows;
            }
        } else if (img.naturalHeight >= img.naturalWidth * 2) {
            // 高度远大于宽度，且不是 holdBody/holdTail 时，尝试按行数拆分
            if (assetType !== 'holdBody' && assetType !== 'holdTail') {
                frames = Math.round(img.naturalHeight / img.naturalWidth);
            }
        }

        if (!Number.isFinite(frames) || frames < 1) frames = 1;
        return frames;
    },

    // 粗略检测尾部朝向：对透明度做一行行统计，判断哪端更尖
    detectTailOrientation(img) {
        try {
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            if (!w || !h) return null;

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const data = ctx.getImageData(0, 0, w, h).data;
            const rowAlpha = new Array(h).fill(0);
            for (let y = 0; y < h; y++) {
                let count = 0;
                const offset = y * w * 4;
                for (let x = 0; x < w; x++) {
                    const a = data[offset + x * 4 + 3];
                    if (a > 8) count++;
                }
                rowAlpha[y] = count;
            }

            // 取头尾各 8% 行的平均透明像素数，较小者被视为“尖端”
            const span = Math.max(1, Math.floor(h * 0.08));
            const avg = (arr, start, end) => {
                let sum = 0;
                for (let i = start; i < end; i++) sum += arr[i];
                return sum / Math.max(1, end - start);
            };
            const topAvg = avg(rowAlpha, 0, span);
            const bottomAvg = avg(rowAlpha, h - span, h);

            // 0.72 阈值：较尖端像素明显更少
            if (topAvg < bottomAvg * 0.72) return 'up';      // 顶部更尖，尾巴朝上
            if (bottomAvg < topAvg * 0.72) return 'down';    // 底部更尖，尾巴朝下
            return null; // 无明显尖端
        } catch (e) {
            console.warn('detectTailOrientation failed', e);
            return null;
        }
    },

    storeAsset(targetCols, assetType, img) {
        targetCols.forEach(col => {
            if (!this.assets[col]) this.assets[col] = {};
            this.assets[col][assetType] = img;
        });
    },

    createImageFromBlob(blob) {
        return new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(blob);
            this.blobUrls.push(url); // 记录 URL
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.warn("Failed to load image blob");
                // 即使失败也返回 img (width=0)，由调用者处理
                resolve(img); 
            };
            img.src = url;
        });
    },

    // 获取资源的辅助方法
    getAsset(col, type) {
        // 1. 尝试获取特定轨道的资源
        if (this.assets[col] && this.assets[col][type]) {
            return this.assets[col][type];
        }
        
        // 2. 尝试获取轨道 0 (通常作为默认轨道)
        if (this.assets[0] && this.assets[0][type]) {
            return this.assets[0][type];
        }

        // 3. 尝试获取任意存在的轨道资源 (防止某些皮肤只有 Up/Down 而没有 Left/Right)
        for (let i = 0; i < 4; i++) {
            if (this.assets[i] && this.assets[i][type]) {
                return this.assets[i][type];
            }
        }

        return null;
    },

    // 获取精灵图信息
    getSpriteInfo(img) {
        return this.spriteInfo.get(img) || { frames: 1, frameHeight: img.height };
    }
};
