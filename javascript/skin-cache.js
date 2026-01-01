// ============================================================
// skin-cache.js - 皮肤缓存系统 (IndexedDB)
// ============================================================

const SkinCache = {
    db: null,
    
    async init() {
        if (this.db || !window.idb || !window.idb.openDB) {
            if (!window.idb) console.warn('idb not available, skip skin cache');
            return this.db;
        }
        const { openDB } = window.idb;
        this.db = await openDB('rc_skin_cache_v1', 1, {
            upgrade(db) {
                const store = db.createObjectStore('skins', { keyPath: 'id' });
                store.createIndex('byCreated', 'createdAt');
                store.createIndex('byName', 'name');
            }
        });
        return this.db;
    },
    
    async list() {
        if (!this.db) return [];
        return await this.db.getAllFromIndex('skins', 'byCreated');
    },
    
    async get(id) {
        if (!this.db) return null;
        return await this.db.get('skins', id);
    },
    
    async save(entry) {
        if (!this.db) return;
        await this.db.put('skins', entry);
    },
    
    async remove(id) {
        if (!this.db) return;
        await this.db.delete('skins', id);
    },
    
    async clear() {
        if (!this.db) return;
        await this.db.clear('skins');
    },
    
    // 生成唯一ID
    generateId() {
        return 'skin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    // 从zip文件创建缓存条目
    async createEntryFromZip(file, zipData) {
        const id = this.generateId();
        const name = file.name.replace(/\.zip$/i, '') || 'Custom Skin';
        const createdAt = Date.now();
        
        return {
            id,
            name,
            fileName: file.name,
            zipData: zipData, // ArrayBuffer
            createdAt,
            size: file.size
        };
    }
};

