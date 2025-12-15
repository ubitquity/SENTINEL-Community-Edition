# SENTINEL Documentation

Complete documentation for SENTINEL V1.1 Community Edition.

## Quick Links

- **[API Reference](./api/README.md)** - Complete API documentation
- **[Integration Guides](./guides/)** - Framework-specific guides
- **[Examples](./examples/)** - Working code samples
- **[Architecture](./architecture/README.md)** - Internal design
- **[Troubleshooting](./guides/troubleshooting.md)** - Common issues and solutions
- **[Contributing](../CONTRIBUTING.md)** - Contribution guidelines

## Getting Started

### Installation

```bash
npm install @neura-help/sentinel-community
```

### Quick Example

```javascript
import { Sentinel } from '@neura-help/sentinel-community';

const sentinel = new Sentinel();

// Protect user input
const result = await sentinel.protect(userInput);

// Filter LLM output
const filtered = await sentinel.filterOutput(llmResponse);

// Or use the full pipeline
const pipeline = await sentinel.pipeline(userInput, async (safe) => {
  return await yourLLM.complete(safe);
});
```

## Documentation Structure

### 📚 API Reference

Complete reference for all SENTINEL methods, parameters, and response objects.

- [Sentinel Class](./api/README.md#sentinel-class)
- [Configuration Options](./api/README.md#configuration)
- [Methods Reference](./api/README.md#methods)
- [Response Objects](./api/README.md#response-objects)
- [Error Handling](./api/README.md#error-handling)

**[→ Read API Docs](./api/README.md)**

### 🔌 Integration Guides

Step-by-step guides for integrating SENTINEL with popular frameworks:

#### Node.js Frameworks
- **[Express.js](./guides/express.md)** - Complete Express integration
  - Middleware setup
  - Route protection
  - Production best practices

- **[Next.js](./guides/nextjs.md)** - Next.js App Router and Pages Router
  - API routes
  - Server actions
  - Streaming responses

#### Python Integration
- **[Python/FastAPI](./guides/python.md)** - Python integration patterns
  - HTTP bridge approach
  - FastAPI integration
  - Django and Flask examples
  - LangChain integration

**[→ Browse Integration Guides](./guides/)**

### 💻 Examples

Working code examples you can run immediately:

- **[Basic Usage](./examples/basic-usage.js)** - Core features demo
- **[Express Server](./examples/express-server.js)** - Complete Express app
- **[Integration Patterns](./examples/README.md)** - Common patterns

**[→ Explore Examples](./examples/)**

### 🏗️ Architecture

Deep dive into SENTINEL's internal design:

- System architecture overview
- Core components
- Data flow diagrams
- Security design principles
- Performance considerations

**[→ Read Architecture Docs](./architecture/README.md)**

### 🔧 Troubleshooting

Solutions for common problems:

- Installation issues
- Runtime errors
- Performance problems
- Integration challenges
- Debugging tips

**[→ View Troubleshooting Guide](./guides/troubleshooting.md)**

### 🤝 Contributing

Learn how to contribute to SENTINEL:

- Development setup
- Coding standards
- Testing guidelines
- Pull request process

**[→ Read Contributing Guide](../CONTRIBUTING.md)**

## Common Use Cases

### 1. Chatbot Protection

Protect your LLM chatbot from prompt injection and data leakage:

```javascript
const sentinel = new Sentinel();

app.post('/chat', async (req, res) => {
  const result = await sentinel.pipeline(req.body.message, async (safe) => {
    return await openai.chat.completions.create({
      messages: [{ role: 'user', content: safe }]
    }).then(r => r.choices[0].message.content);
  });

  res.json({ response: result.response });
});
```

**[→ Full Chatbot Example](./examples/express-server.js)**

### 2. API Input Validation

Sanitize all user inputs across your API:

```javascript
app.use(async (req, res, next) => {
  if (req.body) {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        const result = await sentinel.protect(value);
        req.body[key] = result.output;
      }
    }
  }
  next();
});
```

**[→ Middleware Example](./guides/express.md#middleware-integration)**

### 3. Content Moderation

Detect and block malicious content:

```javascript
async function moderateContent(content) {
  const result = await sentinel.protect(content);

  if (result.threats.length > 0) {
    return {
      approved: false,
      reason: 'Potentially malicious content detected',
      threats: result.threats
    };
  }

  return { approved: true, sanitizedContent: result.output };
}
```

**[→ More Patterns](./examples/README.md#integration-patterns)**

### 4. PII Redaction

Automatically redact sensitive information from outputs:

```javascript
const result = await sentinel.filterOutput(llmResponse);

// PII like SSN, credit cards, emails are automatically redacted
console.log(result.output); // Filtered response
console.log(result.redactions); // What was redacted
```

**[→ Output Filtering Guide](./api/README.md#filteroutput)**

## Feature Comparison

### Community Edition (FREE)

✅ What's included:
- Basic input sanitization (7 patterns)
- Basic output filtering (4 PII patterns)
- Control character removal
- Zero-width character removal
- Script/code block removal
- 5 injection pattern detectors
- Full source code access

### Professional Edition ($499/mo)

Everything in Community, plus:
- 200+ threat signatures
- Advanced heuristic detection
- Behavioral analysis
- Homoglyph attack detection
- Meta-prompt security wrapping
- 15+ PII patterns
- 10+ secret patterns
- Email support

### Business Edition ($1,999/mo)

Everything in Professional, plus:
- Full canary adjudicator
- 500+ threat signatures
- Real-time threat intelligence
- Priority support

### Enterprise Edition (Custom)

Everything in Business, plus:
- Unlimited custom signatures
- SIEM integration
- On-premise deployment
- 24/7 support
- SLA guarantees

**[→ Compare All Features](https://neura.help/sentinel/#pricing)**

## Resources

### Official Links
- **Website**: [neura.help/sentinel](https://neura.help/sentinel)
- **GitHub**: [github.com/ubitquity/SENTINEL-Community-Edition](https://github.com/ubitquity/SENTINEL-Community-Edition)
- **npm**: [@neura-help/sentinel-community](https://www.npmjs.com/package/@neura-help/sentinel-community)

### Support
- **Issues**: [GitHub Issues](https://github.com/ubitquity/SENTINEL-Community-Edition/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ubitquity/SENTINEL-Community-Edition/discussions)

### Upgrading
- **Pricing**: [neura.help/sentinel/#pricing](https://neura.help/sentinel/#pricing)
- **Contact Sales**: For Enterprise Edition inquiries

## What's New in V1.1

- ✨ Basic output filtering with PII redaction
- ✨ Improved threat detection
- ✨ Better error handling
- ✨ Enhanced statistics tracking
- 📚 Comprehensive documentation
- 🐛 Bug fixes and performance improvements

## Community

### Contributing

We welcome contributions! See our [Contributing Guide](../CONTRIBUTING.md) for:
- How to report bugs
- How to suggest features
- Development workflow
- Coding standards

### License

MIT License - Free for personal and commercial use.

See [LICENSE](../LICENSE) for details.

---

## Quick Navigation

<table>
<tr>
<td width="33%">

### 📖 Learn
- [API Reference](./api/README.md)
- [Architecture](./architecture/README.md)
- [Examples](./examples/)

</td>
<td width="33%">

### 🔧 Integrate
- [Express.js](./guides/express.md)
- [Next.js](./guides/nextjs.md)
- [Python](./guides/python.md)

</td>
<td width="33%">

### 🆘 Help
- [Troubleshooting](./guides/troubleshooting.md)
- [GitHub Issues](https://github.com/ubitquity/SENTINEL-Community-Edition/issues)
- [Contributing](../CONTRIBUTING.md)

</td>
</tr>
</table>

---

<p align="center">
  <strong>© 2025 UBITQUITY INC.</strong><br>
  <sub>SENTINEL is a trademark of UBITQUITY INC.</sub>
</p>
