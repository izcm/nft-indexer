const sleep = ms => new Promise(r => setTimeout(r, ms))

let created = 0

async function start() {
  created++
  while (true) {
    await sleep(1000)
  }
}

start()

setInterval(() => {
  console.log('async instances created:', created)
  console.log('memory:', process.memoryUsage().heapUsed / 1024 / 1024, 'MB')
}, 1000)
