const DB_VERSION = 1;
const db = new Dexie('MyDatabase');
db.version(DB_VERSION).stores({
    // posts: 'userId,id,title,body'
    posts: 'id',
    syncPosts: 'title'
});