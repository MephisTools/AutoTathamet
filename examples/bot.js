const { createBot } = require('../index')
const { randomString } = require('../lib/utils')

if (process.argv.length !== 9) {
  console.log('Usage : node bot.js <username> <password> <character> <gamename> <gamepasswd> <gameserver> <host>')
  process.exit(1)
}

let randomGame = randomString(5)

if (process.argv[5] === 'rand') { console.log('connecting to randomGame ' + randomGame) }

const character = process.argv[4]
const gameName = process.argv[5] === 'rand' ? randomGame : process.argv[5]
const gamePassword = process.argv[6] === 'none' ? '' : process.argv[6]
const gameServer = process.argv[7]
const host = process.argv[8]

async function start () {
  const bot = await createBot({
    host: host,
    username: process.argv[2],
    password: process.argv[3]
  })
  await bot.selectCharacter(character)
  await bot.createGame(gameName, gamePassword, gameServer, 0)
}

start()
