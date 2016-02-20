//
// Run this as:
// node perftest > out 
//
var logger = require('./lib/logger') // require('consolelogger')

logger.configure({level:'info'})
var log = logger.getLogger()

console.time('write')
for (var ix = 0; ix < 1000000; ix++) {
  log.info("This is a long line xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx %d", ix + 1)
}
console.timeEnd('write')
