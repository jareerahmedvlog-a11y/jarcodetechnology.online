import { lookup } from "dns/promises";
import net from "net";

function isPrivateIp(ip: string) {
  if (net.isIP(ip) === 0) return true;
  const v4 = ip.split(".").map(Number);
  if (v4.length === 4) {
    if (v4[0] === 10) return true;
    if (v4[0] === 127) return true;
    if (v4[0] === 0) return true;
    if (v4[0] === 169 && v4[1] === 254) return true;
    if (v4[0] === 172 && v4[1] >= 16 && v4[1] <= 31) return true;
    if (v4[0] === 192 && v4[1] === 168) return true;
  }
  // Basic IPv6 local/ULA
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80")) {
    return true;
  }
  return false;
}

export async function assertSafePublicUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid URL.");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http/https URLs are allowed.");
  }
  if (url.username || url.password) {
    throw new Error("URLs with credentials are not allowed.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("Private network hosts are blocked.");
  }
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("Private IP addresses are blocked.");
  } else {
    const records = await lookup(host, { all: true });
    if (!records.length) throw new Error("Could not resolve host.");
    for (const r of records) {
      if (isPrivateIp(r.address)) throw new Error("Host resolves to a private address.");
    }
  }
  return url;
}

export async function fetchPublicPageText(rawUrl: string, maxChars = 12000) {
  const url = await assertSafePublicUrl(rawUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "JarcodeAIBot/1.0 (+https://jarcodetechnology.online)",
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) {
      throw new Error(`Page returned HTTP ${res.status}.`);
    }
    const ctype = res.headers.get("content-type") || "";
    if (!/text\/|json|xml|javascript|html/i.test(ctype) && ctype) {
      throw new Error("Unsupported content type for analysis.");
    }
    const finalUrl = res.url;
    // Re-check after redirects
    await assertSafePublicUrl(finalUrl);
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxChars);
    if (!text) throw new Error("No readable text found on that page.");
    return { url: finalUrl, text, contentType: ctype };
  } finally {
    clearTimeout(timer);
  }
}
