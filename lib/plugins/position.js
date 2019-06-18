const diablo2Data = require('diablo2-data')('pod_1.13d')
const { delay, distance } = require('../utils')
const Map = require('../map')
const { findPath, walkNeighborsCandidates, tpNeighborsCandidates } = require('../pathFinding')

function inject (bot) {
  bot.destination = null
  bot.warps = []
  bot.objects = [] // This is used to store the objects around the bot
  bot.map = new Map(10)
  // Think about bot.objects list clearing ? delay ? or D2GS_REMOVEOBJECT ?
  // received compressed packet D2GS_REMOVEOBJECT {"unitType":2,"unitId":16}
  bot._client.on('D2GS_ASSIGNLVLWARP', (data) => {
    bot.warps.push(data)
  })

  bot._client.on('D2GS_PORTALOWNERSHIP', ({ ownerId, ownerName, localId, remoteId }) => {
    // bot.say(`${bot.playerList.find(p => { return p.id === ownerId }).name} opened a portal`)
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
    // if (bot.objects.findIndex(ob => ob['objectId'] !== object['objectId'])) { // Don't duplicate the same object
    // bot.say(`Detected worldobject ${diablo2Data.objects[object['objectUniqueCode']]['description - not loaded']}`)
    bot.objects.push(object) // Contains the objects around me
    // }
  })
  bot._client.on('D2GS_REMOVEOBJECT', (object) => {
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

  bot.takeMasterTp = () => {
    // TODO: take portal of the master (need to know his area ... ?)
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
    if (bot.warps.findIndex(warp => warp['warpId'] === bot.area + 1) !== -1) { // While we didn't go near the next level warp
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

  function generatePosition (fromPos, d = 60) {
    const pos = { x: fromPos.x - d, y: fromPos.y - d }
    for (;pos.x < d + fromPos.x; pos.x += 20) {
      for (;pos.y < d + fromPos.y; pos.y += 20) {
        if (bot.map.getAtPosition(pos) === undefined) {
          return pos
        }
      }
    }
    return generatePosition(fromPos, d * 10)
  }

  bot.findWarp = async (teleportation) => {
    let done = false
    bot.on('D2GS_ASSIGNLVLWARP', () => {
      bot.say('I found a warp')
      done = true
    })
    while (true) {
      const pos = generatePosition({ x: bot.x, y: bot.y })
      console.log(pos)
      const r = await Promise.race([bot.moveTo(teleportation, pos.x, pos.y), delay(60000)])
      if (done || r === false) {
        return
      }
    }
  }

  bot.moveTo = async (teleportation, x, y) => {
    if (x === undefined || y === undefined) {
      bot.say(`bot.moveTo incorrect coordinate undefined`)
      return false
    }
    await pf2(teleportation, x, y)
  }

  // Function to run to an entity id, return true when arrived, false if not arrived in less than 2 seconds
  bot.runToEntity = async (type, entityId) => {
    return new Promise(resolve => {
      let timeOut
      const callbackWalkVerify = ({ x, y }) => {
        bot.x = x
        bot.y = y
        clearTimeout(timeOut)
        resolve(true)
      }
      bot._client.once('D2GS_WALKVERIFY', callbackWalkVerify)

      bot._client.write('D2GS_RUNTOENTITY', {
        entityType: type, // 1 npc, 2 object, could do an enum
        entityId: entityId
      })

      timeOut = setTimeout(() => { // in case we run in a wall
      // let's assume failure then
        bot._client.removeListener('D2GS_WALKVERIFY', callbackWalkVerify)
        resolve(false)
      }, 2000)
    })
  }

  async function pf2 (teleportation, x, y) {
    if (bot.destination !== null) {
      bot.destination = { x, y }
      await bot.pf2InternalPromise
      return
    }
    bot.destination = { x, y }
    bot.pf2InternalPromise = pf2Internal(teleportation, x, y)
  }
  async function pf2Internal (teleportation, x, y) {
    const verbose = true
    const verboseSay = (message) => {
      if (verbose) {
        bot.say(message)
      }
    }
    // const start = +new Date()
    let stuck = 0
    verboseSay(`My position ${bot.x} - ${bot.y}`)
    verboseSay(`Heading with astar to ${bot.destination.x} - ${bot.destination.y} by ${teleportation ? 'teleporting' : 'walking'}`)
    // We'll continue till arrived at destination
    let path = null
    let indexInPath = 0
    const lookForPath = () => {
      path = findPath({ x: bot.x, y: bot.y }, bot.destination, bot.map, teleportation ? tpNeighborsCandidates : walkNeighborsCandidates)
      if ((path.status !== 'success' && path.status !== 'timeout') || path.path.length < 2) {
        bot.wss.broadcast(JSON.stringify({ protocol: 'event', name: 'noPath' }))
        verboseSay('Sorry, I can\'t go there')
        console.log(path)
        bot.destination = null
        return false
      } else if (path.status === 'timeout') {
        if (path.path.length < 2) {
          bot.wss.broadcast(JSON.stringify({ protocol: 'event', name: 'noPath' }))
          verboseSay('Sorry, I can\'t go there')
          bot.destination = null
          return false
        }
        verboseSay('Searching the path took too long but I found a new path of cost ' + path.cost + ' and length ' + path.path.length + ', let\'s go !')
      } else {
        verboseSay('Found a new path of cost ' + path.cost + ' and length ' + path.path.length + ', let\'s go !')
      }
      bot.wss.broadcast(JSON.stringify({ protocol: 'event', name: 'path', params: path.path }))
      indexInPath = 1
      return true
    }
    while (distance({ x: bot.x, y: bot.y }, bot.destination) > 10.0) {
      const d = distance({ x: bot.x, y: bot.y }, bot.destination)
      verboseSay(`Calculated distance ${d.toFixed(2)}`)
      verboseSay(`Am i arrived ? ${d <= 10.0}`)
      if (path === null || indexInPath >= path.path.length) {
        if (!lookForPath()) {
          return
        }
      }
      let dest = path.path[indexInPath]
      indexInPath++
      verboseSay(`Movement from ${bot.x.toFixed(2)} - ${bot.y.toFixed(2)} to ${dest.x.toFixed(2)} - ${dest.y.toFixed(2)}`)
      const moved = await movementWithMapFilling(teleportation, dest.x, dest.y)
      if (!moved) { // If the bot is stuck
        verboseSay(`Stuck ${stuck} times`)
        stuck++
        if (!lookForPath()) {
          return
        }
      } else {
        stuck = 0
      }
    }
    bot.destination = null
    bot.pf2InternalPromise = Promise.resolve()
    verboseSay(`Arrived at destination`)
  }

  async function movementWithMapFilling (teleportation, destX, destY) {
    const previousPosition = { x: bot.x, y: bot.y }
    await movement(teleportation, destX, destY)

    const currentPosition = { x: bot.x, y: bot.y }
    const dest = { x: destX, y: destY }
    if (Math.abs(previousPosition.x - currentPosition.x) < 2 && Math.abs(previousPosition.y - currentPosition.y) < 2) { // If the bot is stuck
      let obstacle
      if (teleportation) {
        obstacle = dest
      } else {
        obstacle = dest
      }
      console.log('stuck')
      bot.map.setAtPosition(obstacle, true)
      bot.wss.broadcast(JSON.stringify({ protocol: 'event', name: 'mapPoint', params: { x: obstacle.x, y: obstacle.y, isWall: true } }))
      // bot.say(`Obstacle at ${dest.x.toFixed(2)} - ${dest.y.toFixed(2)}`)
      return false
    } else {
      console.log('no stuck')
      const nature = bot.map.getAtPosition(dest)
      if (nature === undefined) {
        bot.wss.broadcast(JSON.stringify({ protocol: 'event', name: 'mapPoint', params: { x: dest.x, y: dest.y, isWall: false } }))
        bot.map.setAtPosition(dest, false)
      }
    }
    return true
  }
  bot.run = (x, y) => {
    bot._client.write('D2GS_RUNTOLOCATION', {
      x: x,
      y: y
    })
  }

  // This will return when the movement is done
  async function movement (teleportation, destX, destY) {
    return new Promise(resolve => {
      if (!teleportation) {
        let timeOut
        const callbackWalkVerify = ({ x, y }) => {
          // bot.say(`endOfMovement at ${x};${y}`)
          bot.x = x
          bot.y = y
          clearTimeout(timeOut)
          resolve(true)
        }
        bot._client.once('D2GS_WALKVERIFY', callbackWalkVerify)
        bot.run(destX, destY)
        timeOut = setTimeout(() => { // in case we run in a wall
          // let's assume failure then
          bot._client.removeListener('D2GS_WALKVERIFY', callbackWalkVerify)
          resolve(false)
        }, 2000)
      } else {
        let timeOut
        const callback = ({ x, y }) => {
          // bot.say(`endOfMovement at ${x};${y}`)
          bot.x = x
          bot.y = y
          clearTimeout(timeOut)
          resolve(true)
        }
        bot.castSkillOnLocation(destX, destY, 53).then(() => {
          bot._client.once('D2GS_REASSIGNPLAYER', callback)
        })

        timeOut = setTimeout(() => { // in case we run in a wall
          // let's assume failure then
          bot._client.removeListener('D2GS_REASSIGNPLAYER', callback)
          resolve(false)
        }, 2000)
      }
    })
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
    // let waypoint = bot.objects.find(object => { return diablo2Data.objects[object['objectUniqueCode']]['description - not loaded'].includes('waypoint') })
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
    await bot.runToEntity(2, waypoint['objectId'])
    bot._client.write('D2GS_INTERACTWITHENTITY', {
      entityType: waypoint['objectType'],
      entityId: waypoint['objectId']
    })
  }

  bot.base = async () => {
    return new Promise(resolve => {
      // Callback that will be triggered when opening portal
      const callback = async ({ ownerId, ownerName, localId, remoteId }) => {
        await bot.runToEntity(2, localId)
        bot._client.write('D2GS_INTERACTWITHENTITY', { // Interact with it
          entityType: 2,
          entityId: localId
        })
        resolve(true)
      }
      bot._client.once('D2GS_PORTALOWNERSHIP', callback)
      if (bot.itemByType('tbk', [diablo2Data.itemEnums.ContainerType.inventory,
        diablo2Data.itemEnums.ContainerType.inventory_bottom]) !== undefined) { // If we have a tome of portal
        bot.castSkillOnLocation(bot.x, bot.y, 220)
      } else { // TODO: should check if we got scrolls in tome or inventory btw
        bot._client.write('D2GS_USEITEM', {
          itemId: 73, // Hardcoded but it's tome of portal
          x: bot.x,
          y: bot.y
        })
      }

      setTimeout(() => {
        if (bot._client.removeListener('D2GS_PORTALOWNERSHIP', callback)) {
          bot.say(`Failed to go to town`) // Maybe can happen that we didn't receive the D2GS_PORTALOWNERSHIP ?
        }
        resolve(false)
      }, 2000)
      bot.say(`Opened portal ${bot.scrolls.portal} portals left`)
    })
  }
}

module.exports = inject
