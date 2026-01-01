// ============================================================
// game-pools.js - 对象池（减少GC压力）
// ============================================================

const ParticlePool = {
    pool: [],
    maxSize: 200,
    
    get: function() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return { x: 0, y: 0, vx: 0, vy: 0, life: 0, decay: 0, size: 0, color: '', judge: '' };
    },
    
    release: function(particle) {
        if (this.pool.length < this.maxSize) {
            this.pool.push(particle);
        }
    }
};

const HitErrorPool = {
    pool: [],
    maxSize: 50,
    
    get: function() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return { diff: 0, timestamp: 0, grade: '' };
    },
    
    release: function(mark) {
        if (this.pool.length < this.maxSize) {
            this.pool.push(mark);
        }
    }
};
