const P = require('bluebird');

/**
 * Executable entry point for testing
 *
 * examples from project root: ("test/start.js" === this file rel path)
 *   `node test/start.js TEST` runs all tests
 *   `node test/start.js TEST test/example.test.js` runs one file
 *
 */

// logging
const {log: print, error: printError} = console;

/* eslint-disable ava/no-ignored-test-files */


/**
 * Enum for the type of test run:
 *   TEST (standard), SETUP_ONLY (reset the db etc), TEST_ONLY (test without setup)
 * @enum {string}
 */
const RunMode = {
  TEST: 'TEST',
  SETUP_ONLY: 'SETUP',
  TEST_ONLY: 'TEST-ONLY'
};

const runMode = process.argv[2] || 'TEST';
if (RunMode[runMode] === undefined) {
  throw new Error(`1st argument is required and must be one of [${Object.keys(RunMode)}]`);
}

const ALL_TEST_FILES = 'test/{**/*,*}.test.js';
const testGlobInput = process.argv[3];
const testGlob = typeof testGlobInput === 'string' ?
    testGlobInput.replace(/(^test\/|^)/, 'test/').replace(/(\.test\.js$|$)/, '.test.js') :
    null;
const matchTestFile = testGlob ? testGlob : ALL_TEST_FILES;
const runningAllTests = matchTestFile === ALL_TEST_FILES;

switch (runMode) {
  case RunMode.TEST:
    preTest()
      .then(() => runTests())
      .then(code => {
        if (runningAllTests) {return runLint(code);}
        return code;
      })
      .then(process.exit);
    break;
  case RunMode.SETUP_ONLY:
    preTest().then(() => process.exit(0));
    break;
  case RunMode.TEST_ONLY:
    runTests().then(process.exit);
    break;
  default:
}

function runLint(previousCode) {
  return new P((resolve, reject) => {
    print('linting...');
    const spawn = require('child_process').spawn;
    const execLint = spawn('npm', ['run', 'lint'], {stdio: 'inherit'});
    execLint.on('close', code => {
      resolve(code || previousCode);
    });
  });
}

/**
 * Wrapper to run tests
 */
function runTests() {
  return new P((resolve, reject) => {
    print('Running Tests...');
    const spawn = require('child_process').spawn;
    print(`Testing files: ${matchTestFile}`);
    global.aplhaTest = 1;
    const execTests = spawn('ava', [matchTestFile, '--verbose', '--fail-fast'], {stdio: 'inherit'});
    execTests.on('close', code => {
      resolve(code);
    });
  });
}

/**
 *  Before tests, for now:
 * @return {Promise}        Promise to reset the db
 * */
function preTest() {
  print('Running Pre-test...');
  return P.resolve(0)
    .catch(err => {
      process.exitCode = 1;
      printError('Pre-test failed.');
      if (err instanceof Error) {
        throw err;
      } else {
        throw new Error(err);
      }
    });
}

/* eslint-enable ava/no-ignored-test-files */

