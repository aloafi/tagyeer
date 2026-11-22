/* تصدير CSV متوافق مع Excel العربي (علامة BOM حتى تظهر الحروف سليمة). */

const cell = (c) => '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"';

export const csvOf = (rows) => rows.map((r) => r.map(cell).join(",")).join("\r\n");

export function downloadCsv(name, text) {
  const blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
