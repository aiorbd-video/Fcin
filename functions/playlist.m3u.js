function deny() {
  const ref =
    "R-" +
    crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();

  return new Response(
    `Access Denied

You don't have permission to access this resource.

Reference #${ref}`,
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
  const SECRET_TOKEN = "BD71_JS_ACCESS_2025"; // 🔑 change anytime

  const origin = request.headers.get("Origin");
  const referer = request.headers.get("Referer");
  const token = request.headers.get("X-BD71-TOKEN");

  // 🔒 Hard check: domain + token
  if (
    token !== SECRET_TOKEN ||
    !(
      (origin && origin.startsWith(ALLOWED_ORIGIN)) ||
      (referer && referer.startsWith(ALLOWED_ORIGIN))
    )
  ) {
    return deny();
  }

  // 🔗 SOURCE playlist
  const SOURCE =
    "https://raw.githubusercontent.com/byte-capsule/FanCode-Hls-Fetcher/main/Fancode_Live.m3u";

  const res = await fetch(SOURCE, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!res.ok) return deny();

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
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'inline; filename="playlist.m3u"',
      "Cache-Control": "no-store",
    },
  });
}
