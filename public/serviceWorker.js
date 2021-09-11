console.log(":::serviceWorker.js:::", self);

importScripts('/static/js/dexie.js');
importScripts('/static/js/db.js');


let CACHE_VERSION = 2;

let CURRENT_CACHE = {
    static: `static-cache-v${CACHE_VERSION}`,
    dynamic: `dynamic-cache-v${CACHE_VERSION}`
};

// let CURRENT_CACHE = `static-cache-v${CACHE_VERSION}`;

self.addEventListener("install", (event) => {
    console.log('serviceWorker installing =>', event);
    console.log('serviceWorker caches =>', caches);
    event.waitUntil(
        caches
            .open(CURRENT_CACHE["static"])
            // .open(CURRENT_CACHE)
            .then(cache => {
                console.log("cache=>", cache);
                cache.addAll([
                    '/',
                    '/offline.html',
                    '/static/js/dexie.js',
                    '/static/js/db.js',
                    '/manifest.json',
                    '/static/css/bootstrap.rtl.css',
                    '/static/css/custom.css',
                    '/static/images/favicon.ico',
                    '/static/images/logo192.png',
                    '/static/images/logo512.png',
                    '/static/js/app.js',
                    '/static/js/bootstrap.bundle.js',
                    '/static/js/jquery-3.6.0.js',
                    '/static/js/pwacompat.js'
                ]);
                // cache.add('/index.html');
            })
            .catch(err => console.log(err))
    );
});

self.addEventListener("activate", (event) => {
    console.log('serviceWorker active =>', event);
    let expectedCacheNames = Object.values(CURRENT_CACHE);
    console.log("expectedCacheNames: ", expectedCacheNames);
    event.waitUntil(
        caches
            .keys()
            .then(cacheNames => {
                // console.log("cacheNames: ", cacheNames, Promise.all(cacheNames));
                return Promise.all(
                    cacheNames.forEach(cacheName => {
                        if (!expectedCacheNames.includes(cacheName)) {
                            console.log("This cacheName was removed.", cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
    );
});

/* self.addEventListener("fetch", (event) => {
    console.log('serviceWorker fetch =>', event);
    event.respondWith(null);
    event.respondWith(fetch(event.request));
    event.respondWith(
        caches
            .open(CURRENT_CACHE["static"])
            .open(CURRENT_CACHE)
            .then(cache => {
                return cache
                    .match(event.request)
                    .then(response => {
                        return response || fetch(event.request);
                        if (response) {
                            console.log("A response was found in the cache.", response);
                            return response;
                        }
                        console.log("No response found in cache and received from the network.");
                        return fetch(event.request)
                            .then(networkResponse => {
                                console.log("networkResponse: ", networkResponse);
                                cache.put(event.request, networkResponse.clone());
                                return networkResponse;
                            })
                            .catch(err => {
                                console.log(err);
                                throw err;
                            });
                    })
                    .catch(err => console.log(err));
            })
            .catch(err => console.log(err))
    );
}); */

self.addEventListener("fetch", (event) => {
    // console.log("event: ", event.request.url);
    let urls = [
        'https://jsonplaceholder.typicode.com/posts'
    ];

    if (urls.indexOf(event.request.url) > -1) {
        console.log("network");
        /* return event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    caches
                        .open(CURRENT_CACHE["dynamic"])
                        .then(cache => {
                            cache.put(event.request, networkResponse.clone());
                            return networkResponse;
                        });
                })
                .catch(err => {
                    return caches.match(event.request);
                })
        ); */
        return event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    let cloneRes = networkResponse.clone();
                    cloneRes.json()
                        .then(posts => {
                            posts.forEach(post => {
                                db.posts.put(post);
                            });
                        });
                    return networkResponse;
                })
        );
    } else {
        console.log("caches");
        return event.respondWith(
            caches
                .match(event.request)
                .then(response => {
                    if (response) {
                        console.log("A response was found in the cache.", response);
                        return response;
                    }
                    console.log("No response found in cache and received from the network.");
                    return fetch(event.request)
                        .then(networkResponse => {
                            console.log("networkResponse: ", networkResponse);
                            return caches
                                .open(CURRENT_CACHE["dynamic"])
                                .then(cache => {
                                    cache.put(event.request, networkResponse.clone());
                                    return networkResponse;
                                });
                        })
                        .catch(err => {
                            // console.log(err);
                            // throw err;
                            return caches
                                .open(CURRENT_CACHE["static"])
                                .then(cache => {
                                    return cache.match('/offline.html');
                                });
                        });
                })
                .catch()
        );
    }
    /* event.respondWith(
        fetch(event.request)
    ); */
    /* event.respondWith(
        caches.match(event.request)
    ); */
});

self.addEventListener("sync", (event) => {
    console.log("sync: ", event);
    if (event.tag === 'sync-new-post') {
        event.waitUntil(
            db.syncPosts.toArray()
                .then(syncPosts => {
                    console.log("indexedDB => ", syncPosts);
                    syncPosts.forEach(post => {
                        let fd = new FormData();
                        fd.append('title', post.title);
                        fd.append('body', post.body);
                        fd.append('userId', post.userId);
                        fd.append('image', post.image, Date.now() + '.png');

                        console.log("fd: ", fd);

                        fetch('https://jsonplaceholder.typicode.com/posts', {
                            method: 'POST',
                            body: JSON.stringify({
                                title: post.title,
                                body: post.body,
                                userId: post.userId
                            }),
                            // body: fd,
                            headers: {
                                'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
                            }
                        })
                            .then(res => {
                                return res.json();
                            })
                            .then(res => {
                                console.log("Answer in sync => ", res);
                                /* if (res.status === 'success') {
                                    db.syncPosts
                                        .where({title: post.title})
                                        .delete()
                                        .then(() => {
                                            console.log('Remove item from syncPosts', post);
                                        });
                                } */
                                db.syncPosts
                                    .where({title: post.title})
                                    .delete()
                                    .then(() => {
                                        console.log('Remove item from syncPosts', post);
                                    });
                            })
                            .catch(err => {
                                console.log("err: ", err);
                            });
                    });
                })
        );
    }
});

/* async function doSomething() {
    console.log("doSomething");
    db.syncPosts.toArray()
        .then(posts => {
            console.log("indexedDB", posts);
            posts.forEach(post => {
                createPost(post);
            });
        });
} */

self.addEventListener("notificationclick", (event) => {
    console.log("notificationclick", event);
    let notification = event.notification;
    let action = event.action;
    let data = notification.data;
    let promiseChain;

    notification.close();

    switch (action) {
        case "show":
            promiseChain = clients.openWindow(data.url);
            break;
        case "read":
            promiseChain = clients.openWindow(data.url);
            break;
        case "write":
            promiseChain = clients.openWindow(data.url);
            break;
        default:
            promiseChain = clients.openWindow(data.url);
            break;
    }
    event.waitUntil(promiseChain);
});

self.addEventListener("push", (event) => {
    console.log("push: ", event);
    const DEFAULT_TAG = "simple-notification";
    let data = event.data.json();
    let title = data.notification.title;
    let options = data.notification;
    if (!options.tag) {
        options.tag = DEFAULT_TAG;
    }
    event.waitUntil(registration.showNotification(title, options));
});