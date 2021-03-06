const execSync = require('../exec-sync');
const path = require('path');
const fs = require('fs');
const msCustomRulesMain = require.resolve('tslint-microsoft-contrib');
const rulesPath = path.dirname(msCustomRulesMain);
const tslintPath = 'node ' + path.resolve(__dirname, '../node_modules/tslint/lib/tslint-cli');

const files = process.argv.slice(2);

runTsLintOnFilesGroupedPerPackage(groupFilesByPackage(files));

/**
 * Since we have a tslint.json config file per package we need to respect this when running
 * tslint for staged files. To do this we group the files per package name. This function takes
 * a list of package names and returns an object with the package name as the key and the files
 * in that package as the value.
 *
 * @param {string[]} files
 * @returns {[packageName: string]: string[]}
 */
function groupFilesByPackage(files) {
  const rootDirectory = path.join(path.resolve(__dirname, '..', '..'), path.sep);

  return files
    .map(fileName => {
      const parts = fileName.replace(rootDirectory, '').split(path.sep);
      const packageRoot = [parts[0], parts[1]].join(path.sep);

      return [packageRoot, fileName];
    })
    .reduce((acc, [package, file]) => {
      if (!acc[package]) {
        acc[package] = [];
      }
      acc[package].push(file);
      return acc;
    }, {});
}

/**
 * Runs tslint for the staged files in the packages that require it.
 *
 * @param {[packageName: string]: string[]} filesGroupedByPackage
 */
function runTsLintOnFilesGroupedPerPackage(filesGroupedByPackage) {
  // Log an empty line on error to make the tslint output look better
  console.log('');

  for (let [package, files] of Object.entries(filesGroupedByPackage)) {
    const tslintConfig = path.join(path.resolve(__dirname, '..', '..'), package, 'tslint.json');

    execSync(`${tslintPath} --config ${tslintConfig} -t stylish -r ${rulesPath} ${files.join(' ')}`);
  }
}
