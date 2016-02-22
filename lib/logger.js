"use strict";

//const logbuffer = require('log-buffer') // patches console logging to use buffering
const fs = require('fs')
const speedDate = require('speed-date')

const defaultLogConfig = './logconfig.json'

const CATEGORY_ALL = '[all]'
const levels = [CATEGORY_ALL, 'trace', 'debug', 'info', 'warn', 'error', 'fatal', 'off']

const defaultDateFormat = 'YYYY-MM-DD HH:mm:ssZ'

var configFile = null
var lastModified = null
var watchTimer = null

// string to index value
function getLevelValue(level) {
  if (level && typeof level === 'string') {
    let ix = levels.indexOf(level.toLowerCase())
    return ix === -1 ? levels.length : ix
  }
  return levels.length
}

function fmtLevel(s) {
  return '[' + s.toUpperCase() + ']'
}

// index to string value
function getLevelString(val) {
  if (val >= 0 && val < levels.length) return levels[val]
  return 'off'
}

function getLevelForCategory(category) {
  let level = config.level
  if (config.levels && config.levels[category]) {
    level = config.levels[category]
  }
  return level
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function fileExists(path) {
  try {
    var stats = fs.lstatSync(path)
    return stats.isFile()
  }
  catch (err) {
    return false
  }
}

function getMTime() {
  try {
    if (!configFile) return null
    return fs.statSync(configFile).mtime;
  }
  catch (e) {
    return null
  }
}

function watchConfigFile() {
  if (process.env.NODE_ENV === 'production') {
    watchTimer = setTimeout(watchConfigFile, config.watchInterval*1000)
    var mtime =  getMTime()
    if (!mtime) return

    if (lastModified && lastModified !== mtime) {
      lastModified = mtime
      configureFromFile(configFile)
    }
    else {
      lastModified = mtime
    }
  }
  else {
    fs.watch(configFile, function (event) {
      if (event === 'change') {
        configureFromFile(configFile)
      }
    })
  }
}

function readSync(fileName) {
  try {
    var buf = fs.readFileSync(fileName)
    var obj = JSON.parse(buf)
    return obj
  }
  catch(err) {
    console.error('Error reading ' + fileName + ': ' + err)
    return null
  }
}

//------------------------------------------------------------------------------
// Configuration
//------------------------------------------------------------------------------

// current configuration settings
const config = {}

function resetConfig() {
  // remove any watches / timers
  if (configFile && config.watch) fs.unwatchFile(configFile)
  if (watchTimer) { clearTimeout(watchTimer); watchTimer = null }

  config.level = getLevelValue('info')
  config.watch = false
  config.watchInterval = 60 // default 1 minute
  config.dateFormat = defaultDateFormat
  config.levels = {}
  config.loggingFunction = console.log.bind(console)

  config.dateFormatter = speedDate(defaultDateFormat)
}
resetConfig() // first time initialization

function getTimestamp() {
  if (!config.dateFormat) return ''
  var ts = config.dateFormatter(new Date())
  return ts + ': '
}

function configureFromFile(path) {
  fs.readFile(path, function (err, content) {
    if (err) return console.error('Could not load ' + path + ': ' + err)
    try {
      let obj = JSON.parse(content)
      configFile = path
      configure(obj)
      if (config.watch) watchConfigFile()
    }
    catch (err) {
      console.error('Error parsing JSON configuration: ' + err)
    }
  })
}

function configure(obj) {
  if (!obj) return;
  if (typeof obj === 'string') return configureFromFile(obj)

  resetConfig() // restore defaults and clear any watches

  if (obj.level) {
    config.level = getLevelValue(obj.level)
    defaultLogger.level = config.level
  }
  if (obj.watchInterval && typeof obj.watchInterval === 'number') {
    if (obj.watchInterval < 10) {
      console.error('watchInterval less than 10 seconds, setting to 10')
      config.watchInterval = 10
    }
    else {
      config.watchInterval = obj.watchInterval
    }
  }
  if (obj.levels) {
    Object.keys(obj.levels).forEach(function (cat) {
      var levelValue = getLevelValue(obj.levels[cat])
      if (cat === CATEGORY_ALL) {
        config.level = levelValue
        defaultLogger.level = levelValue
      }
      else {
        config.levels[cat] = levelValue
      }
    })
    // update all loggers
    Object.keys(loggers).forEach(function (cat) {
      var log = loggers[cat]
      log.level = getLevelForCategory(cat)
    })
  }
  if (obj && obj.dateFormat && typeof obj.dateFormat === 'string') {
    config.dateFormat = obj.dateFormat
    config.dateFormatter = speedDate(config.dateFormat)
  }
  if (typeof obj.loggingFunction === 'function') {
    config.loggingFunction = obj.loggingFunction
  }
  if (typeof obj.dateFormat === 'undefined') {
    // if not specified use default timestamp format
    config.dateFormat = defaultDateFormat
    config.dateFormatter = speedDate(defaultDateFormat)
  }
  else if (obj.dateFormat === null) {
    config.dateFormat = null; // disable timestamps
  }
}

//------------------------------------------------------------------------------
// Logger
//------------------------------------------------------------------------------
function Logger(name) {
  this.level = getLevelForCategory(name); // This gets updated on each config change

  this.category = name ? ' ' + name : '';

  this.getLevel = function () {
    return getLevelString(this.level)
  }
}
// Add a function for each level that logs at that level value
levels.forEach(function (value) {
  if (value === 'off') return
  var logLevel = getLevelValue(value) // log level for this function
  Logger.prototype['is' + capitalize(value) + 'Enabled'] = function () {
    return (this.level <= logLevel)
  }
  Logger.prototype[value] = function () {
    if (!arguments.length) return
    if (!(this.level <= logLevel)) return

    // enabled, call log function with the level value inserted in front
    // of all other arguments
    var slevel = fmtLevel(value)
    var ts = getTimestamp()
    var args = [ts + slevel + this.category + ' - ' + arguments[0]]
    for (var ix = 1; ix < arguments.length; ix++) args.push(arguments[ix])
    config.loggingFunction.apply(null, args)
  }
})

const loggers = {}

function getLogger(name) {
  if (!name) return defaultLogger
  var logger = loggers[name]
  if (!logger) {
    logger = new Logger(name)
    loggers[name] = logger
  }
  return logger
}

var defaultLogger = new Logger()

// if default log config is found load it synchronously
if (fileExists(defaultLogConfig)) {
  var opts = readSync(defaultLogConfig)
  if (opts) {
    configFile = defaultLogConfig
    configure(opts)
  }
}

module.exports = {
  configure: configure,
  getLogger: getLogger,
  dumpConfig: function() {console.log(config)},
  getLevel: function () {
    return getLevelString(config.level)
  },
  getCategoryLevel: function (category) {
    return getLevelString(getLevelForCategory(category))
  },
  getCategories: function () {
    return config.levels
  }
}
