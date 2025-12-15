/**
 * SENTINEL V1.1 - Configuration Manager
 * 
 * Centralized configuration management for all security layers.
 */

class SentinelConfig {
    constructor(options = {}) {
        this.startTime = Date.now();
        
        // Default configuration
        this.defaults = {
            // General settings
            apiKey: null,
            environment: 'production',
            debug: false,
            
            // Input sanitization
            maxInputLength: 10000,
            enableCanaryTokens: true,
            normalizeUnicode: true,
            stripCodeBlocks: true,
            
            // Heuristic detection
            heuristicWarnThreshold: 30,
            heuristicBlockThreshold: 70,
            enableBehavioralAnalysis: true,
            
            // Meta-prompt wrapping
            securityLevel: 'standard', // 'minimal', 'standard', 'strict'
            includeTimestamp: true,
            includeSessionId: true,
            
            // Canary adjudicator
            enableCanaryChecks: true,
            enablePolicyChecks: true,
            enableManipulationDetection: true,
            
            // Output filtering
            redactPII: true,
            redactSecrets: true,
            blockHarmfulContent: true,
            
            // Logging
            enableLogging: true,
            logLevel: 'info', // 'debug', 'info', 'warn', 'error'
            logDestination: 'console', // 'console', 'file', 'remote'
            logFilePath: './sentinel.log',
            remoteLogEndpoint: null,
            
            // Rate limiting
            enableRateLimit: false,
            rateLimit: 100, // requests per minute
            
            // Callbacks
            onThreatDetected: null,
            onBlocked: null,
            onError: null
        };

        // Merge with provided options
        this.config = { ...this.defaults, ...options };
        
        // Validate configuration
        this._validate();
    }

    /**
     * Get a configuration value
     * @param {string} key - Configuration key
     * @param {*} defaultValue - Default if not set
     * @returns {*} Configuration value
     */
    get(key, defaultValue = undefined) {
        if (key in this.config) {
            return this.config[key];
        }
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        if (key in this.defaults) {
            return this.defaults[key];
        }
        return undefined;
    }

    /**
     * Set a configuration value
     * @param {string} key - Configuration key
     * @param {*} value - Value to set
     */
    set(key, value) {
        this.config[key] = value;
        this._validate();
    }

    /**
     * Update multiple configuration values
     * @param {object} updates - Key-value pairs to update
     */
    update(updates) {
        this.config = { ...this.config, ...updates };
        this._validate();
    }

    /**
     * Get all configuration
     * @returns {object} Full configuration object
     */
    getAll() {
        return { ...this.config };
    }

    /**
     * Reset to defaults
     */
    reset() {
        this.config = { ...this.defaults };
    }

    /**
     * Create a preset configuration
     * @param {string} preset - Preset name
     * @returns {SentinelConfig} New config instance
     */
    static preset(preset) {
        const presets = {
            minimal: {
                securityLevel: 'minimal',
                heuristicBlockThreshold: 90,
                redactPII: false,
                enableBehavioralAnalysis: false,
                enableManipulationDetection: false
            },
            standard: {
                securityLevel: 'standard',
                heuristicBlockThreshold: 70,
                redactPII: true,
                redactSecrets: true
            },
            strict: {
                securityLevel: 'strict',
                heuristicBlockThreshold: 50,
                heuristicWarnThreshold: 20,
                redactPII: true,
                redactSecrets: true,
                blockHarmfulContent: true,
                enableBehavioralAnalysis: true,
                enableManipulationDetection: true,
                maxInputLength: 5000
            },
            paranoid: {
                securityLevel: 'strict',
                heuristicBlockThreshold: 30,
                heuristicWarnThreshold: 10,
                redactPII: true,
                redactSecrets: true,
                blockHarmfulContent: true,
                enableBehavioralAnalysis: true,
                enableManipulationDetection: true,
                maxInputLength: 2000,
                enableRateLimit: true,
                rateLimit: 30
            }
        };

        if (!presets[preset]) {
            throw new Error(`Unknown preset: ${preset}. Available: ${Object.keys(presets).join(', ')}`);
        }

        return new SentinelConfig(presets[preset]);
    }

    /**
     * Validate configuration
     */
    _validate() {
        const errors = [];

        // Validate thresholds
        if (this.config.heuristicWarnThreshold >= this.config.heuristicBlockThreshold) {
            errors.push('heuristicWarnThreshold must be less than heuristicBlockThreshold');
        }

        if (this.config.heuristicBlockThreshold < 0 || this.config.heuristicBlockThreshold > 200) {
            errors.push('heuristicBlockThreshold must be between 0 and 200');
        }

        // Validate security level
        const validLevels = ['minimal', 'standard', 'strict'];
        if (!validLevels.includes(this.config.securityLevel)) {
            errors.push(`securityLevel must be one of: ${validLevels.join(', ')}`);
        }

        // Validate log level
        const validLogLevels = ['debug', 'info', 'warn', 'error'];
        if (!validLogLevels.includes(this.config.logLevel)) {
            errors.push(`logLevel must be one of: ${validLogLevels.join(', ')}`);
        }

        // Validate max input length
        if (this.config.maxInputLength < 100 || this.config.maxInputLength > 100000) {
            errors.push('maxInputLength must be between 100 and 100000');
        }

        if (errors.length > 0) {
            console.warn('SENTINEL Config Validation Warnings:', errors);
        }
    }

    /**
     * Export configuration as JSON
     */
    toJSON() {
        // Exclude sensitive data and callbacks
        const safeConfig = { ...this.config };
        delete safeConfig.apiKey;
        delete safeConfig.onThreatDetected;
        delete safeConfig.onBlocked;
        delete safeConfig.onError;
        return JSON.stringify(safeConfig, null, 2);
    }

    /**
     * Import configuration from JSON
     */
    fromJSON(json) {
        try {
            const parsed = typeof json === 'string' ? JSON.parse(json) : json;
            this.update(parsed);
        } catch (error) {
            throw new Error('Invalid configuration JSON: ' + error.message);
        }
    }
}

export { SentinelConfig };
export default SentinelConfig;
