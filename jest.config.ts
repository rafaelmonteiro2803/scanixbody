import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/domain'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    // Resolve @/ path alias to src/
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { strict: false } }],
  },
  collectCoverageFrom: ['src/domain/**/*.ts', '!src/domain/**/__tests__/**'],
  coverageThreshold: {
    global: { lines: 80 },
  },
}

export default config
