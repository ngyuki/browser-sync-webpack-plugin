const browserSync = require('browser-sync')
const getCssOnlyEmittedAssetsNames = require('./getCssOnlyEmittedAssetsNames')

const defaultPluginOptions = {
  reload: true,
  name: 'bs-webpack-plugin',
  callback: undefined,
  injectCss: false
}

class BrowserSyncPlugin {
  constructor (browserSyncOptions, pluginOptions) {
    this.browserSyncOptions = Object.assign({}, browserSyncOptions)
    this.options = Object.assign({}, defaultPluginOptions, pluginOptions)

    this.browserSync = browserSync.create(this.options.name)
    this.isWebpackWatching = false
    this.isBrowserSyncRunning = false
    this.emittedFiles = []
  }

  apply (compiler) {
    const watchRunCallback = () => {
      this.isWebpackWatching = true
    }
    const compilationCallback = () => {
      if (this.isBrowserSyncRunning && this.browserSyncOptions.notify) {
        this.browserSync.notify('Rebuilding...')
      }
    }
    const assetEmittedCallback = (file, info) => {
      this.emittedFiles.push(file)
    }
    const doneCallback = stats => {
      if (!this.isWebpackWatching) {
        return
      }

      if (!this.isBrowserSyncRunning) {
        this.browserSync.init(this.browserSyncOptions, this.options.callback)
        this.isBrowserSyncRunning = true
      }

      if (this.options.reload) {
        if (this.emittedFiles.length) {
          this.browserSync.reload(this.emittedFiles)
          this.emittedFiles = [];
        } else {
          this.browserSync.reload()
        }
      }
    }

    if (typeof compiler.hooks !== 'undefined') {
      compiler.hooks.watchRun.tap(BrowserSyncPlugin.name, watchRunCallback)
      compiler.hooks.compilation.tap(BrowserSyncPlugin.name, compilationCallback)
      compiler.hooks.assetEmitted.tap(BrowserSyncPlugin.name, assetEmittedCallback)
      compiler.hooks.done.tap(BrowserSyncPlugin.name, doneCallback)
    } else {
      compiler.plugin('watch-run', (watching, callback) => {
        watchRunCallback()
        callback(null, null)
      })
      compiler.plugin('compilation', compilationCallback)
      compiler.plugin('done', doneCallback)
    }
  }
}

module.exports = BrowserSyncPlugin
