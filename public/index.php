<?php
/**
 * Zapia Routing Gateway
 *
 * Domain topology:
 * - admin.zapia.app: Platform Super Admin (React SPA)
 * - painel.zapia.app: Merchant App (React SPA)
 * - zapia.app / www.zapia.app: Pure HTML Marketing Site & LPs (served from /site/)
 * - site.zapia.app: 301 redirect to zapia.app
 * - [storeSlug].zapia.app: Store Catalogs (React SPA)
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

// 2. Global Asset Interceptor (handles any /assets/... regardless of prefix e.g. /admin/assets/...)
if (preg_match('#/assets/(.+)$#', $path, $matches)) {
    $assetFile = __DIR__ . '/assets/' . $matches[1];
    if (serveFile($assetFile)) exit;
}

// If direct physical static file exists on disk (excluding PHP and root index.html), serve it
if (is_file(__DIR__ . $path) && !preg_match('#\.(php|html)$#', $path)) {
    serveFile(__DIR__ . $path);
}

// 3. ADMIN DOMAIN (admin.zapia.app / admin.localhost)
// Bulletproof: NEVER issue a redirect to admin if already on admin
if (strpos($host, 'admin.') === 0 || $host === 'admin.localhost') {
    serveFile(__DIR__ . '/index.html');
}

// 4. PAINEL DOMAIN (painel.zapia.app / gestao.zapia.app / app.zapia.app)
// Bulletproof: NEVER issue a redirect to painel if already on painel
if (strpos($host, 'painel.') === 0 || strpos($host, 'gestao.') === 0 || strpos($host, 'app.') === 0 || $host === 'painel.localhost') {
    serveFile(__DIR__ . '/index.html');
}

// 5. ROOT DOMAIN (zapia.app / www.zapia.app) - Pure HTML Marketing Site
$cleanPath = rtrim($path, '/');
if ($cleanPath === '') {
    $cleanPath = '/';
}

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

// Static site assets (/src/... or /site/src/...)
if (strpos($cleanPath, '/site/src/') === 0) {
    $rel = substr($cleanPath, strlen('/site/src/'));
    $target = __DIR__ . '/site/src/' . $rel;
    if (serveFile($target)) exit;
}
if (strpos($cleanPath, '/src/') === 0) {
    $rel = substr($cleanPath, strlen('/src/'));
    $target = __DIR__ . '/site/src/' . $rel;
    if (serveFile($target)) exit;
}

// Static HTML pages from site/
if ($cleanPath === '/' || $cleanPath === '/index.html') {
    serveFile(__DIR__ . '/site/index.html');
}
if ($cleanPath === '/termos' || $cleanPath === '/termos.html' || $cleanPath === '/termos-de-uso') {
    serveFile(__DIR__ . '/site/termos.html');
}
if ($cleanPath === '/privacidade' || $cleanPath === '/privacidade.html') {
    serveFile(__DIR__ . '/site/privacidade.html');
}

// Root static files (logos, lp, experimente-gratis, robots, sitemap, favicon)
if (is_file(__DIR__ . $cleanPath)) {
    serveFile(__DIR__ . $cleanPath);
}
if (is_file(__DIR__ . $cleanPath . '/index.html')) {
    serveFile(__DIR__ . $cleanPath . '/index.html');
}

// Default: Store slugs (e.g. zapia.app/minhaloja) and Tenant subdomains -> React SPA
serveFile(__DIR__ . '/index.html');
