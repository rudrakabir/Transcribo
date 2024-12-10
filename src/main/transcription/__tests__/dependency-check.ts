import { describe, expect, it } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Dependency Checks', () => {
    it('should have all required npm packages', () => {
        const packageJsonPath = path.join(__dirname, '../../../../package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        const requiredPackages = [
            '@types/jest',
            'jest',
            'ts-jest',
            'node-addon-api',
            'electron',
            'typescript'
        ];

        for (const pkg of requiredPackages) {
            expect(
                packageJson.dependencies[pkg] || packageJson.devDependencies[pkg]
            ).toBeDefined();
        }
    });

    it('should have essential project files', () => {
        const requiredFiles = [
            'tsconfig.json',
            'package.json',
            'jest.config.ts'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(__dirname, '../../../../', file);
            expect(fs.existsSync(filePath)).toBe(true);
        }
    });

    it('should have whisper native module directory structure', () => {
        const requiredDirs = [
            'native/whisper',
            'native/src',
            'src/main/transcription'
        ];

        for (const dir of requiredDirs) {
            const dirPath = path.join(__dirname, '../../../../', dir);
            expect(fs.existsSync(dirPath)).toBe(true);
        }
    });
});