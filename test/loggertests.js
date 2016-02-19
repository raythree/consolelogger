var assert = require('assert')
var logger = require('../../consolelogger')

describe('console logger tests', function () {

  it('should export the right functions', function () {
    assert(typeof logger.getLogger === 'function')
    assert(typeof logger.configure === 'function')
    assert(typeof logger.getLevel === 'function')
    assert(typeof logger.getCategoryLevel === 'function')
  })

  it('should support configuration', function () {
    logger.configure({
      level: 'debug'
    })
    assert(logger.getLevel() === 'debug')
    assert(logger.getCategoryLevel('none') === 'off')

    logger.configure({
      level: 'all'
    })
    assert(logger.getLevel() === 'all')

  })

})
