import type { Config } from 'jest';

/**
 * Konfigurasi Jest untuk testing
 * Mendukung TypeScript dengan ts-jest
 */
const config: Config = {
  // Preset untuk TypeScript
  preset: 'ts-jest',

  // Environment untuk testing (Node.js)
  testEnvironment: 'node',

  // Root directory untuk tests
  roots: ['<rootDir>/tests', '<rootDir>/src'],

  // Pattern untuk test files
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
  ],

  // Transform files dengan ts-jest
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts',
    '!src/serverless.ts',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Coverage directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Setup files
  setupFilesAfterEnv: [],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Timeout untuk tests (10 detik)
  testTimeout: 10000,

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],

  // Module name mapper untuk path aliases (jika diperlukan)
  moduleNameMapper: {},
};

export default config;
