const sleep = ms => new Promise(r => setTimeout(r, ms))

// ----- recursive worker -----
let recursiveCount = 0

const recursiveLoop = async () => {
  recursiveCount++
  await sleep(2000)
  recursiveLoop()
}

recursiveLoop()

setInterval(() => {
  console.log('recursive created:', recursiveCount)
  console.log('heap MB:', (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2))
  console.log('----')
}, 2000)
