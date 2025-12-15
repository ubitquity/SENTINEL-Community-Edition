# 🛡️ SENTINEL V1.1 - Community Edition

**Free & Open Source AI Security Hardening**

[![npm version](https://img.shields.io/npm/v/@neura-help/sentinel-community)](https://www.npmjs.com/package/@neura-help/sentinel-community)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

---

## What is SENTINEL?

SENTINEL is a security layer that protects your LLM applications from prompt injection, jailbreaking, and data leakage.

**Community Edition** provides basic protection for free. For advanced threat detection, [upgrade to Professional](https://neura.help/sentinel/#pricing).

---

## 🚀 Quick Start

### Installation

```bash
npm install @neura-help/sentinel-community
```

### Basic Usage

```javascript
import { Sentinel } from '@neura-help/sentinel-community';

const sentinel = new Sentinel();

// Protect user input before sending to LLM
const result = await sentinel.protect(userInput);
console.log(result.output);  // Sanitized input

// Filter LLM output before returning to user
const filtered = await sentinel.filterOutput(llmResponse);
console.log(filtered.output);  // Filtered output with PII redacted
```

### Full Pipeline

```javascript
const result = await sentinel.pipeline(userInput, async (safeInput) => {
    // Your LLM call here
    return await openai.chat.completions.create({
        messages: [{ role: 'user', content: safeInput }]
    });
});

console.log(result.response);  // Safe, filtered response
```

---

## ✅ What's Included (FREE)

### Layer 1: Basic Input Sanitization
- Code block removal (```)
- Script tag removal (`<script>`)
- System marker escaping ([SYSTEM], [INST])
- Control character removal
- Zero-width character removal
- JavaScript protocol removal
- **5 injection pattern detectors**

### Layer 5: Basic Output Filtering
- SSN redaction → `XXX-XX-XXXX`
- Credit card redaction → `**** **** **** 1234`
- Email redaction → `j***@example.com`
- Phone redaction → `(XXX) XXX-XXXX`

---

## ❌ What's NOT Included (Requires Upgrade)

| Feature | Edition Required |
|---------|------------------|
| 200+ threat signatures | Professional |
| Heuristic detection engine | Professional |
| Behavioral analysis | Professional |
| Homoglyph attack detection | Professional |
| Meta-prompt wrapping | Professional |
| Canary leak detection | Business |
| 15+ PII patterns | Professional |
| 10+ secret patterns | Professional |
| Real-time threat intel | Business |
| Custom signatures | Enterprise |
| SIEM integration | Enterprise |

[View full comparison →](https://neura.help/sentinel/#pricing)

---

## 📖 API Reference

### `sentinel.protect(input)`

Sanitizes user input before sending to LLM.

```javascript
const result = await sentinel.protect("Hello <script>alert('xss')</script>");

// result:
{
  original: "Hello <script>alert('xss')</script>",
  output: "Hello ",
  sanitized: true,
  changes: [{ type: 'script_tag', count: 1 }],
  threats: [],
  edition: 'community'
}
```

### `sentinel.filterOutput(output)`

Filters LLM output, redacting sensitive information.

```javascript
const result = await sentinel.filterOutput("Your SSN is 123-45-6789");

// result:
{
  original: "Your SSN is 123-45-6789",
  output: "Your SSN is XXX-XX-XXXX",
  redactions: [{ type: 'pii', name: 'SSN', count: 1 }],
  edition: 'community'
}
```

### `sentinel.pipeline(input, llmCallback)`

Full protection pipeline: sanitize → LLM → filter.

```javascript
const result = await sentinel.pipeline(userInput, async (safe) => {
  return await yourLLM.complete(safe);
});
```

### `sentinel.getStats()`

Returns usage statistics.

### `sentinel.getUpgradeInfo()`

Returns detailed information about available upgrades.

---

## 🔧 Configuration

```javascript
const sentinel = new Sentinel({
  maxInputLength: 10000,
  redactPII: true,
  redactSecrets: true,
  logLevel: 'info'
});
```

---

## 🆚 Community vs Professional

```
┌─────────────────────────────────────────────────────────┐
│ Feature                    │ Community │ Professional  │
├────────────────────────────┼───────────┼───────────────┤
│ Threat Signatures          │     5     │    200+       │
│ Input Patterns             │     7     │     25+       │
│ PII Patterns               │     4     │     15+       │
│ Heuristic Detection        │     ❌    │      ✅       │
│ Behavioral Analysis        │     ❌    │      ✅       │
│ Meta-Prompt Wrapping       │     ❌    │      ✅       │
│ Canary Detection           │     ❌    │      ✅       │
│ Price                      │   FREE    │   $499/mo     │
└─────────────────────────────────────────────────────────┘
```

---

## 🤝 Contributing

We welcome contributions!

---

## 📄 License

MIT License - Free for personal and commercial use.

See [LICENSE](./LICENSE) for details.

---

## 🔗 Links

- **Website**: [neura.help/sentinel](https://neura.help/sentinel)
- **Documentation**: [neura.help/sentinel/docs](https://neura.help/sentinel/docs)
- **GitHub**: [github.com/ubitquity/SENTINEL-Community-Edition](https://github.com/ubitquity/SENTINEL-Community-Edition)
- **Upgrade**: [neura.help/sentinel/#pricing](https://neura.help/sentinel/#pricing)

---

<p align="center">
  <strong>© 2025 UBITQUITY INC.</strong><br>
  <sub>SENTINEL is a trademark of UBITQUITY INC.</sub>
</p>
