import fs from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'

const args = process.argv.slice(2)

const [options, packages] = args.reduce(([options, packages], value) => {
  const match = value.match(/^--?([^=]+)(=(.+))?$/)
  if (match) {
    options[match[1]] = match[3] || true
  } else {
    packages.push(...value.split(','))
  }
  return [options, packages]
}, [{platforms: ''}, []])

const toNpmPlatform = platform => platform == 'win' ? 'win32' : platform

/**
 * Prebuilt binaries of sharp are shipped as optional dependencies like
 * `@img/sharp-win32-x64` or `@img/sharp-libvips-darwin-x64` and their versions
 * are pinned by sharp. They are read from its manifest so that a sharp update
 * requires no change here.
 */
const sharpPackages = async platformArchs => {
  const file = path.resolve('node_modules', 'sharp', 'package.json')
  const pkg = await fs.readFile(file, 'utf8').then(JSON.parse).catch(() => false)
  if (!pkg) {
    console.log(`No sharp installation found at ${file}. Skip its binaries`)
    return []
  }

  const suffixes = platformArchs.map(platformArch => {
    const [platform, arch] = platformArch.split('-')
    return `-${toNpmPlatform(platform)}-${arch}`
  })

  return Object.entries(pkg.optionalDependencies || {})
    .filter(([name]) => suffixes.find(suffix => name.endsWith(suffix)))
    .map(([name, version]) => `${name}@${version}`)
}

const install = packages => new Promise((resolve, reject) => {
  // npm skips packages of foreign platforms due to their os and cpu
  // properties. `--force` overrides this check, `--no-save` keeps the
  // manifests untouched
  const npmArgs = ['install', '--force', '--no-save', ...packages]
  console.log(`Run npm ${npmArgs.join(' ')}`)
  const child = spawn('npm', npmArgs, {stdio: 'inherit', shell: process.platform == 'win32'})
  child.on('error', reject)
  child.on('exit', code => code == 0 ? resolve() : reject(new Error(`npm install exited with code ${code}`)))
})

const run = async () => {
  const platformArchs = `${options.platforms || ''}`.split(',').filter(v => v)
  if (!platformArchs.length) {
    throw new Error(`No target platforms are given. Use --platforms=linux-x64,win-x64`)
  }

  const allPackages = [...packages, ...await sharpPackages(platformArchs)]
  if (!allPackages.length) {
    console.log(`No native packages to install`)
    return
  }

  // A single install: npm prunes packages which are not saved in the manifests
  // and a second `--no-save` install would remove the packages of the first one
  return install(allPackages)
}

run()
  .then(() => console.log(`Installed native packages for ${options.platforms}`))
  .catch(err => {
    console.error(`Failed to install native packages: ${err}`)
    process.exit(1)
  })
