/**
 * SENTINEL V1.1 - Threat Logger
 * 
 * Centralized logging for security events, threats, and audit trail.
 */

class ThreatLogger {
    constructor(config) {
        this.config = config;
        this.logBuffer = [];
        this.bufferSize = 100;
        
        // Log levels
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };

        // Threat severity colors (for console)
        this.severityColors = {
            low: '\x1b[34m',      // Blue
            medium: '\x1b[33m',   // Yellow
            high: '\x1b[35m',     // Magenta
            critical: '\x1b[31m'  // Red
        };
        this.resetColor = '\x1b[0m';
    }

    /**
     * Log threats from analysis result
     * @param {object} result - Analysis result containing threats
     */
    async logThreats(result) {
        if (!this.config.get('enableLogging', true)) return;

        for (const threat of result.threats || []) {
            await this._log('warn', 'THREAT', {
                type: threat.type,
                severity: threat.severity,
                details: threat.details,
                sessionId: result.sessionId,
                timestamp: new Date().toISOString()
            });
        }

        // Call callback if configured
        const callback = this.config.get('onThreatDetected');
        if (callback && typeof callback === 'function') {
            try {
                await callback(result);
            } catch (e) {
                this._log('error', 'CALLBACK_ERROR', { error: e.message });
            }
        }
    }

    /**
     * Log blocked request
     * @param {object} result - Result with block information
     */
    async logBlocked(result) {
        if (!this.config.get('enableLogging', true)) return;

        await this._log('error', 'BLOCKED', {
            reason: result.blockReason,
            threats: result.threats?.length || 0,
            sessionId: result.sessionId,
            timestamp: new Date().toISOString()
        });

        // Call callback if configured
        const callback = this.config.get('onBlocked');
        if (callback && typeof callback === 'function') {
            try {
                await callback(result);
            } catch (e) {
                this._log('error', 'CALLBACK_ERROR', { error: e.message });
            }
        }
    }

    /**
     * Log error
     * @param {Error} error - Error object
     * @param {object} context - Additional context
     */
    async logError(error, context = {}) {
        if (!this.config.get('enableLogging', true)) return;

        await this._log('error', 'ERROR', {
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString()
        });

        // Call callback if configured
        const callback = this.config.get('onError');
        if (callback && typeof callback === 'function') {
            try {
                await callback(error, context);
            } catch (e) {
                console.error('Error callback failed:', e);
            }
        }
    }

    /**
     * Log security event
     * @param {string} event - Event type
     * @param {object} data - Event data
     */
    async logEvent(event, data = {}) {
        if (!this.config.get('enableLogging', true)) return;

        await this._log('info', event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Log audit entry (for compliance)
     * @param {string} action - Action performed
     * @param {object} details - Action details
     */
    async audit(action, details = {}) {
        const auditEntry = {
            action: action,
            ...details,
            timestamp: new Date().toISOString(),
            environment: this.config.get('environment', 'unknown')
        };

        await this._log('info', 'AUDIT', auditEntry);
        
        // Always keep audit in buffer regardless of log level
        this._addToBuffer({
            level: 'audit',
            category: 'AUDIT',
            data: auditEntry
        });
    }

    /**
     * Debug log
     */
    async debug(message, data = {}) {
        if (this.config.get('debug', false)) {
            await this._log('debug', 'DEBUG', { message, ...data });
        }
    }

    /**
     * Info log
     */
    async info(message, data = {}) {
        await this._log('info', 'INFO', { message, ...data });
    }

    /**
     * Warning log
     */
    async warn(message, data = {}) {
        await this._log('warn', 'WARN', { message, ...data });
    }

    /**
     * Error log
     */
    async error(message, data = {}) {
        await this._log('error', 'ERROR', { message, ...data });
    }

    /**
     * Internal log method
     */
    async _log(level, category, data) {
        const configLevel = this.config.get('logLevel', 'info');
        
        // Check if this level should be logged
        if (this.levels[level] < this.levels[configLevel]) {
            return;
        }

        const logEntry = {
            level,
            category,
            data,
            timestamp: new Date().toISOString()
        };

        const destination = this.config.get('logDestination', 'console');

        switch (destination) {
            case 'console':
                this._logToConsole(logEntry);
                break;
            case 'file':
                await this._logToFile(logEntry);
                break;
            case 'remote':
                await this._logToRemote(logEntry);
                break;
            default:
                this._logToConsole(logEntry);
        }

        this._addToBuffer(logEntry);
    }

    /**
     * Log to console with formatting
     */
    _logToConsole(entry) {
        const prefix = `[SENTINEL ${entry.level.toUpperCase()}]`;
        const timestamp = entry.timestamp;
        const category = entry.category;
        
        let color = this.resetColor;
        switch (entry.level) {
            case 'debug': color = '\x1b[36m'; break; // Cyan
            case 'info': color = '\x1b[32m'; break;  // Green
            case 'warn': color = '\x1b[33m'; break;  // Yellow
            case 'error': color = '\x1b[31m'; break; // Red
        }

        // Format based on data content
        if (entry.data.severity) {
            const sevColor = this.severityColors[entry.data.severity] || this.resetColor;
            console.log(
                `${color}${prefix}${this.resetColor} [${timestamp}] ${category}: ` +
                `${sevColor}${entry.data.severity.toUpperCase()}${this.resetColor} - ` +
                `${entry.data.type || entry.data.details || JSON.stringify(entry.data)}`
            );
        } else {
            console.log(
                `${color}${prefix}${this.resetColor} [${timestamp}] ${category}:`,
                entry.data.message || entry.data
            );
        }
    }

    /**
     * Log to file
     */
    async _logToFile(entry) {
        const filePath = this.config.get('logFilePath', './sentinel.log');
        const line = JSON.stringify(entry) + '\n';
        
        // In browser environment, fall back to console
        if (typeof window !== 'undefined') {
            this._logToConsole(entry);
            return;
        }

        try {
            const fs = await import('fs/promises');
            await fs.appendFile(filePath, line);
        } catch (error) {
            console.error('Failed to write to log file:', error);
            this._logToConsole(entry);
        }
    }

    /**
     * Log to remote endpoint
     */
    async _logToRemote(entry) {
        const endpoint = this.config.get('remoteLogEndpoint');
        
        if (!endpoint) {
            console.warn('Remote logging enabled but no endpoint configured');
            this._logToConsole(entry);
            return;
        }

        try {
            await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Sentinel-Version': '1.0'
                },
                body: JSON.stringify(entry)
            });
        } catch (error) {
            console.error('Failed to send to remote log:', error);
            this._logToConsole(entry);
        }
    }

    /**
     * Add entry to circular buffer
     */
    _addToBuffer(entry) {
        this.logBuffer.push(entry);
        if (this.logBuffer.length > this.bufferSize) {
            this.logBuffer.shift();
        }
    }

    /**
     * Get recent log entries
     * @param {number} count - Number of entries to return
     * @param {string} level - Filter by level (optional)
     */
    getRecent(count = 10, level = null) {
        let entries = [...this.logBuffer];
        
        if (level) {
            entries = entries.filter(e => e.level === level);
        }
        
        return entries.slice(-count);
    }

    /**
     * Get threat summary
     */
    getThreatSummary() {
        const threats = this.logBuffer.filter(e => e.category === 'THREAT');
        
        const summary = {
            total: threats.length,
            bySeverity: {},
            byType: {},
            recent: threats.slice(-10)
        };

        for (const threat of threats) {
            const severity = threat.data?.severity || 'unknown';
            const type = threat.data?.type || 'unknown';
            
            summary.bySeverity[severity] = (summary.bySeverity[severity] || 0) + 1;
            summary.byType[type] = (summary.byType[type] || 0) + 1;
        }

        return summary;
    }

    /**
     * Clear log buffer
     */
    clearBuffer() {
        this.logBuffer = [];
    }

    /**
     * Export logs as JSON
     */
    exportLogs() {
        return JSON.stringify(this.logBuffer, null, 2);
    }
}

export { ThreatLogger };
export default ThreatLogger;
