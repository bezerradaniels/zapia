<?php
/**
 * Zapia Universal Gateway & Routing Engine
 *
 * Decoupled Domain Topology:
 * - zapia.app / www.zapia.app: Static Marketing Site (home.html, termos.html, privacidade.html)
 * - painel.zapia.app: Merchant Platform (app.html / React SPA)
 * - admin.zapia.app: Platform Super Admin (app.html / React SPA)
 * - [loja].zapia.app: Storefronts & Checkout (app.html / React SPA)
 * - site.zapia.app: 301 redirect to zapia.app
 */

$rawHost = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? '';
$host = strtolower(trim(explode(':', explode(',', $rawHost)[0])[0]));

$rawUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($rawUri, PHP_URL_PATH) ?: '/';

// 1. site.zapia.app -> 301 permanent redirect to zapia.app
if ($host === 'site.zapia.app') {
    $targetPath = preg_replace('#^/site(/|$)#', '/', $path);
    $query = isset($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] !== '' ? '?' . $_SERVER['QUERY_STRING'] : '';
    header('Location: https://zapia.app' . $targetPath . $query, true, 301);
    exit;
}

// Helper to serve a static file with correct MIME type and caching headers
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

    $mime = $types[$ext] ?? 'application/octet-stream';
    header('Content-Type: ' . $mime);

    // Cache headers for static immutable assets
    if (in_array($ext, ['css', 'js', 'svg', 'png', 'jpg', 'jpeg', 'webp', 'woff2', 'ico'])) {
        header('Cache-Control: public, max-age=31536000, immutable');
    } else {
        header('Cache-Control: public, max-age=3600');
    }

    readfile($filePath);
    exit;
}

// 2. Global Asset Interceptor (/assets/*, /styles/*, /img/*, /logos/*, favicon, robots, sitemap, llms)
if (preg_match('#/assets/(.+)$#', $path, $matches)) {
    $assetFile = __DIR__ . '/assets/' . $matches[1];
    if (serveFile($assetFile)) exit;
}

if (is_file(__DIR__ . $path) && !preg_match('#\.(php|html)$#', $path)) {
    serveFile(__DIR__ . $path);
}

// 3. ADMIN & PAINEL DOMAINS (admin.zapia.app / painel.zapia.app / gestao.zapia.app) -> React SPA
if (strpos($host, 'admin.') === 0 || $host === 'admin.localhost') {
    serveFile(is_file(__DIR__ . '/app.html') ? __DIR__ . '/app.html' : __DIR__ . '/index.html');
}

if (strpos($host, 'painel.') === 0 || strpos($host, 'gestao.') === 0 || strpos($host, 'app.') === 0 || $host === 'painel.localhost') {
    serveFile(is_file(__DIR__ . '/app.html') ? __DIR__ . '/app.html' : __DIR__ . '/index.html');
}

// 4. ROOT DOMAIN (zapia.app / www.zapia.app)
$cleanPath = rtrim($path, '/');
if ($cleanPath === '') {
    $cleanPath = '/';
}

// Forward merchant auth/app routes to painel.zapia.app
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
    if ($cleanPath === $prefix || strpos($cleanPath, $prefix . '/') === 0) {
        $query = isset($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] !== '' ? '?' . $_SERVER['QUERY_STRING'] : '';
        header('Location: https://painel.zapia.app' . $rawUri, true, 302);
        exit;
    }
}

if ($cleanPath === '/admin' || strpos($cleanPath, '/admin/') === 0) {
    header('Location: https://admin.zapia.app' . $rawUri, true, 302);
    exit;
}

// Serve Static Marketing HTML Pages directly
if ($cleanPath === '/' || $cleanPath === '/index.html' || $cleanPath === '/home.html') {
    if (serveFile(__DIR__ . '/home.html')) exit;
    if (serveFile(__DIR__ . '/index.html')) exit;
}
if ($cleanPath === '/termos' || $cleanPath === '/termos.html' || $cleanPath === '/termos-de-uso') {
    serveFile(__DIR__ . '/termos.html');
}
if ($cleanPath === '/privacidade' || $cleanPath === '/privacidade.html') {
    serveFile(__DIR__ . '/privacidade.html');
}

// Direct static file match
if (is_file(__DIR__ . $cleanPath)) {
    serveFile(__DIR__ . $cleanPath);
}

// Default Fallback for Store Slugs (e.g. zapia.app/minhaloja) and Tenant Subdomains -> React SPA
serveFile(is_file(__DIR__ . '/app.html') ? __DIR__ . '/app.html' : __DIR__ . '/index.html');
