module.exports = {
  default: {
    paths: ['tests/features/**/*.feature'],
    require: ['tests/features/step-definitions/**/*.ts'],
    requireModule: ['tsx/cjs'],
    format: ['progress-bar'],
    formatOptions: { snippetInterface: 'async-await' },
  }
};
