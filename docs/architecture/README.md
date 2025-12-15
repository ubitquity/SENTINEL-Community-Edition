# SENTINEL Architecture

Understanding the internal architecture of SENTINEL Community Edition.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [Security Design](#security-design)
- [Performance Considerations](#performance-considerations)

## Overview

SENTINEL is designed as a lightweight, modular security layer for LLM applications. The architecture follows these principles:

1. **Layered Defense** - Multiple protection layers (sanitization, filtering)
2. **Fail-Safe** - Graceful degradation on errors
3. **Zero Dependencies** - Minimal external dependencies
4. **Stateless** - No persistent state required
5. **Extensible** - Easy to extend for paid editions

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Application                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    SENTINEL Main Class                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  protect() │ filterOutput() │ pipeline() │ getStats()│  │
│  └──────────────────────────────────────────────────────┘  │
└────┬────────────────────────────────┬──────────────────┬────┘
     │                                │                  │
     ▼                                ▼                  ▼
┌─────────────┐             ┌──────────────────┐   ┌─────────┐
│ Input       │             │ Output           │   │ Config  │
│ Sanitizer   │             │ Filter           │   │ Manager │
│ (Basic)     │             │ (Basic)          │   │         │
└─────┬───────┘             └────────┬─────────┘   └────┬────┘
      │                              │                   │
      ▼                              ▼                   ▼
┌─────────────┐             ┌──────────────────┐   ┌─────────┐
│ Pattern     │             │ PII Patterns     │   │ Logger  │
│ Matching    │             │ Secret Patterns  │   │         │
└─────────────┘             └──────────────────┘   └─────────┘
```

## Core Components

### 1. Sentinel Main Class

**Location**: `src/index.js`

The main orchestrator that coordinates all operations.

**Responsibilities:**
- Initialize sub-components
- Provide public API
- Track statistics
- Handle errors gracefully

**Key Methods:**
```javascript
class Sentinel {
  constructor(options)      // Initialize with config
  protect(input)            // Sanitize user input
  filterOutput(output)      // Filter LLM output
  pipeline(input, callback) // Full protection pipeline
  getStats()                // Return statistics
  getUpgradeInfo()          // Return upgrade information
}
```

### 2. Input Sanitizer

**Location**: `src/layers/sanitizer-basic.js`

Sanitizes user input before it reaches the LLM.

**Responsibilities:**
- Pattern matching and removal
- Threat detection
- Input normalization
- Length validation

**Processing Steps:**
```
Input
  ↓
1. Apply dangerous pattern removal
   - Code blocks
   - Script tags
   - System markers
   - Control characters
  ↓
2. Check injection indicators
   - Prompt injection patterns
   - Jailbreak attempts
  ↓
3. Validate length
   - Truncate if exceeds max
  ↓
4. Normalize whitespace
  ↓
Output
```

**Pattern Categories:**

| Category | Action | Examples |
|----------|--------|----------|
| Code injection | Remove | Code blocks, script tags |
| System markers | Escape | [SYSTEM], [INST] |
| Control chars | Remove | \x00-\x1F |
| Zero-width | Remove | \u200B-\u200D |
| URL injection | Remove | javascript: |

### 3. Output Filter

**Location**: `src/layers/output-filter-basic.js`

Filters LLM output to redact sensitive information.

**Responsibilities:**
- PII detection and redaction
- Secret pattern redaction
- Maintain readability

**Processing Steps:**
```
Output
  ↓
1. Detect PII patterns
   - SSN
   - Credit cards
   - Email addresses
   - Phone numbers
  ↓
2. Apply redactions
   - Format-preserving redaction
   - Maintain context
  ↓
3. Detect secrets
   - Passwords
   - API keys (limited)
  ↓
Filtered Output
```

**Redaction Strategies:**

| Type | Strategy | Example |
|------|----------|---------|
| SSN | Full mask | 123-45-6789 → XXX-XX-XXXX |
| Credit Card | Last 4 digits | 4532-1234-5678-9010 → **** **** **** 9010 |
| Email | Partial mask | john@example.com → j***@example.com |
| Phone | Full mask | (555) 123-4567 → (XXX) XXX-XXXX |

### 4. Configuration Manager

**Location**: `src/utils/config.js`

Manages configuration options.

**Responsibilities:**
- Store configuration
- Provide defaults
- Validate options

### 5. Threat Logger

**Location**: `src/utils/threat-logger.js`

Logs detected threats for monitoring.

**Responsibilities:**
- Log threats with context
- Support different log levels
- Format log output

## Data Flow

### protect() Flow

```
┌──────────┐
│  Input   │ "Hello <script>alert('xss')</script>"
└────┬─────┘
     │
     ▼
┌─────────────────┐
│ InputSanitizer  │
│  .process()     │
└────┬────────────┘
     │
     ├─► Pattern Matching
     │     ├─ Remove script tags
     │     ├─ Remove code blocks
     │     ├─ Escape markers
     │     └─ Remove control chars
     │
     ├─► Threat Detection
     │     ├─ Check injection patterns
     │     └─ Flag suspicious content
     │
     ├─► Validation
     │     └─ Check length
     │
     └─► Normalization
           └─ Clean whitespace
                 │
                 ▼
           ┌──────────┐
           │  Result  │ { output: "Hello ", sanitized: true, ... }
           └──────────┘
```

### filterOutput() Flow

```
┌──────────┐
│  Output  │ "Your SSN is 123-45-6789"
└────┬─────┘
     │
     ▼
┌─────────────────┐
│ OutputFilter    │
│   .filter()     │
└────┬────────────┘
     │
     ├─► PII Detection
     │     ├─ Scan for SSN
     │     ├─ Scan for credit cards
     │     ├─ Scan for emails
     │     └─ Scan for phones
     │
     ├─► Secret Detection
     │     └─ Scan for passwords
     │
     └─► Apply Redactions
           └─ Replace with masks
                 │
                 ▼
           ┌──────────┐
           │  Result  │ { output: "Your SSN is XXX-XX-XXXX", ... }
           └──────────┘
```

### pipeline() Flow

```
┌──────────┐
│  Input   │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│  protect()      │ Sanitize input
└────┬────────────┘
     │
     ├─ Log threats
     │
     ▼
┌─────────────────┐
│ LLM Callback    │ Call user's LLM
└────┬────────────┘
     │
     ├─ Handle errors
     │
     ▼
┌─────────────────┐
│ filterOutput()  │ Filter response
└────┬────────────┘
     │
     ▼
┌──────────┐
│  Result  │ { success: true, response: "...", ... }
└──────────┘
```

## Security Design

### Defense in Depth

SENTINEL implements multiple security layers:

1. **Input Layer** - Sanitizes before LLM sees it
2. **Detection Layer** - Identifies threats
3. **Output Layer** - Redacts sensitive data
4. **Monitoring Layer** - Logs for analysis

### Threat Model

**Protected Against (Community Edition):**
- Basic XSS attempts
- Simple code injection
- Common prompt injection patterns
- PII leakage (4 patterns)
- Control character attacks

**Not Protected Against (Requires Upgrade):**
- Advanced prompt injection
- Sophisticated jailbreaks
- Homoglyph attacks
- Unicode exploits
- Canary token leaks
- Advanced PII patterns

### Pattern Matching Strategy

```javascript
// Regular expression-based matching
const patterns = [
  {
    pattern: /<script[\s\S]*?<\/script>/gi,
    name: 'script_tag',
    action: 'remove'
  }
];

// Fast, deterministic matching
for (const p of patterns) {
  if (p.pattern.test(input)) {
    input = input.replace(p.pattern, '');
  }
}
```

## Performance Considerations

### Time Complexity

| Operation | Complexity | Notes |
|-----------|------------|-------|
| protect() | O(n*p) | n = input length, p = pattern count |
| filterOutput() | O(n*p) | n = output length, p = pattern count |
| pipeline() | O(n*p + LLM) | Includes LLM latency |

### Memory Usage

- **Sentinel instance**: ~1-2 KB
- **Per request**: ~O(n) where n = input/output length
- **No persistent state** between requests

### Optimization Techniques

1. **Early Return** - Skip processing for empty/invalid input
2. **Lazy Evaluation** - Only process what's needed
3. **Compiled Regex** - Pre-compile patterns at initialization
4. **Single Pass** - Apply all patterns in one iteration

### Benchmarks

Typical performance on modern hardware:

```
Input Protection:
  Small (100 chars):  < 1ms
  Medium (1K chars):  1-2ms
  Large (10K chars):  5-10ms

Output Filtering:
  Small (100 chars):  < 1ms
  Medium (1K chars):  1-2ms
  Large (10K chars):  5-10ms

Full Pipeline:
  Depends on LLM latency + 2-4ms overhead
```

## Extensibility

### Community vs Professional Architecture

```
Community Edition:
  - Basic patterns (7 input, 5 output)
  - Regex matching only
  - No ML/heuristics
  - Stateless

Professional Edition:
  + 200+ threat signatures
  + Heuristic detection engine
  + Behavioral analysis
  + Meta-prompt wrapping
  + Advanced PII detection
  + Contextual analysis
```

### Extension Points

1. **Custom Patterns** - Add to pattern arrays (Enterprise only)
2. **Custom Actions** - Define new action types
3. **Middleware** - Wrap protect/filter methods
4. **Logging** - Custom threat logger implementations

## Error Handling

### Fail-Safe Philosophy

```javascript
// Always return a valid result
async protect(input) {
  try {
    // Processing
  } catch (error) {
    console.error('SENTINEL error:', error);
    // Return original input on error
    return {
      original: input,
      output: input,
      sanitized: false,
      error: error.message
    };
  }
}
```

### Error Types

1. **Configuration Errors** - Invalid options
2. **Processing Errors** - Regex failures, etc.
3. **LLM Errors** - Callback failures (pipeline only)

## Monitoring and Observability

### Built-in Metrics

```javascript
{
  totalRequests: 150,
  threatsDetected: 5,
  blocked: 0,
  sanitizerStats: {
    processed: 150,
    sanitized: 45
  },
  filterStats: {
    filtered: 150,
    redacted: 12
  }
}
```

### Integration with External Monitoring

```javascript
// Custom logger integration
class CustomLogger extends ThreatLogger {
  async logThreats(result) {
    // Send to your monitoring service
    await yourMonitoring.track('sentinel.threat', {
      threats: result.threats,
      timestamp: Date.now()
    });
  }
}
```

## Future Architecture (Paid Editions)

The architecture is designed to support advanced features:

```
Professional/Enterprise Architecture:
  ┌────────────────────┐
  │ Heuristic Engine   │ ML-based detection
  ├────────────────────┤
  │ Behavioral Analysis│ Pattern learning
  ├────────────────────┤
  │ Canary Adjudicator │ Leak detection
  ├────────────────────┤
  │ Threat Intel Feed  │ Real-time updates
  ├────────────────────┤
  │ Custom Signatures  │ User-defined rules
  └────────────────────┘
```

## References

- [API Documentation](../api/README.md)
- [Integration Guides](../guides/)
- [Examples](../examples/)
