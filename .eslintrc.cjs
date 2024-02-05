module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    semi: ['error', 'always'],
    quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    'max-len': ['error', { code: 100 }],
  }
};