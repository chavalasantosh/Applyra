const HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" />
  <title>Applyra email confirmed</title>
  <style>
    body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f7f8fb;color:#172033;margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box}
    main{max-width:560px;background:#fff;border:1px solid #e4e8f0;border-radius:18px;padding:30px;box-shadow:0 10px 30px rgba(21,32,51,.08)}
    h1{margin:0 0 10px;font-size:26px}p{line-height:1.55;margin:8px 0;color:#4a5568}.ok{display:inline-block;margin-bottom:16px;padding:6px 10px;border-radius:999px;background:#edfdf4;color:#167343;font-weight:700;font-size:13px}
  </style>
</head>
<body>
  <main>
    <div class="ok">EMAIL CONFIRMED</div>
    <h1>Your Applyra email is confirmed.</h1>
    <p>You can close this tab, return to the Applyra extension, and sign in with the email and password you created.</p>
    <p>No job-portal password or payment credential is handled on this page.</p>
  </main>
  <script>try{if(location.hash||location.search){history.replaceState(null,'',location.pathname)}}catch{}</script>
</body>
</html>`;

Deno.serve((_req) => new Response(HTML, {
  status: 200,
  headers: {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store, max-age=0',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'x-frame-options': 'DENY'
  }
}));
