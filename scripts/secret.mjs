#!/usr/bin/env node
// 비밀글 빌드기 / 복원기.
//
//   secret-src/<slug>.md   평문. .gitignore 로 저장소에 절대 안 들어간다.
//        ↓ build: hugo 로 렌더 (위키링크·코드 하이라이트 전부 적용) → AES-256-GCM
//   content/secret/<slug>.md   암호문 스텁. 이것만 커밋된다.
//        ↓ restore: 복호화
//   secret-src/<slug>.md   원본 마크다운 그대로
//
// 키는 사이트에 하나다. data/secret.json 의 솔트로 비밀번호에서 유도하고, 모든 글이 그 키를
// 공유한다(글마다 IV 만 다르다). 그래서 브라우저에서 비밀번호를 한 번만 넣으면 전부 열린다.
//
// 암호문 안에는 { title, html, source } 가 들어간다. source 덕분에 새로 클론한 곳에서도
// 비밀번호만 있으면 편집 가능한 원문이 돌아온다. 저장소 자체가 암호화된 백업이 된다.
//
// 사용: node scripts/secret.mjs [build]     평문 → 암호문 (기본값)
//       node scripts/secret.mjs restore     암호문 → 평문
//       SECRET_PASSPHRASE=... node scripts/secret.mjs
//       --force    build: 변경 없어도 재암호화 / restore: 기존 평문 덮어쓰기
//       --rekey    비밀번호를 바꾼다. 솔트를 새로 뽑고 전부 다시 암호화한다.

import { execFileSync } from 'node:child_process';
import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes, createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'secret-src');
const BUILD_DIR = path.join(ROOT, 'content', 'secretbuild');
const OUT_DIR = path.join(ROOT, 'content', 'secret');
const KEYCHAIN = path.join(ROOT, 'data', 'secret.json');
const CACHE = path.join(ROOT, '.secret-cache.json');

const ITERATIONS = 600000; // PBKDF2-SHA256. OWASP 2023 권고치
const TAG_BYTES = 16; // AES-GCM 인증 태그
const CHECK = 'secret-ok'; // 비밀번호 검증용 평문. 이게 풀리면 키가 맞다.

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const REKEY = args.includes('--rekey');
const COMMAND = args.find((a) => !a.startsWith('-')) ?? 'build';

// ── 프론트매터 ──────────────────────────────────────────────────────────
// 전체 YAML 파서는 필요 없다. 최상위 스칼라 몇 개만 읽는다.
function frontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim().replace(/^["'](.*)["']$/, '$1');
  }
  return fm;
}

const yamlQuote = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
const b64 = (buf) => buf.toString('base64url');
const unb64 = (s) => Buffer.from(s, 'base64url');

// ── 비밀번호 ────────────────────────────────────────────────────────────
async function askPassphrase(label = '비밀번호') {
  if (process.env.SECRET_PASSPHRASE) return process.env.SECRET_PASSPHRASE;
  if (!process.stdin.isTTY) throw new Error('TTY 가 아니다. SECRET_PASSPHRASE 로 넘겨라.');
  process.stdout.write(`${label}: `);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  let pw = '';
  for await (const chunk of process.stdin) {
    for (const ch of chunk.toString('utf8')) {
      if (ch === '\r' || ch === '\n') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write('\n');
        return pw;
      }
      if (ch === '\u0003') { process.stdout.write('\n'); process.exit(130); } // Ctrl-C
      if (ch === '\u007f' || ch === '\b') { pw = pw.slice(0, -1); continue; }
      pw += ch;
    }
  }
  return pw;
}

const fingerprint = (pw) => createHash('sha256').update(`fp ${pw}`).digest('hex').slice(0, 16);
const sha256 = (s) => createHash('sha256').update(s).digest('hex');
const readCache = () => (fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {});

// ── 암복호화 ────────────────────────────────────────────────────────────
// 키는 하나, IV 는 매번 새로. 같은 키로 IV 를 재사용하면 GCM 은 무너진다.
function seal(key, text) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key, iv);
  // WebCrypto 는 인증 태그가 암호문 뒤에 붙어 있기를 기대한다.
  const ct = Buffer.concat([c.update(text, 'utf8'), c.final(), c.getAuthTag()]);
  return { iv: b64(iv), ct: b64(ct) };
}

function unseal(key, ivB64, ctB64) {
  const ct = unb64(ctB64);
  const d = createDecipheriv('aes-256-gcm', key, unb64(ivB64));
  d.setAuthTag(ct.subarray(ct.length - TAG_BYTES));
  return Buffer.concat([d.update(ct.subarray(0, ct.length - TAG_BYTES)), d.final()]).toString('utf8');
}

// data/secret.json — 솔트·반복횟수·검증값. 비밀이 아니라서 커밋된다.
function loadKeychain(passphrase, { allowCreate }) {
  if (fs.existsSync(KEYCHAIN) && !REKEY) {
    const kc = JSON.parse(fs.readFileSync(KEYCHAIN, 'utf8'));
    const key = pbkdf2Sync(passphrase, unb64(kc.salt), kc.iter, 32, 'sha256');
    try {
      if (unseal(key, kc.check_iv, kc.check_ct) !== CHECK) throw new Error();
    } catch {
      throw new Error('기존 비밀글과 다른 비밀번호다. 바꾸려면 --rekey (전부 다시 암호화된다).');
    }
    return { key, created: false };
  }

  if (!allowCreate) throw new Error(`키체인이 없다: ${path.relative(ROOT, KEYCHAIN)}`);

  const salt = randomBytes(16);
  const key = pbkdf2Sync(passphrase, salt, ITERATIONS, 32, 'sha256');
  const check = seal(key, CHECK);
  fs.mkdirSync(path.dirname(KEYCHAIN), { recursive: true });
  fs.writeFileSync(
    KEYCHAIN,
    JSON.stringify({ v: 1, iter: ITERATIONS, salt: b64(salt), check_iv: check.iv, check_ct: check.ct }, null, 2) + '\n'
  );
  return { key, created: true };
}

// 스텁 프론트매터에서 암호문을 꺼낸다.
function readStub(file) {
  const fm = frontMatter(fs.readFileSync(file, 'utf8'));
  return fm.secret_ct ? fm : null;
}

const stubs = () =>
  fs.existsSync(OUT_DIR)
    ? fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.md') && f !== '_index.md').sort()
    : [];

// ── build ───────────────────────────────────────────────────────────────
async function build() {
  const sources = fs.existsSync(SRC_DIR)
    ? fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.md')).sort()
    : [];

  if (sources.length === 0) {
    console.log(`평문이 없다: ${path.relative(ROOT, SRC_DIR)}/*.md`);
    if (stubs().length) console.log('클론 직후라면 `node scripts/secret.mjs restore` 로 원문을 복원해라.');
    return;
  }

  const cache = readCache();
  const passphrase = await askPassphrase();
  if (!passphrase) throw new Error('비밀번호가 비었다.');
  const { key, created } = loadKeychain(passphrase, { allowCreate: true });
  if (created) console.log(`키체인 생성: ${path.relative(ROOT, KEYCHAIN)}`);
  const pw = fingerprint(passphrase);
  // 솔트가 바뀌면 예전 암호문은 못 읽는다. 전부 다시 굽는다.
  const rebuildAll = FORCE || REKEY || created;

  // 평문을 임시로 content/secretbuild/ 에 넣고 hugo 로 렌더한다.
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  fs.mkdirSync(BUILD_DIR, { recursive: true });

  const docs = [];
  for (const file of sources) {
    const slug = path.basename(file, '.md');
    const raw = fs.readFileSync(path.join(SRC_DIR, file), 'utf8');
    const digest = sha256(raw);
    const unchanged =
      !rebuildAll &&
      cache[slug]?.digest === digest &&
      cache[slug]?.pw === pw &&
      fs.existsSync(path.join(OUT_DIR, `${slug}.md`));
    docs.push({ slug, raw, fm: frontMatter(raw), digest, unchanged });
    if (!unchanged) fs.writeFileSync(path.join(BUILD_DIR, `${slug}.md`), raw);
  }

  const todo = docs.filter((d) => !d.unchanged);
  if (todo.length === 0) {
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
    console.log(`변경 없음. ${docs.length}개 그대로 (--force 로 강제 재암호화).`);
    return;
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hugo-secret-'));
  try {
    // --buildFuture 가 없으면 미래 날짜 글이 통째로 빠진다. draft 와는 별개 스위치다.
    execFileSync(
      'hugo',
      ['--quiet', '--buildDrafts', '--buildFuture', '--destination', tmp, '--logLevel', 'error'],
      { cwd: ROOT, stdio: ['ignore', 'inherit', 'inherit'] }
    );

    fs.mkdirSync(OUT_DIR, { recursive: true });
    for (const doc of todo) {
      const rendered = path.join(tmp, 'secretbuild', doc.slug, 'index.html');
      if (!fs.existsSync(rendered)) {
        throw new Error(`렌더 결과가 없다: ${doc.slug} (프론트매터의 slug/draft 확인)`);
      }
      const html = fs.readFileSync(rendered, 'utf8').trim();
      const title = doc.fm.title ?? doc.slug;

      // source 를 같이 넣는다 → restore 로 편집 가능한 원문이 돌아온다.
      const body = seal(key, JSON.stringify({ title, html, source: doc.raw }));
      // 제목은 따로 한 번 더 — 목록에서 본문 전체를 받지 않고 제목만 풀 수 있게.
      const label = seal(key, title);

      const lines = [
        '---',
        `title: ${yamlQuote(doc.fm.publicTitle ?? '비밀글')}`,
        `date: ${doc.fm.date ?? new Date().toISOString()}`,
        'draft: false',
        'searchHidden: true',
        'ShowToc: false',
        // list: local → 자기 섹션 목록에만 뜨고 사이트 전체 수집(홈·RSS·검색)에서는 빠진다.
        'build:',
        '  list: local',
        `secret_iv: ${yamlQuote(body.iv)}`,
        `secret_ct: ${yamlQuote(body.ct)}`,
        `secret_title_iv: ${yamlQuote(label.iv)}`,
        `secret_title_ct: ${yamlQuote(label.ct)}`,
        '---',
        '',
      ];
      fs.writeFileSync(path.join(OUT_DIR, `${doc.slug}.md`), lines.join('\n'));
      cache[doc.slug] = { digest: doc.digest, pw };
      console.log(`암호화 ${doc.slug}  ${html.length}B → ${body.ct.length}B`);
    }
  } finally {
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  // 원본이 사라진 스텁은 알려만 준다. 지우는 건 사람이 판단할 일.
  for (const f of stubs()) {
    const slug = path.basename(f, '.md');
    if (!docs.some((d) => d.slug === slug)) console.log(`평문 없는 스텁: content/secret/${f}`);
  }

  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2));
  console.log('\n완료. content/secret/ 와 data/secret.json 을 커밋하면 된다.');
}

// ── restore ─────────────────────────────────────────────────────────────
async function restore() {
  const files = stubs();
  if (files.length === 0) {
    console.log(`암호문이 없다: ${path.relative(ROOT, OUT_DIR)}/*.md`);
    return;
  }

  const passphrase = await askPassphrase();
  if (!passphrase) throw new Error('비밀번호가 비었다.');
  const { key } = loadKeychain(passphrase, { allowCreate: false });
  const pw = fingerprint(passphrase);

  fs.mkdirSync(SRC_DIR, { recursive: true });
  const cache = readCache();
  let written = 0, skipped = 0, failed = 0;

  for (const file of files) {
    const slug = path.basename(file, '.md');
    const target = path.join(SRC_DIR, `${slug}.md`);
    const fm = readStub(path.join(OUT_DIR, file));

    if (!fm) {
      console.log(`건너뜀 ${slug}  암호문이 없다 (스텁이 아니다)`);
      skipped++;
      continue;
    }

    let doc;
    try {
      doc = JSON.parse(unseal(key, fm.secret_iv, fm.secret_ct));
    } catch {
      // GCM 인증 실패 = 암호문이 손상됐거나 키가 맞지 않는다.
      console.log(`실패   ${slug}  복호화 실패`);
      failed++;
      continue;
    }

    if (!doc.source) {
      console.log(`건너뜀 ${slug}  source 없는 옛 형식이다. 원문은 못 되살린다.`);
      skipped++;
      continue;
    }

    // 이미 있는 평문은 건드리지 않는다. 손으로 고치던 게 날아가면 복구할 길이 없다.
    if (fs.existsSync(target) && !FORCE) {
      const same = fs.readFileSync(target, 'utf8') === doc.source;
      console.log(`건너뜀 ${slug}  ${same ? '이미 같다' : '로컬 평문이 다르다 (--force 로 덮어쓰기)'}`);
      if (same) cache[slug] = { digest: sha256(doc.source), pw };
      skipped++;
      continue;
    }

    fs.writeFileSync(target, doc.source);
    // 캐시를 채워두면 다음 build 가 불필요한 재암호화를 건너뛴다.
    cache[slug] = { digest: sha256(doc.source), pw };
    written++;
    console.log(`복원   ${slug}  → secret-src/${slug}.md  (${doc.title})`);
  }

  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2));
  console.log(`\n복원 ${written} · 건너뜀 ${skipped} · 실패 ${failed}`);
  if (written) console.log('secret-src/ 는 .gitignore 다. 커밋되지 않는다.');
}

// ── 진입점 ──────────────────────────────────────────────────────────────
try {
  if (COMMAND === 'build') await build();
  else if (COMMAND === 'restore') await restore();
  else {
    console.error(`모르는 명령: ${COMMAND}`);
    console.error('사용: node scripts/secret.mjs [build|restore] [--force] [--rekey]');
    process.exit(1);
  }
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
