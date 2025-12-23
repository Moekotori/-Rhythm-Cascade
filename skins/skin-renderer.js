// ============================================================
// skin-renderer.js - 皮肤渲染系统 (修复版)
// ============================================================

// 皮肤图片缓存
const SkinImages = {
    etternaArrow: [null, null, null, null],
    amSoEpicCircle: [null, null, null, null],
    attangReceptor: null, // Attang 使用 Receptor 作为 Note 贴图
    etternaHoldBody: null,
    etternaHoldTail: null,
    amsoHoldBody: null,
    amsoHoldTail: null,
    attangHoldBody: null,
    attangHoldTail: null,
    // 缓存染色后的图片
    tintCache: {}
};

// 16 进制颜色转 rgba 字符串
function hexToRgba(hex, alpha) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r},${g},${b},${alpha})`;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// 获取 Etterna 箭头图片
function getEtternaArrowImg(col) {
    if (SkinImages.etternaArrow[col]) return SkinImages.etternaArrow[col];
    const names = ['Down', 'Left', 'Right', 'Up'];
    const img = new Image();
    img.src = `skins/etterna-arrow/Notes/_${names[col]} Tap Note 1x1 (res 64x64).png`;
    SkinImages.etternaArrow[col] = img;
    return img;
}

// 获取 AmSoEpicCircles 图片
function getAmSoEpicCircleImg(col) {
    if (SkinImages.amSoEpicCircle[col]) return SkinImages.amSoEpicCircle[col];
    const names = ['Down', 'Left', 'Right', 'Up'];
    const img = new Image();
    img.src = `skins/AmSoEpicCircles/Notes/_${names[col]} Tap Note 1x1 (res 64x64).png`;
    SkinImages.amSoEpicCircle[col] = img;
    return img;
}

// 获取 Attang 图片
function getAttangImg() {
    if (SkinImages.attangReceptor) return SkinImages.attangReceptor;
    const img = new Image();
    // 尝试使用 Tap Note parts (mipmaps).png，这通常是 3D 模型的纹理，可能是透明的
    img.src = 'skins/Attang/ATTangRework/textures/Tap Note parts (mipmaps).png';
    SkinImages.attangReceptor = img;
    return img;
}

// 获取 LN 贴图
function getLNImages(skin) {
    if (skin === 'ATTANG') {
        if (!SkinImages.attangHoldBody) {
            SkinImages.attangHoldBody = new Image();
            SkinImages.attangHoldBody.src = 'skins/Attang/ATTangRework/Down Hold Body Active (doubleres).png';
        }
        if (!SkinImages.attangHoldTail) {
            SkinImages.attangHoldTail = new Image();
            SkinImages.attangHoldTail.src = 'skins/Attang/ATTangRework/Down Hold BottomCap active (doubleres).png';
        }
        return { body: SkinImages.attangHoldBody, tail: SkinImages.attangHoldTail };
    } else if (skin === 'AMSOEPIC_CIRCLES') {
        if (!SkinImages.amsoHoldBody) {
            SkinImages.amsoHoldBody = new Image();
            SkinImages.amsoHoldBody.src = 'skins/AmSoEpicCircles/Holds/Up Hold Body Active (doubleres).png';
        }
        if (!SkinImages.amsoHoldTail) {
            SkinImages.amsoHoldTail = new Image();
            SkinImages.amsoHoldTail.src = 'skins/AmSoEpicCircles/Holds/Up Hold BottomCap active (doubleres).png';
        }
        return { body: SkinImages.amsoHoldBody, tail: SkinImages.amsoHoldTail };
    } else {
        if (!SkinImages.etternaHoldBody) {
            SkinImages.etternaHoldBody = new Image();
            SkinImages.etternaHoldBody.src = 'skins/etterna-arrow/Holds/Up Hold Body Active (doubleres).png';
        }
        if (!SkinImages.etternaHoldTail) {
            SkinImages.etternaHoldTail = new Image();
            SkinImages.etternaHoldTail.src = 'skins/etterna-arrow/Holds/Up Hold BottomCap active (doubleres).png';
        }
        return { body: SkinImages.etternaHoldBody, tail: SkinImages.etternaHoldTail };
    }
}

// ============================================================
// Note 渲染器
// ============================================================

const SkinRenderer = {
    // 渲染普通 note
    drawNote(ctx, skin, x, y, w, col, color, helpers) {
        const { drawRoundedRect, lightenColor, darkenColor } = helpers;

        // =============================
        // 自定义皮肤 (Etterna/SM) 支持
        // =============================
        if (skin === 'CUSTOM' && typeof SkinManager !== 'undefined') {
            try {
                const img = SkinManager.getAsset(col, 'tap');
                if (img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                    const info = SkinManager.getSpriteInfo(img);
                    // 防御性编程：确保 frames 有效且大于0
                    const frames = (info && Number.isFinite(info.frames) && info.frames > 0) ? info.frames : 1;
                    const frameHeight = (info && Number.isFinite(info.frameHeight) && info.frameHeight > 0) ? info.frameHeight : img.naturalHeight;
                    
                    const frameIndex = Math.floor((performance.now() / 150) % frames);
                    const sx = 0;
                    const sy = frameIndex * frameHeight;
                    const sw = img.naturalWidth;
                    let sh = frameHeight;
                    
                    // 防止 sh 为 0 或负数
                    if (sh <= 0) sh = img.naturalHeight;

                    // 目标区域：以列宽为基准，Note 近似正方形
                    // 方案四：Soft Pixel Snapping - 只在最后一步取整
                    ctx.drawImage(img, sx, sy, sw, sh, Math.round(x), Math.round(y - w / 2), Math.round(w), Math.round(w));
                    return;
                }
            } catch (e) {
                // 降级处理，不抛出错误
                console.warn("Custom Note Render Error:", e);
            }
        }
        
        switch (skin) {
            case 'BAR':
                this.drawBarNote(ctx, x, y, w, color, drawRoundedRect);
                break;
            case 'O2JAM':
                this.drawO2JamNote(ctx, x, y, w, color, lightenColor, darkenColor);
                break;
            case 'MANIA_FLAT':
                this.drawManiaFlatNote(ctx, x, y, w, color, drawRoundedRect, lightenColor, darkenColor);
                break;
            case 'ETTERNA_ARROW':
                this.drawEtternaArrowNote(ctx, x, y, w, col, color);
                break;
            case 'AMSOEPIC_CIRCLES':
                this.drawAmSoEpicCircleNote(ctx, x, y, w, col, color);
                break;
            case 'ATTANG':
                this.drawAttangNote(ctx, x, y, w, col, color);
                break;
            case 'CIRCLE':
                this.drawCircleNote(ctx, x, y, w, color);
                break;
            case 'DIAMOND':
                this.drawDiamondNote(ctx, x, y, w, color);
                break;
            default:
                this.drawCircleNote(ctx, x, y, w, color);
        }
        
        // 方案二：给 Note 加一层微弱的辉光，柔化边缘
        // 这能显著改善视觉上的"断层感"，让重影看起来不那么锐利
        // 注意：阴影效果需要在绘制之前设置，所以这里我们保存阴影状态
        // 实际的阴影绘制已经在各个 drawXXXNote 方法中完成（如果它们支持的话）
        // 为了不影响性能，我们只在需要时应用阴影
    },

    // BAR 皮肤
    drawBarNote(ctx, x, y, w, color, drawRoundedRect) {
        const h = 20;
        const margin = 3;
        ctx.fillStyle = color;
        drawRoundedRect(ctx, x + margin, y - h, w - margin * 2, h, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        drawRoundedRect(ctx, x + margin, y - h, w - margin * 2, 6, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + margin, y - 3, w - margin * 2, 3);
    },

    // O2JAM 皮肤
    drawO2JamNote(ctx, x, y, w, color, lightenColor, darkenColor) {
        const h = 18;
        const margin = 2;
        const ww = w - margin * 2;
        const xx = x + margin;
        const yy = y - h;

        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fillRect(xx, yy - 1, ww, h + 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 1;
        ctx.strokeRect(xx + 0.5, yy - 0.5, ww - 1, h + 1);

        const grad = ctx.createLinearGradient(0, yy, 0, yy + h);
        grad.addColorStop(0, lightenColor(color, 22));
        grad.addColorStop(0.55, color);
        grad.addColorStop(1, darkenColor(color, 26));
        ctx.fillStyle = grad;
        ctx.fillRect(xx + 1, yy, ww - 2, h);

        ctx.fillStyle = 'rgba(255,255,255,0.68)';
        ctx.fillRect(xx + 2, yy + 2, ww - 4, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.42)';
        ctx.fillRect(xx + 3, yy + 6, ww - 6, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(xx + 1, yy + h - 2, ww - 2, 2);
    },

    // MANIA_FLAT 皮肤
    drawManiaFlatNote(ctx, x, y, w, color, drawRoundedRect, lightenColor, darkenColor) {
        const h = 18;
        const margin = 0;
        const ww = w - margin * 2;

        const grad = ctx.createLinearGradient(0, y - h, 0, y);
        grad.addColorStop(0, lightenColor(color, 10));
        grad.addColorStop(1, darkenColor(color, 12));
        ctx.fillStyle = grad;
        drawRoundedRect(ctx, x + margin, y - h, ww, h, 4);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        drawRoundedRect(ctx, x + margin + 1, y - h + 1, ww - 2, 3, 3);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, x + margin, y - h, ww, h, 4);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0,0,0,0.26)';
        ctx.fillRect(x + margin, y - h, 2, h);
        ctx.fillRect(x + margin + ww - 2, y - h, 2, h);
    },

    // ETTERNA_ARROW 皮肤
    drawEtternaArrowNote(ctx, x, y, w, col, color) {
        const size = Math.max(44, Math.min(Math.round(w * 1.75), 220));
        const cx = x + w / 2;
        const cy = y - size / 2 + 2;

        const img = getEtternaArrowImg(col);
        if (img && img.complete && img.naturalWidth > 0) {
            // 方案四：Soft Pixel Snapping
            ctx.drawImage(img, Math.round(cx - size / 2), Math.round(cy - size / 2), Math.round(size), Math.round(size));
        } else {
            // 兜底
            const size2 = w * 0.7;
            ctx.save();
            ctx.translate(cx, cy);
            const rots = [Math.PI / 2, Math.PI, 0, -Math.PI / 2];
            ctx.rotate(rots[col]);
            ctx.beginPath();
            ctx.moveTo(0, -size2 / 2);
            ctx.lineTo(size2 / 2, size2 / 4);
            ctx.lineTo(size2 / 4, size2 / 4);
            ctx.lineTo(size2 / 4, size2 / 2);
            ctx.lineTo(-size2 / 4, size2 / 2);
            ctx.lineTo(-size2 / 4, size2 / 4);
            ctx.lineTo(-size2 / 2, size2 / 4);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
    },

    // AMSOEPIC_CIRCLES 皮肤
    drawAmSoEpicCircleNote(ctx, x, y, w, col, color) {
        const size = Math.max(44, Math.min(Math.round(w * 1.55), 200));
        const cx = x + w / 2;
        const cy = y - size / 2 + 2;

        const img = getAmSoEpicCircleImg(col);
        if (img && img.complete && img.naturalWidth > 0) {
            // 方案四：Soft Pixel Snapping
            ctx.drawImage(img, Math.round(cx - size / 2), Math.round(cy - size / 2), Math.round(size), Math.round(size));
        } else {
            const r = (w - 8) / 2;
            ctx.beginPath();
            ctx.arc(cx, y - r - 2, r, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    },

    // ATTANG 皮肤
    drawAttangNote(ctx, x, y, w, col, color) {
        const img = getAttangImg();
        if (img && img.complete && img.naturalWidth > 0) {
            // 假设纹理是正方形的，或者我们只取一部分
            // 通常 mipmaps 包含多个分辨率，我们假设整个图片是纹理
            // 或者它是一个 2x2 的网格？先假设是单张纹理
            const sw = img.naturalWidth;
            const sh = img.naturalHeight;
            
            const cx = x + w / 2;
            const cy = y; // Note 中心

            ctx.save();
            ctx.translate(cx, cy);

            // 旋转逻辑：Left, Down, Up, Right
            // 假设纹理默认是向下的 (Down)
            // Col 0: Left (90 deg)
            // Col 1: Down (0 deg)
            // Col 2: Up (180 deg)
            // Col 3: Right (270 deg)
            const rotations = [Math.PI / 2, 0, Math.PI, -Math.PI / 2];
            ctx.rotate(rotations[col % 4]);

            // 绘制
            // 注意：如果纹理包含多个部分，这里可能需要调整 sx, sy, sw, sh
            // 先尝试绘制整个图片
            
            // 优化：使用缓存的染色图片
            const tintedCanvas = this.getTintedCanvas(img, color);
            if (tintedCanvas) {
                // 方案四：Soft Pixel Snapping
                ctx.drawImage(tintedCanvas, Math.round(-w/2), Math.round(-w/2), Math.round(w), Math.round(w));
            }
            
            ctx.restore();
        } else {
            // Fallback
            ctx.fillStyle = color;
            ctx.fillRect(x, y - w/2, w, w);
        }
    },

    // 辅助：获取染色后的 Canvas (带缓存)
    getTintedCanvas(img, color) {
        // 缓存键：图片源路径 + 颜色
        const key = (img.src || 'unknown') + '_' + color;
        
        if (SkinImages.tintCache[key]) {
            return SkinImages.tintCache[key];
        }

        // 创建新的 Canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');

        // 1. 绘制原始 Sprite
        ctx.drawImage(img, 0, 0);
        
        // 2. 应用染色 (Multiply)
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 3. 恢复混合模式
        ctx.globalCompositeOperation = 'source-over';

        // 存入缓存
        SkinImages.tintCache[key] = canvas;
        return canvas;
    },

    // 辅助：绘制染色 Sprite (旧版，保留兼容性但不再推荐)
    drawTintedSprite(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh, color) {
        if (!this.tintCanvas) {
            this.tintCanvas = document.createElement('canvas');
            this.tintCtx = this.tintCanvas.getContext('2d');
        }
        // 动态调整大小
        if (this.tintCanvas.width < sw || this.tintCanvas.height < sh) {
            this.tintCanvas.width = Math.max(this.tintCanvas.width || 0, sw);
            this.tintCanvas.height = Math.max(this.tintCanvas.height || 0, sh);
        }
        
        const tCtx = this.tintCtx;
        // 清除区域
        tCtx.clearRect(0, 0, sw, sh);
        
        // 1. 绘制原始 Sprite
        tCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        
        // 2. 应用染色 (Multiply)
        tCtx.globalCompositeOperation = 'multiply';
        tCtx.fillStyle = color;
        tCtx.fillRect(0, 0, sw, sh);
        
        // 3. 恢复混合模式
        tCtx.globalCompositeOperation = 'source-over';
        
        // 4. 绘制回主画布
        ctx.drawImage(this.tintCanvas, 0, 0, sw, sh, dx, dy, dw, dh);
    },

    // CIRCLE 皮肤
    drawCircleNote(ctx, x, y, w, color) {
        const r = (w - 8) / 2;
        const cx = x + w / 2;
        const cy = y - r - 2;
        
        // 方案二：给 Note 加一层微弱的辉光，柔化边缘
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        ctx.restore(); // 清除阴影，避免影响后续绘制
        
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
    },

    // DIAMOND 皮肤
    drawDiamondNote(ctx, x, y, w, color) {
        const size = w * 0.6;
        const cx = x + w / 2;
        const cy = y - size / 2 - 4;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = color;
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(-size / 2, -size / 2, size, size / 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-size / 2, -size / 2, size, size);
        ctx.restore();
    },

    // ============================================================
    // LN Body 渲染 - [重点修复]
    // ============================================================
    drawLNBody(ctx, skin, x, yTail, w, bodyH, color, holding, helpers, col = 0) {
        const { drawRoundedRect, lightenColor, darkenColor } = helpers;

        // 自定义皮肤：使用 createPattern 平铺防拉伸
        if (skin === 'CUSTOM' && typeof SkinManager !== 'undefined') {
            const img = SkinManager.getAsset(col, 'holdBody');
            if (img) {
                this.drawTiledLNBody(ctx, img, x, yTail, w, bodyH, holding);
                return;
            }
        }
        
        switch (skin) {
            case 'ETTERNA_ARROW':
            case 'AMSOEPIC_CIRCLES':
            case 'ATTANG':
                this.drawImageLNBody(ctx, skin, x, yTail, w, bodyH, color, holding);
                break;
            case 'CIRCLE':
                this.drawCircleLNBody(ctx, x, yTail, w, bodyH, color, holding, drawRoundedRect);
                break;
            case 'MANIA_FLAT':
                this.drawManiaFlatLNBody(ctx, x, yTail, w, bodyH, color, holding, drawRoundedRect, lightenColor, darkenColor);
                break;
            default:
                this.drawDefaultLNBody(ctx, x, yTail, w, bodyH, color, holding);
        }
    },

    drawImageLNBody(ctx, skin, x, yTail, w, bodyH, color, holding) {
        const margin = 0;
        const bodyW = w - margin * 2;
        const imgs = getLNImages(skin);

        if (imgs.body && imgs.body.complete && imgs.body.naturalWidth > 0) {
            // 这里我们也应用 Tiling 逻辑，因为 Etterna 内置皮肤也是贴图
            this.drawTiledLNBody(ctx, imgs.body, x, yTail, w, bodyH, holding);
        } else {
            ctx.fillStyle = color + '88';
            ctx.fillRect(x + margin, yTail, bodyW, bodyH);
        }
    },

    // [核心修复] 终极稳健方案：手动循环 + 视口剔除 + 最小高度限制
    drawTiledLNBody(ctx, img, x, yTail, w, bodyH, holding) {
        // 1. 基础参数检查
        if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) return;
        if (bodyH <= 0 || w <= 0) return;

        try {
            ctx.save();

            // 2. 视口剔除 (Viewport Culling)
            // 获取画布高度，如果获取不到则给一个默认安全值
            const canvasH = ctx.canvas ? ctx.canvas.height : window.innerHeight;
            const buffer = 50; // 缓冲区
            
            // 计算屏幕上的可见范围
            const drawStart = Math.max(yTail, -buffer);
            const drawEnd = Math.min(yTail + bodyH, canvasH + buffer);

            // 如果完全不可见，直接跳过
            if (drawStart >= drawEnd) {
                ctx.restore();
                return;
            }

            // 3. 裁剪 (Clip)
            // 确保只在 LN 的范围内绘制
            ctx.beginPath();
            ctx.rect(x, drawStart, w, drawEnd - drawStart);
            ctx.clip();

            // 4. 计算渲染尺寸
            const scale = w / img.naturalWidth;
            let renderH = img.naturalHeight * scale;
            
            // 【关键保护】防止 renderH 过小导致循环次数过多
            // 如果单次绘制高度小于 10px，强制拉伸到 10px 或直接使用纯色填充
            // 这能防止 1px 高度的图片导致数千次 drawImage 调用
            if (renderH < 10) {
                // 方案A: 强制拉伸 (可能会变形，但保证性能)
                // renderH = 10; 
                
                // 方案B: 如果图片太小，直接回退到纯色/拉伸填充 (性能最好)
                // 方案四：Soft Pixel Snapping
                ctx.drawImage(img, Math.round(x), Math.round(drawStart), Math.round(w), Math.round(drawEnd - drawStart));
                ctx.restore();
                return;
            }

            // 5. 智能循环绘制
            // 计算相对于 yTail 的偏移量
            const offset = drawStart - yTail;
            // 计算需要跳过多少个完整贴图
            const skipCount = Math.floor(offset / renderH);
            
            // 调整起始 Y 坐标 (保证贴图对齐)
            let currentY = yTail + skipCount * renderH;
            
            // 安全计数器 (双重保险)
            let loopCount = 0;
            const maxLoops = 200; // 屏幕高度通常容纳不下 200 个 10px 的贴图，足够了

            while (currentY < drawEnd && loopCount < maxLoops) {
                // 绘制图片
                // +0.5 消除缝隙
                // 方案四：Soft Pixel Snapping
                ctx.drawImage(img, Math.round(x), Math.round(currentY), Math.round(w), Math.round(renderH + 0.5));
                currentY += renderH;
                loopCount++;
            }

        } catch (e) {
            console.warn("LN Render Error:", e);
            // 降级绘制：纯色填充
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillRect(x, yTail, w, bodyH);
        } finally {
            ctx.restore();
        }

        // 按住时不再额外叠加高光，保持与未按住一致
    },

    drawCircleLNBody(ctx, x, yTail, w, bodyH, color, holding, drawRoundedRect) {
        const margin = 6;
        const bodyW = w - margin * 2;
        const radius = Math.max(8, Math.min(bodyW / 2, 18));

        ctx.fillStyle = color + '70';
        drawRoundedRect(ctx, x + margin, yTail, bodyW, bodyH, radius);
        ctx.fill();

        const g = ctx.createLinearGradient(0, yTail, 0, yTail + Math.max(1, bodyH));
        g.addColorStop(0, 'rgba(255,255,255,0.22)');
        g.addColorStop(0.45, 'rgba(255,255,255,0.10)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        drawRoundedRect(ctx, x + margin + 2, yTail + 1, bodyW - 4, bodyH * 0.55, Math.max(6, radius - 2));
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.10)';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, x + margin, yTail, bodyW, bodyH, radius);
        ctx.stroke();

        // 按住时不再额外叠加高光
    },

    drawManiaFlatLNBody(ctx, x, yTail, w, bodyH, color, holding, drawRoundedRect, lightenColor, darkenColor) {
        const margin = 6;
        const bodyW = w - margin * 2;
        const radius = 4;

        const g = ctx.createLinearGradient(0, yTail, 0, yTail + bodyH);
        g.addColorStop(0, lightenColor(color, 12) + 'aa');
        g.addColorStop(1, darkenColor(color, 12) + 'aa');
        ctx.fillStyle = g;
        drawRoundedRect(ctx, x + margin, yTail, bodyW, bodyH, radius);
        ctx.fill();

        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(x + margin, yTail, 1.5, bodyH);
        ctx.fillRect(x + margin + bodyW - 1.5, yTail, 1.5, bodyH);

        // 按住时不再额外叠加高光
    },

    drawDefaultLNBody(ctx, x, yTail, w, bodyH, color, holding) {
        const margin = 4;
        const bodyW = Math.max(0, w - margin * 2);
        if (bodyW <= 0 || bodyH <= 0) return;
        const bodyX = x + margin;
        let radius = 6;
        radius = Math.min(radius, bodyW / 2, bodyH / 2);

        const grad = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
        grad.addColorStop(0, hexToRgba(color, 0.5));
        grad.addColorStop(0.3, hexToRgba(this.lightenColor(color, 20), 0.65));
        grad.addColorStop(0.5, hexToRgba(this.lightenColor(color, 35), 0.75));
        grad.addColorStop(0.7, hexToRgba(this.lightenColor(color, 20), 0.65));
        grad.addColorStop(1, hexToRgba(color, 0.5));

        ctx.fillStyle = grad;
        drawRoundedRect(ctx, bodyX, yTail, bodyW, bodyH, radius);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, bodyX, yTail, bodyW, bodyH, radius);
        ctx.stroke();
        // 取消按住时的内核高光

    },

    // ============================================================
    // LN Tail 渲染
    // ============================================================
    drawLNTail(ctx, skin, x, yTail, w, color, holding, helpers, col = 0) {
        const { drawRoundedRect } = helpers;

        // 自定义皮肤：尾部贴图
        if (skin === 'CUSTOM' && typeof SkinManager !== 'undefined') {
            try {
                const img = SkinManager.getAsset(col, 'holdTail') || SkinManager.getAsset(0, 'holdTail');
                if (img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                    // 保持宽高比
                    const ratio = img.naturalHeight / img.naturalWidth;
                    // 限制最大高度，防止异常图片遮挡
                    const h = Math.min(w * ratio, w * 4); 

                    // 根据滚动方向 + 尾部尖端朝向自适应翻转
                    const info = SkinManager.getSpriteInfo(img) || {};
                    const imgOrientation = info.tailOrientation; // 'up' | 'down' | null
                    const isUpscroll = (typeof Config !== 'undefined' && Config.scrollDirection === 'up');
                    
                    // 确定需要的朝向：
                    // 下落式：尾部在上方，需要尖端朝上（up）
                    // 上升式：尾部在下方，需要尖端朝下（down）
                    const desiredOrientation = isUpscroll ? 'down' : 'up';
                    let flipY = false;

                    if (imgOrientation) {
                        // 如果检测到了朝向，根据需要的朝向决定是否翻转
                        flipY = imgOrientation !== desiredOrientation;
                    } else {
                        // 无法判断时：假设皮肤为上卷（StepMania 默认上卷，尖端朝上）
                        // 下落式需要朝上，所以不翻转；上升式需要朝下，所以翻转
                        flipY = isUpscroll;
                    }

                    // 修复：确保只绘制一次，根据滚动方向正确翻转
                    ctx.save();
                    if (flipY) {
                        // 需要翻转：先平移到中心点，翻转，然后绘制
                        // 修复：确保坐标计算正确
                        ctx.translate(x + w / 2, yTail);
                        ctx.scale(1, -1);
                        // 绘制图片（翻转后，-h/2会变成+h/2，所以图片会正确对齐到tailY）
                        // 方案四：Soft Pixel Snapping
                        ctx.drawImage(img, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h));
                    } else {
                        // 不需要翻转：直接绘制，图片中心对齐到tailY
                        // 方案四：Soft Pixel Snapping
                        ctx.drawImage(img, Math.round(x), Math.round(yTail - h / 2), Math.round(w), Math.round(h));
                    }
                    ctx.restore();
                    // 修复：确保return，避免继续执行switch语句导致重复绘制
                    return;
                }
            } catch (e) {
                console.warn("Custom Tail Render Error:", e);
            }
        }
        
        switch (skin) {
            case 'CIRCLE':
                this.drawCircleLNTail(ctx, x, yTail, w, color, holding);
                break;
            case 'MANIA_FLAT':
                this.drawManiaFlatLNTail(ctx, x, yTail, w, color, drawRoundedRect);
                break;
            case 'ETTERNA_ARROW':
            case 'AMSOEPIC_CIRCLES':
            case 'ATTANG':
                this.drawImageLNTail(ctx, skin, x, yTail, w, color, drawRoundedRect);
                break;
            default:
                // 将默认样式也更新为三角形，以防万一
                this.drawCircleLNTail(ctx, x, yTail, w, color, holding);
        }
    },

    drawCircleLNTail(ctx, x, yTail, w, color, holding) {
        // 修复：根据滚动方向调整三角形方向，确保只绘制一次
        const isUpscroll = (typeof Config !== 'undefined' && Config.scrollDirection === 'up');
        const margin = 6;
        const bodyW = w - margin * 2;
        const cx = x + w / 2;
        // 三角形高度，根据宽度动态调整
        const tailH = Math.min(bodyW * 0.8, 30); 

        // 修复：确保只绘制一个三角形，不会形成钻石形状
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        
        if (isUpscroll) {
            // 上升式：尾部在下方，三角形尖端朝下
            // 1. 顶部基座（连接 Body 的部分）
            ctx.moveTo(cx - bodyW / 2, yTail - 1); // -1 防止缝隙
            ctx.lineTo(cx + bodyW / 2, yTail - 1);
            // 2. 尖端朝下
            const tipY = yTail + tailH;
            ctx.lineTo(cx, tipY);
        } else {
            // 下落式：尾部在上方，三角形尖端朝上
            // 1. 底部基座（连接 Body 的部分）
            ctx.moveTo(cx - bodyW / 2, yTail + 1); // +1 防止缝隙
            ctx.lineTo(cx + bodyW / 2, yTail + 1);
            // 2. 尖端朝上
            const tipY = yTail - tailH;
            ctx.lineTo(cx, tipY);
        }
        
        ctx.closePath();
        ctx.fill();

        // 3. 内部高光（小三角形）
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        const innerScale = 0.6;
        if (isUpscroll) {
            ctx.moveTo(cx - (bodyW / 2) * innerScale, yTail);
            ctx.lineTo(cx + (bodyW / 2) * innerScale, yTail);
            ctx.lineTo(cx, yTail + tailH * innerScale);
        } else {
            ctx.moveTo(cx - (bodyW / 2) * innerScale, yTail);
            ctx.lineTo(cx + (bodyW / 2) * innerScale, yTail);
            ctx.lineTo(cx, yTail - tailH * innerScale);
        }
        ctx.closePath();
        ctx.fill();

        // 4. 描边
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (isUpscroll) {
            const tipY = yTail + tailH;
            ctx.moveTo(cx - bodyW / 2, yTail);
            ctx.lineTo(cx, tipY);
            ctx.lineTo(cx + bodyW / 2, yTail);
        } else {
            const tipY = yTail - tailH;
            ctx.moveTo(cx - bodyW / 2, yTail);
            ctx.lineTo(cx, tipY);
            ctx.lineTo(cx + bodyW / 2, yTail);
        }
        ctx.stroke();
        ctx.restore();
    },

    drawManiaFlatLNTail(ctx, x, yTail, w, color, drawRoundedRect) {
        const margin = 6;
        const bodyW = w - margin * 2;
        const h = 10;
        ctx.fillStyle = color;
        drawRoundedRect(ctx, x + margin, yTail - h / 2, bodyW, h, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(x + margin + 2, yTail - h / 2 + 1, bodyW - 4, 2);
    },

    drawImageLNTail(ctx, skin, x, yTail, w, color, drawRoundedRect) {
        const margin = 0;
        const bodyW = w - margin * 2;
        const h = Math.max(12, Math.min(28, Math.round(w * 0.65)));
        const imgs = getLNImages(skin);

        if (imgs.tail && imgs.tail.complete && imgs.tail.naturalWidth > 0) {
            // 修复：根据皮肤类型和滚动方向正确翻转
            // ATTANG使用"Down Hold BottomCap"（用于下落式，尖端朝上）
            // ETTERNA/AMSO使用"Up Hold BottomCap"（用于上升式，尖端朝下）
            const isUpscroll = (typeof Config !== 'undefined' && Config.scrollDirection === 'up');
            
            // 判断皮肤图片的原始朝向
            const isDownHold = skin === 'ATTANG'; // ATTANG是Down Hold，其他是Up Hold
            
            // 确定是否需要翻转：
            // - 下落式需要尖端朝上：ATTANG不需要翻转，ETTERNA/AMSO需要翻转
            // - 上升式需要尖端朝下：ATTANG需要翻转，ETTERNA/AMSO不需要翻转
            let needFlip = false;
            if (isUpscroll) {
                // 上升式：需要尖端朝下
                needFlip = isDownHold; // ATTANG需要翻转，其他不需要
            } else {
                // 下落式：需要尖端朝上
                needFlip = !isDownHold; // ATTANG不需要翻转，其他需要翻转
            }
            
            if (needFlip) {
                // 需要翻转：先平移到中心点，翻转，然后绘制
                ctx.save();
                ctx.translate(x + w / 2, yTail);
                ctx.scale(1, -1);
                // 方案四：Soft Pixel Snapping
                ctx.drawImage(imgs.tail, Math.round(-bodyW / 2), Math.round(-h / 2), Math.round(bodyW), Math.round(h));
                ctx.restore();
            } else {
                // 不需要翻转：直接绘制
                // 方案四：Soft Pixel Snapping
                ctx.drawImage(imgs.tail, Math.round(x + margin), Math.round(yTail - h / 2), Math.round(bodyW), Math.round(h));
            }
        } else {
            // 回退方案：使用简单的圆角矩形
            const r = Math.max(6, Math.min(h / 2, bodyW / 2));
            ctx.fillStyle = color;
            drawRoundedRect(ctx, x + margin, yTail - h / 2, bodyW, h, r);
            ctx.fill();

            ctx.fillStyle = 'rgba(255,255,255,0.22)';
            drawRoundedRect(ctx, x + margin + 1, yTail - h / 2 + 1, bodyW - 2, Math.max(2, h * 0.26), Math.max(3, r - 2));
            ctx.fill();
        }
    },

    drawDefaultLNTail(ctx, x, yTail, w, color, drawRoundedRect) {
        const margin = 4;
        const bodyW = w - margin * 2;
        const tailH = 12;
        const radius = 4;

        // 修复：确保 darkenColor 存在
        const safeColor = this.darkenColor ? this.darkenColor(color, 15) : color;
        ctx.fillStyle = safeColor;
        
        // 绘制一个简单的圆角矩形作为尾部
        // yTail 是长条的顶部（Downscroll）或底部（Upscroll）
        // 我们将其居中绘制在 yTail 上
        drawRoundedRect(ctx, x + margin, yTail - tailH / 2, bodyW, tailH, radius);
        ctx.fill();
        
        // 添加高光
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        drawRoundedRect(ctx, x + margin + 2, yTail - tailH / 2 + 2, bodyW - 4, tailH / 2, 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, x + margin, yTail - tailH / 2, bodyW, tailH, radius);
        ctx.stroke();
    },

    // 颜色调亮/调暗
    lightenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
        const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(2.55 * percent));
        const b = Math.min(255, (num & 0x0000FF) + Math.round(2.55 * percent));
        return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
    },
    darkenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - Math.round(2.55 * percent));
        const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(2.55 * percent));
        const b = Math.max(0, (num & 0x0000FF) - Math.round(2.55 * percent));
        return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
    }
};
