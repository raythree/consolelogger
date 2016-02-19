"use strict";

require('log-buffer') // patches console logging to use buffering

const fs = require('fs')
const speedDate = require('speed-date')
const defaultLogConfig = './logconfig.json'

const CATEGORY_ALL = '[all]'
const levels = ['all', 'trace', 'debug', 'info', 'warn', 'error', 'fatal', 'off']

function setLevel(val) {
  if (val && typeof val === 'string') {
    let ix = levels.indexOf(val)
    config.level = ix === -1 ? levels.length : ix
  }
}

function getLevelForCategory(cat) {
  if (config.levels) {
  }
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
  level: null,
  timestamps: true,
  logConfigFile: null,
  dateformatter: speedDate('YYYY-MM-DD HH:mm:ssZ'), // default
  levels: {},
  loggingFunction: console.log // can be changed for testing purposes
}

function configure(obj) {
  if (!obj) return;
  if (typeof obj === 'string') return configureFromFile(obj)

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
  var that = this;
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

// set default
setLevel('info')

var defaultLogger = new Logger('')

if (fileExists(defaultLogConfig)) configureFromFile(defaultLogConfig)

module.exports = {
  configure: configure,
  getLogger: getLogger
}
