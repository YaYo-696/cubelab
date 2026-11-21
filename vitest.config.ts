import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['tests/unit/**/*.test.ts'], testTimeout: 900000, hookTimeout: 120000 } });
