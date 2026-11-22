/* ماسح رمز QR داخل الصفحة: يستخدم BarcodeDetector إن توفّر، وإلا jsQR عند الحاجة. */
import { useCallback, useEffect, useRef, useState } from "react";

const JSQR_SRC = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";

export function extractCode(t) {
  const s = String(t || "").trim();
  let m = s.match(/[?&](?:c|code)=([A-Za-z0-9]{4,8})/i);
  if (m) return m[1].toUpperCase();
  m = s.match(/\/join\/([A-Za-z0-9]{4,8})/i);
  if (m) return m[1].toUpperCase();
  if (/^[A-Za-z0-9]{4,8}$/.test(s)) return s.toUpperCase();
  m = s.match(/([A-Za-z0-9]{6})\s*$/);
  return m ? m[1].toUpperCase() : null;
}

function loadJsQR() {
  return new Promise((res, rej) => {
    if (window.jsQR) return res();
    const sc = document.createElement("script");
    sc.src = JSQR_SRC;
    sc.onload = () => res();
    sc.onerror = () => rej(new Error("lib"));
    document.head.appendChild(sc);
  });
}

export default function QrScanner({ open, onClose, onCode }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const busyRef = useRef(false);
  const [msg, setMsg] = useState("جارٍ تشغيل الكاميرا…");

  const stop = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    busyRef.current = false;
    const v = videoRef.current;
    try { v?.pause(); if (v) v.srcObject = null; } catch { /* تجاهل */ }
    streamRef.current?.getTracks().forEach((t) => { try { t.stop(); } catch { /* تجاهل */ } });
    streamRef.current = null;
  }, []);

  const hit = useCallback(
    (raw) => {
      const code = extractCode(raw);
      if (!code) { setMsg("هذا الرمز لا يخص المنصة. جرّب رمز الجلسة المعروض على الشاشة."); return; }
      try { navigator.vibrate?.(55); } catch { /* تجاهل */ }
      stop();
      onCode(code);
    },
    [onCode, stop]
  );

  useEffect(() => {
    if (!open) { stop(); setMsg("جارٍ تشغيل الكاميرا…"); return; }
    let cancelled = false;

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream;
        try { await v.play(); } catch { /* تجاهل */ }
        setMsg("وجّه الكاميرا نحو الرمز — سُيقرأ تلقائياً.");

        /* القارئ المدمج في المتصفح أسرع وأدق حين يتوفّر */
        let detector = null;
        try {
          if ("BarcodeDetector" in window) {
            const fmts = await window.BarcodeDetector.getSupportedFormats();
            if (fmts?.includes("qr_code")) detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          }
        } catch { /* تجاهل */ }

        if (detector) {
          timerRef.current = setInterval(async () => {
            if (busyRef.current || !videoRef.current || videoRef.current.readyState < 2) return;
            busyRef.current = true;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes?.length) hit(codes[0].rawValue);
            } catch { /* تجاهل */ }
            busyRef.current = false;
          }, 110);
          return;
        }

        try { await loadJsQR(); }
        catch { setMsg("تعذر تحميل أداة القراءة. اكتب الرمز يدوياً."); return; }
        if (cancelled) return;

        const cv = document.createElement("canvas");
        const ctx = cv.getContext("2d", { willReadFrequently: true });
        timerRef.current = setInterval(() => {
          const vv = videoRef.current;
          if (!vv || vv.readyState < 2) return;
          const w = vv.videoWidth, h = vv.videoHeight;
          if (!w || !h) return;
          const scale = Math.min(1, 480 / Math.max(w, h));
          cv.width = Math.round(w * scale);
          cv.height = Math.round(h * scale);
          ctx.drawImage(vv, 0, 0, cv.width, cv.height);
          try {
            const img = ctx.getImageData(0, 0, cv.width, cv.height);
            const res = window.jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
            if (res?.data) hit(res.data);
          } catch { /* تجاهل */ }
        }, 140);
      } catch (err) {
        const n = err?.name;
        setMsg(
          n === "NotAllowedError" || n === "SecurityError"
            ? "لم يتم السماح بالوصول للكاميرا. اسمح بالصلاحية من إعدادات المتصفح، أو اكتب الرمز يدوياً."
            : "تعذر تشغيل الكاميرا على هذا الجهاز. اكتب الرمز يدوياً."
        );
      }
    })();

    return () => { cancelled = true; stop(); };
  }, [open, hit, stop]);

  /* الكاميرا تُغلق عند إخفاء الصفحة أو الضغط على Escape */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    const onHide = () => { if (document.hidden) onClose(); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onClose);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onClose);
    };
  }, [open, onClose]);

  return (
    <div className={"sheet" + (open ? " on" : "")} onClick={(e) => { if (e.currentTarget === e.target) onClose(); }}>
      <div className="scan-card">
        <div className="scan-head">
          <b>امسح رمز الجلسة</b>
          <button className="scan-x" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
        <div className="scan-view">
          <video ref={videoRef} playsInline muted autoPlay />
          <div className="scan-frame"><i /></div>
        </div>
        <p className="scan-msg">{msg}</p>
        <button className="btn btn-ghost" style={{ width: "100%" }} onClick={onClose}>إلغاء</button>
      </div>
    </div>
  );
}
