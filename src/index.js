/**
 * SENTINEL V1.1 - Community Edition
 * 
 * Open Source - MIT License
 * https://neura.help/sentinel
 * 
 * Basic AI security hardening for LLM applications.
 * For advanced features, upgrade to Professional: https://neura.help/sentinel/#pricing
 */

import { InputSanitizerBasic } from './layers/sanitizer-basic.js';
import { OutputFilterBasic } from './layers/output-filter-basic.js';
import { SentinelConfig } from './utils/config.js';
import { ThreatLogger } from './utils/threat-logger.js';

/**
 * SENTINEL Community Edition
 * Provides basic input sanitization and output filtering
 */
class Sentinel {
    constructor(options = {}) {
        this.config = new SentinelConfig(options);
        this.logger = new ThreatLogger(this.config);
        
        // Community Edition layers
        this.sanitizer = new InputSanitizerBasic(this.config);
        this.outputFilter = new OutputFilterBasic(this.config);
        
        this.stats = {
            totalRequests: 0,
            threatsDetected: 0,
            blocked: 0
        };

        this._showWelcome();
    }

    _showWelcome() {
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          🛡️ SENTINEL V1.1 - Community Edition                 ║
║                                                               ║
║  Basic AI security hardening - FREE & Open Source             ║
║                                                               ║
║  Included:                                                    ║
║  ✅ Basic Input Sanitization (7 patterns)                     ║
║  ✅ Basic Output Filtering (4 PII patterns)                   ║
║                                                               ║
║  Upgrade for advanced protection:                             ║
║  🔒 200+ threat signatures                                    ║
║  🔒 Heuristic detection                                       ║
║  🔒 Meta-prompt wrapping                                      ║
║  🔒 Canary leak detection                                     ║
║                                                               ║
║  → https://neura.help/sentinel/#pricing                       ║
╚═══════════════════════════════════════════════════════════════╝
        `);
    }

    /**
     * Protect user input before sending to LLM
     * @param {string} input - Raw user input
     * @returns {Promise<object>} - Sanitization result
     */
    async protect(input) {
        this.stats.totalRequests++;
        const startTime = Date.now();

        const result = await this.sanitizer.process(input);
        
        if (result.threats.length > 0) {
            this.stats.threatsDetected += result.threats.length;
            await this.logger.logThreats(result);
        }

        result.processingTime = Date.now() - startTime;
        result.edition = 'community';
        
        // Add upgrade notice for detected threats
        if (result.threats.length > 0) {
            result.notice = 'Threats detected. Professional Edition provides 200+ signatures for better protection.';
        }

        return result;
    }

    /**
     * Filter LLM output before returning to user
     * @param {string} output - Raw LLM response
     * @returns {Promise<object>} - Filtering result
     */
    async filterOutput(output) {
        const startTime = Date.now();

        const result = await this.outputFilter.filter(output);
        
        result.processingTime = Date.now() - startTime;
        result.edition = 'community';

        return result;
    }

    /**
     * Full pipeline: protect → LLM → filter
     * @param {string} input - User input
     * @param {function} llmCallback - Async function that calls your LLM
     * @returns {Promise<object>} - Pipeline result
     */
    async pipeline(input, llmCallback) {
        // Protect input
        const inputResult = await this.protect(input);
        
        if (inputResult.threats.length > 0) {
            console.warn('[SENTINEL] Threats detected in input:', inputResult.threats);
        }

        // Call LLM with sanitized input
        let llmResponse;
        try {
            llmResponse = await llmCallback(inputResult.output);
        } catch (error) {
            return {
                success: false,
                error: 'LLM call failed: ' + error.message,
                inputResult
            };
        }

        // Filter output
        const outputResult = await this.filterOutput(llmResponse);

        return {
            success: true,
            response: outputResult.output,
            redactions: outputResult.redactions,
            inputThreats: inputResult.threats,
            edition: 'community',
            notice: 'Using Community Edition. Upgrade for advanced protection: https://neura.help/sentinel/#pricing'
        };
    }

    /**
     * Get current statistics
     */
    getStats() {
        return {
            ...this.stats,
            edition: 'community',
            sanitizerStats: this.sanitizer.getStats(),
            filterStats: this.outputFilter.getStats()
        };
    }

    /**
     * Show upgrade information
     */
    getUpgradeInfo() {
        return {
            currentEdition: 'community',
            features: {
                included: [
                    'Basic input sanitization (7 patterns)',
                    'Basic output filtering (4 PII patterns)',
                    'Control character removal',
                    'Zero-width character removal',
                    'Script/code block removal'
                ],
                professional: [
                    '200+ threat signatures',
                    'Advanced heuristic detection',
                    'Behavioral analysis',
                    'Homoglyph attack detection',
                    'Meta-prompt security wrapping',
                    '15+ PII patterns',
                    '10+ secret patterns',
                    'Email support'
                ],
                business: [
                    'Everything in Professional',
                    'Full canary adjudicator',
                    '500+ threat signatures',
                    'Real-time threat intelligence',
                    'Priority support'
                ],
                enterprise: [
                    'Everything in Business',
                    'Unlimited custom signatures',
                    'SIEM integration',
                    'On-premise deployment',
                    '24/7 support',
                    'SLA guarantees'
                ]
            },
            pricing: {
                professional: '$499/mo',
                business: '$1,999/mo',
                enterprise: 'Custom'
            },
            upgradeUrl: 'https://neura.help/sentinel/#pricing'
        };
    }
}

// Named exports
export { Sentinel, InputSanitizerBasic, OutputFilterBasic, SentinelConfig, ThreatLogger };

// Default export
export default Sentinel;
