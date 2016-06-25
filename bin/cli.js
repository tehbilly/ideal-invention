'use strict'

const chalk = require('chalk')
const cli = require('commander')
const columnify = require('columnify')
const fs = require('fs-extra')
const path = require('path')

// TODO Standardize names, pick default location
// modulePath: should be process.env.LOCALAPPDATA + 'OMGANAME/packages'
// installPath: should be process.env.LOCALAPPDATA + 'OMGANAME/installed' (or similar)
let modulePath = process.env.CUSTOM_MODULE_PATH || path.join(__dirname, '..', 'test_modules')
let installPath = process.env.CUSTOM_PACKAGE_PATH || path.join(__dirname, '..', 'test_installs')

class PackageHandler {
  constructor() {
    this.loadedPackages = []
  }

  // Load a list of all available packages, filtering out ones with errors
  loadPackages() {
    return new Promise((resolve, reject) => {
      fs.readdir(cli.packageSource, (err, packages) => {
        if (err) throw err;
        
        let pkgPromises = []
        let pkgList = []

        for (const pkg of packages) {
          pkgPromises.push(this.loadPackage(pkg)
            .then(loadedPackage => {
              pkgList.push(loadedPackage)
            })
            .catch(err => {
              if (cli.verbose) {
                console.log(chalk.red('[error]'), `Unable to load package '${pkg}': ${err}`)
              }
            })
          )
        }

        return Promise.all(pkgPromises).then(ignored => {
          resolve(pkgList)
        })
      })
    })
  }

  // Load a package by name
  loadPackage(pkg) {
    return new Promise((resolve, reject) => {
      let pkgPath = path.join(cli.packageSource, pkg)
      let mod = require(pkgPath)

      // Check for required properties
      // TODO Remove name property, filename provides this for us
      if (mod.name === null || mod.name === undefined || mod.name === '') {
        reject('Package has no name!')
        return
      }
      if (mod.desc === null || mod.desc === undefined || mod.desc === '') {
        reject('Package has no description!')
        return
      }

      resolve(mod)
    })
  }

  // Install a package by name
  installPackage(name) {
    return new Promise((resolve, reject) => {
      this.loadPackage(name)
        .then(pkg => {
          // Check that pkg.install() is good
          if (!(pkg.install instanceof Function)) {
            throw new Error(`No install function`)
          }
          // Loaded, let's create the target directory if it doesn't exist
          let targetPath = path.join(cli.packagePath, pkg.name)
          fs.ensureDir(targetPath, err => {
            if (err) {
              throw err
            }

            // Do the thing!
            let result = pkg.install({
              installPath: targetPath 
            })

            // Still here? I guess we're done!
            resolve(result)
          })
        })
        .catch(err => {
          reject(`Failed to install package '${chalk.bold(name)}': ${err.message}`)
        })
    })
  }

  // Cleanup empty directories in install target
  cleanInstallDir() {
    return new Promise((resolve, reject) => {
      // TODO ... All of it
      resolve()
    })
  }

  // Check all packages for available updates
}

let packageHandler = new PackageHandler()

// General info
cli.version('0.0.1')

// Global options
cli.option('-v, --verbose', 'Be chatty')
cli.option('--package-source <packageSource>', 'Directory containing packages', modulePath)
cli.option('--package-path <packagePath>', 'Install packages to this location', installPath)

// Command: list
cli.command('list')
  .action(() => {
    packageHandler.loadPackages().then(packages => {
      let packageList = columnify(packages, {
        // columnSplitter: ' | ',
        minWidth: 15,
        columns: ['name', 'desc'],
        config: {
          name: {
            headingTransform: heading => chalk.bold("Name")
          },
          desc: {
            headingTransform: heading => chalk.bold("Description")
          }
        }
      })

      console.log(packageList)
    })
  })

// Install
cli.command('install [packages...]')
  .action(packages => {
    for (const pkg of packages) {
      packageHandler.installPackage(pkg)
        .then(res => {
          // Should probably do some better messaging support for modules
          console.log(chalk.bold.green('[info] '), `Installed package:`, chalk.bold(pkg))
        })
        .catch(err => {
          console.log(chalk.bold.red('[error]'), err)
        })
    }
  })

// parse 'em
cli.parse(process.argv)

// No args? Eh... you probably need help
if (!cli.args.length) {
  cli.help()
}