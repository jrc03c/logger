const { copy, isEqual, isUndefined, normal } = require("@jrc03c/js-math-tools")
const fs = require("node:fs")
const Logger = require(".")
const makeKey = require("@jrc03c/make-key")
const pause = require("@jrc03c/pause")

const dirs = []

afterAll(() => {
  dirs.forEach(dir => {
    fs.rmSync(dir, { force: true, recursive: true })
  })
})

test("tests that the `Logger` class works as expected", async () => {
  const root = makeKey(8)
  dirs.push(root)
  fs.mkdirSync(root)

  let logger = new Logger({
    path: root,
  })

  expect(logger.logs.length).toBe(0)

  // generic
  logger.log("Hello, world!", "INFO")
  expect(logger.logs.length).toBe(1)
  expect(logger.logs[0].message).toBe("Hello, world!")
  expect(logger.logs[0].type).toBe("INFO")
  expect(isUndefined(logger.logs[0].payload)).toBe(true)
  await pause(100)

  // info
  logger.logInfo("Goodbye, world!", { x: 3, y: 5, z: 7 })
  expect(logger.logs.length).toBe(2)
  expect(logger.logs[1].message).toBe("Goodbye, world!")
  expect(logger.logs[1].type).toBe("INFO")
  expect(isEqual(logger.logs[1].payload, { x: 3, y: 5, z: 7 })).toBe(true)
  expect(logger.logs[0].date < logger.logs[1].date).toBe(true)
  await pause(100)

  // warning
  logger.logWarning({ "this is not": "a string" })
  expect(logger.logs.length).toBe(3)

  expect(isEqual(logger.logs[2].message, { "this is not": "a string" })).toBe(
    true,
  )

  expect(logger.logs[2].type).toBe("WARNING")
  expect(isUndefined(logger.logs[2].payload)).toBe(true)
  expect(logger.logs[1].date < logger.logs[2].date).toBe(true)
  await pause(100)

  // error
  logger.logError()
  expect(logger.logs.length).toBe(4)
  expect(isUndefined(logger.logs[3].message)).toBe(true)
  expect(logger.logs[3].type).toBe("ERROR")
  expect(isUndefined(logger.logs[3].payload)).toBe(true)
  expect(logger.logs[2].date < logger.logs[3].date).toBe(true)
  await pause(100)

  // success
  logger.logSuccess("Yippee!", "Hooray!")
  expect(logger.logs.length).toBe(5)
  expect(logger.logs[4].message).toBe("Yippee!")
  expect(logger.logs[4].type).toBe("SUCCESS")
  expect(logger.logs[4].payload).toBe("Hooray!")
  expect(logger.logs[3].date < logger.logs[4].date).toBe(true)
  await pause(100)

  const origLogs = copy(logger.logs)

  // max age
  const maxAge = 100
  const dir2 = makeKey(8)
  dirs.push(dir2)
  fs.mkdirSync(dir2)

  logger = new Logger({
    path: dir2,
    maxAge,
    maxEntries: Infinity,
  })

  for (let i = 0; i < 100; i++) {
    logger.logWarning(makeKey(8), normal(10))
  }

  await pause(250)

  for (let i = 0; i < 25; i++) {
    logger.logError(makeKey(8))
  }

  expect(logger.logs.length).toBe(25)
  expect(logger.logs.every(entry => entry.type === "ERROR")).toBe(true)

  // max entries
  const maxEntries = 25
  const dir3 = makeKey(8)
  dirs.push(dir3)
  fs.mkdirSync(dir3)

  logger = new Logger({
    path: dir3,
    maxAge: Infinity,
    maxEntries,
  })

  for (let i = 0; i < 100; i++) {
    logger.logInfo(makeKey(8))
    expect(logger.logs.length).toBeLessThanOrEqual(maxEntries)
  }

  // loading
  logger = new Logger({
    path: root,
  })

  logger.load()
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
