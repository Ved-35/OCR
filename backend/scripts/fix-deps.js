import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, '..');

// 1. Remove nested onnxruntime-node in ppu-paddle-ocr so it resolves to root onnxruntime-node (1.20.1)
const nestedOrt = path.join(backendDir, 'node_modules/ppu-paddle-ocr/node_modules/onnxruntime-node');
if (fs.existsSync(nestedOrt)) {
  console.log('[fix-deps] Removing nested onnxruntime-node in ppu-paddle-ocr...');
  fs.rmSync(nestedOrt, { recursive: true, force: true });
}

const nestedOrtCommon = path.join(backendDir, 'node_modules/ppu-paddle-ocr/node_modules/onnxruntime-common');
if (fs.existsSync(nestedOrtCommon)) {
  fs.rmSync(nestedOrtCommon, { recursive: true, force: true });
}

// 2. Fix circular imports in ppu-ocv/operations/*.js
const opsDir = path.join(backendDir, 'node_modules/ppu-ocv/operations');
if (fs.existsSync(opsDir)) {
  const files = fs.readdirSync(opsDir).filter(f => f.endsWith('.js'));
  for (const f of files) {
    const p = path.join(opsDir, f);
    let c = fs.readFileSync(p, 'utf8');
    let changed = false;
    if (c.includes('../index')) {
      c = c.replace(/import\s*\{\s*cv\s*,\s*registry\s*\}\s*from\s*[\"']\.\.\/index(\.js)?[\"']/g, 'import cv from "@techstark/opencv-js";import{registry}from"../pipeline/registry.js"');
      c = c.replace(/import\s*\{\s*registry\s*\}\s*from\s*[\"']\.\.\/index(\.js)?[\"']/g, 'import{registry}from"../pipeline/registry.js"');
      fs.writeFileSync(p, c);
      changed = true;
    }
  }
  console.log('[fix-deps] Verified ppu-ocv operation imports.');
}

// 3. Just in case ppu-paddle-ocr ever gets a nested onnxruntime-node created again,
// ensure darwin/x64 binding exists in napi-v6 if created:
const v6DarwinX64Dir = path.join(backendDir, 'node_modules/ppu-paddle-ocr/node_modules/onnxruntime-node/bin/napi-v6/darwin/x64');
const v3DarwinX64 = path.join(backendDir, 'node_modules/onnxruntime-node/bin/napi-v3/darwin/x64/onnxruntime_binding.node');
if (fs.existsSync(path.dirname(path.dirname(v6DarwinX64Dir))) && fs.existsSync(v3DarwinX64) && !fs.existsSync(path.join(v6DarwinX64Dir, 'onnxruntime_binding.node'))) {
  fs.mkdirSync(v6DarwinX64Dir, { recursive: true });
  fs.copyFileSync(v3DarwinX64, path.join(v6DarwinX64Dir, 'onnxruntime_binding.node'));
  console.log('[fix-deps] Provided fallback onnxruntime_binding.node for darwin/x64 napi-v6.');
}

console.log('[fix-deps] Dependency fixes applied successfully.');
