"use strict";

require('log-buffer') // patches console logging to use buffering
const fs = require('fs')
const speedDate = require('speed-date')

const defaultLogConfig = './logconfig.json'

const CATEGORY_ALL = '[all]'
const levels = ['all', 'trace', 'debug', 'info', 'warn', 'error', 'fatal', 'off']

//
// numeric level from string
//
function getLevelValue(level) {
  if (level && typeof level === 'string') {
    let ix = levels.indexOf(level)
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
    return config.levels[category].level
  }
  return getLevelValue('off')
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
// Current configuration
//------------------------------------------------------------------------------
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

function configure(obj) {
  if (!obj) return;
  if (typeof obj === 'string') return configureFromFile(obj)
  if (obj.level) config.level = getLevelValue(obj.level)
  if (obj.levels && typeof obj.levels.forEach === 'function') {
    obj.levels.forEach(function (category) {
    })
  }
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

//------------------------------------------------------------------------------
// Loggers
//------------------------------------------------------------------------------
function Logger(name) {
  this.name = name || '';
  this.level = config.level;

  this.log = function () {
    if (!arguments.length) return
    if (this.level < config.level) {
      var ts = config.dateformatter(new Date())
      var args = [level + ' ' + ts + ': ']
      for (var ix = 0; ix < arguments.length; ix++) args.push(arguments[ix])
      config.loggingFunction.apply(this, args)
    }
  }.bind(this)
}
const loggers = {}

function getLogger(name) {
  if (!name) return defaultLogger
  return new Logger(name)
}

var defaultLogger = new Logger('')

if (fileExists(defaultLogConfig)) configureFromFile(defaultLogConfig)

module.exports = {
  configure: configure,
  getLogger: getLogger,
  getLevel: function () {
    return getLevelString(config.level)
  },
  getCategoryLevel: function (category) {
    return getLevelString(getLevelForCategory(category))
  }
}
