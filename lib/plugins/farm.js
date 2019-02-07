function inject (bot) {
  function randomString () {
    const possible = 'abcdefghijklmnopqrstuvwxyz'
    let randomString = ''

    for (let i = 0; i < 5; i++) { randomString += possible.charAt(Math.floor(Math.random() * possible.length)) }
    return randomString
  }

  // This is supposed to farm one or multiple scripts like killing mephisto, doing a quest, cow level, rushing a mule ... in a loop
  bot.farmLoop = async (scriptToFarm, gameServer) => {
    let nbRuns = 100
    while (nbRuns > 0) {
      await bot.createGame(randomString(), randomString(), gameServer, 0)
      bot.checkTown()
      bot.takeWaypoint()
      // Pathfinding here
      bot.exit()
      nbRuns--
    }
  }
  // Work in progress, doesn't work
  bot.mephisto = async () => {
    const diablo2Data = require('diablo2-data')('pod_1.13d')
    // The goal of this function is to
    // Check before these steps: is there fucking travincal mobs at the middle (near red portal)
    // throwing hydra on us (we die trying to kill Mephisto), if yes => kill them (very often light / fire immune) / go to next script
    // 1 - Make the bot teleport in front of Mephisto
    // 2- Mephisto will come near the bot, under a treshold of distance, the bot teleport to the bottom one time
    // 3 - And repeat 2 until Mephisto is stuck at a point we can hit him with far range spell such as Lightning (Lightning surge in pod)
    // 4 - Teleport to the bottom (spot where we can hit Mephisto and he can't hit the bot)
    // 5 - Spam spell until he dies, pickup items, leave
    bot.moat = async () => {
      let mephisto
      bot.moveTo(true, 17563, 8072)
      bot._client.once('D2GS_ASSIGNNPC', (data) => {
        if (data['unitCode'] === diablo2Data.monstersByName['Mephisto']) {
          mephisto = data
        }
      })
      const callback = (data) => {
        if (data['unitCode'] === diablo2Data.monstersByName['Mephisto']) {
          mephisto = data
        }
      }
      bot._client.on('D2GS_NPCMOVE', callback)
      bot._client.once('D2GS_REPORTKILL', (data) => {
        bot._client.removeListener('D2GS_NPCMOVE', callback)
      })

      // Listen for the event.
      bot.on('closeEnoughToMe', () => {
        bot.moveTo(bot.x + 10, bot.y + 5)
      })

      while (mephisto['x'] === 99999 && mephisto['y'] === 99999) { // TODO: hardcode wanted mephisto position
        if (/* distance({ x: bot.x, y: bot.y }, { x: mephisto['x'], y: mephisto['y'] }) < 10 */bot === 'standardfaispaschier') {
          bot.emit('closeEnoughToMe')
        }
      }
      // Ok we're ready to kill him
      return mephisto
    }

    bot.checkTown()
    bot.takeWaypoint(101)
    // bot.doPrecast(true)

    if (!bot.moveToNextArea(true)) {
      throw new Error('Failed to move to Durance Level 3')
    }

    bot.moveTo(17566, 8069)

    const mephisto = bot.moat()

    bot.kill(mephisto)

    // bot.pickItems()
  }
}
module.exports = inject
