// SW version
const version = '1.0';

// Static cache - app shell
const appAssets = [
    'index.html',
    'main.js',
    'images/flame.png',
    'images/logo.png',
    'images/sync.png',
    'vendor/bootstrap.min.css',
    'vendor/jquery.min.js'
];

// SW install
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(`static-${version}`)
            .then( cache => cache.addAll(appAssets))
    );
});

// SW activate
self.addEventListener('activate', e => {
    // clean static cache
    let cleaned = cache.keys().then( keys => {
        keys.forEach(key => {
            if (key !== `static-${version}` && key.match('static-')) {
                return caches.delete(key);
            }
        });
    });
    e.waitUntil(cleaned);
})