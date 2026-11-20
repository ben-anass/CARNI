/**
 * Compact, self-contained QR Code generator for CARNI.
 * Generates an SVG string or matrix of boolean modules for URLs/tokens.
 * Supports standard Byte Mode QR Code generation up to Version 6 with Error Correction Level M.
 */

// QR Code Constants
const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);

// Initialize Galois Field GF(256) tables
(function initGF256() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_EXP[i + 255] = x;
    GF256_LOG[x] = i;
    x <<= 1;
    if (x >= 256) x ^= 0x11d;
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

// Reed-Solomon Generator Polynomial
function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], GF256_EXP[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsComputeRemainder(data: Uint8Array, ecLength: number): Uint8Array {
  const gen = rsGeneratorPoly(ecLength);
  const remainder = new Uint8Array(ecLength);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    for (let j = 0; j < ecLength - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    remainder[ecLength - 1] = gfMul(gen[ecLength], factor);
  }
  return remainder;
}

// Basic QR specs for Level M
interface QRVersionSpec {
  version: number;
  totalCodewords: number;
  ecCodewords: number;
  dataCodewords: number;
  alignPatterns: number[];
}

const QR_SPECS_M: QRVersionSpec[] = [
  { version: 1, totalCodewords: 26, ecCodewords: 10, dataCodewords: 16, alignPatterns: [] },
  { version: 2, totalCodewords: 44, ecCodewords: 16, dataCodewords: 28, alignPatterns: [6, 18] },
  { version: 3, totalCodewords: 70, ecCodewords: 26, dataCodewords: 44, alignPatterns: [6, 22] },
  { version: 4, totalCodewords: 100, ecCodewords: 36, dataCodewords: 64, alignPatterns: [6, 26] },
  { version: 5, totalCodewords: 134, ecCodewords: 48, dataCodewords: 86, alignPatterns: [6, 30] },
  { version: 6, totalCodewords: 172, ecCodewords: 64, dataCodewords: 108, alignPatterns: [6, 34] },
];

export function generateQRCodeMatrix(text: string): boolean[][] {
  const utf8 = new TextEncoder().encode(text);
  const dataLen = utf8.length;

  // Find smallest version that fits
  let spec = QR_SPECS_M[0];
  for (const s of QR_SPECS_M) {
    // Mode indicator (4 bits) + Character count indicator (8 bits for v1-9 byte mode) + data bytes
    const requiredBits = 4 + 8 + dataLen * 8;
    if (requiredBits <= s.dataCodewords * 8) {
      spec = s;
      break;
    }
    spec = s;
  }

  const moduleCount = spec.version * 4 + 17;
  const matrix: (boolean | null)[][] = Array.from({ length: moduleCount }, () =>
    Array(moduleCount).fill(null)
  );

  // 1. Finder patterns
  function placeFinder(startX: number, startY: number) {
    for (let dy = -1; dy <= 7; dy++) {
      for (let dx = -1; dx <= 7; dx++) {
        const y = startY + dy;
        const x = startX + dx;
        if (x >= 0 && x < moduleCount && y >= 0 && y < moduleCount) {
          if (
            (dx >= 0 && dx <= 6 && (dy === 0 || dy === 6)) ||
            (dy >= 0 && dy <= 6 && (dx === 0 || dx === 6)) ||
            (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)
          ) {
            matrix[y][x] = true;
          } else {
            matrix[y][x] = false;
          }
        }
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(moduleCount - 7, 0);
  placeFinder(0, moduleCount - 7);

  // 2. Alignment patterns for version >= 2
  if (spec.alignPatterns.length > 0) {
    const coords = spec.alignPatterns;
    for (const cy of coords) {
      for (const cx of coords) {
        // Skip finder areas
        if (
          (cx < 9 && cy < 9) ||
          (cx > moduleCount - 10 && cy < 9) ||
          (cx < 9 && cy > moduleCount - 10)
        ) {
          continue;
        }
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const isBorder = Math.abs(dx) === 2 || Math.abs(dy) === 2;
            const isCenter = dx === 0 && dy === 0;
            matrix[cy + dy][cx + dx] = isBorder || isCenter;
          }
        }
      }
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < moduleCount - 8; i++) {
    if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0;
    if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0;
  }

  // Dark module
  matrix[4 * spec.version + 9][8] = true;

  // 4. Reserve format information areas
  for (let i = 0; i <= 8; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
  }
  for (let i = moduleCount - 8; i < moduleCount; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
  }

  // 5. Construct bitstream
  const bits: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  }

  // Byte mode indicator: 0100
  pushBits(0b0100, 4);
  // Character count indicator (8 bits for v1-9)
  pushBits(dataLen, 8);
  // Data bytes
  for (let i = 0; i < dataLen; i++) {
    pushBits(utf8[i], 8);
  }
  // Terminator (up to 4 zeros)
  const maxDataBits = spec.dataCodewords * 8;
  const termLen = Math.min(4, maxDataBits - bits.length);
  pushBits(0, termLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Pad with alternating 0xEC and 0x11
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < maxDataBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to data codewords
  const dataCodewords = new Uint8Array(spec.dataCodewords);
  for (let i = 0; i < spec.dataCodewords; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    dataCodewords[i] = b;
  }

  // 6. Compute Error Correction (Reed-Solomon)
  const ecCodewords = rsComputeRemainder(dataCodewords, spec.ecCodewords);

  // Combine data + EC into all bits
  const allCodewords = new Uint8Array(spec.totalCodewords);
  allCodewords.set(dataCodewords, 0);
  allCodewords.set(ecCodewords, spec.dataCodewords);

  const allBits: number[] = [];
  for (let i = 0; i < allCodewords.length; i++) {
    for (let j = 7; j >= 0; j--) {
      allBits.push((allCodewords[i] >>> j) & 1);
    }
  }

  // 7. Place data bits in matrix (right to left, zigzag)
  let bitIdx = 0;
  let dir = -1; // up
  let x = moduleCount - 1;
  while (x > 0) {
    if (x === 6) x--; // Skip vertical timing line
    const yStart = dir === -1 ? moduleCount - 1 : 0;
    const yEnd = dir === -1 ? -1 : moduleCount;
    for (let y = yStart; y !== yEnd; y += dir === -1 ? -1 : 1) {
      for (const col of [x, x - 1]) {
        if (matrix[y][col] === null) {
          const bit = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
          // Apply mask 0: (x + y) % 2 === 0
          const mask = (col + y) % 2 === 0;
          matrix[y][col] = (bit === 1) !== mask;
        }
      }
    }
    x -= 2;
    dir = -dir;
  }

  // 8. Format bits: Mask 0 (000), EC Level M (00) -> 00000 -> Format string with BCH = 101010000010010
  // Standard format bits for EC Level M + Mask 0: 0x5412 XOR 0x5412 = 0x0000...
  // Standard precalculated 15-bit format information for Level M, Mask 0: 0b101010000010010
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];

  // Write format info around top-left
  matrix[8][0] = formatBits[0] === 1;
  matrix[8][1] = formatBits[1] === 1;
  matrix[8][2] = formatBits[2] === 1;
  matrix[8][3] = formatBits[3] === 1;
  matrix[8][4] = formatBits[4] === 1;
  matrix[8][5] = formatBits[5] === 1;
  matrix[8][7] = formatBits[6] === 1;
  matrix[8][8] = formatBits[7] === 1;
  matrix[7][8] = formatBits[8] === 1;
  matrix[5][8] = formatBits[9] === 1;
  matrix[4][8] = formatBits[10] === 1;
  matrix[3][8] = formatBits[11] === 1;
  matrix[2][8] = formatBits[12] === 1;
  matrix[1][8] = formatBits[13] === 1;
  matrix[0][8] = formatBits[14] === 1;

  // Write format info top-right & bottom-left
  for (let i = 0; i < 8; i++) {
    matrix[8][moduleCount - 1 - i] = formatBits[i] === 1;
  }
  for (let i = 0; i < 7; i++) {
    matrix[moduleCount - 7 + i][8] = formatBits[8 + i] === 1;
  }

  return matrix.map((row) => row.map((cell) => cell === true));
}
