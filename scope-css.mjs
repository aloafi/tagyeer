/* يحصر ورقة أنماط كاملة داخل صنف جذر واحد، حتى تتعايش واجهتان في تطبيق واحد. */
import { readFileSync, writeFileSync } from "node:fs";

const [, , inFile, outFile, scope, flag, altScope] = process.argv;
if (!inFile || !outFile || !scope) throw new Error("usage: scope-css <in> <out> <.scope> [--container <.altScope>]");

/* نسخة ثانية من الورقة نفسها محصورة في صنف آخر، تقيس بوحدات الحاوية
   بدل وحدات الشاشة. فائدتها: عرض واجهة المشارك داخل إطار جهاز في لوحة
   التحكم بالمقاسات نفسها التي يراها على جواله فعلاً، دون تكرار القيم يدوياً. */
const container = flag === "--container" ? altScope : null;
if (flag && !container) throw new Error("--container requires a scope class");

let src = readFileSync(inFile, "utf8");

/* التعليقات تُزال قبل التحليل: تعليق قبل @media كان يجعل المحلّل يحسبه
   محدِّداً عادياً فيسبقه بصنف الجذر، فتفسد القاعدة كلها بصمت.
   الملف المصدر يحتفظ بتعليقاته؛ المحذوف هنا هو الناتج المولَّد فقط. */
src = src.replace(/\/\*[\s\S]*?\*\//g, "");

/* يقسّم على الفواصل العليا فقط، لا داخل الأقواس */
function splitTop(sel) {
  const out = []; let depth = 0, cur = "";
  for (const ch of sel) {
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    if (ch === "," && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map(s => s.trim()).filter(Boolean);
}

function scopeSelector(sel, scope) {
  return splitTop(sel).map(s => {
    if (s === ":root" || s === "html" || s === "body" || s === "html,body") return scope;
    if (s === "*") return scope + ",$" ; // يُعالَج أدناه
    if (/^(html|body)\s*[.#:[]/.test(s)) return scope + s.replace(/^(html|body)/, "");
    if (/^(html|body)\s+/.test(s)) return scope + " " + s.replace(/^(html|body)\s+/, "");
    return scope + " " + s;
  }).join(",").replace(scope + ",$", scope + "," + scope + " *");
}

/* مُحلِّل بسيط: يمرّ على الأحرف ويتعقّب عمق الأقواس والنصوص */
let out = "", i = 0, buf = "";
const atKeep = /^@(keyframes|font-face|import|charset|supports|-webkit-keyframes)/i;

function readBlock(text, start) {     // يُعيد [المحتوى, الفهرس بعد القوس المغلق]
  let depth = 0, j = start, s = "";
  for (; j < text.length; j++) {
    const c = text[j];
    if (c === "{") { depth++; if (depth === 1) { s = ""; continue; } }
    else if (c === "}") { depth--; if (depth === 0) return [s, j + 1]; }
    if (depth >= 1) s += c;
  }
  throw new Error("unbalanced braces at " + start);
}

/* وحدات الشاشة تصير وحدات حاوية: 4vw داخل إطار عرضه 390px تساوي
   4cqw، فيظهر النص بحجمه على الجوال لا بحجمه على شاشة الكمبيوتر. */
const toContainerUnits = (body) =>
  body
    .replace(/([\d.]+)vw\b/g, "$1cqw")
    .replace(/([\d.]+)(?:s|d|l)?vh\b/g, "$1cqh")
    .replace(/([\d.]+)vmin\b/g, "$1cqmin")
    .replace(/([\d.]+)vmax\b/g, "$1cqmax");

/* استعلام عرض الشاشة يصير استعلام عرض الحاوية؛ ما عداه يبقى كما هو */
function mediaToContainer(sel) {
  const cond = sel.replace(/^@media/i, "").trim();
  if (/prefers-|orientation|hover|pointer|print|screen|resolution|aspect|color/i.test(cond)) return sel;
  if (!/width/i.test(cond)) return sel;
  return "@container " + cond;
}

function walk(css, scope, asContainer) {
  let res = "", k = 0, head = "";
  while (k < css.length) {
    const c = css[k];
    if (c === "{") {
      const [body, next] = readBlock(css, k);
      const sel = head.trim(); head = ""; k = next;
      if (!sel) continue;
      const decl = asContainer ? toContainerUnits(body) : body;
      if (atKeep.test(sel)) {
        if (/^@(supports|media)/i.test(sel)) {
          const at = asContainer && /^@media/i.test(sel) ? mediaToContainer(sel) : sel;
          res += at + "{" + walk(body, scope, asContainer) + "}";
        } else res += sel + "{" + decl + "}";               /* keyframes كما هي */
      } else if (/^@media/i.test(sel)) {
        const at = asContainer ? mediaToContainer(sel) : sel;
        res += at + "{" + walk(body, scope, asContainer) + "}";
      } else {
        res += scopeSelector(sel, scope) + "{" + decl + "}";
      }
    } else { head += c; k++; }
  }
  return res + (head.trim() ? head : "");
}

let outCss = walk(src, scope, false);

if (container) {
  /* الإطارات المسمّاة تتكرّر مرتين لولا هذا الحذف */
  const variant = walk(src, container, true).replace(/@(-webkit-)?keyframes[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, "");
  outCss += "\n" + variant;
}

writeFileSync(outFile, outCss + "\n");
console.log(outFile + " scoped under " + scope + (container ? " (+ " + container + " بوحدات الحاوية)" : ""));
