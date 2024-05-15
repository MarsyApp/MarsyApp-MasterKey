#!/usr/bin/env node

const fs = require("fs-extra");
const glob = require("glob");
const zip = require("bestzip");
const path = require("path");

const pathToMods = "D:\\spt-381\\user\\mods"

const { author, name:packageName, version } = require("./package.json");

const packageNameRes = packageName.replace(/[^a-z0-9]/gi, "");
const packageNameRes2 = `MarsyApp-${packageNameRes}`;
const modName = `${author.replace(/[^a-z0-9]/gi, "")}-${packageNameRes}-${version}`;
console.log(`Generated package name: ${modName}`);

fs.rmSync(`${__dirname}/${modName}`, { force: true, recursive: true });
fs.rmSync(`${__dirname}/dist`, { force: true, recursive: true });
console.log("Previous build files deleted.");

const ignoreList = [
    "node_modules/",
    // "node_modules/!(weighted|glob)", // Instead of excluding the entire node_modules directory, allow two node modules.
    "src/**/*.js",
    "types/",
    ".git/",
    ".gitea/",
    ".eslintignore",
    ".eslintrc.json",
    ".gitignore",
    ".DS_Store",
    "packageBuild.ts",
    "mod.code-workspace",
    "package-lock.json",
    "tsconfig.json",
    ".idea",
    "README.md",
    "test.json",
    "test2.json",
    "test3.json",
    "test4.json",
    "test5.json",
    "test6.json",
    "test7.json",
    "allItemsName.json",
    "MypackageBuild.ts",
    "clientMod",
    "dist",
    "builtDll"
];
const exclude = glob.sync(`{${ignoreList.join(",")}}`, { realpath: true, dot: true });

fs.copySync(__dirname, path.normalize(`${__dirname}/../~${modName}`), {filter:(filePath) =>
    {
        return !exclude.includes(filePath);
    }});
fs.moveSync(path.normalize(`${__dirname}/../~${modName}`), path.normalize(`${__dirname}/${modName}`), { overwrite: true });
fs.copySync(path.normalize(`${__dirname}/${modName}`), path.normalize(`${pathToMods}/${packageNameRes2}`));
console.log("Build files copied.");

fs.copySync(path.normalize(`${__dirname}/${modName}`), path.normalize(`${__dirname}/dist/user/mods/${packageNameRes2}`));
console.log("Build files copied.");

const pathToBuiltDll = path.normalize(`${__dirname}/builtDll`);
const files = fs.readdirSync(pathToBuiltDll);
if (files.length !== 1) {
    console.log("No files found in builtDll");
    // @ts-ignore
    return;
}

const file = files[0];
fs.copySync(path.normalize(`${pathToBuiltDll}/${file}`), path.normalize(`${__dirname}/dist/BepInEx/plugins/${file}`));
console.log("dll files copied.");
console.log("dist files copied.");

const dirsArray = fs.readdirSync(`${__dirname}/dist`);
console.log(dirsArray);
zip({
    source: dirsArray,
    destination: `${modName}.zip`,
    cwd: `${__dirname}/dist`
}).catch(function(err)
{
    console.error("A bestzip error has occurred: ", err.stack);
}).then(function()
{
    console.log(`Compressed mod package to: /dist/${modName}.zip`);

    fs.rmSync(`${__dirname}/${modName}`, { force: true, recursive: true });
    console.log("Build successful! your zip file has been created and is ready to be uploaded to hub.sp-tarkov.com/files/");
});
