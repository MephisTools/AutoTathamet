const diablo2Data = require('diablo2-data')('pod_1.13d')
function inject (bot) {
  // Idk what name should it has
  // When joining a game you get D2GS_ITEMACTIONOWNED for each items you have equipped,
  // D2GS_ITEMACTIONWORLD for each item in your inventory / stash
  // Save our items in arrays
  bot.inventory = []
  const itemCallback = (item) => {
    bot.inventory.push(item)
  }
  bot._client.on('D2GS_ITEMACTIONOWNED', itemCallback)
  bot._client.on('D2GS_ITEMACTIONWORLD', itemCallback)

  // We stop this behaviour after having saved all our inventory
  setTimeout(() => {
    bot._client.removeListener('D2GS_ITEMACTIONOWNED', itemCallback)
    bot._client.removeListener('D2GS_ITEMACTIONWORLD', itemCallback)
  }, 5000)

  // More oriented for followbot
  bot.pickupEveryItems = () => {
    bot._client.on('D2GS_ITEMACTIONWORLD', (item) => {
      bot._client.write('D2GS_RUNTOENTITY', {
        entityType: 4,
        entityId: item['id'] // 2nd element seems to be the id
      })
      bot._client.write('D2GS_PICKUPITEM', { // Possible action IDs: 0x00 - Move item to inventory 0x01 - Move item to cursor buffer
        unitType: 4,
        unitId: item['id']
      })
      bot._client.once('D2GS_REMOVEOBJECT', ({ unitType, unitId }) => { // Maybe its not optimal ? (not sure it's me who picked it)
        bot.inventory.push(item)
      })
      /*
        D2GS_PICKUPITEM {"unitType":4,"unitId":52,"actionId":0}
        d2gsToClient :  D2GS_REMOVEOBJECT {"unitType":4,"unitId":52}
        d2gsToClient :  D2GS_ITEMACTIONWORLD {"entityType":4,"unknown2":[5,52,0,0,0,16,0,128,0,101,0,82,242,6,199,6,130,128,32,16,128,192,127]}
        */
    })

    // toclient D2GS_ITEMACTIONWORLD {"unknown1":0,"unknown2":[16,86,0,0,0,16,32,160,0,101,204,101,2,8,227,140,141,12,196,0,0]}
    // toserver D22GS_RUNTOENTITY {"entityType":4,"entityId":86}
    // toserver D2GS_PICKUPITEM {"unitType":4,"unitId":86,"actionId":0}
  }

  // TODO: handle pickit
  bot.pickit = (config) => {
    // Context: the bot is farming, an item fell on the ground
    bot._client.on('D2GS_ITEMACTIONWORLD', (item) => {
      bot.groundItems.push(item)
      // Check limited stuff (keys, potions, id scroll, portal scroll, quest ...) if we need to pickit or not
      // Check if we have pickit for it in the config and if we have space
      // If yes take, remove from groundItems, check space, go drop stuff in stash if full
      // Else, leave it on the ground, remove the item from groundItems after a few secs ?
      // TODO: FINISH THIS
      bot._client.once('D2GS_REMOVEOBJECT', ({ unitType, unitId }) => { // Maybe its not optimal ? (not sure it's me who picked it)
        const index = bot.groundItems.indexOf(bot.groundItems.find(item => { return item['id'] === unitId })) // Does this works ?
        if (index > -1) {
          bot.groundItems.splice(index, 1)
        }
      })
    })
  }

  // Drop a potion of health ? health : mana
  bot.dropPot = (health) => {
    try {
      const potion = bot.inventory.find(item => { return item['type'].includes(health ? 'hp' : 'mp') })
      console.log('found potion', potion)
      // if (potion['container'] === 2) { // 2 = inventory
      bot._client.write('D2GS_DROPITEM', {
        itemId: potion['id']
      })
      // }
      // if (potion['container'] === 0) { // 0 = belt
      bot._client.write('D2GS_REMOVEBELTITEM', {
        itemId: potion['id']
      })
      // }
    } catch (error) {
      console.log(error)
    }
  }

  // Do i have this item ?
  bot.hasItem = (name) => {
    try {
      bot.say(bot.inventory.find(item => item['name'].includes(name)) ? `I have ${name}` : `I don't have ${name}`)
    } catch (error) {
      console.log(error)
    }
  }

  // This should check my space left in the inventory
  bot.spaceLeft = (where) => {
    // TODO: sniff cube and trade storage
    // Containers
    // 0 = body
    // 2 = inventory
    // 10 = stash
    // 32 = belt
    // shops: first tab 130, second tab 132, third tab 134, fourth tab seems to be 2?
    let space = 0
    if (where === 0) {
    } else if (where === 2) {
      space = 90
    } else if (where === 10) {
      space = 100
    } else if (where === 32) {
      space = 16 // TODO: dynamic size depending on the belt size
    } else if (where === 130) {
      space = 100
    } else if (where === 132) {
      space = 100
    } else if (where === 134) {
      space = 100
    }
    bot.inventory.forEach(item => {
      if (item['container'] === where) {
        space -= item['width'] * item['height']
      }
    })
    return space
  }

  // Put everything in the stash except the required stuff (set a parameter for things we wanna always keep such as book scroll, charms ...)
  // Put extra gold in stash ...
  bot.stash = () => {
    /*
      d2gsToServer : D2GS_RUNTOENTITY {"entityType":2,"entityId":17}
      d2gsToServer : D2GS_RUNTOENTITY {"entityType":2,"entityId":17}
      d2gsToServer : D2GS_INTERACTWITHENTITY {"entityType":2,"entityId":17}
      d2gsToClient :  D2GS_TRADEACTION {"requestType":16}
    */
    // let stash = bot.objects.find(object => { return object['objectUniqueCode'] === diablo2Data.objectsByName['stash']['Id'] })
    let stash
    for (let i = bot.objects.length - 1; i > 0; i--) { // We start at the end, just in case, so we check the latest received objects
      // console.log('loool', diablo2Data.objects[bot.objects[i]['objectUniqueCode']]['Name'])
      if (diablo2Data.objects[bot.objects[i]['objectUniqueCode']]['Name'].includes('bank')) {
        stash = bot.objects[i]
      }
    }
    if (stash === undefined) { // No waypoint in my area !!!
      bot.say(`No stash in area ${bot.area}`)
      return false
    }
    bot.moveToEntity(false, stash['objectId'])
    bot._client.write('D2GS_INTERACTWITHENTITY', {
      entityType: 2,
      entityId: stash['objectId']
    })
    bot._client.on('D2GS_TRADEACTION', (data) => {
      // Move stuff
    })
  }
}

module.exports = inject
