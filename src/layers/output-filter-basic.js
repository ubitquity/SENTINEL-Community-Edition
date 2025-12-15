/**
 * SENTINEL V1.1 - Basic Output Filter (Community Edition)
 * 
 * Open Source - MIT License
 * See LICENSE.mit for terms.
 * 
 * Basic output filtering with limited PII detection.
 * Upgrade to Professional for advanced redaction and canary detection.
 */

class OutputFilterBasic {
    constructor(config) {
        this.config = config;
        this.stats = {
            filtered: 0,
            redacted: 0
        };

        // Basic PII patterns (limited set - 5 patterns)
        // Professional version has 20+ patterns with smart redaction
        this.piiPatterns = {
            ssn: {
                pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
                redact: () => 'XXX-XX-XXXX',
                name: 'SSN'
            },
            creditCard: {
                pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
                redact: (m) => '**** **** **** ' + m.slice(-4),
                name: 'Credit Card'
            },
            email: {
                pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
                redact: (m) => m.split('@')[0][0] + '***@' + m.split('@')[1],
                name: 'Email'
            },
            phone: {
                pattern: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
                redact: () => '(XXX) XXX-XXXX',
                name: 'Phone'
            }
        };

        // Basic secret patterns (limited)
        // Professional version includes API key variants, AWS, JWT, etc.
        this.secretPatterns = {
            password: {
                pattern: /(?:password|passwd|pwd)[:\s=]+['"]?([^\s'"]{4,})['"]?/gi,
                redact: () => 'password: [REDACTED]',
                name: 'Password'
            }
        };
    }

    /**
     * Filter LLM output
     */
    async filter(output, context = {}) {
        this.stats.filtered++;
        
        const result = {
            original: output,
            output: output,
            filtered: false,
            redactions: [],
            threats: [],
            edition: 'community'
        };

        if (!output || typeof output !== 'string') {
            return result;
        }

        let filtered = output;

        // Redact PII (if enabled)
        const redactPII = this.config?.get?.('redactPII', true) ?? true;
        if (redactPII) {
            for (const [key, config] of Object.entries(this.piiPatterns)) {
                const matches = filtered.match(config.pattern);
                if (matches) {
                    filtered = filtered.replace(config.pattern, config.redact);
                    result.redactions.push({
                        type: 'pii',
                        name: config.name,
                        count: matches.length
                    });
                    result.filtered = true;
                }
            }
        }

        // Redact secrets (if enabled)
        const redactSecrets = this.config?.get?.('redactSecrets', true) ?? true;
        if (redactSecrets) {
            for (const [key, config] of Object.entries(this.secretPatterns)) {
                const matches = filtered.match(config.pattern);
                if (matches) {
                    filtered = filtered.replace(config.pattern, config.redact);
                    result.redactions.push({
                        type: 'secret',
                        name: config.name,
                        count: matches.length
                    });
                    result.filtered = true;
                }
            }
        }

        if (result.filtered) {
            this.stats.redacted++;
        }

        result.output = filtered;

        // Add upgrade notice
        if (result.redactions.length > 0) {
            result.upgradeNotice = 'Professional Edition includes advanced PII detection, API key redaction, and canary token leak detection.';
        }

        return result;
    }

    getStats() {
        return { ...this.stats };
    }

    updateConfig(config) {
        this.config = config;
    }
}

export { OutputFilterBasic };
export default OutputFilterBasic;
