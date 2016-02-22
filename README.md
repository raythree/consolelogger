# Console Logger

A simple, light-weight and fast console logger that uses [log-buffer](https://github.com/bahamas10/node-log-buffer) and [speed-date](https://github.com/gosquared/speed-date) for increased speed. Ideal for production if you're using PM2 to manage logs via `stdout` and you don't need log file management or other appenders. Category logging was designed to be the same as [log4js-node](https://github.com/nomiddlename/log4js-node).

Features:

* Simple configuration via options or an external JSON file
* Option to watch the external config file for dynamic re-configuration
* Uses same levels and ability to use categories as [log4js-node](https://github.com/nomiddlename/log4js-node)
* Configurable timestamps that can be turned off in production if using PM2 to generate timestamps (this increases performance significantly).

## Usage:  

```
var logger = require('consolelogger')

// default level is INFO

var log = logger.getLog()  // default logger
var app = logger.getLog('App')  // App category logger

app.info('Hello %s', 'World')
log.info('A message from the default logger')

// output
2/17/2016 8:30:33 AM: INFO: App: Hello World
2/17/2016 8:30:33 AM: INFO: A message from the default logger
```

## Configuration Options

The logger can be configured via options passed to the `config` method. If you skip the config step but the logger finds the file `./logconfig.json` it will read the configuration from there. If not found everything will default to DEBUG if `NODE_ENV` is set to development or ERROR if `NODE_ENV` is set to production. You can also pass a configuration object or the full path to a logging config file. If either the default or specified configuration file is used, a `watch` option can be enabled to dynamically change levels.

All arguments passed to the logging methods are passed to console.log. If the first argument is a string the optinal timestamp, level, and logger name will be prepended.

### Options

* `level` The log level for all loggers. Defaults to ERROR in production and DEBUG in development.
* `levels` Allows per-category levels to be specified just as in log4js-node. Note that the "[all]" category is supported, but this is the exact same thing as setting the `level` option above.
* `watch` If configured via an external JSON file you can set watch to `true` to watch for changes and dynamically change the configuration. Default is `false`.
* `timeformat` Optional function to format timestamps. This is passed to `speed-date`. To disable timestamps (for example if using PM2 to generate log timestamps) set this option to null. If not explicitely set the default timestamp format will be `YYYY-MM-DD HH:mm:ssZ`.

Example:

```
var logger = require('consolelogger')

logger.config({
	level: 'info', // default level
	levels: {
		category1: 'debug',
		category2: 'info',
		category3: 'error'
	},
	timestamp: 'YYYY-MM-DD HH:mm:ss',
	watch: false	
})

```
### Logging
Note that the default logger is directly available, so that these are the same:

```
var logger = require('consolelogger')
logger('hello')

logger.getLogger().info('hello')
```

All arguments passed are passed to console.log. If the first argument is a `string` the optional  

### Performance
Running a test to log 1 million lines:

```
[~] $ time node logtest.js | dd > out

1045+707624 records in
204861+1 records out
104888910 bytes transferred in 6.096642 secs (17204374 bytes/sec)

real	0m6.111s
user	0m5.286s
sys	0m2.640s

```

Running the same test using log4js with single console appender:

```
[~] $ time node logtest.js | dd > out

540+993360 records in
241970+1 records out
123888911 bytes transferred in 19.298922 secs (6419473 bytes/sec)

real	0m19.318s
user	0m18.282s
sys	0m3.513s
```






