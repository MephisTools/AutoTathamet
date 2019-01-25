const { createBot } = require('../index')

if (process.argv.length !== 7) {
  console.log('Usage : node bot.js <username> <password> <character> <gameserver> <host>')
  process.exit(1)
}

const character = process.argv[4]
const gameServer = process.argv[5]
const host = process.argv[6]

async function start () {
  const bot = await createBot({
    host: host,
    username: process.argv[2],
    password: process.argv[3]
  })
  await bot.selectCharacter(character)
  bot.farmLoop(0, gameServer)
}

start()
