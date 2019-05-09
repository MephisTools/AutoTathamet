function inject (bot) {
  bot.master = null
  bot.follow = false

  bot._client.on('D2GS_GAMECHAT', ({ charName, message }) => {
    if (message === '.master') {
      if (bot.master === null) {
        bot.say(`${charName} is now master`)
        try {
          bot.master = { id: bot.playerList.find(player => { return player.name === charName }).id, name: charName }
          bot._client.write('D2GS_PARTY', {
            actionId: 6, // TODO: what is it ? 6 invite, 7 cancel ?
            playerId: bot.playerList.find(player => { return player.name === charName }).id
          })
        } catch (error) {
          console.log(error)
          bot.say(`I don't have his id !`)
        }
      } else {
        bot.say(`${bot.master} is already master`)
      }
    }

    if (bot.master !== null) { // Just a security
      if ((message === '.follow' || message === '.followpf' || message === '.followpftp') && charName === bot.master.name) {
        const doPf = message === '.followpf'
        const doPfTp = message === '.followpftp'

        bot.follow = !bot.follow
        bot.say(bot.follow ? `Following  ${bot.master.name}` : `Stopped following  ${bot.master.name}`)

        if (!bot.follow) { // TODO: when turning follow off maybe make the bots to go to portal spot in master act (if in camp)
          bot._client.removeAllListeners('D2GS_PLAYERMOVE')
          bot._client.removeAllListeners('D2GS_PORTALOWNERSHIP')
          bot._client.removeAllListeners('D2GS_CHARTOOBJ')
        } else {
          bot._client.on('D2GS_PLAYERMOVE', ({ targetX, targetY, unitId }) => {
            if (unitId === bot.master.id) {
              if (doPf) {
                bot.moveTo(false, targetX, targetY)
              } else if (doPfTp) {
                bot.moveTo(true, targetX, targetY)
              } else {
                bot.run(targetX, targetY) // Maybe use currentX, Y ? and runtoentity ?
              }
            }
          })
          // Master opens a portal
          bot._client.on('D2GS_PORTALOWNERSHIP', ({ ownerId, ownerName, localId, remoteId }) => { // TODO: Why is this looping ?
            // bot.say(`${Buffer.from(ownerName).toString().replace(/\0.*$/g, '')}:${ownerId}:masterId:${bot.master.id} opened a portal close to me`)
            // bot.say(bot.master.id === ownerId ? `He is my master, incoming` : `He isn't my master i stay here !`)
            if (bot.master.id === ownerId) {
              bot._client.write('D2GS_RUNTOENTITY', {
                entityType: 2,
                entityId: localId
              })
              bot._client.write('D2GS_INTERACTWITHENTITY', {
                entityType: 2,
                entityId: localId
              })
            }
          })
          // Master enter a warp
          bot._client.on('D2GS_CHARTOOBJ', ({ unknown, playerId, movementType, destinationType, objectId, x, y }) => {
            if (bot.master.id === playerId) {
              bot._client.write('D2GS_RUNTOENTITY', {
                entityType: destinationType,
                entityId: objectId
              })
              bot._client.write('D2GS_INTERACTWITHENTITY', {
                entityType: destinationType,
                entityId: objectId
              })
            }
          })
        }
      }

      // .town makes the bot go to town
      if (bot.master !== null && charName === bot.master.name && message === '.town') {
        bot.base()
      }

      if (message === '.autokill' && charName === bot.master.name) {
        bot.autoKill()
      }

      if (message === '.taketp' && charName === bot.master.name) {
        bot.takeMasterTp()
      }

      if (message === '.findWarp' && charName === bot.master.name) {
        bot.findWarp(true)
      }

      if (message === '.pickup' && charName === bot.master.name) {
        bot.pickup = !bot.pickup
        bot.say(`pickup  ${bot.pickup ? 'on' : 'off'}`)
        if (!bot.pickup) {
          bot._client.removeAllListeners('D2GS_ITEMACTIONWORLD')
        } else {
          bot.initializePickit()
        }
      }

      if (message.startsWith('.item') && charName === bot.master.name && message.split(' ').length > 1) {
        bot.hasItem(message.split(' ')[1])
      }

      if (message.startsWith('.pot') && charName === bot.master.name && message.split(' ').length > 1) {
        bot.dropPot(message.split(' ')[1] === 'hp')
      }

      if (message.startsWith('.wp') && charName === bot.master.name && message.split(' ').length > 1) {
        bot.takeWaypoint(parseInt(message.split(' ')[1]))
      }

      // Debug stuff
      if (message.startsWith('.write') && charName === bot.master.name && message.split(' ').length > 1) {
        try {
          bot._client.write(message.split(' ')[1])
        } catch (error) {
          console.log(error)
        }
      }

      if (message.startsWith('.do') && charName === bot.master.name && message.split(' ').length > 1) {
        switch (message.split(' ')[1]) {
          case '1':
            bot.moveToNextArea(true)
            break
          case '2':
            bot.runToWarp()
            break
          case '3':
            bot.moveTo(true, bot.npcs[0].x, bot.npcs[0].y)
            break
          case '4':
            bot.moveTo(false, bot.npcs[0].x, bot.npcs[0].y)
            break
          case '5':
            bot.moveTo(false, bot.x + parseInt(message.split(' ')[2]), bot.y + parseInt(message.split(' ')[3]))
            break
          case '55':
            bot.moveTo(true, bot.x + parseInt(message.split(' ')[2]), bot.y + parseInt(message.split(' ')[3]))
            break
          case '6': // come -> doesn't work from far away because position unknown
            bot._client.once('D2GS_PLAYERMOVE', ({ targetX, targetY, unitId }) => {
              if (unitId === bot.master.id) {
                bot.moveTo(false, targetX, targetY)
              }
            })
            break
          case '7':
            const npc = bot.npcs.find(npc => parseInt(npc['unitId']) === parseInt(message.split(' ')[2]))
            bot.moveTo(false, npc.x, npc.y)
            break
          case '8':
            const object = bot.objects.find(npc => parseInt(npc['objectId']) === parseInt(message.split(' ')[2]))
            bot.moveTo(false, object.x, object.y)
            break
          case '9': // come -> doesn't work from far away because position unknown
            bot._client.once('D2GS_PLAYERMOVE', ({ targetX, targetY, unitId }) => {
              if (unitId === bot.master.id) {
                bot.moveTo(true, targetX, targetY)
              }
            })
            break
          case '10':
            bot.say(`Space left in container ${message.split(' ')[2]}: ${bot.spaceLeft(parseInt(message.split(' ')[2]))}`)
            break
          case '11':
            bot.stash()
            break
          case '12':
            bot.checkTown()
            break
          case '13':
            console.log(bot.checkRepair())
            console.log(bot.checkPotions())
            console.log(bot.hasItem('tbk'))
            break
        }
      }

      if (message.startsWith('.move') && charName === bot.master.name && message.split(' ').length > 3) {
        bot.moveTo(message.split(' ')[1] === 'tp', bot.x + parseInt(message.split(' ')[2], 10), bot.y + parseInt(message.split(' ')[3], 10))
      }

      if (message.startsWith('.npc') && charName === bot.master.name && message.split(' ').length > 1) {
        if (bot.area === undefined) {
          return
        }
        switch (message.split(' ')[1]) {
          case 'heal':
            bot.reachNpc(bot.tasks[bot.area].heal)
            break
          case 'repair':
            bot.reachNpc(bot.tasks[bot.area].repair)
            break
          case 'gamble':
            bot.reachNpc(bot.tasks[bot.area].gamble)
            break
          case 'shop':
            bot.reachNpc(bot.tasks[bot.area].shop)
            break
        }
      }
    }
  })
}

module.exports = inject
