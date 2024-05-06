#!/usr/bin/env node
import { createInterface } from 'node:readline/promises'
import { exec } from 'node:child_process'

const dependencies = {}
const devDependencies = {}
try {
  const { stdout: dependenciesJsonString } = await execAsnc('npm list --json --omit=dev')
  const { stdout: allDependenciesJsonString } = await execAsnc('npm list --json')
  for (const packageModule in JSON.parse(dependenciesJsonString).dependencies)
    dependencies[packageModule] = JSON.parse(dependenciesJsonString).dependencies[packageModule].version
  for (const packageModule in JSON.parse(allDependenciesJsonString).dependencies) {
    if (dependencies[packageModule]) continue
    devDependencies[packageModule] = JSON.parse(allDependenciesJsonString).dependencies[packageModule].version
  }
} catch (error) {
  console.error('❌ Error while reading dependencies.You probably have a discrepancy between your package.json and your node_modules folder. Please run `npm install` and try again.')
  process.exitCode = 1
  process.exit()  
}
const positiveAnswers = ['yes', 'y']
const versionTypes = {
  MAJOR: { symbol: Symbol('MAJOR'), label: '🔴 Major update' },
  MINOR: { symbol: Symbol('MINOR'), label: '🟡 Minor update' },
  FIX: { symbol: Symbol('FIX'), label: '🟢 Fix update' }
}

await checkVersions(dependencies)
await checkVersions(devDependencies, true)

/**
 * @param { Object.<string, string> } dependenciesObject
 * @param { boolean } isDev
 */
async function checkVersions (dependenciesObject, isDev = false) {
  console.log(`🔍 Checking ${isDev ? 'devDependencies' : 'dependencies'} versions...`)
  const depEntries = Object.entries(dependenciesObject)
  const res = await Promise.all(depEntries.map(checkDepVersion))
  const oldPackages = res
    .filter(({ actualVersion, latestVersion }) => actualVersion !== latestVersion)
  if (!oldPackages.length) return console.log(`✅ ${isDev ? 'devDependencies' : 'dependencies'} are up to date`)
  for (const { dep, actualVersion, latestVersion } of oldPackages) {
    console.log(`🔻 ${dep} is out of date: 🔻
    ${actualizationType({ actualVersion, latestVersion }).label} / ${actualVersion} => ${latestVersion}`)
  }
  const updatePachages = await questionUserBoolean('Do you wich to update these packages? (yes/no): ')
  if (!updatePachages) return
  await updateDeps(oldPackages, isDev)
}

/**
 * @param {{ dep: string; actualVersion: string; latestVersion: string; }[]} deps
 * @param { boolean } isDev
 */
async function updateDeps (deps, isDev = false) {
  const updateMajors = await questionUserBoolean('Do you wich to update the major versions? (yes/no): ')
  if (!updateMajors) {
    deps = deps.filter(({ actualVersion, latestVersion }) =>
      actualizationType({ actualVersion, latestVersion }).symbol !== versionTypes.MAJOR.symbol)
  }
  if (deps.length < 1) return
  console.log(`🔄 Updating packages...`)
  const mappedDeps = deps.map(({ dep }) => `${dep}@latest`).join(' ')
  let command = `npm install ${mappedDeps} -E`
  if (isDev) command += ' -D'
  await execAsnc(command)
  console.log(`⬆️ Following packages has been updated: ${deps.map(({ dep }) => dep).join(', ')}`)
}

/**
 * @param { string[] } param0
 * @returns { Promise<{dep: string, actualVersion: string, latestVersion: string}> }
 */
async function checkDepVersion ([dep, actualVersion]) {
  const { stdout } = await execAsnc(`npm show ${dep} version`)
  const latestVersion = stdout.replace(/\n/g, '')
  return { dep, actualVersion, latestVersion }
}

/**
 *
 * @param { string } command
 * @returns { Promise<{ stdout: string, stderr: string }> }
 */
function execAsnc (command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error)
      resolve({ stdout, stderr })
    })
  })
}

/**
 * @param { Object } param0
 * @param { string } param0.actualVersion
 * @param { string } param0.latestVersion
 * @returns { { symbol: symbol, label: string } }
 */
function actualizationType ({ actualVersion, latestVersion }) {
  const [actualMajor, actualMinor, actualFix] = actualVersion.split('.')
  const [newMajor, newMinor, newFix] = latestVersion.split('.')
  if (actualMajor !== newMajor) return versionTypes.MAJOR
  if (actualMinor !== newMinor) return versionTypes.MINOR
  if (actualFix !== newFix) return versionTypes.FIX
  return {}
}

/**
 * @param { string } question
 */
async function questionUserBoolean (question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(question)
  rl.close()
  return positiveAnswers.includes(answer)
}
