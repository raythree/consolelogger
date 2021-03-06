# Console Logger

A simple, light-weight and fast console logger that uses [speed-date](https://github.com/gosquared/speed-date) for fast timestamps. Ideal for production if you're using PM2 to manage logs via `stdout` and you don't need log file management or other appenders. Category logging was designed to be the same as [log4js-node](https://github.com/nomiddlename/log4js-node).

Features:

* Simple configuration via options or an external JSON file
* Option to watch the external config file for dynamic re-configuration
* Uses same levels and ability to use categories as [log4js-node](https://github.com/nomiddlename/log4js-node)
* Configurable timestamps that can be turned off in production if using PM2 to generate timestamps (this increases performance significantly).
* Works in browser for selectively debugging via the console.

## Usage:  

Directly using the default logger:

```
var log = require('consolelogger')

log.info('Hello %s', 'World')

// output - default level is info
2/17/2016 8:30:33 AM: INFO: Hello World
```

Using category loggers:

```
var logger = require('consolelogger')

logger.configure({level: 'debug'})

var log = logger.getLog()  // default logger
var log1 = logger.getLog('category1')  // category loggers
var log2 = logger.getLog('category2')  
var log3 = logger.getLog('category3')  

log.info('Hello %s', 'World')
log1.info('An info message from category1')
log2.debug('A debug message from category2')
log3.trace('A trace message from category3 will not be logged')

// output
2/17/2016 8:30:33 AM: INFO: Hello World
2/17/2016 8:30:33 AM: INFO: category1: An info message from category1
2/17/2016 8:30:33 AM: DEBUG: category2: A debug message from category2
```
**NOTE:** If using in the browser for console debugging all file configuration is disabled, just pass logging options to the `configure` method.

## Configuration Options

###For Version 2.x
Due to issues with running in the browser and Webpack/dynamic requires, the logger no longer requires the ```fs``` module and does not automatically look for a default logconfig.json file. In order to configure the logger from an external file, do so like this:

```
const logger = require('simple-console-logger');
const fs = require('fs');

logger.configure('./logconfig.json', fs);
```

###For Version 1.x

The logger can be configured via options passed to the `config` method. If you skip the config step but the logger finds the file `./logconfig.json` it will read the configuration from there. If not configured the level defaults to INFO for all loggers. You can also pass a configuration object or the full path to a logging config file. If either the default or specified configuration file is used, a `watch` option can be enabled to dynamically change levels. If NODE_ENV is production the configuration file is checked for changes every `watchInterval` seconds (default is 60, minimum is 10). If in development mode `fs.watch` is used.

### Options

* `level` The log level for all loggers. Defaults to INFO. **NOTE:** that level strings are case insensitive but are always printed uppercase.
* `levels` Allows per-category levels to be specified just as in log4js-node. Note that the "[all]" category is supported to be compatible with Log4js, but this is the exact same thing as setting the `level` option above. If you set both, the `[all]` category will override.
* `watch` If configured via an external JSON file you can set watch to `true` to watch for changes and dynamically change the configuration. Default is `false`.
* `watchInterval` The time in seconds to check for configuration file changes if `watch` is `true`. Defaults to 60 seconds. The minimum value that supported is 10 seconds.
* `dateFormat` Optional function to format timestamps. This is passed to `speed-date`. To disable timestamps (for example if using PM2 to generate log timestamps) set this option to null. If not explicitely set the default timestamp format will be `YYYY-MM-DD HH:mm:ssZ`.

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
	dateFormat: 'YYYY-MM-DD HH:mm:ssZ',
	watch: false
})

// ... enable watching, using [all] category rather than level, remove timezone offset:

logger.config({
	levels: {
		'[all]': 'INFO'
		category1: 'DEBUG',
		category2: 'ERROR',
		category3: 'TRACE'
	},
	dateFormat: 'YYYY-MM-DD HH:mm:ss',
	watch: true,
	watchInterval: 10
})
```

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
