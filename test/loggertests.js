var assert = require('assert')
var logger = require('../../consolelogger')

describe('console logger tests', function () {

  it('should export the right functions', function () {
    assert(typeof logger.getLogger === 'function')
    assert(typeof logger.configure === 'function')
    assert(typeof logger.getLevel === 'function')
    assert(typeof logger.getCategoryLevel === 'function')
  })

  it('should support level configuration', function () {
    logger.configure({level: 'off'})
    assert(logger.getLevel() === 'off')

    logger.configure({level: 'trace'})
    assert(logger.getLevel() === 'trace')

    logger.configure({level: 'debug'})
    assert(logger.getLevel() === 'debug')

    logger.configure({level: 'info'})
    assert(logger.getLevel() === 'info')

    logger.configure({level: 'warn'})
    assert(logger.getLevel() === 'warn')

    logger.configure({level: 'error'})
    assert(logger.getLevel() === 'error')

    logger.configure({level: 'fatal'})
    assert(logger.getLevel() === 'fatal')
  })

  it('should support category configuration', function () {
    logger.configure({
      level: 'info',
      levels: {
        category1: 'debug',
        category2: 'error'
      }
    })
    assert(logger.getLevel() === 'info')
    assert(logger.getCategoryLevel('category1') === 'debug')
    assert(logger.getCategoryLevel('category2') === 'error')
    assert(logger.getCategoryLevel('notfound') === 'info')  // default
  })

  it('should return the default logger', function () {
    logger.configure({
      level: 'info',
      levels: {
        category1: 'debug',
        category2: 'error'
      }
    })
    logger.getLogger()
  })
})
