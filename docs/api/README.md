# SENTINEL API Reference

Complete API reference for SENTINEL Community Edition.

## Table of Contents

- [Sentinel Class](#sentinel-class)
- [Configuration](#configuration)
- [Methods](#methods)
- [Response Objects](#response-objects)
- [Error Handling](#error-handling)

## Sentinel Class

The main entry point for SENTINEL functionality.

### Constructor

```javascript
new Sentinel(options)
```

#### Parameters

- `options` (Object, optional): Configuration options

#### Example

```javascript
import { Sentinel } from '@neura-help/sentinel-community';

const sentinel = new Sentinel({
  maxInputLength: 10000,
  redactPII: true,
  redactSecrets: true,
  logLevel: 'info'
});
```

## Configuration

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxInputLength` | number | 10000 | Maximum input length before truncation |
| `redactPII` | boolean | true | Enable PII redaction in outputs |
| `redactSecrets` | boolean | true | Enable secret redaction in outputs |
| `logLevel` | string | 'info' | Logging level: 'none', 'error', 'warn', 'info', 'debug' |

### Example Configuration

```javascript
const sentinel = new Sentinel({
  maxInputLength: 5000,
  redactPII: true,
  redactSecrets: true,
  logLevel: 'warn'
});
```

## Methods

### protect()

Sanitizes user input before sending to an LLM.

#### Signature

```javascript
async protect(input: string): Promise<ProtectResult>
```

#### Parameters

- `input` (string): Raw user input to sanitize

#### Returns

`Promise<ProtectResult>` - Object containing:

| Property | Type | Description |
|----------|------|-------------|
| `original` | string | Original input text |
| `output` | string | Sanitized output text |
| `sanitized` | boolean | Whether any sanitization occurred |
| `changes` | array | Array of change objects describing modifications |
| `threats` | array | Array of detected threats |
| `processingTime` | number | Processing time in milliseconds |
| `edition` | string | Edition identifier ('community') |
| `notice` | string | Upgrade notice (if threats detected) |

#### Example

```javascript
const result = await sentinel.protect("Hello <script>alert('xss')</script>");

console.log(result);
// {
//   original: "Hello <script>alert('xss')</script>",
//   output: "Hello ",
//   sanitized: true,
//   changes: [{ type: 'script_tag', count: 1 }],
//   threats: [],
//   processingTime: 2,
//   edition: 'community'
// }
```

#### Change Types

| Type | Description |
|------|-------------|
| `code_block` | Removed code blocks (```) |
| `script_tag` | Removed script tags |
| `system_marker` | Escaped system markers ([SYSTEM], [INST]) |
| `inst_marker` | Escaped instruction markers |
| `control_chars` | Removed control characters |
| `zero_width` | Removed zero-width characters |
| `js_protocol` | Removed JavaScript protocol URLs |
| `truncation` | Input was truncated due to length |

#### Threat Types

| Type | Severity | Description |
|------|----------|-------------|
| `injection_attempt` | high | Basic injection pattern detected |

### filterOutput()

Filters LLM output to redact sensitive information.

#### Signature

```javascript
async filterOutput(output: string): Promise<FilterResult>
```

#### Parameters

- `output` (string): Raw LLM response to filter

#### Returns

`Promise<FilterResult>` - Object containing:

| Property | Type | Description |
|----------|------|-------------|
| `original` | string | Original output text |
| `output` | string | Filtered output text |
| `filtered` | boolean | Whether any filtering occurred |
| `redactions` | array | Array of redaction objects |
| `processingTime` | number | Processing time in milliseconds |
| `edition` | string | Edition identifier ('community') |
| `upgradeNotice` | string | Upgrade notice (if redactions occurred) |

#### Example

```javascript
const result = await sentinel.filterOutput("Your SSN is 123-45-6789");

console.log(result);
// {
//   original: "Your SSN is 123-45-6789",
//   output: "Your SSN is XXX-XX-XXXX",
//   filtered: true,
//   redactions: [{ type: 'pii', name: 'SSN', count: 1 }],
//   processingTime: 1,
//   edition: 'community'
// }
```

#### Redaction Types

**PII Redactions:**

| Name | Pattern | Redaction Format |
|------|---------|-----------------|
| `SSN` | Social Security Numbers | `XXX-XX-XXXX` |
| `Credit Card` | Credit card numbers | `**** **** **** 1234` |
| `Email` | Email addresses | `j***@example.com` |
| `Phone` | Phone numbers | `(XXX) XXX-XXXX` |

**Secret Redactions:**

| Name | Pattern | Redaction Format |
|------|---------|-----------------|
| `Password` | Password fields | `password: [REDACTED]` |

### pipeline()

Full protection pipeline: sanitize input → call LLM → filter output.

#### Signature

```javascript
async pipeline(input: string, llmCallback: Function): Promise<PipelineResult>
```

#### Parameters

- `input` (string): User input to process
- `llmCallback` (async function): Async function that calls your LLM
  - Receives: `safeInput` (string) - sanitized input
  - Returns: LLM response (string)

#### Returns

`Promise<PipelineResult>` - Object containing:

| Property | Type | Description |
|----------|------|-------------|
| `success` | boolean | Whether pipeline completed successfully |
| `response` | string | Filtered LLM response (if successful) |
| `redactions` | array | Output redactions applied |
| `inputThreats` | array | Threats detected in input |
| `edition` | string | Edition identifier ('community') |
| `notice` | string | Upgrade notice |
| `error` | string | Error message (if failed) |
| `inputResult` | object | Full input protection result (if failed) |

#### Example

```javascript
const result = await sentinel.pipeline(userInput, async (safeInput) => {
  // Your LLM call here
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: safeInput }]
  });
  return response.choices[0].message.content;
});

console.log(result);
// {
//   success: true,
//   response: "Filtered LLM response",
//   redactions: [],
//   inputThreats: [],
//   edition: 'community',
//   notice: 'Using Community Edition. Upgrade for advanced protection...'
// }
```

#### Error Handling

If the LLM callback throws an error:

```javascript
{
  success: false,
  error: 'LLM call failed: <error message>',
  inputResult: { /* protect() result */ }
}
```

### getStats()

Returns current usage statistics.

#### Signature

```javascript
getStats(): StatsObject
```

#### Returns

Object containing:

| Property | Type | Description |
|----------|------|-------------|
| `totalRequests` | number | Total protect() calls |
| `threatsDetected` | number | Total threats detected |
| `blocked` | number | Total blocked requests |
| `edition` | string | Edition identifier |
| `sanitizerStats` | object | Sanitizer statistics |
| `filterStats` | object | Filter statistics |

#### Example

```javascript
const stats = sentinel.getStats();

console.log(stats);
// {
//   totalRequests: 150,
//   threatsDetected: 5,
//   blocked: 0,
//   edition: 'community',
//   sanitizerStats: { processed: 150, sanitized: 45 },
//   filterStats: { filtered: 150, redacted: 12 }
// }
```

### getUpgradeInfo()

Returns detailed information about upgrade options.

#### Signature

```javascript
getUpgradeInfo(): UpgradeInfo
```

#### Returns

Object containing:

| Property | Type | Description |
|----------|------|-------------|
| `currentEdition` | string | Current edition name |
| `features` | object | Feature comparison by edition |
| `pricing` | object | Pricing information |
| `upgradeUrl` | string | URL to upgrade page |

#### Example

```javascript
const info = sentinel.getUpgradeInfo();

console.log(info);
// {
//   currentEdition: 'community',
//   features: {
//     included: [...],
//     professional: [...],
//     business: [...],
//     enterprise: [...]
//   },
//   pricing: {
//     professional: '$499/mo',
//     business: '$1,999/mo',
//     enterprise: 'Custom'
//   },
//   upgradeUrl: 'https://neura.help/sentinel/#pricing'
// }
```

## Response Objects

### ProtectResult

Returned by `protect()` method.

```typescript
interface ProtectResult {
  original: string;
  output: string;
  sanitized: boolean;
  changes: Change[];
  threats: Threat[];
  processingTime: number;
  edition: string;
  notice?: string;
  upgradeNotice?: string;
}

interface Change {
  type: string;
  count?: number;
  originalLength?: number;
}

interface Threat {
  type: string;
  severity: string;
  details: string;
  note?: string;
}
```

### FilterResult

Returned by `filterOutput()` method.

```typescript
interface FilterResult {
  original: string;
  output: string;
  filtered: boolean;
  redactions: Redaction[];
  processingTime: number;
  edition: string;
  upgradeNotice?: string;
}

interface Redaction {
  type: 'pii' | 'secret';
  name: string;
  count: number;
}
```

### PipelineResult

Returned by `pipeline()` method.

```typescript
interface PipelineResult {
  success: boolean;
  response?: string;
  redactions?: Redaction[];
  inputThreats?: Threat[];
  edition: string;
  notice?: string;
  error?: string;
  inputResult?: ProtectResult;
}
```

## Error Handling

SENTINEL methods are designed to fail gracefully.

### Input Validation

```javascript
// Empty or invalid input returns unmodified
const result = await sentinel.protect('');
// { original: '', output: '', sanitized: false, ... }

const result2 = await sentinel.protect(null);
// { original: null, output: null, sanitized: false, ... }
```

### LLM Callback Errors

```javascript
const result = await sentinel.pipeline(input, async () => {
  throw new Error('API rate limit exceeded');
});

// result:
// {
//   success: false,
//   error: 'LLM call failed: API rate limit exceeded',
//   inputResult: { /* sanitization result */ }
// }
```

### Best Practices

1. **Always check `success` in pipeline results:**
   ```javascript
   const result = await sentinel.pipeline(input, llmCallback);
   if (!result.success) {
     console.error('Pipeline failed:', result.error);
     // Handle error
   }
   ```

2. **Log detected threats:**
   ```javascript
   const result = await sentinel.protect(input);
   if (result.threats.length > 0) {
     console.warn('Threats detected:', result.threats);
   }
   ```

3. **Monitor statistics periodically:**
   ```javascript
   setInterval(() => {
     const stats = sentinel.getStats();
     console.log('SENTINEL stats:', stats);
   }, 60000); // Every minute
   ```

4. **Handle truncated inputs:**
   ```javascript
   const result = await sentinel.protect(longInput);
   const wasTruncated = result.changes.some(c => c.type === 'truncation');
   if (wasTruncated) {
     console.warn('Input was truncated');
   }
   ```

## Advanced Usage

### Custom LLM Integration

```javascript
// OpenAI
const result = await sentinel.pipeline(input, async (safe) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: safe }]
  });
  return completion.choices[0].message.content;
});

// Anthropic Claude
const result = await sentinel.pipeline(input, async (safe) => {
  const message = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    messages: [{ role: 'user', content: safe }]
  });
  return message.content[0].text;
});

// Local LLM (Ollama)
const result = await sentinel.pipeline(input, async (safe) => {
  const response = await ollama.generate({
    model: 'llama2',
    prompt: safe
  });
  return response.response;
});
```

### Streaming Responses

For streaming LLM responses, protect input first, then filter chunks:

```javascript
const inputResult = await sentinel.protect(userInput);

if (inputResult.threats.length > 0) {
  console.warn('Threats detected:', inputResult.threats);
}

const stream = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: inputResult.output }],
  stream: true
});

let fullResponse = '';
for await (const chunk of stream) {
  fullResponse += chunk.choices[0]?.delta?.content || '';
}

const filtered = await sentinel.filterOutput(fullResponse);
return filtered.output;
```

### Multiple Instances

You can create multiple Sentinel instances with different configurations:

```javascript
const strictSentinel = new Sentinel({
  maxInputLength: 5000,
  redactPII: true,
  logLevel: 'debug'
});

const lenientSentinel = new Sentinel({
  maxInputLength: 20000,
  redactPII: false,
  logLevel: 'warn'
});
```

## TypeScript Support

SENTINEL is written in JavaScript but can be used with TypeScript:

```typescript
import { Sentinel } from '@neura-help/sentinel-community';

const sentinel = new Sentinel({
  maxInputLength: 10000,
  redactPII: true
});

interface ProtectResult {
  original: string;
  output: string;
  sanitized: boolean;
  // ... other properties
}

const result: ProtectResult = await sentinel.protect(input);
```

For full TypeScript definitions, see the [TypeScript guide](../guides/typescript.md).
