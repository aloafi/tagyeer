/* يحصر ورقة أنماط كاملة داخل صنف جذر واحد، حتى تتعايش واجهتان في تطبيق واحد. */
import { readFileSync, writeFileSync } from "node:fs";

const [, , inFile, outFile, scope] = process.argv;
if (!inFile || !outFile || !scope) throw new Error("usage: scope-css <in> <out> <.scope>");

const src = readFileSync(inFile, "utf8");

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

function scopeSelector(sel) {
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

function walk(css) {
  let res = "", k = 0, head = "";
  while (k < css.length) {
    const c = css[k];
    if (c === "{") {
      const [body, next] = readBlock(css, k);
      const sel = head.trim(); head = ""; k = next;
      if (!sel) continue;
      if (atKeep.test(sel)) {
        if (/^@(supports|media)/i.test(sel)) res += sel + "{" + walk(body) + "}";
        else res += sel + "{" + body + "}";                 /* keyframes كما هي */
      } else if (/^@media/i.test(sel)) {
        res += sel + "{" + walk(body) + "}";
      } else {
        res += scopeSelector(sel) + "{" + body + "}";
      }
    } else { head += c; k++; }
  }
  return res + (head.trim() ? head : "");
}

writeFileSync(outFile, walk(src) + "\n");
console.log(outFile + " scoped under " + scope);
