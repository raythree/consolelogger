"use strict";

require('log-buffer') // patches console logging to use buffering
const fs = require('fs')
const speedDate = require('speed-date')

const defaultLogConfig = './logconfig.json'

const CATEGORY_ALL = '[all]'
const levels = [CATEGORY_ALL, 'trace', 'debug', 'info', 'warn', 'error', 'fatal', 'off']

//
// numeric level from string
//
function getLevelValue(level) {
  if (level && typeof level === 'string') {
    let ix = levels.indexOf(level.toLowerCase())
    return ix === -1 ? levels.length : ix
  }
  return levels.length
}

//
// string level from numeric
//
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

//------------------------------------------------------------------------------
// Configuration
//------------------------------------------------------------------------------

// current configuration settings
const config = {
  level: getLevelValue('info'),
  timestamps: true,
  logConfigFile: null,
  watch: false,
  dateformat: 'YYYY-MM-DD HH:mm:ssZ', // default
  levels: {},
  loggingFunction: console.log // can be changed for testing purposes
}

var dateformatter = speedDate(config.dateformat)

function getTimestamp() {
  if (!config.dateformat) return ''
  return dateformatter(new Date())
}

function configureFromFile(logFile) {
  fs.readFile(logFile, function (err, content) {
    if (err) return console.error('Could not load ' + logFile + ': ' + err)
    try {
      let obj = JSON.parse(content)
      configure(obj)
    }
    catch (err) {
      console.error('Error parsing JSON configuration: ' + err)
    }
  })
}

function configure(obj) {
  if (!obj) return;
  if (typeof obj === 'string') return configureFromFile(obj)

  if (obj.level) {
    config.level = getLevelValue(obj.level)
    defaultLogger.level = config.level
  }
  config.levels = {} // reset
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
}

//------------------------------------------------------------------------------
// Loggers
//------------------------------------------------------------------------------
function Logger(name) {
  this.level = getLevelForCategory(name); // This gets updated on each config change

  this.log = function (args) {
    var ts = config.dateformatter(new Date())
    var args = [args[0] + ' ' + ts + ': ']
    for (var ix = 0; ix < arguments.length; ix++) args.push(arguments[ix])
    config.loggingFunction.apply(this, args)
  }.bind(this)

  this.enabled = function () {
    return this.level >= config.level
  }
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
    if (this.level <= logLevel) return
    // enabled, call log function with the level value inserted in front
    // of all other arguments
    var args = []
    for (var ix = 0; ix < arguments.length; ix++) args.push(arguments[ix])
    this.log(value, args)
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

if (fileExists(defaultLogConfig)) configureFromFile(defaultLogConfig)

module.exports = {
  configure: configure,
  getLogger: getLogger,
  dump: function() {console.log(config)},
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
