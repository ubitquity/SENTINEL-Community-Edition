# Contributing to SENTINEL Community Edition

Thank you for your interest in contributing to SENTINEL! This document provides guidelines for contributing to the Community Edition.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to:
- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/SENTINEL-Community-Edition.git
   cd SENTINEL-Community-Edition
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ubitquity/SENTINEL-Community-Edition.git
   ```

4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- Node.js >= 16.0.0
- npm >= 7.0.0

### Installation

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run linter
npm run lint
```

### Project Structure

```
SENTINEL-Community-Edition/
├── src/
│   ├── index.js                    # Main entry point
│   ├── layers/
│   │   ├── sanitizer-basic.js      # Input sanitization layer
│   │   └── output-filter-basic.js  # Output filtering layer
│   └── utils/
│       ├── config.js                # Configuration management
│       └── threat-logger.js         # Threat logging utility
├── docs/                            # Documentation
├── tests/                           # Test files
├── package.json
└── README.md
```

## Contributing Guidelines

### What Can You Contribute?

✅ **Accepted Contributions:**
- Bug fixes
- Documentation improvements
- Test coverage improvements
- Performance optimizations
- Code refactoring
- Examples and tutorials
- Issue triage and discussion

❌ **Not Accepted:**
- New threat signatures (reserved for Professional/Enterprise editions)
- Advanced detection algorithms (reserved for paid editions)
- Features that overlap with paid editions

### Reporting Issues

Before creating an issue:
1. Search existing issues to avoid duplicates
2. Use the issue template
3. Provide clear reproduction steps
4. Include environment details (Node version, OS, etc.)

**Good Issue Example:**
```markdown
## Description
SENTINEL throws an error when processing empty strings

## Steps to Reproduce
1. Initialize SENTINEL: `const sentinel = new Sentinel()`
2. Call protect with empty string: `sentinel.protect('')`
3. Error occurs

## Expected Behavior
Should return a result object with empty output

## Actual Behavior
Throws TypeError: Cannot read property 'length' of undefined

## Environment
- Node.js: v18.0.0
- SENTINEL: v1.1.0
- OS: Ubuntu 22.04
```

### Suggesting Features

For feature requests:
1. Check if it belongs in Community Edition or paid editions
2. Provide clear use cases
3. Explain why it's valuable for the community
4. Consider implementation complexity

## Pull Request Process

### Before Submitting

1. **Test your changes**:
   ```bash
   npm test
   npm run lint
   ```

2. **Update documentation** if needed

3. **Add tests** for new functionality

4. **Follow coding standards** (see below)

### Submitting a PR

1. **Update your fork**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request** on GitHub

4. **Fill out the PR template** completely

5. **Wait for review** - maintainers will review and provide feedback

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring
- [ ] Test improvement

## Testing
- [ ] All tests pass
- [ ] Added new tests for changes
- [ ] Manually tested

## Checklist
- [ ] Code follows project style
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Commits are clear and atomic
```

## Coding Standards

### JavaScript Style

We use ESLint with Standard config. Key points:

```javascript
// ✅ Good
class InputSanitizer {
  constructor(config) {
    this.config = config;
  }

  async process(input) {
    if (!input) {
      return { output: input, sanitized: false };
    }

    const result = this.sanitize(input);
    return result;
  }
}

// ❌ Bad
class inputSanitizer {
  constructor(config){
    this.config=config
  }

  async process(input){
    if(!input) return {output:input,sanitized:false}
    const result=this.sanitize(input)
    return result
  }
}
```

### Naming Conventions

- **Classes**: PascalCase (`InputSanitizer`)
- **Functions/methods**: camelCase (`processInput`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_INPUT_LENGTH`)
- **Private methods**: prefix with underscore (`_internalMethod`)
- **Files**: kebab-case (`sanitizer-basic.js`)

### Code Comments

```javascript
// ✅ Good - explains WHY, not WHAT
// Remove zero-width characters to prevent steganography attacks
sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF]/g, '');

// ❌ Bad - obvious what it does
// Replace zero-width characters with empty string
sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF]/g, '');
```

### Function Documentation

```javascript
/**
 * Process and sanitize user input
 * @param {string} input - Raw user input
 * @returns {Promise<object>} - Sanitization result with threats array
 */
async process(input) {
  // Implementation
}
```

## Testing

### Writing Tests

We use Jest for testing. Tests should be:
- **Isolated** - Each test is independent
- **Clear** - Test names describe what they test
- **Complete** - Cover happy path and edge cases

```javascript
describe('InputSanitizer', () => {
  let sanitizer;

  beforeEach(() => {
    sanitizer = new InputSanitizerBasic({});
  });

  test('should remove script tags', async () => {
    const input = 'Hello <script>alert("xss")</script>';
    const result = await sanitizer.process(input);

    expect(result.output).toBe('Hello ');
    expect(result.sanitized).toBe(true);
    expect(result.changes).toContainEqual({
      type: 'script_tag',
      count: 1
    });
  });

  test('should handle empty input', async () => {
    const result = await sanitizer.process('');

    expect(result.output).toBe('');
    expect(result.sanitized).toBe(false);
  });

  test('should handle null input', async () => {
    const result = await sanitizer.process(null);

    expect(result.output).toBe(null);
    expect(result.sanitized).toBe(false);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- sanitizer-basic.test.js

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Test Coverage

Aim for:
- **Statement coverage**: > 80%
- **Branch coverage**: > 75%
- **Function coverage**: > 80%
- **Line coverage**: > 80%

## Documentation

### Documentation Guidelines

1. **Keep it simple** - Use clear, concise language
2. **Include examples** - Show, don't just tell
3. **Update as you code** - Documentation changes with code changes
4. **Check formatting** - Use proper markdown

### Documentation Structure

- **API docs**: Technical reference for methods/classes
- **Guides**: Step-by-step tutorials
- **Examples**: Working code samples
- **README**: Quick start and overview

### Example Documentation

````markdown
## protect()

Sanitizes user input before sending to an LLM.

### Parameters

- `input` (string): Raw user input

### Returns

Promise resolving to sanitization result object.

### Example

```javascript
const result = await sentinel.protect("Hello <script>alert('xss')</script>");
console.log(result.output); // "Hello "
```
````

## Release Process

Releases are managed by maintainers. The process:

1. Version bump in `package.json`
2. Update CHANGELOG.md
3. Create git tag
4. Publish to npm
5. Create GitHub release

## Questions?

- **Issues**: [GitHub Issues](https://github.com/ubitquity/SENTINEL-Community-Edition/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ubitquity/SENTINEL-Community-Edition/discussions)
- **Security**: See SECURITY.md for reporting vulnerabilities

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to SENTINEL! 🛡️
