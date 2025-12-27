function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function deny() {
  const ref =
    "R-" +
    crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();

  const edge = "edge-" + Math.floor(Math.random() * 900 + 100);
  const time = new Date().toUTCString();

  return new Response(
`Access Denied

You don't have permission to access this resource.

Reference #${ref}
Edge: ${edge}
Time: ${time}
`,
    {
      status: 403,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function onRequest({ request }) {
  const ALLOWED_ORIGIN = "https://bd71.vercel.app";

  const origin = request.headers.get("Origin");
  const referer = request.headers.get("Referer");

  // 🔒 Domain lock (best possible without JS)
  if (
    !(
      (origin && origin.startsWith(ALLOWED_ORIGIN)) ||
      (referer && referer.startsWith(ALLOWED_ORIGIN))
    )
  ) {
    // 🕳️ Silent drop
    await sleep(6000);
    return deny();
  }

  // 🔗 Main + Backup sources
  const MAIN_SOURCE =
    "https://raw.githubusercontent.com/byte-capsule/FanCode-Hls-Fetcher/main/Fancode_Live.m3u";

  const BACKUP_SOURCE =
    "https://raw.githubusercontent.com/FunctionError/PiratesTv/main/combined_playlist.m3u";

  let res;
  try {
    res = await fetch(MAIN_SOURCE, { cf: { cacheTtl: 60 } });
    if (!res.ok) throw new Error("Main failed");
  } catch {
    res = await fetch(BACKUP_SOURCE, { cf: { cacheTtl: 60 } });
    if (!res.ok) return deny();
  }

  const text = await res.text();
  const lines = text.split("\n");

  let output = [];
  for (let line of lines) {
    line = line.trim();

    // ❌ remove only unwanted lines
    if (
      line.startsWith("#EXTVLCOPT:http-user-agent") ||
      line.startsWith("#EXTHTTP:")
    ) {
      continue;
    }

    output.push(line);
  }

  return new Response(output.join("\n"), {
    headers: {
      // 🔐 Browser hardening
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",

      // Allow only bd71.vercel.app
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,

      // Browser shows text, IPTV compatible
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'inline; filename="playlist.m3u"',
      "Cache-Control": "no-store",
    },
  });
}
