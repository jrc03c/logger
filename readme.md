# Intro

This is a simple logging tool for Node.

# Installation

```bash
npm install --save @jrc03c/logger
```

# Usage

Pick a directory in which the logger should store its files. If the directory doesn't exist, you'll need to create it before using the logger.

```bash
mkdir -p path/to/my-logs
```

```js
const Logger = require("@jrc03c/logger")

const logger = new Logger({
  dir: "path/to/my-logs",
})

logger.logInfo("Hello, world!")
logger.logSuccess("YISSSSS!!!", [1, 2, 3, 4, 5])
logger.logWarning("Uh-oh!", { hereIs: "more info" })
logger.logError("Crap!" { stuff: { broke: { real: "good" } } })
```

Log entries are automatically timestamped and saved to disk.

# API

## Constructor

### `Logger(options)`

The options object passed into the constructor can have these properties and corresponding values:

**Required:**

- `dir` = See the [`dir`](#dir) property.

**Optional:**

- `dbKey` = See the [`dbKey`](#dbKey) property.
- `maxAge` = See the [`maxAge`](#maxAge) property.
- `maxEntries` = See the [`maxEntries`](#maxEntries) property.

## Properties

### `db`

The `FileDB` instance that handles writing to and reading from disk. Check out the documentation for FileDB [here](https://github.com/jrc03c/filedb).

### `dbKey`

The is a string representing the key under which values are written in the database. If you're familiar with [FileDB](https://github.com/jrc03c/filedb), which has a `write(key, value)` method, then you can think of this property as the `key` argument to that method. In practice, and on disk, it becomes a subdirectory of `dir`.

### `dir`

The filesystem directory in which the logger will store its files.

### `logs`

The array of log entries.

### `maxAge`

The maximum age in milliseconds of any log entry. Entries that are older than this age are automatically deleted from the log.

### `maxEntries`

The maximum number of entries to be kept in the log. When the number of entries exceeds `maxEntries`, the most recent `maxEntries` entries are kept and the rest are deleted.

## Methods

### `log(message, type, payload)`

This is the generic form of all of the subsequent methods. The only difference between this and the others is that this one requires that you specify an entry `type`. Options are: `"ERROR"`, `"INFO"`, `"SUCCESS"`, or `"WARNING"`. Those options can also be found under `Logger.Entry.Type`. For example:

```js
logger.log("Hello, world!", Logger.Entry.Type.INFO, { some: "info" })
```

Because this method requires a more verbose call, there's really no reason to prefer it over the methods below. In fact, all of the methods below really just call this method!

Note that entries are saved to disk at the end of each `log` method call.

### `logError(message, payload)`

Logs an error message.

### `logInfo(message, payload)`

Logs an info message.

### `logSuccess(message, payload)`

Logs a success message.

### `logWarning(message, payload)`

Logs a warning message.
