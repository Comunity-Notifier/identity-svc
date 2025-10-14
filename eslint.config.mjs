import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import jestConfig from 'eslint-plugin-jest';

export default tseslint.config(
  // Ignora carpetas comunes y archivos de configuración
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'build/**',
      'coverage/**',
      '*.config.js',
      '*.config.mjs',
      'jest.config.js',
      'eslint.config.js',
    ],
  },

  // Configuración base de JavaScript
  js.configs.recommended,

  // Configuraciones recomendadas de TypeScript
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Configuración específica para archivos TypeScript
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      // Reglas personalizadas para Express
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',

      // Reglas generales
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off', // solo en tests
    },
  },
  // Configuración para archivos JavaScript (si los tienes)
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    ...tseslint.configs.disableTypeChecked,
  },

  // Desactiva reglas que entran en conflicto con Prettier (debe ir al final)
  prettierConfig
);
