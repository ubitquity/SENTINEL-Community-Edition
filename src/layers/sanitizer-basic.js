/**
 * SENTINEL V1.1 - Basic Input Sanitizer (Community Edition)
 * 
 * Open Source - MIT License
 * See LICENSE.mit for terms.
 * 
 * Basic input sanitization with limited threat signatures.
 * Upgrade to Professional for advanced detection.
 */

class InputSanitizerBasic {
    constructor(config) {
        this.config = config;
        this.stats = {
            processed: 0,
            sanitized: 0
        };

        // Basic dangerous patterns (limited set - 15 patterns)
        this.dangerousPatterns = [
            // Code injection
            { pattern: /```[\s\S]*?```/g, name: 'code_block', action: 'remove' },
            { pattern: /<script[\s\S]*?<\/script>/gi, name: 'script_tag', action: 'remove' },
            
            // Common system markers
            { pattern: /\[SYSTEM\]/gi, name: 'system_marker', action: 'escape' },
            { pattern: /\[INST\]/gi, name: 'inst_marker', action: 'escape' },
            
            // Control characters
            { pattern: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, name: 'control_chars', action: 'remove' },
            
            // Zero-width characters
            { pattern: /[\u200B-\u200D\uFEFF]/g, name: 'zero_width', action: 'remove' },
            
            // Basic URL injections
            { pattern: /javascript:/gi, name: 'js_protocol', action: 'remove' }
        ];

        // Basic injection indicators (limited - 5 patterns)
        // Professional version has 50+ patterns
        this.injectionIndicators = [
            /ignore\s+(all\s+)?previous\s+instructions?/i,
            /reveal\s+(your\s+)?system\s+prompt/i,
            /jailbreak/i,
            /\bDAN\b/i,
            /bypass\s+safety/i
        ];
    }

    /**
     * Process and sanitize user input
     */
    async process(input) {
        this.stats.processed++;
        
        const result = {
            original: input,
            output: input,
            sanitized: false,
            changes: [],
            threats: [],
            edition: 'community'
        };

        if (!input || typeof input !== 'string') {
            return result;
        }

        let sanitized = input;

        // Apply basic patterns
        for (const pattern of this.dangerousPatterns) {
            const matches = sanitized.match(pattern.pattern);
            if (matches) {
                if (pattern.action === 'remove') {
                    sanitized = sanitized.replace(pattern.pattern, '');
                } else if (pattern.action === 'escape') {
                    sanitized = sanitized.replace(pattern.pattern, m => `[ESCAPED:${m}]`);
                }
                result.changes.push({ type: pattern.name, count: matches.length });
                result.sanitized = true;
            }
        }

        // Check basic injection indicators
        for (const indicator of this.injectionIndicators) {
            if (indicator.test(sanitized)) {
                result.threats.push({
                    type: 'injection_attempt',
                    severity: 'high',
                    details: 'Basic injection pattern detected',
                    note: 'Upgrade to Professional for advanced detection'
                });
            }
        }

        // Basic length check
        const maxLength = this.config?.get?.('maxInputLength', 10000) || 10000;
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
            result.changes.push({ type: 'truncation', originalLength: input.length });
            result.sanitized = true;
        }

        // Normalize whitespace
        sanitized = sanitized
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/ {3,}/g, '  ')
            .trim();

        if (result.sanitized) {
            this.stats.sanitized++;
        }

        result.output = sanitized;
        
        // Add upgrade notice if threats detected
        if (result.threats.length > 0) {
            result.upgradeNotice = 'Professional Edition includes 200+ threat signatures and advanced behavioral analysis.';
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

export { InputSanitizerBasic };
export default InputSanitizerBasic;
