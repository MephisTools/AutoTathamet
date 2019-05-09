const Utils = require('../utils')

function inject (bot) {
  bot.toKill = [] // List of mobs to kill
  bot.killEverything = false
  bot.attacking = false
  bot.clear = async () => {
    return new Promise(resolve => {
      resolve()
    })
  }
  bot.killAllTargets = async () => {
    // return new Promise(resolve => {
    bot.attacking = true
    let skip = false
    const timeOut = setTimeout(() => {
      bot.say(`Skipping these mobs`)
      skip = true
    }, 20000)
    while (bot.toKill.length > 0) { // While there is mobs to kill or we skip them after a time
      bot.say(`Monsters left to kill  ${bot.toKill.length}`)
      let closestMob = bot.toKill[0]
      /*
      for (let mob in bot.toKill) { // Let's find the closest mob
        let currentDistance = Utils.distance({ x: bot.x, y: bot.y }, { x: mob.x, y: mob.y })
        if (closestMob === undefined || currentDistance < Utils.distance({ x: bot.x, y: bot.y }, { x: closestMob.x, y: closestMob.y })) {
          closestMob = mob
        }
      }
      */
      if (closestMob === undefined || skip) {
        return
      }
      await bot.kill(closestMob)
      bot.say(`Next mob ${closestMob.id}`)
      // Once we found the closest mob, throw ability on it until it dies
      // bot.castSkill(unitId, type, 49)
      // await Utils.delay(10000)
    }
    //  resolve()
    // })
    bot.toKill = []
    clearTimeout(timeOut)
    bot.attacking = false
  }

  bot.kill = async (mob) => {
    // If we can't kill the mob in few secs, skip
    let skip = false
    const timeOut = setTimeout(() => { // TODO: maybe skip condition would be if life didn't change overtime idk (for bosses ...)
      bot.say(`Skipping this mob`)
      bot.toKill.splice(bot.toKill.findIndex(m => { return m.id === mob.id }), 1)
      console.log(`toKill ${bot.toKill}`)
      skip = true
    }, 2000)
    while (bot.toKill.find(m => m.id === mob.id)) { // While this mob isn't dead
      await bot.castSkillOnLocation(mob.x, mob.y, 49)
      // bot.castSkillOnEntity(0, mob.id, 49)
      await Utils.delay(300) // If the delay is too short, your spell won't do any dmg (prob a server side protection ;))
      if (skip) {
        return
      }
    }
    clearTimeout(timeOut)
    bot.say(`I killed ${mob.id}`)
  }

  bot.addTarget = (id, x, y) => {
    // If it's not already in the list
    if (!bot.toKill.find(mob => mob.id === id)) {
      bot.say(`New target to kill ${id}`)
      bot.toKill.push({ id: id, x: x, y: y })
      if (!bot.attacking) { // Just one attack loop at once
        bot.killAllTargets()
      }
    }
  }

  bot.autoKill = () => {
    bot.killEverything = !bot.killEverything
    bot.say(`killEverything  ${bot.killEverything ? 'on' : 'off'}`)
    if (!bot.killEverything) {
      bot._client.removeAllListeners('D2GS_NPCMOVE')
      bot._client.removeAllListeners('D2GS_NPCMOVETOTARGET')
      bot._client.removeAllListeners('D2GS_NPCATTACK')
      bot._client.removeAllListeners('D2GS_REPORTKILL')
      bot.toKill = [] // Clear the list
    } else {
      /*
      // TODO: Find a way to not add non-killable npc (either traders or other idk izual body ..)
      bot._client.on('D2GS_NPCMOVE', ({ unitId, type, x, y }) => {
        bot.addTarget(unitId, x, y)
      })
      */
      bot._client.on('D2GS_NPCMOVETOTARGET', ({ unitId, type, x, y }) => {
        bot.addTarget(unitId, x, y)
      })
      // Atm only attack npc that attack
      bot._client.on('D2GS_NPCATTACK', ({ unitId, attackType, targetId, targetType, x, y }) => {
        bot.addTarget(unitId, x, y)
      })
      bot._client.on('D2GS_REPORTKILL', ({ unitId, type, x, y }) => {
        bot.toKill.splice(bot.toKill.findIndex(mob => { return mob.id === unitId }), 1)
      })
    }
  }
}

module.exports = inject
