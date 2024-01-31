const { parse, stringify } = require("@jrc03c/js-text-tools")
const FileDB = require("@jrc03c/filedb")
const fs = require("node:fs")

class Entry {
  static Type = {
    INFO: "INFO",
    SUCCESS: "SUCCESS",
    WARNING: "WARNING",
    ERROR: "ERROR",
  }

  date = null
  message = null
  payload = null
  type = null

  constructor(options) {
    options = options || {}
    this.date = new Date().toJSON()
    this.message = options.message
    this.payload = options.payload
    this.type = options.type

    const types = Object.keys(Entry.Type).toSorted()

    if (types.indexOf(this.type) < 0) {
      throw new Error(
        `New entries into the log must have a type that is one of these: [${types.join(", ")}] !`,
      )
    }
  }
}

class Logger {
  static Entry = Entry

  db = null
  dbKey = "/logs"
  dir = null
  logs = []
  maxAge = Infinity
  maxEntries = Infinity

  constructor(options) {
    options = options || {}

    this.dir = options.dir

    if (!this.dir || typeof this.dir !== "string") {
      throw new Error(
        `A "dir" property must be defined on the options object passed into the \`Logger\` constructor! It must be given a string value representing a filesystem path where the logger will store its files.`,
      )
    }

    if (!fs.existsSync(this.dir)) {
      throw new Error(`The directory "${this.dir}" does not exist!`)
    }

    this.db = new FileDB(this.dir)
    this.dbKey = options.dbKey || this.dbKey
    this.maxAge = options.maxAge || this.maxAge
    this.maxEntries = options.maxEntries || this.maxEntries

    this.load()
  }

  load() {
    this.logs = this.db.readSync(this.dbKey)

    if (!(this.logs instanceof Array)) {
      this.logs = []
    }

    this.logs = this.logs.map(entry => parse(entry))
    return this
  }

  log(message, type, payload) {
    this.logs.push(new Entry({ message, payload, type }))
    this.save()
    return this
  }

  error(message, payload) {
    return this.log(message, Entry.Type.ERROR, payload)
  }

  info(message, payload) {
    return this.log(message, Entry.Type.INFO, payload)
  }

  warn(message, payload) {
    return this.log(message, Entry.Type.WARNING, payload)
  }

  save() {
    // prune old entries
    const now = new Date()

    this.logs = this.logs.filter(
      entry => now - new Date(entry.date) <= this.maxAge,
    )

    // prune to the maximum number of entries
    if (this.logs.length > this.maxEntries) {
      this.logs = this.logs.slice(-this.maxEntries)
    }

    this.db.writeSync(
      this.dbKey,
      this.logs.map(entry => stringify(entry)),
    )

    return this
  }
}

module.exports = Logger
