import dns from 'dns';
import http from 'http';
import https from 'https';
import net from 'net';
import { URL } from 'url';

const MAX_RESPONSE_BYTES = 256 * 1024;
const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);

function isPrivateIpv4(address: string): boolean {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }
  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && octets[2] === 2) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && octets[2] === 100) ||
    (a === 203 && b === 0 && octets[2] === 113) ||
    a >= 224
  );
}

function parseIpv6(address: string): bigint | null {
  let normalized = address.toLowerCase().split('%')[0].replace(/^\[|\]$/g, '');
  if (normalized.includes('.')) {
    const lastColon = normalized.lastIndexOf(':');
    const ipv4 = normalized.slice(lastColon + 1);
    const octets = ipv4.split('.').map(Number);
    if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;
    normalized = `${normalized.slice(0, lastColon)}:${((octets[0] << 8) | octets[1]).toString(16)}:${((octets[2] << 8) | octets[3]).toString(16)}`;
  }

  const halves = normalized.split('::');
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;

  const parts = [...left, ...Array(Math.max(0, missing)).fill('0'), ...right];
  if (parts.length !== 8 || parts.some((part) => !/^[0-9a-f]{1,4}$/.test(part))) return null;
  return parts.reduce((value, part) => (value << 16n) | BigInt(parseInt(part, 16)), 0n);
}

function ipv6InRange(value: bigint, prefix: bigint, prefixLength: number): boolean {
  const shift = BigInt(128 - prefixLength);
  return (value >> shift) === (prefix >> shift);
}

function isPrivateIpv6(address: string): boolean {
  const value = parseIpv6(address);
  if (value === null) return true;

  // IPv4-mapped (::ffff:0:0/96) and NAT64 well-known (64:ff9b::/96) addresses
  // carry an IPv4 inside: they must inherit the IPv4 policy. `::ffff:7f00:1`
  // is 127.0.0.1, and a NAT64 gateway turns 64:ff9b::a00:1 into 10.0.0.1.
  const embeddedIpv4 = () => {
    const ipv4 = Number(value & 0xffffffffn);
    return `${ipv4 >>> 24}.${(ipv4 >>> 16) & 255}.${(ipv4 >>> 8) & 255}.${ipv4 & 255}`;
  };
  if (ipv6InRange(value, 0xffffn << 32n, 96) || ipv6InRange(value, 0x0064ff9b000000000000000000000000n, 96)) {
    return isPrivateIpv4(embeddedIpv4());
  }

  const blockedRanges: Array<[bigint, number]> = [
    [0n, 96], // Unspecified, loopback and the deprecated IPv4-compatible range (::a.b.c.d)
    [0x0064ff9b000100000000000000000000n, 48], // Local-use translation
    [0x01000000000000000000000000000000n, 64], // Discard-only
    [0x20010000000000000000000000000000n, 23], // IETF protocol assignments
    [0x20010db8000000000000000000000000n, 32], // Documentation
    [0x20020000000000000000000000000000n, 16], // 6to4
    [0x3fff0000000000000000000000000000n, 20], // Documentation
    [0xfc000000000000000000000000000000n, 7], // Unique local
    [0xfe800000000000000000000000000000n, 10], // Link local
    [0xff000000000000000000000000000000n, 8], // Multicast
  ];
  return blockedRanges.some(([prefix, length]) => ipv6InRange(value, prefix, length));
}

export function isPublicIp(address: string): boolean {
  const family = net.isIP(address);
  if (family === 4) return !isPrivateIpv4(address);
  if (family === 6) return !isPrivateIpv6(address);
  return false;
}

export async function resolvePublicAddress(hostname: string): Promise<{ address: string; family: number }> {
  const normalizedHost = hostname.trim().toLowerCase().replace(/\.$/, '').replace(/^\[|\]$/g, '');
  if (!normalizedHost || normalizedHost === 'localhost' || /\.(localhost|local|internal)$/.test(normalizedHost)) {
    throw new Error('Private or local destinations are not allowed.');
  }

  if (net.isIP(normalizedHost)) {
    if (!isPublicIp(normalizedHost)) throw new Error('Private or reserved IP addresses are not allowed.');
    return { address: normalizedHost, family: net.isIP(normalizedHost) };
  }

  const records = await dns.promises.lookup(normalizedHost, { all: true, verbatim: true });
  if (!records.length || records.some((record) => !isPublicIp(record.address))) {
    throw new Error('Destination resolves to a private or reserved IP address.');
  }
  return records[0];
}

export async function validatePublicHttpUrl(rawUrl: string): Promise<{ url: URL; address: string }> {
  let url: URL;
  try {
    if (rawUrl.length > 2048) throw new Error('too long');
    url = new URL(rawUrl);
  } catch {
    throw new Error('A valid webhook URL is required.');
  }

  // HTTPS only, on the usual ports: a webhook test must not turn the server
  // into a port scanner of public hosts.
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('Only credential-free HTTPS webhook URLs are allowed.');
  }
  if (url.port && !['443', '8443'].includes(url.port)) {
    throw new Error('Webhook URLs must use port 443 or 8443.');
  }

  const { address } = await resolvePublicAddress(url.hostname);
  return { url, address };
}

export interface SafeHttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}

export async function safePost(
  rawUrl: string,
  headers: Record<string, string>,
  body: string,
  redirectsRemaining = 2
): Promise<SafeHttpResponse> {
  const { url, address } = await validatePublicHttpUrl(rawUrl);
  const requestFn = url.protocol === 'https:' ? https.request : http.request;

  return new Promise<SafeHttpResponse>((resolve, reject) => {
    const requestHeaders = { ...headers, Host: url.host };
    const request = requestFn({
      protocol: url.protocol,
      hostname: address,
      port: url.port || undefined,
      path: `${url.pathname}${url.search}`,
      method: 'POST',
      headers: requestHeaders,
      servername: url.hostname,
      timeout: 8000,
      rejectUnauthorized: true,
    } as https.RequestOptions, (response) => {
      const status = response.statusCode || 502;
      const location = response.headers.location;
      if (REDIRECT_CODES.has(status) && location) {
        response.resume();
        if (redirectsRemaining <= 0) {
          reject(new Error('Too many webhook redirects.'));
          return;
        }
        const redirectedUrl = new URL(location, url);
        const redirectedHeaders = redirectedUrl.origin === url.origin
          ? headers
          : Object.fromEntries(Object.entries(headers).filter(([name]) =>
              !/(authorization|api[-_]?key|cookie|secret|token)/i.test(name)
            ));
        safePost(redirectedUrl.toString(), redirectedHeaders, body, redirectsRemaining - 1).then(resolve, reject);
        return;
      }

      const chunks: Buffer[] = [];
      let size = 0;
      response.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > MAX_RESPONSE_BYTES) {
          request.destroy(new Error('Webhook response exceeded the size limit.'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => {
        const responseHeaders: Record<string, string> = {};
        for (const [key, value] of Object.entries(response.headers)) {
          if (value !== undefined) responseHeaders[key] = Array.isArray(value) ? value.join(', ') : String(value);
        }
        resolve({
          status,
          statusText: response.statusMessage || '',
          headers: responseHeaders,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      });
    });

    request.on('timeout', () => request.destroy(new Error('Webhook request timed out.')));
    request.on('error', reject);
    request.end(body);
  });
}
