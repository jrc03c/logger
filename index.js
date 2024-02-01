const { fg, fx } = require("@jrc03c/bash-colors")
const fs = require("node:fs")
const makeKey = require("@jrc03c/make-key")
const path = require("node:path")

const COLORS = {
  ERROR: fg.red,
  INFO: fg.blue,
  OTHER: fx.bright,
  SUCCESS: fg.green,
  WARNING: fg.yellow,
}

function writeToStdout(message, type, payload, filename) {
  const color = COLORS[type] || COLORS["OTHER"]
  console.log("-----")

  console.log(
    `${fx.bright(color(type.toUpperCase()))} ${fx.dim(color("[" + new Date().toUTCString() + "]"))}: ${message}` +
      (payload ? ` See "${filename}" to inspect this message's payload.` : ""),
  )
}

class Logger {
  logs = []
  maxAge = Infinity
  maxEntries = Infinity
  path = null
  shouldWriteToStdout = true
  subscriptions = {}

  constructor(options) {
    options = options || {}

    this.path = options.path

    if (!this.path || typeof this.path !== "string") {
      throw new Error(
        `A "path" property must be defined on the options object passed into the \`Logger\` constructor! It must be given a string value representing a filesystem path where the logger will store its files. If the path points to a single file, then the logger will write all entries into that file. If the path points to a directory, then the logger will create a file for each entry within that directory.`,
      )
    }

    this.maxAge = options.maxAge || this.maxAge
    this.maxEntries = options.maxEntries || this.maxEntries

    this.shouldWriteToStdout =
      typeof options.shouldWriteToStdout === "undefined"
        ? this.shouldWriteToStdout
        : options.shouldWriteToStdout
  }

  emit(channel, payload) {
    if (this.subscriptions[channel]) {
      this.subscriptions[channel].forEach(callback => {
        callback(payload)
      })
    }

    return this
  }

  getEntryFSPath(entry) {
    if (fs.statSync(this.path).isFile()) {
      return this.path
    } else {
      const date = new Date(entry.date)
      const year = date.getFullYear()
      const month = date.getMonth().toString().padStart(2, "0")
      const day = date.getDate().toString().padStart(2, "0")
      const hours = date.getHours().toString().padStart(2, "0")
      const minutes = date.getMinutes().toString().padStart(2, "0")
      const seconds = date.getSeconds().toString().padStart(2, "0")
      const millis = date.getMilliseconds().toString().padStart(4, "0")

      const filename = [
        year,
        month,
        day,
        hours,
        minutes,
        seconds,
        millis,
        entry.id,
      ].join("-")

      return path.join(this.path, filename)
    }
  }

  load() {
    // read from disk
    if (!fs.existsSync(this.path)) {
      throw new Error(`The path "${this.path}" does not exist!`)
    }

    const stat = fs.statSync(this.path)

    if (stat.isFile()) {
      try {
        const raw = fs.readFileSync(this.path, "utf8")
        this.logs = JSON.parse(raw)
      } catch (e) {
        this.logs = []
      }
    } else {
      const files = fs.readdirSync(this.path)

      try {
        this.logs = files.map(f =>
          JSON.parse(fs.readFileSync(path.join(this.path, f), "utf8")),
        )
      } catch (e) {
        this.logs = []
      }
    }

    this.logs.forEach(entry => {
      Object.keys(entry).forEach(key => {
        if (typeof entry[key] === "undefined") {
          delete entry[key]
        }
      })
    })

    this.emit("load")
    return this
  }

  log(message, type, payload) {
    const date = new Date().toJSON()
    const id = makeKey(8)
    const entry = { date, id, message, payload, type }
    this.logs.push(entry)

    if (this.shouldWriteToStdout) {
      const file = this.getEntryFSPath(entry)
      writeToStdout(message, type, payload, file)
    }

    this.save()
    return this
  }

  logError(message, payload) {
    this.emit("error", { message, payload })
    return this.log(message, "ERROR", payload)
  }

  logInfo(message, payload) {
    this.emit("info", { message, payload })
    return this.log(message, "INFO", payload)
  }

  logSuccess(message, payload) {
    this.emit("success", { message, payload })
    return this.log(message, "SUCCESS", payload)
  }

  logWarning(message, payload) {
    this.emit("warning", { message, payload })
    return this.log(message, "WARNING", payload)
  }

  off(channel, callback) {
    if (this.subscriptions[channel]) {
      const index = this.subscriptions[channel].indexOf(callback)

      if (index > -1) {
        this.subscriptions[channel].splice(index, 1)
      }
    }

    return this
  }

  on(channel, callback) {
    if (!this.subscriptions[channel]) {
      this.subscriptions[channel] = []
    }

    this.subscriptions[channel].push(callback)
    return this
  }

  save() {
    // tree-shake unused properties
    this.logs.forEach(entry => {
      Object.keys(entry).forEach(key => {
        if (typeof entry[key] === "undefined") {
          delete entry[key]
        }
      })
    })

    // prune old entries
    const now = new Date()

    this.logs = this.logs.filter(
      entry => now - this.maxAge < new Date(entry.date),
    )

    // prune to the maximum number of entries
    if (this.logs.length > this.maxEntries) {
      this.logs = this.logs.slice(-this.maxEntries)
    }

    // write to disk
    if (!fs.existsSync(this.path)) {
      throw new Error(`The path "${this.path}" does not exist!`)
    }

    const stat = fs.statSync(this.path)

    if (stat.isFile()) {
      fs.writeFileSync(this.path, JSON.stringify(this.logs, null, 2), "utf8")
    } else {
      this.logs.forEach(entry => {
        const file = this.getEntryFSPath(entry)
        fs.writeFileSync(file, JSON.stringify(entry, null, 2), "utf8")
      })
    }

    this.emit("save")
    return this
  }
}

module.exports = Logger
