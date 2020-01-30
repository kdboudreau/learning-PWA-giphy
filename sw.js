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

// Static cache strategy - cache with network fallback
const staticCache = (req, cacheName = `static-${version}`) => {
    return caches.match(req).then(cachedRes => {
        // return cached response if found
        if(cachedRes) return cachedRes;

        // fall back to network
        return fetch(req).then(networkRes => {
            //update cache with new response
            caches.open(cacheName)
                .then(cache => cache.put( req, networkRes));

            // Return clone of network response
            return networkRes.clone();
        });
    });
};

// Network with Cache Fallback
const fallbackCache = (req) => {
    // Try network
    return fetch(req).then(networkRes => {
        // Check response is ok, else go to cache
        if(!networkRes.ok) throw 'Fetch Error';

        // Update cache
        caches.open(`static-${version}`)
            .then(cache => cache.put(req, networkRes));

        // Return clone of network response
        return networkRes.clone();
    })

    // Try cache
    .catch(err => caches.match(req));
}

// Clean old Giphys from the 'giphy' cache
const cleanGiphyCache = (giphys) => {
    caches.open('giphy').then(cache => {
        // Get all cache entries
        cache.keys().then(keys => {
            // Loop entries
            keys.forEach(key => {
                // If entry is not part of current Giphys, delete
                if (!giphys.includes(key.url)) cache.delete(key);
            })
        })
    })
}

// SW fetch
self.addEventListener('fetch', e => {
    if (e.request.url.match(location.origin)) { //App shell
        e.respondWith(staticCache(e.request));
    } else if (e.request.url.match('https://api.giphy.com/v1/gifs/trending')) { // Giphy API
        e.respondWith(fallbackCache(e.request));
    } else if (e.request.url.match('giphy.com/media')) { // Giphy media 
        e.respondWith(staticCache(e.request, 'giphy'))
    }
});

// Listen for message from client
self.addEventListener('message', e => {
    // Identify the message
    if (e.data.action === 'cleanGiphyCache') cleanGiphyCache(e.data.giphys);
});