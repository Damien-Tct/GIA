import fs from 'fs';
import path from 'path';
import { SubmissionLog } from './types';

const LOGS_DIR = path.join(process.cwd(), 'data', 'logs');

function ensureDir() {
  if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
}

export function addLog(entry: Omit<SubmissionLog, 'id'>): SubmissionLog {
  ensureDir();
  const log: SubmissionLog = { id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, ...entry };
  const date = new Date().toISOString().split('T')[0];
  const filePath = path.join(LOGS_DIR, `${date}.jsonl`);
  fs.appendFileSync(filePath, JSON.stringify(log) + '\n', 'utf-8');
  return log;
}

export function getLogs(limit = 50, offset = 0): { logs: SubmissionLog[]; total: number } {
  ensureDir();
  const files = fs.readdirSync(LOGS_DIR).sort().reverse();
  const all: SubmissionLog[] = [];
  for (const f of files) {
    if (!f.endsWith('.jsonl')) continue;
    const lines = fs.readFileSync(path.join(LOGS_DIR, f), 'utf-8').trim().split('\n').filter(Boolean);
    for (const line of lines.reverse()) {
      try { all.push(JSON.parse(line)); } catch { /* skip */ }
    }
  }
  all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return { logs: all.slice(offset, offset + limit), total: all.length };
}
