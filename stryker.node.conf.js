// eslint-disable-next-line func-names
module.exports = function(config) {
  config.set({
    // fileLogLevel: 'trace',
    // logLevel: 'trace',
    mutate: ['api/**/*.ts', '!api/**/*.spec.ts', '!api/test/**/*.ts'],
    mutator: 'typescript',
    transpilers: ['typescript'],
    testFramework: 'mocha',
    testRunner: 'mocha',
    reporters: ['clear-text', 'progress', 'html'],
    tsconfigFile: 'tsconfig.json',
    mochaOptions: {
      spec: [ 'dist/out-tsc/api/{,!(test)/**/}*.spec.js' ]
      // timeout: 5000
    },
    htmlReporter: { baseDir: 'reports/tests/mutation/node/' },
    maxConcurrentTestRunners: 2

  });
};
