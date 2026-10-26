module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  // TestRunner.tsx is the stage template's local test harness, kept as-is
  ignorePatterns: ['dist', '.eslintrc.cjs', 'src/TestRunner.tsx'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    // The stage template's types (config, init state, saved data) are loosely typed by design
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
