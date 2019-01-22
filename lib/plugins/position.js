// const levelPreset = require('../../../../lib/map/level')
// const aStar = require('a-star')
const diablo2Data = require('diablo2-data')('pod_1.13d')

function inject (bot) {
  bot.warps = []
  bot.objects = [] // This is used to store the objects around the bot
  // Think about bot.objects list clearing ? delay ? or D2GS_REMOVEOBJECT ?
  // received compressed packet D2GS_REMOVEOBJECT {"unitType":2,"unitId":16}
  bot._client.on('D2GS_ASSIGNLVLWARP', (data) => {
    bot.warps.push(data)
  })
  /*
  bot._client.on('D2GS_LOADACT', ({ areaId }) => {

    // received compressed packet D2GS_LOADACT {"act":0,"mapId":336199680,"areaId":5188,"unkwown":88448}
    // packet broken ?????????????????????

    if (bot.area !== areaId) {
      bot.say(`My area ${areaId}`)
    }
    bot.area = areaId
  })
  */
  bot._client.on('D2GS_MAPREVEAL', ({ areaId }) => {
    if (bot.area !== areaId) {
      bot.say(`My area ${areaId}`)
    }
    bot.area = areaId
  })
  bot._client.on('D2GS_WORLDOBJECT', (object) => {
    /*
    d2gsToClient :  D2GS_WORLDOBJECT {"objectType":2,"objectId":10,"objectUniqueCode":119,"x":4419,"y":5609,"state":2,
    "interactionCondition":0}
    */
    // if (bot.objects.find(ob => ob['objectId'] === object['objectId']) === undefined) { // Don't duplicate the same object
    if (bot.debug) {
      bot.say(`Detected worldobject ${diablo2Data.objects[object['objectUniqueCode']]['description - not loaded']}`)
    }
    bot.objects.push(object) // Contains the objects around me
    // }
  })
  bot._client.on('D2GS_REMOVEOBJECT', (object) => {
    /*
    received compressed packet D2GS_REMOVEOBJECT {"unitType":2,"unitId":104}
    received compressed packet D2GS_REMOVEOBJECT {"unitType":2,"unitId":103}
    received compressed packet D2GS_REMOVEOBJECT {"unitType":2,"unitId":102}
    */
    if (bot.debug) {
      bot.say(`Removed worldobject ${diablo2Data.objects[object['objectUniqueCode']]['description - not loaded']}`)
    }
    // TODO: test this
    // bot.objects.splice(bot.objects.findIndex(ob => { return ob['unitId'] === object['unitId']}), 1)
  })

  bot._client.on('D2GS_REASSIGNPLAYER', ({ x, y }) => {
    bot.x = x
    bot.y = y
  })
  bot._client.on('D2GS_WALKVERIFY', ({ x, y }) => {
    bot.x = x
    bot.y = y
  })

  // Maybe remove this
  bot.run = (x, y) => {
    bot._client.write('D2GS_RUNTOLOCATION', {
      x: x,
      y: y
    })
  }

  bot.moveToNextArea = async (teleportation) => {
    bot.say('Looking for the next level !')
    bot.say(await reachedWarp() ? 'Found the next level' : 'Could\'nt find the next level')
  }

  // Tentative to do pathfinding by exploring all 4 corners of the map
  // The bot should stop when receiving assignlvlwarp from the next area
  const DirectionsEnum = Object.freeze({ 'left': 1, 'top': 2, 'right': 3, 'bottom': 4 })

  // This will return when the teleportation is done
  async function reachedPosition (previousPos) {
    return new Promise(resolve => {
      bot.say(`arrived at ${bot.x};${bot.y}`)
      bot.say(`previousPos difference ${Math.abs(bot.x - previousPos.x)};${Math.abs(bot.y - previousPos.y)}`)
      // We check if we moved
      resolve(Math.abs(bot.x - previousPos.x) > 5 || Math.abs(bot.y - previousPos.y) > 5) // Means we hit a corner
    })
  }

  // TODO: Return the path used, to get optimized latter
  async function reachedWarp (direction = DirectionsEnum.left) {
    if (bot.warps.findIndex(warp => warp['warpId'] === bot.area + 1) === -1) { // While we didn't go near the next level warp
      return true
    }
    // Reset the direction
    if (direction === DirectionsEnum.bottom) {
      direction = DirectionsEnum.left
    }
    let reachedCorner = false
    let nextPos = { x: bot.x, y: bot.y }
    while (!reachedCorner) {
      if (direction === DirectionsEnum.left) {
        nextPos = { x: bot.x, y: bot.y + 30 }
      }
      if (direction === DirectionsEnum.top) {
        nextPos = { x: bot.x + 30, y: bot.y }
      }
      if (direction === DirectionsEnum.right) {
        nextPos = { x: bot.x, y: bot.y - 30 }
      }
      if (direction === DirectionsEnum.top) {
        nextPos = { x: bot.x - 30, y: bot.y }
      }
      let previousPos = { x: bot.x, y: bot.y }
      await bot.moveTo(true, nextPos.x, nextPos.y)
      reachedCorner = await reachedPosition(previousPos)
    }
    bot.say(`Going ${direction}`)
    await reachedWarp(direction + 1)
  }

  bot.moveTo = async (teleportation, x, y) => {
    if (x === undefined || y === undefined) {
      bot.say(`bot.moveTo incorrect coordinate undefined`)
      return false
    }
    await pf(teleportation, x, y)
  }

  // TODO: test, make it works for all type of entity
  bot.moveToEntity = async (teleportation, entityId) => {
    let entity = bot.npcs.find(npc => { return npc['id'] === entityId })
    let type = 1
    if (entity === undefined) {
      entity = bot.warps.find(warp => { return warp['unitId'] === entityId })
      if (entity === undefined) {
        entity = bot.objects.find(object => { return object['objectId'] === entityId })
      }
      type = 2
    }
    await pf(teleportation, entity['x'], entity['y'])
    bot._client.write('D2GS_RUNTOENTITY', {
      entityType: type, // 1 seems to be npc, 2 portal ...
      entityId: entityId
    })
  }

  async function pf (teleportation, x, y) {
    // const start = +new Date()
    let stuck = 0
    let step = 10
    bot.say(`My position ${bot.x} - ${bot.y}`)
    bot.say(`Heading to ${x} - ${y} by ${teleportation ? 'teleporting' : 'walking'}`)
    bot.say(`Direction ${degreeBetweenTwoPoints({ x: bot.x, y: bot.y }, { x: x, y: y }).toFixed(2)}`)
    // We'll continue till arrived at destination
    let degree
    while (Math.sqrt((bot.x - x) * (bot.x - x) + (bot.y - y) * (bot.y - y)) > 5.0) {
      const distance = Math.sqrt((bot.x - x) * (bot.x - x) + (bot.y - y) * (bot.y - y))
      bot.say(`Calculated distance ${distance.toFixed(2)}`)
      bot.say(`Am i arrived ? ${distance < 5.0}`)
      let previousPosition = { x: bot.x, y: bot.y }
      if (stuck === 0) {
        degree = degreeBetweenTwoPoints({ x: bot.x, y: bot.y }, { x: x, y: y })
      }
      bot.say(`angle ${degree}`)
      let dest = coordFromDistanceAndAngle({ x: bot.x, y: bot.y }, Math.min(distance, step), degree)
      bot.say(`Movement to ${dest.x.toFixed(2)} - ${dest.y.toFixed(2)}`)
      await movement(teleportation, dest.x, dest.y)
      if (Math.abs(previousPosition.x - bot.x) < 0.1 && Math.abs(previousPosition.y - bot.y) < 0.1) { // If the bot is stuck
        bot.say('Stuck')
        stuck += getRandomInt(0, 3)
        degree *= (2 + stuck)
        step = 3
      } else {
        stuck = 0
        step = 10
      }
    }
    bot.say(`Arrived at destination`)
  }

  function getRandomInt (min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  // This will return when the movement is done
  async function movement (teleportation, destX, destY) {
    return new Promise(resolve => {
      if (!teleportation) {
        let timeOut
        const callback = ({ x, y }) => {
          // bot.say(`endOfMovement at ${x};${y}`)
          bot.x = x
          bot.y = y
          clearTimeout(timeOut)
          resolve()
        }
        bot._client.once('D2GS_WALKVERIFY', callback)
        bot.run(destX, destY)
        timeOut = setTimeout(() => { // in case we run in a wall
          // let's assume failure then
          bot._client.removeListener('D2GS_WALKVERIFY', callback)
          resolve()
        }, 2000)
      } else {
        bot._client.once('D2GS_REASSIGNPLAYER', ({ x, y }) => {
          bot.x = x
          bot.y = y
          bot.say(`endOfMovement at ${x};${y}`)
          resolve()
        })
        bot.castSkillOnLocation(destX, destY, 53)
      }
    })
  }

  function degreeBetweenTwoPoints (a, b) {
    return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI
  }

  // Return the coordinate of a point with at a distance dist and degree angle from point point
  function coordFromDistanceAndAngle (point, dist, angle) {
    return { x: Math.cos(angle * Math.PI / 180) * dist + point.x, y: Math.sin(angle * Math.PI / 180) * dist + point.y }
  }

  bot.runToWarp = () => {
    try {
      const nextArea = bot.warps.find(warp => {
        return warp['warpId'] === bot.area + 1
      })
      bot.moveTo(false, nextArea.x, nextArea.y)
      bot.say(`Heading for the next area`)
      bot._client.removeAllListeners('D2GS_PLAYERMOVE')
      bot.follow = false
      bot.say(`Follow off`)
    } catch (error) {
      bot.say('Can\'t find any warp')
    }
  }

  bot.takeWaypoint = async (level) => {
    // Should we move this to a property of bot to avoid looping the array everytime we use the wp ? Or not
    let waypoint
    for (let i = bot.objects.length - 1; i > 0; i--) { // We start at the end, just in case, so we check the latest received objects
      if (diablo2Data.objects[bot.objects[i]['objectUniqueCode']]['description - not loaded'].includes('waypoint')) {
        waypoint = bot.objects[i]
      }
    }
    if (waypoint === undefined) { // No waypoint in my area !!!
      bot.say(`No waypoint in area ${bot.area}`)
      return false
    }
    await bot.moveTo(false, waypoint['x'], waypoint['y'])
    const area = diablo2Data.areasByName[level]
    bot._client.once('D2GS_WAYPOINTMENU', ({ unitId, availableWaypoints }) => {
      bot._client.write('D2GS_WAYPOINT', { // TODO: Handle the case where the bot aint got the wp
        waypointId: unitId,
        levelNumber: area === undefined ? level : area['id'] // Allows to use this function with the name of the level or the id
      })
    })
    await bot.moveToEntity(false, waypoint['objectId'])
    bot._client.write('D2GS_INTERACTWITHENTITY', {
      entityType: waypoint['objectType'],
      entityId: waypoint['objectId']
    })
  }

  bot.base = () => {
    bot._client.once('D2GS_PORTALOWNERSHIP', ({ ownerId, ownerName, localId, remoteId }) => {
      bot._client.write('D2GS_RUNTOENTITY', {
        entityType: 2,
        entityId: localId
      })
      bot._client.write('D2GS_INTERACTWITHENTITY', {
        entityType: 2,
        entityId: localId
      })
    })
    if (bot.checkTomes(true) > 0) {
      bot.castSkillOnLocation(bot.x, bot.y, 220) // Must have a tome of portal
    } else {
      bot._client.write('D2GS_USESCROLL', {
        type: 4,
        itemId: 1
      })
    }
  }
}

module.exports = inject
