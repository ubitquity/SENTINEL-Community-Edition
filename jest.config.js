/**
 * Jest configuration for SENTINEL
 * ES Modules support enabled
 */

export default {
    // Use node environment for testing
    testEnvironment: 'node',

    // Transform ES modules
    transform: {},

    // Enable ES modules support
    extensionsToTreatAsEsm: ['.js'],

    // Module name mapper for imports
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },

    // Coverage settings
    collectCoverage: false,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/__tests__/'
    ],

    // Test match patterns
    testMatch: [
        '**/__tests__/**/*.test.js',
        '**/?(*.)+(spec|test).js'
    ],

    // Verbose output
    verbose: true,

    // Clear mocks between tests
    clearMocks: true,

    // Reset mocks between tests
    resetMocks: true,

    // Restore mocks between tests
    restoreMocks: true
};
