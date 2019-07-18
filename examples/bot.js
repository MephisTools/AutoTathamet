const { createBot } = require('../index')

var ArgumentParser = require('argparse').ArgumentParser
var parser = new ArgumentParser({
  version: '1.4.1',
  addHelp: true,
  description: 'Simple bot'
})
parser.addArgument([ '-au', '--username' ], { required: true })
parser.addArgument([ '-ap', '--password' ], { required: true })
parser.addArgument([ '-c', '--character' ], { required: true })
parser.addArgument([ '-gn', '--gameName' ], { required: true })
parser.addArgument([ '-gp', '--gamePassword' ], { required: true })
parser.addArgument([ '-gs', '--gameServer' ], { required: true })
parser.addArgument([ '-s', '--sidServer' ], { required: true })
parser.addArgument([ '-dv', '--diabloVersion' ], { defaultValue: '1.14' }) // How do we use version.js from diablo2-protocol ?
parser.addArgument([ '-k1', '--keyClassic' ], { required: true })
parser.addArgument([ '-k2', '--keyExtension' ], { required: true })
parser.addArgument([ '-dp', '--delayPackets' ], { defaultValue: 500 }) // Only servers with anti hack system should use delay between packets

const { username, password, character, gameName, gamePassword, gameServer, sidServer, diabloVersion, keyClassic, keyExtension, delayPackets } = parser.parseArgs()

async function start () {
  const bot = await createBot({
    host: sidServer,
    username,
    password,
    version: diabloVersion,
    keyClassic,
    keyExtension,
    delayPackets
  })
  await bot.selectCharacter(character)
  await bot.createGame(gameName, gamePassword, gameServer, 0)
}

start()
