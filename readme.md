# Intro

This is a simple logging tool for Node.

# Installation

```bash
npm install --save @jrc03c/logger
```

# Usage

Pick a target path where the directory will store its log entries. This can be either a file path or a directory path. If a file path is specified, then all log entries will be stored in that single file in JSON format. If a directory path is specified, then each log entry will be stored in its own file (in JSON format) within the directory. If the target path doesn't exist, you'll need to create it before using the logger.

For example, if I wanted to keep my log entries in a directory, I'd create the directory first:

```bash
mkdir -p path/to/my/logs
```

And then use the logger:

```js
const Logger = require("@jrc03c/logger")

const logger = new Logger({
  path: "path/to/my/logs",
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

- `path` = See the [`path`](#path) property.

**Optional:**

- `maxAge` = See the [`maxAge`](#maxAge) property.
- `maxEntries` = See the [`maxEntries`](#maxEntries) property.
- `shouldWriteToStdout` = See the [`shouldWriteToStdout`](#shouldWriteToStdout) property.

## Properties

### `logs`

The array of log entries.

### `maxAge`

The maximum age in milliseconds of any log entry. Entries that are older than this age are automatically deleted from the log.

### `maxEntries`

The maximum number of entries to be kept in the log. When the number of entries exceeds `maxEntries`, the most recent `maxEntries` entries are kept and the rest are deleted.

### `path`

A string representing either a file path or a directory path. If the path points to a file, then all log entries will be stored in that file in JSON format. If the path points to a directory, then each log entry will be stored in its own file (in JSON format) within the directory. If the path doesn't exist, it'll need to be created before the logger can be used.

### `shouldWriteToStdout`

A boolean indicating whether or not the logger should print its messages to stdout. True by default.

### `subscriptions`

An object containing key-value pairs that are, respectively, event names and arrays of callback functions. There's probably no need to access this property directly as it is generally controlled by the [`emit`](#emitevent-payload), [`off`](#offevent-callback), and [`on`](#onevent-callback) methods.

## Methods

### `emit(event, payload)`

Calls all callbacks that are subscribed for a particular event name (`event`), passing `payload` to them.

Emitted events include:

- `"error"` is fired when an error message is logged.
- `"info"` is fired when an info message is logged.
- `"load"` is fired when the logger instance has finished loading log entries from disk.
- `"save"` is fired when the logger instance has finished writing log entries to disk.
- `"success"` is fired when a success message is logged.
- `"warning"` is fired when a warning message is logged.

### `load()`

Loads log entries from disk. You'll almost certainly want to call this method after constructing your `Logger` instance unless you know for sure that you don't have logs on disk that you'll want to import at runtime.

### `log(message, type, payload)`

This is the generic form of all of the subsequent methods. The only difference between this and the others is that this one requires that you specify an entry `type`. I tend to prefer uppercase strings for the types, like `"INFO"`, but you're welcome to use whatever you like.

```js
logger.log("Hello, world!", "INFO", { some: "info" })
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

### `off(event, callback)`

Unsubscribes a callback function from an event.

### `on(event, callback)`

Subscribes a callback function to an event. For example:

```js
const Logger = require("@jrc03c/logger")
const logger = new Logger({ path: "path/to/my/logs" })

logger.on("load", () => {
  console.log("Loaded!")
})

logger.on("error", () => {
  console.log("Oh noes!")
})

logger.load()
```

When a logging method is invoked (e.g., `logInfo`, `logError`, etc.), the message and payload passed into that method also get passed along to all callback functions that are subscribed to the corresponding event. For example:

```js
logger.on("info", data => {
  console.log(data.message) // "Hello, world!"
  console.log(data.payload) // [1, 2, 3, 4, 5]
})

logger.logInfo("Hello, world!", [1, 2, 3, 4, 5])
```
