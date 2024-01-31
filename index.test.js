const { isEqual, isUndefined, normal } = require("@jrc03c/js-math-tools")
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
  logger.info("Goodbye, world!", { x: 3, y: 5, z: 7 })
  expect(logger.logs.length).toBe(2)
  expect(logger.logs[1].message).toBe("Goodbye, world!")
  expect(logger.logs[1].type).toBe(Logger.Entry.Type.INFO)
  expect(isEqual(logger.logs[1].payload, { x: 3, y: 5, z: 7 })).toBe(true)

  expect(new Date(logger.logs[0].date) < new Date(logger.logs[1].date)).toBe(
    true,
  )

  await pause(100)

  // warning
  logger.warn({ "this is not": "a string" })
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
  logger.error()
  expect(logger.logs.length).toBe(4)
  expect(isUndefined(logger.logs[3].message)).toBe(true)
  expect(logger.logs[3].type).toBe(Logger.Entry.Type.ERROR)
  expect(isUndefined(logger.logs[3].payload)).toBe(true)

  expect(new Date(logger.logs[2].date) < new Date(logger.logs[3].date)).toBe(
    true,
  )

  // max age
  const maxAge = 100

  logger = new Logger({
    dbKey: "/" + makeKey(8),
    dir: root,
    maxAge,
    maxEntries: Infinity,
  })

  for (let i = 0; i < 100; i++) {
    logger.warn(makeKey(8), normal(10))
  }

  await pause(250)

  for (let i = 0; i < 25; i++) {
    logger.error(makeKey(8), normal(10))
  }

  const now = new Date()

  expect(logger.logs.length).toBe(
    logger.logs.filter(entry => now - new Date(entry.date) <= maxAge).length,
  )

  expect(
    logger.logs.every(entry => entry.type === Logger.Entry.Type.ERROR),
  ).toBe(true)

  // max entries
  const maxEntries = 100

  logger = new Logger({
    dbKey: "/" + makeKey(8),
    dir: root,
    maxAge: Infinity,
    maxEntries,
  })

  for (let i = 0; i < 1000; i++) {
    logger.info(makeKey(8))
    expect(logger.logs.length).toBeLessThanOrEqual(maxEntries)
  }
})
