# PlanFlow AI — Security Architecture & Threat Model

This document outlines the security architecture, threat model, input sanitization policies, client-side boundary rules, and vulnerability reporting processes for **PlanFlow AI**.

---

## 1. Threat Model & Risk Analysis

PlanFlow AI operates as a client-side, local-first web application with optional third-party GenAI API integrations (Google Gemini). The primary threat vectors analyzed include:

| Threat Category | Potential Attack Vector | Impact Level | Mitigation Strategy |
| :--- | :--- | :---: | :--- |
| **Cross-Site Scripting (XSS)** | Malicious strings injected via task names, vendor notes, risk descriptions, prompt inputs, or imported JSON files. | **High** | Imports are normalized and bounded; dynamic text is escaped before the reviewed template-rendering boundary. Attribute IDs are restricted to a safe token set. |
| **Content Security Policy (CSP)** | Injection of external unauthorized scripts or iframes. | **High** | Dual-layer CSP via `<meta http-equiv="Content-Security-Policy">` and `vercel.json` permits scripts only from `'self'` and blocks framing. |
| **Data Exfiltration** | Unauthorized exposure of user planning budgets, guest lists, or API keys. | **High** | Zero remote tracking or server-side telemetry. Planning data stays in origin-scoped `localStorage`; optional API keys are session-only. |
| **API Key Leakage & Abuse** | Inadvertent disclosure or brute-force misuse of Google Gemini API keys. | **Medium** | Keys are stored only in `sessionStorage`, excluded from exports, and sent solely to Google's official endpoint over HTTPS. |
| **Chat Flood & Prompt Injection** | High-frequency automated spam or malformed prompt flooding. | **Medium** | Client-side rate-limiting cooldown (2.5s window) and text length bounding (`CHAT_MAX_LEN: 500`). |
| **DOM-based State Poisoning** | Crafted malicious JSON files loaded via the "Import JSON" utility. | **Medium** | Schema verification (`v3`), safe parsing wrapped in `try/catch`, and strict numeric/text bounds clamping. |
| **Denial of Service (Client CPU)** | Extreme numeric inputs causing division-by-zero or excessive DOM rendering loops. | **Low** | Strict input boundary clamping (`sanitizeNumber` limits budget to $100M, guests to 100k, debounce delay of 150ms on sliders). |

---

## 2. Cross-Site Scripting (XSS) Mitigation Strategy

PlanFlow AI adheres to a strict "Escape by Default" policy:

1. **`escapeHTML(str)` Helper**:
   Every string rendered inside dynamic DOM elements is converted to safe HTML entities:
   ```javascript
   function escapeHTML(str) {
     if (typeof str !== 'string') {
       return str === null || str === undefined ? '' : String(str);
     }
     return str
       .replace(/&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;')
       .replace(/'/g, '&#039;')
       .replace(/\//g, '&#x2F;');
   }
   ```
2. **Safe DOM Construction**:
   Whenever possible, UI nodes are created using `document.createElement`, with properties assigned via `element.textContent`, `element.setAttribute`, or validated CSS custom properties.
3. **Markdown-to-HTML Parser**:
   The PlanGenie chat renderer does not evaluate raw HTML. It first passes the message through `escapeHTML()`, then safely replaces markdown tokens (`**bold**`, `*italic*`, bullet items) with pre-sanitized structural tags (`<strong>`, `<em>`, `<li>`).

---

## 3. LocalStorage Boundary & Data Privacy Rules

- **Origin Isolation**: All event state (budgets, vendor lists, risks, inventory, chat transcripts) is keyed to `planflow_ai_v2_state` and scoped strictly to the current origin via the browser's Same-Origin Policy (SOP).
- **Graceful Fault Tolerance**: Storage reads are encapsulated in defensive `try/catch` blocks. If storage contains invalid, tampered, or corrupted data, PlanFlow AI logs a console warning and transparently recovers the clean default state without crashing.
- **Data Sovereignty**: PlanFlow AI requires no user account, collects no PII (Personally Identifiable Information), and sends no tracking analytics to external endpoints.

---

## 4. Google Gemini API Key Guidelines

When users optionally configure their Google Gemini API key:
- **Validation**: Enforces standard Google AI API key format (`AIza[0-9A-Za-z-_]{35}`) before attempting network transactions.
- **Session-Only Storage**: The key is stored strictly in memory and `sessionStorage` during the active browser session. It is **NEVER** persisted to `localStorage` and **NEVER** serialized into exported JSON event plans.
- **Immediate Clearing**: Users can revoke and delete their session key anytime via the in-app AI Settings dialog (`⚙️ -> Remove API Key`). Closing the browser tab automatically flushes the key from memory.
- **Offline Fallback**: Even without an API key, the built-in offline heuristic AI provides full functionality with zero dependencies.

---

## 5. Content Security Policy (CSP) Specifications

Enforced across both `index.html` and `vercel.json`:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://generativelanguage.googleapis.com; img-src 'self' data: https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';
```

---

## 6. Vulnerability Reporting Guidelines

If you discover a potential security vulnerability within PlanFlow AI, please report it responsibly:
- Repository: [https://github.com/VishwajeetCSE/GenAI-powered-planning-assistant](https://github.com/VishwajeetCSE/GenAI-powered-planning-assistant)
- Please open a private Security Advisory on GitHub or submit a detailed issue report outlining:
  1. Description of the vulnerability.
  2. Proof of Concept (PoC) or reproduction steps.
  3. Potential impact assessment.
