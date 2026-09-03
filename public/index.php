<?php
/**
 * Zapia Routing Gateway
 *
 * Domain topology:
 * - zapia.app / www.zapia.app: Pure HTML Marketing & Landing Pages (served from /site/)
 *   - /entrar, /cadastrar, /recuperar-senha, /dashboard*, /nova-loja* -> redirect to painel.zapia.app
 *   - /admin* -> redirect to admin.zapia.app
 *   - [storeSlug] -> serve React SPA (for store catalogs)
 * - painel.zapia.app / gestao.zapia.app / app.zapia.app: Merchant App (React SPA)
 *   - /admin* -> redirect to admin.zapia.app
 * - admin.zapia.app: Platform Super Admin (React SPA)
 *   - /dashboard*, /nova-loja* -> redirect to painel.zapia.app
 * - site.zapia.app: Deprecated -> 301 redirect to zapia.app
 * - [storeSlug].zapia.app: Store Catalogs (React SPA)
 */

$rawHost = strtolower($_SERVER['HTTP_HOST'] ?? '');
// Remove port if present
$host = explode(':', $rawHost)[0];

$rawUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($rawUri, PHP_URL_PATH) ?: '/';
$path = rtrim($path, '/');
if ($path === '') {
    $path = '/';
}

// 1. site.zapia.app -> 301 permanent redirect to zapia.app
if ($host === 'site.zapia.app') {
    $targetPath = preg_replace('#^/site(/|$)#', '/', $path);
    $query = isset($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] !== '' ? '?' . $_SERVER['QUERY_STRING'] : '';
    header('Location: https://zapia.app' . $targetPath . $query, true, 301);
    exit;
}

// Helper to serve a static file with correct MIME type
function serveFile($filePath) {
    if (!is_file($filePath)) {
        return false;
    }
    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $types = [
        'html' => 'text/html; charset=UTF-8',
        'css'  => 'text/css; charset=UTF-8',
        'js'   => 'application/javascript; charset=UTF-8',
        'svg'  => 'image/svg+xml',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'webp' => 'image/webp',
        'gif'  => 'image/gif',
        'ico'  => 'image/x-icon',
        'json' => 'application/json; charset=UTF-8',
        'xml'  => 'application/xml; charset=UTF-8',
        'txt'  => 'text/plain; charset=UTF-8',
        'woff2'=> 'font/woff2',
        'woff' => 'font/woff',
        'ttf'  => 'font/ttf',
    ];
    header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
    readfile($filePath);
    exit;
}

// 2. zapia.app / www.zapia.app (External site & LPs)
$isRootDomain = ($host === 'zapia.app' || $host === 'www.zapia.app' || $host === 'localhost' || $host === '127.0.0.1');

if ($isRootDomain) {
    // A. Merchant auth/dashboard routes -> redirect to painel.zapia.app
    $merchantPrefixes = [
        '/entrar',
        '/cadastrar',
        '/cadastrar-trial',
        '/recuperar-senha',
        '/nova-loja',
        '/dashboard',
        '/onboard-complete',
    ];
    foreach ($merchantPrefixes as $prefix) {
        if ($path === $prefix || strpos($path, $prefix . '/') === 0) {
            $query = isset($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] !== '' ? '?' . $_SERVER['QUERY_STRING'] : '';
            header('Location: https://painel.zapia.app' . $rawUri, true, 302);
            exit;
        }
    }

    // B. Super Admin routes -> redirect to admin.zapia.app
    if ($path === '/admin' || strpos($path, '/admin/') === 0) {
        header('Location: https://admin.zapia.app' . $rawUri, true, 302);
        exit;
    }

    // C. Static site assets (/src/... or /site/src/...)
    if (strpos($path, '/site/src/') === 0) {
        $rel = substr($path, strlen('/site/src/'));
        $target = __DIR__ . '/site/src/' . $rel;
        if (serveFile($target)) exit;
    }
    if (strpos($path, '/src/') === 0) {
        $rel = substr($path, strlen('/src/'));
        $target = __DIR__ . '/site/src/' . $rel;
        if (serveFile($target)) exit;
    }

    // D. Static HTML pages from site/
    if ($path === '/' || $path === '/index.html') {
        serveFile(__DIR__ . '/site/index.html');
    }
    if ($path === '/termos' || $path === '/termos.html' || $path === '/termos-de-uso') {
        serveFile(__DIR__ . '/site/termos.html');
    }
    if ($path === '/privacidade' || $path === '/privacidade.html') {
        serveFile(__DIR__ . '/site/privacidade.html');
    }

    // E. Root static files (logos, lp, experimente-gratis, robots, sitemap, favicon)
    if (is_file(__DIR__ . $path)) {
        serveFile(__DIR__ . $path);
    }
    if (is_file(__DIR__ . $path . '/index.html')) {
        serveFile(__DIR__ . $path . '/index.html');
    }

    // F. Store slugs on root domain (e.g. zapia.app/minhaloja) -> React SPA
    serveFile(__DIR__ . '/index.html');
}

// 3. painel.zapia.app (or gestao / app)
if ($host === 'painel.zapia.app' || $host === 'gestao.zapia.app' || $host === 'app.zapia.app' || $host === 'painel.localhost') {
    // If admin route requested on painel, redirect to admin.zapia.app
    if ($path === '/admin' || strpos($path, '/admin/') === 0) {
        header('Location: https://admin.zapia.app' . $rawUri, true, 302);
        exit;
    }

    // Static assets
    if (is_file(__DIR__ . $path)) {
        serveFile(__DIR__ . $path);
    }

    // React SPA
    serveFile(__DIR__ . '/index.html');
}

// 4. admin.zapia.app
if ($host === 'admin.zapia.app' || $host === 'admin.localhost') {
    // If merchant routes requested on admin, redirect to painel.zapia.app
    if (strpos($path, '/dashboard') === 0 || strpos($path, '/nova-loja') === 0) {
        header('Location: https://painel.zapia.app' . $rawUri, true, 302);
        exit;
    }

    // Static assets
    if (is_file(__DIR__ . $path)) {
        serveFile(__DIR__ . $path);
    }

    // React SPA
    serveFile(__DIR__ . '/index.html');
}

// 5. Default / Tenant store subdomains (*.zapia.app) -> React SPA
if (is_file(__DIR__ . $path)) {
    serveFile(__DIR__ . $path);
}
serveFile(__DIR__ . '/index.html');
