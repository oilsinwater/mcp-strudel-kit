import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(__dirname, '../..');

describe('TypeScript project compilation', () => {
  it('compiles without emitting artifacts or diagnostics', () => {
    const configPath = ts.findConfigFile(projectRoot, ts.sys.fileExists, 'tsconfig.json');
    expect(configPath).toBeTruthy();

    const configFile = ts.readConfigFile(configPath!, ts.sys.readFile);
    expect(configFile.error).toBeUndefined();

    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(configPath!),
    );

    const rootNames = parsedConfig.fileNames.filter((fileName) => {
      const normalized = path.normalize(fileName);
      return (
        normalized.includes(`${path.sep}src${path.sep}`) ||
        normalized.includes(`${path.sep}config${path.sep}`) ||
        normalized.endsWith(`${path.sep}vitest.config.ts`)
      );
    });

    const program = ts.createProgram({
      rootNames,
      options: {
        ...parsedConfig.options,
        noEmit: true,
      },
    });

    const diagnostics = ts.getPreEmitDiagnostics(program);

    const relevantDiagnostics = diagnostics.filter((diagnostic) => {
      const fileName = diagnostic.file?.fileName;
      if (!fileName) {
        return true;
      }

      const normalized = path.normalize(fileName);
      return (
        normalized.includes(`${path.sep}src${path.sep}`) ||
        normalized.includes(`${path.sep}config${path.sep}`) ||
        normalized.endsWith(`${path.sep}vitest.config.ts`)
      );
    });

    if (relevantDiagnostics.length > 0) {
      const formatted = ts.formatDiagnosticsWithColorAndContext(relevantDiagnostics, {
        ...ts.sys,
        getCurrentDirectory: () => projectRoot,
        getCanonicalFileName: (fileName) => fileName,
        getNewLine: () => ts.sys.newLine,
      });

      // eslint-disable-next-line no-console -- Provide actionable diagnostic output if the assertion fails.
      console.error(formatted);
    }

    expect(relevantDiagnostics).toHaveLength(0);
  });
});
