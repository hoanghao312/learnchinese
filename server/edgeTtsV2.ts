import crypto from "node:crypto";
import { WebSocket } from "ws";

export const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
export const CHROMIUM_FULL_VERSION = "143.0.3650.75";
export const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split(".")[0];
export const SEC_MS_GEC_VERSION = `2-${CHROMIUM_FULL_VERSION}`;
const WIN_EPOCH = 11644473600n;
const U32_MASK = 0xffffffffn;

const SHA256_INITIAL: bigint[] = [
  0x6a09e667n,
  0xbb67ae85n,
  0x3c6ef372n,
  0xa54ff53an,
  0x510e527fn,
  0x9b05688cn,
  0x1f83d9abn,
  0x5be0cd19n,
];

const SHA256_STATE: bigint[] = [
  0xfd9fbea2n,
  0x91243ce7n,
  0xbe499094n,
  0xcd2e1e0an,
  0x6c006f49n,
  0x04bd35abn,
  0xfeb0a7e4n,
  0x03effbd2n,
];

const SHA256_SCHEDULE: bigint[] = [
  0xeb24bf9en,
  0x1558691fn,
  0xa0c09ee2n,
  0x0cfa32ban,
  0xa622ee8cn,
  0xd1dd9491n,
  0xc0dd25a0n,
  0xf9e70ab6n,
  0xf0c31573n,
  0x7058ce4en,
  0x7188e606n,
  0x00e5ab33n,
  0xd258b060n,
  0x72766564n,
];

const SHA256_ROUND_CONSTANTS: bigint[] = [
  0x428a2f98n, 0x71374491n, 0xb5c0fbcfn, 0xe9b5dba5n, 0x3956c25bn, 0x59f111f1n, 0x923f82a4n, 0xab1c5ed5n,
  0xd807aa98n, 0x12835b01n, 0x243185ben, 0x550c7dc3n, 0x72be5d74n, 0x80deb1fen, 0x9bdc06a7n, 0xc19bf174n,
  0xe49b69c1n, 0xefbe4786n, 0x0fc19dc6n, 0x240ca1ccn, 0x2de92c6fn, 0x4a7484aan, 0x5cb0a9dcn, 0x76f988dan,
  0x983e5152n, 0xa831c66dn, 0xb00327c8n, 0xbf597fc7n, 0xc6e00bf3n, 0xd5a79147n, 0x06ca6351n, 0x14292967n,
  0x27b70a85n, 0x2e1b2138n, 0x4d2c6dfcn, 0x53380d13n, 0x650a7354n, 0x766a0abbn, 0x81c2c92en, 0x92722c85n,
  0xa2bfe8a1n, 0xa81a664bn, 0xc24b8b70n, 0xc76c51a3n, 0xd192e819n, 0xd6990624n, 0xf40e3585n, 0x106aa070n,
  0x19a4c116n, 0x1e376c08n, 0x2748774cn, 0x34b0bcb5n, 0x391c0cb3n, 0x4ed8aa4an, 0x5b9cca4fn, 0x682e6ff3n,
  0x748f82een, 0x78a5636fn, 0x84c87814n, 0x8cc70208n, 0x90befffan, 0xa4506cebn, 0xbef9a3f7n, 0xc67178f2n,
];

const SHA256_ADJUSTMENT = 0xc9dc06a7n;
const SHA256_BLOCK_CONSTANTS: bigint[] = [
  ...SHA256_ROUND_CONSTANTS.slice(0, 14),
  SHA256_ADJUSTMENT,
  ...SHA256_ROUND_CONSTANTS.slice(15),
];

const SHA256_SIGMA0_ADJUSTMENT = 0x059c0b80n;
const SHA256_SIGMA1_ADJUSTMENT = 0x000b92c0n;

const CS64_COEFFICIENTS: Array<[bigint, bigint]> = [
  [0xe82e91b1n, 0xb32700d0n],
  [0x44de24c6n, 0x88dff51dn],
  [0x3beb65bcn, 0x29514038n],
  [0xc89c5933n, 0xb328cbdfn],
  [0x8d1ec211n, 0xd405b4d5n],
  [0x314ef5d5n, 0x26e55f3cn],
  [0xe92491b1n, 0x607801c6n],
  [0xf0a5b9d5n, 0x82b2c1fbn],
  [0x06064cf3n, 0xfa51a3dan],
  [0xda79fa60n, 0x207cc464n],
  [0xbed20560n, 0x3c3c74f3n],
  [0x89f9c9f8n, 0xd2d14b61n],
  [0x35fa38c6n, 0xbb04a2c1n],
  [0xcb49e3c6n, 0xc5626167n],
];

const CS64_FACTOR = 0x82893933n;
const CS64_ADJUSTMENT0 = 0xf2f90b1an;
const CS64_ADJUSTMENT1 = 0x0b1a0000n;

function rol16(value: bigint): bigint {
  const v = value & U32_MASK;
  return ((v << 16n) | (v >> 16n)) & U32_MASK;
}

function wordsLe4Even(data: Buffer): bigint[] {
  const rem = data.length % 4;
  const padLen = rem === 0 ? 0 : 4 - rem;
  const padded = padLen > 0 ? Buffer.concat([data, Buffer.alloc(padLen, 0)]) : data;
  if (padded.length === 0) return [];
  const words: bigint[] = [];
  for (let i = 0; i < padded.length; i += 4) {
    words.push(BigInt(padded.readUInt32LE(i)));
  }
  if (words.length % 2 === 1) {
    words.push(0n);
  }
  return words;
}

function sigma0(value: bigint): bigint {
  return ((value >> 7n) ^ (value << 25n) ^ (value >> 18n) ^ (value << 14n) ^ (value >> 3n)) & U32_MASK;
}

function sigma1(value: bigint): bigint {
  return ((value >> 17n) ^ (value << 15n) ^ (value >> 19n) ^ (value << 13n) ^ (value >> 10n)) & U32_MASK;
}

function rotr(val: bigint, bits: bigint): bigint {
  const v = val & U32_MASK;
  return ((v >> bits) | (v << (32n - bits))) & U32_MASK;
}

function sha256Rounds(state: bigint[], words: bigint[], firstRound: number = 0): bigint[] {
  let [a, b, c, d, e, f, g, h] = state;
  const constants = firstRound === 14 ? SHA256_BLOCK_CONSTANTS : SHA256_ROUND_CONSTANTS;
  for (let index = firstRound; index < 64; index++) {
    const s1 = rotr(e, 6n) ^ rotr(e, 11n) ^ rotr(e, 25n);
    const ch = g ^ (e & (f ^ g));
    const t1 = (h + s1 + ch + constants[index] + words[index]) & U32_MASK;
    const s0 = rotr(a, 2n) ^ rotr(a, 13n) ^ rotr(a, 22n);
    const maj = (a & b) | (c & (a | b));
    const t2 = (s0 + maj) & U32_MASK;

    h = g;
    g = f;
    f = e;
    e = (d + t1) & U32_MASK;
    d = c;
    c = b;
    b = a;
    a = (t1 + t2) & U32_MASK;
  }
  return [a, b, c, d, e, f, g, h];
}

function expandSha256Schedule(words: bigint[], firstWord: number = 16): void {
  for (let index = firstWord; index < 64; index++) {
    const x = words[index - 2];
    const y = words[index - 15];
    const s1 = sigma1(x);
    const s0 = sigma0(y);
    words.push((s1 + words[index - 7] + s0 + words[index - 16]) & U32_MASK);
  }
}

function sha256Init(data7: Buffer): bigint[] {
  const w14 = BigInt((data7[0] << 16) | (data7[1] << 8) | data7[2]);
  const w15 = BigInt(data7.readUInt32BE(3));
  const words: bigint[] = new Array(14).fill(0n);
  words.push(w14, w15);

  for (let index = 16; index < 30; index++) {
    let value = SHA256_SCHEDULE[index - 16];
    if (index - 2 >= 14) {
      value += index === 16 ? (sigma1(words[index - 2]) ^ SHA256_SIGMA1_ADJUSTMENT) : sigma1(words[index - 2]);
    }
    if (index - 7 >= 14) {
      value += words[index - 7];
    }
    if (index - 15 >= 14) {
      value += index === 29 ? (sigma0(words[index - 15]) ^ SHA256_SIGMA0_ADJUSTMENT) : sigma0(words[index - 15]);
    }
    words.push(value & U32_MASK);
  }

  words.push(
    (sigma1(words[28]) +
      words[23] +
      sigma0(words[15]) +
      words[14] +
      SHA256_ADJUSTMENT -
      SHA256_ROUND_CONSTANTS[14] +
      0x100000000n) &
      U32_MASK
  );

  expandSha256Schedule(words, 31);
  const working = sha256Rounds(SHA256_STATE, words, 14);
  return SHA256_INITIAL.map((x, idx) => (x + working[idx]) & U32_MASK);
}

function sha256Digest(data: Buffer): Buffer {
  if (data.length < 7) {
    throw new Error("Token salt must contain at least seven bytes");
  }
  const length = 57 + data.length;
  const zeroPadLen = (((55 - length) % 64) + 64) % 64;
  const lenBuf = Buffer.alloc(8);
  lenBuf.writeBigUInt64BE(BigInt(length) * 8n, 0);

  const padded = Buffer.concat([
    data.subarray(7),
    Buffer.from([0x80]),
    Buffer.alloc(zeroPadLen, 0),
    lenBuf,
  ]);

  let state = sha256Init(data.subarray(0, 7));
  for (let offset = 0; offset < padded.length; offset += 64) {
    const words: bigint[] = [];
    for (let i = 0; i < 64; i += 4) {
      words.push(BigInt(padded.readUInt32BE(offset + i)));
    }
    expandSha256Schedule(words, 16);
    const working = sha256Rounds(state, words, 0);
    state = state.map((x, idx) => (x + working[idx]) & U32_MASK);
  }

  const out = Buffer.alloc(32);
  for (let i = 0; i < 8; i++) {
    out.writeUInt32BE(Number(state[i]), i * 4);
  }
  return out;
}

function cs64Digest(data: Buffer, digest: Buffer): [bigint, bigint] {
  let keyA = BigInt(digest.readUInt32LE(0)) | 1n;
  let keyB = BigInt(digest.readUInt32LE(4)) | 1n;
  const factors: [bigint, bigint] = [
    (keyA * CS64_FACTOR) & U32_MASK,
    (keyB * CS64_FACTOR) & U32_MASK,
  ];

  const terms: bigint[] = CS64_COEFFICIENTS.map(
    ([coeff], idx) => (coeff * factors[idx % 2]) & U32_MASK
  );
  const offsets: bigint[] = CS64_COEFFICIENTS.map(([, off]) => off);

  const evenWords = wordsLe4Even(Buffer.concat([Buffer.from([0x00]), data]));
  evenWords.forEach((word, index) => {
    let term = word * (index % 2 === 0 ? keyA : keyB);
    let offset = rol16(word) * (index % 2 === 0 ? 0xef0569fbn : 0xc31713dbn);
    if (index === 0) {
      term += CS64_ADJUSTMENT0 * factors[0];
      offset += CS64_ADJUSTMENT1;
    }
    terms.push(term & U32_MASK);
    offsets.push(offset & U32_MASK);
  });

  let swapAcc = 0n;
  let swapLast = 0n;
  let state = 0n;
  let acc = 0n;

  for (let index = 0; index < terms.length; index += 2) {
    const x = terms[index];
    const y = terms[index + 1];

    let t = rol16((offsets[index] + x) & U32_MASK);
    let q = (t * 0x76f50f34n) & U32_MASK;
    swapAcc = (swapAcc + ((rol16(q) * 0xc3efea97n + q) & U32_MASK)) & U32_MASK;

    t = rol16((offsets[index + 1] + y) & U32_MASK);
    q = (t * 0x1881ce3cn) & U32_MASK;
    swapLast = (rol16(q) * 0x35bd1ec9n + q) & U32_MASK;
    swapAcc = (swapAcc + swapLast) & U32_MASK;

    state = (state * keyA + x) & U32_MASK;
    state = (rol16(state) * 0xcf98b111n) & U32_MASK;
    state = (rol16(state) * 0x87085b9fn) & U32_MASK;
    state = (rol16(state) * 0x12ceb96dn) & U32_MASK;
    state = (rol16(state) * 0x257e1d83n) & U32_MASK;
    acc = (acc + state) & U32_MASK;

    t = (state * keyB + y) & U32_MASK;
    t = (rol16(t) * 0xa27416f5n) & U32_MASK;
    t = (rol16(t) * 0xd38396ffn) & U32_MASK;
    state = (rol16((rol16(t) * 0x7c932b89n) & U32_MASK) * 0xbfa49f69n) & U32_MASK;
    acc = (acc + state) & U32_MASK;
  }

  return [(swapLast ^ state) & U32_MASK, (swapAcc ^ acc) & U32_MASK];
}

let clockSkewSeconds = 0;

export function generateSecMsGecV2(unixTimestampSeconds?: number): string {
  const nowSec =
    unixTimestampSeconds !== undefined
      ? BigInt(Math.floor(unixTimestampSeconds))
      : BigInt(Math.floor(Date.now() / 1000 + clockSkewSeconds));
  let ticks = nowSec + WIN_EPOCH;
  ticks -= ticks % 300n;
  ticks *= 10000000n;

  const strToHash = Buffer.from(`${ticks.toString()}${TRUSTED_CLIENT_TOKEN}`, "ascii");
  const digest = sha256Digest(strToHash);
  const [cs0, cs1] = cs64Digest(strToHash, digest);
  const csBuf = Buffer.alloc(8);
  csBuf.writeUInt32LE(Number(cs0), 0);
  csBuf.writeUInt32LE(Number(cs1), 4);

  return `${csBuf.toString("hex").toUpperCase()}-${digest.toString("hex").toUpperCase()}`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&apos;";
      default:
        return c;
    }
  });
}

export interface EdgeSubtitleCue {
  part: string;
  start: number;
  end: number;
}

/**
 * Synthesizes true Microsoft Edge Neural TTS (`zh-CN-XiaoxiaoNeural` or `zh-CN-YunxiNeural`)
 * using the latest Sec-MS-GEC v2 DRM protocol.
 */
export async function synthesizeEdgeNeuralV2(
  text: string,
  voice: string = "zh-CN-XiaoxiaoNeural",
  timeoutMs: number = 12000
): Promise<{ buffer: Buffer; subtitles: EdgeSubtitleCue[] }> {
  const gec = generateSecMsGecV2();
  const connId = crypto.randomUUID().replace(/-/g, "");
  const muid = crypto.randomBytes(16).toString("hex").toUpperCase();
  const url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${gec}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}&ConnectionId=${connId}`;

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, {
      origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
      headers: {
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
        "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
        Cookie: `muid=${muid};`,
      },
    });

    const audioChunks: Buffer[] = [];
    const rawCues: EdgeSubtitleCue[] = [];
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        try {
          ws.close();
        } catch {}
        reject(new Error("Edge TTS v2 timeout"));
      }
    }, timeoutMs);

    ws.on("unexpected-response", (_req, res) => {
      const serverDate = res.headers?.date;
      if (serverDate) {
        const parsedMs = Date.parse(serverDate);
        if (!Number.isNaN(parsedMs)) {
          clockSkewSeconds = parsedMs / 1000 - Date.now() / 1000;
        }
      }
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(`Edge TTS unexpected HTTP ${res.statusCode}`));
      }
    });

    ws.on("error", (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
    });

    ws.on("open", () => {
      const configMsg =
        `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: {
                  sentenceBoundaryEnabled: "false",
                  wordBoundaryEnabled: "true",
                },
                outputFormat: "audio-24khz-48kbitrate-mono-mp3",
              },
            },
          },
        });
      ws.send(configMsg);

      const requestId = crypto.randomBytes(16).toString("hex");
      const ssml =
        `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n` +
        `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">` +
        `<voice name="${voice}">` +
        `<prosody rate="default" pitch="default" volume="default">` +
        `${escapeXml(text)}` +
        `</prosody>` +
        `</voice>` +
        `</speak>`;
      ws.send(ssml);
    });

    ws.on("message", (data: Buffer, isBinary: boolean) => {
      if (isBinary) {
        const separator = "Path:audio\r\n";
        const idx = data.indexOf(separator);
        if (idx !== -1) {
          const audioSlice = data.subarray(idx + separator.length);
          if (audioSlice.length > 0) {
            audioChunks.push(audioSlice);
          }
        }
      } else {
        const msg = data.toString("utf-8");
        if (msg.includes("Path:audio.metadata")) {
          try {
            const bodyStart = msg.indexOf("\r\n\r\n");
            if (bodyStart !== -1) {
              const metadata = JSON.parse(msg.slice(bodyStart + 4));
              if (Array.isArray(metadata?.Metadata)) {
                for (const elem of metadata.Metadata) {
                  const textPart = elem?.Data?.text?.Text;
                  if (textPart) {
                    const startMs = Math.floor((elem.Data.Offset || 0) / 10000);
                    const endMs = Math.floor(
                      ((elem.Data.Offset || 0) + (elem.Data.Duration || 0)) / 10000
                    );
                    rawCues.push({
                      part: textPart,
                      start: startMs,
                      end: endMs,
                    });
                  }
                }
              }
            }
          } catch {}
        } else if (msg.includes("Path:turn.end")) {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            try {
              ws.close();
            } catch {}
            const finalBuffer = Buffer.concat(audioChunks);
            resolve({
              buffer: finalBuffer,
              subtitles: rawCues,
            });
          }
        }
      }
    });
  });
}
