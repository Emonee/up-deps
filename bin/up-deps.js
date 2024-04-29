#!/usr/bin/env node

import { exec } from 'node:child_process'

async function main () {
  const { stdout } = await execAsnc('npm list --json')
  const obj = JSON.parse(stdout)
  console.log(obj);
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

main().catch(console.error)