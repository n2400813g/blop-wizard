import fs from 'fs';
import path from 'path';
import * as jsonc from 'jsonc-parser';
import type { EnvConfig } from './types.js';

export function writeJsoncValue(
  filePath: string,
  jsonPath: (string | number)[],
  value: unknown,
): void {
  const resolved = path.resolve(filePath);
  const dir = path.dirname(resolved);
  fs.mkdirSync(dir, { recursive: true });
  const original = fs.existsSync(resolved)
    ? fs.readFileSync(resolved, 'utf8')
    : '{}\n';
  const edits = jsonc.modify(original, jsonPath, value, {
    formattingOptions: { insertSpaces: true, tabSize: 2 },
  });
  const output = jsonc.applyEdits(original, edits);
  fs.writeFileSync(resolved, output, 'utf8');
}

export function readEnvFile(filePath: string): Partial<EnvConfig> {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) return {};
  const raw = fs.readFileSync(resolved, 'utf8');
  const env: Record<string, string> = {};

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }
    const [key, ...rest] = trimmed.split('=');
    env[key] = rest.join('=');
  }

  return env as Partial<EnvConfig>;
}

export function upsertEnvFile(
  filePath: string,
  updates: Partial<EnvConfig>,
): void {
  const resolved = path.resolve(filePath);
  const current = fs.existsSync(resolved)
    ? fs.readFileSync(resolved, 'utf8')
    : '';
  const lines = current.length > 0 ? current.split('\n') : [];
  const byKey = new Map<string, number>();
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return;
    const [key] = trimmed.split('=');
    byKey.set(key, i);
  });

  for (const [key, value] of Object.entries(updates)) {
    if (typeof value === 'undefined' || value === '') {
      continue;
    }
    const next = `${key}=${value}`;
    if (byKey.has(key)) {
      lines[byKey.get(key)!] = next;
    } else {
      lines.push(next);
    }
  }

  const output = lines
    .filter((line, index) => !(line === '' && index === lines.length - 1))
    .join('\n');
  fs.writeFileSync(resolved, `${output}\n`, 'utf8');
}
