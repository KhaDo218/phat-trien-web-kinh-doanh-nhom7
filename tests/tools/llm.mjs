#!/usr/bin/env node
// Gọi DeepSeek / GLM (OpenAI-compatible) để giao việc viết hàng loạt.
// Dùng:  node tools/llm.mjs --model ds|glm --in prompt.md [--system sys.md] [--out file] [--max 8000] [--code]
//   --code : bỏ khung ``` ở đầu/cuối câu trả lời (khi xin code/CSV/JSON)
// Key đọc từ .env ở thư mục gốc (không in ra). Mỗi lần gọi ghi số token vào tools/usage.log.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = (d => { while (!(fs.existsSync(path.join(d, 'scripts')) && fs.existsSync(path.join(d, 'data')))) { const c = path.dirname(d); if (c === d) throw new Error('Không tìm thấy gốc repo'); d = c; } return d; })(path.dirname(fileURLToPath(import.meta.url)));

// Nạp .env (không ghi đè biến đã có)
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}

const BASE = process.env.QA_BASE_URL || 'https://api-cdn.deploy.com/api/v1';
const MODELS = {
  ds: { id: 'deepseek-ai/deepseek-v4.1-flash-1017', key: process.env.DEEPSEEK_API_KEY },
  glm: { id: 'zai-org/glm-5.3-flash', key: process.env.GLM_API_KEY },
};

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (!a.startsWith('--')) continue;
  const next = process.argv[i + 1];
  if (next === undefined || next.startsWith('--')) args[a.slice(2)] = true;
  else { args[a.slice(2)] = next; i++; }
}

const m = MODELS[args.model || 'ds'];
if (!m) throw new Error('--model phải là ds hoặc glm');
if (!m.key) throw new Error('Thiếu API key trong .env');
if (!args.in) throw new Error('Thiếu --in <file prompt>');

const messages = [];
if (args.system) messages.push({ role: 'system', content: fs.readFileSync(args.system, 'utf8') });
messages.push({ role: 'user', content: fs.readFileSync(args.in, 'utf8') });

// Thử tắt suy nghĩ trước; API không nhận thì lùi dần
// GLM trên cổng này luôn suy nghĩ; gửi reasoning_effort làm phần suy nghĩ lẫn vào content,
// nên với GLM không gửi gì (suy nghĩ tách riêng ở message.reasoning) và cộng thêm token cho nó.
const VARIANTS = args.model === 'glm' ? [{}] : [{ reasoning_effort: 'none' }, { reasoning_effort: 'low' }, {}];
const EXTRA = args.model === 'glm' ? 4000 : 0;

async function call() {
  for (let attempt = 0, v = 0; attempt < 6; attempt++) {
    const body = { model: m.id, messages, max_tokens: Number(args.max || 8000) + EXTRA, temperature: 0.3, ...VARIANTS[v] };
    let res;
    try {
      res = await fetch(`${BASE}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${m.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(900_000),
      });
      var text = await res.text();
    } catch (e) {
      console.error(`Lỗi mạng (lần ${attempt + 1}): ${e.message}`);
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
      continue;
    }
    if (res.status === 400 && v < VARIANTS.length - 1) { v++; continue; }
    if (res.status === 429 || res.status >= 500) {
      console.error(`HTTP ${res.status}, thử lại...`);
      await new Promise(r => setTimeout(r, 5000 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
    const json = JSON.parse(text);
    const choice = json.choices?.[0];
    let out = choice?.message?.content || '';
    if (!out) throw new Error(`Trả về rỗng (finish_reason=${choice?.finish_reason}). Tăng --max.`);
    if (choice.finish_reason === 'length') console.error('CẢNH BÁO: câu trả lời bị cắt do hết max_tokens');
    const u = json.usage || {};
    fs.appendFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'usage.log'),
      `${new Date().toISOString()}\t${args.model || 'ds'}\tin=${u.prompt_tokens}\tout=${u.completion_tokens}\t${args.in}\n`);
    return out;
  }
  throw new Error('Gọi API thất bại sau nhiều lần thử');
}

let out = await call();
if (args.code) out = out.trim().replace(/^```[\w-]*\r?\n/, '').replace(/\r?\n```\s*$/, '');
if (args.out) {
  fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
  fs.writeFileSync(args.out, out);
  console.error(`Đã ghi ${args.out} (${out.length} ký tự)`);
} else process.stdout.write(out);
