'use strict';
/**
 * Build the Windows .ico for electron-builder from the existing Tenh Gram
 * artwork (public/logo.png 256x256, public/icon-192.png, public/favicon-32.png).
 *
 * Pure Node, no dependencies: a Windows .ico is just a small header plus
 * one or more image blobs, and Windows Vista+ accepts PNG blobs inside it,
 * so the PNG files are embedded verbatim. Run by `npm run dist:win` before
 * electron-builder; the generated electron/build/icon.ico is a build
 * artefact and is NOT committed.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(__dirname, 'build');
const outFile = path.join(outDir, 'icon.ico');

// [source file, size byte in the ICO directory: 0 means 256]
const IMAGES = [
  ['public/logo.png', 0],
  ['public/icon-192.png', 192],
  ['public/favicon-32.png', 32],
];

function buildIco() {
  const blobs = IMAGES.map(([rel, sizeByte]) => {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) throw new Error(`Missing icon source: ${rel}`);
    return { data: fs.readFileSync(file), sizeByte };
  });

  const headerSize = 6 + blobs.length * 16;
  let offset = headerSize;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(blobs.length, 4); // image count

  blobs.forEach((blob, i) => {
    const entry = 6 + i * 16;
    header.writeUInt8(blob.sizeByte, entry); // width (0 = 256)
    header.writeUInt8(blob.sizeByte, entry + 1); // height (0 = 256)
    header.writeUInt8(0, entry + 2); // palette: none
    header.writeUInt8(0, entry + 3); // reserved
    header.writeUInt16LE(1, entry + 4); // colour planes
    header.writeUInt16LE(32, entry + 6); // bits per pixel
    header.writeUInt32LE(blob.data.length, entry + 8); // blob size
    header.writeUInt32LE(offset, entry + 12); // blob offset
    offset += blob.data.length;
  });

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, Buffer.concat([header, ...blobs.map(b => b.data)]));
  console.log(`Wrote ${path.relative(root, outFile)} (${blobs.length} images)`);
}

buildIco();
