const { copy, isEqual, isUndefined, normal } = require("@jrc03c/js-math-tools")
const fs = require("node:fs")
const Logger = require(".")
const makeKey = require("@jrc03c/make-key")
const pause = require("@jrc03c/pause")

let root

afterAll(() => {
  fs.rmSync(root, { force: true, recursive: true })
})

test("tests that the `Logger` class works as expected", async () => {
  let logger
  root = makeKey(8)

  expect(() => new Logger()).toThrow()
  expect(() => new Logger({ dir: root })).toThrow()

  fs.mkdirSync(root)

  logger = new Logger({
    dbKey: "/logs",
    dir: root,
    maxAge: Infinity,
    maxEntries: Infinity,
  })

  expect(logger.logs.length).toBe(0)

  // generic
  logger.log("Hello, world!", Logger.Entry.Type.INFO)
  expect(logger.logs.length).toBe(1)
  expect(logger.logs[0].message).toBe("Hello, world!")
  expect(logger.logs[0].type).toBe(Logger.Entry.Type.INFO)
  expect(isUndefined(logger.logs[0].payload)).toBe(true)
  await pause(100)

  // info
  logger.logInfo("Goodbye, world!", { x: 3, y: 5, z: 7 })
  expect(logger.logs.length).toBe(2)
  expect(logger.logs[1].message).toBe("Goodbye, world!")
  expect(logger.logs[1].type).toBe(Logger.Entry.Type.INFO)
  expect(isEqual(logger.logs[1].payload, { x: 3, y: 5, z: 7 })).toBe(true)

  expect(new Date(logger.logs[0].date) < new Date(logger.logs[1].date)).toBe(
    true,
  )

  await pause(100)

  // warning
  logger.logWarning({ "this is not": "a string" })
  expect(logger.logs.length).toBe(3)

  expect(isEqual(logger.logs[2].message, { "this is not": "a string" })).toBe(
    true,
  )

  expect(logger.logs[2].type).toBe(Logger.Entry.Type.WARNING)
  expect(isUndefined(logger.logs[2].payload)).toBe(true)

  expect(new Date(logger.logs[1].date) < new Date(logger.logs[2].date)).toBe(
    true,
  )

  await pause(100)

  // error
  logger.logError()
  expect(logger.logs.length).toBe(4)
  expect(isUndefined(logger.logs[3].message)).toBe(true)
  expect(logger.logs[3].type).toBe(Logger.Entry.Type.ERROR)
  expect(isUndefined(logger.logs[3].payload)).toBe(true)

  expect(new Date(logger.logs[2].date) < new Date(logger.logs[3].date)).toBe(
    true,
  )

  // success
  logger.logSuccess("Yippee!", "Hooray!")
  expect(logger.logs.length).toBe(5)
  expect(logger.logs[4].message).toBe("Yippee!")
  expect(logger.logs[4].type).toBe(Logger.Entry.Type.SUCCESS)
  expect(logger.logs[4].payload).toBe("Hooray!")

  expect(new Date(logger.logs[3].date) < new Date(logger.logs[4].date)).toBe(
    true,
  )

  const origLogs = copy(logger.logs)

  // max age
  const maxAge = 100

  logger = new Logger({
    dbKey: "/" + makeKey(8),
    dir: root,
    maxAge,
    maxEntries: Infinity,
  })

  for (let i = 0; i < 100; i++) {
    logger.logWarning(makeKey(8), normal(10))
  }

  await pause(250)

  for (let i = 0; i < 5; i++) {
    logger.logError(makeKey(8))
  }

  const now = new Date()

  expect(logger.logs.length).toBe(
    logger.logs.filter(entry => now - new Date(entry.date) <= maxAge).length,
  )

  expect(
    logger.logs.every(entry => entry.type === Logger.Entry.Type.ERROR),
  ).toBe(true)

  // max entries
  const maxEntries = 25

  logger = new Logger({
    dbKey: "/" + makeKey(8),
    dir: root,
    maxAge: Infinity,
    maxEntries,
  })

  for (let i = 0; i < 100; i++) {
    logger.logInfo(makeKey(8))
    expect(logger.logs.length).toBeLessThanOrEqual(maxEntries)
  }

  // loading
  logger = new Logger({
    dbKey: "/logs",
    dir: root,
  })

  expect(logger.logs.length).toBe(origLogs.length)

  for (let i = 0; i < logger.logs.length; i++) {
    const e1 = logger.logs[i]
    const e2 = origLogs[i]

    expect(isEqual(Object.keys(e1).toSorted(), Object.keys(e2).toSorted()))

    Object.keys(e1).forEach(key => {
      expect(isEqual(e1[key], e2[key])).toBe(true)
    })
  }
})
