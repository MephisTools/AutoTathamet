const diablo2Data = require('diablo2-data')('pod_1.13d')
const fs = require('fs')
const path = require('path')
function inject (bot) {
  // Idk what name should it has
  // When joining a game you get D2GS_ITEMACTIONOWNED for each items you have equipped,
  // D2GS_ITEMACTIONWORLD for each item in your inventory / stash
  // Save our items in arrays
  bot.inventory = []
  bot.groundItems = []
  bot.pickit = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../pickitExample.json'), 'utf8'))
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

  bot.pickGroundItem = (item) => {
    bot._client.write('D2GS_RUNTOENTITY', {
      entityType: 4,
      entityId: item['id'] // 2nd element seems to be the id
    })
    bot._client.write('D2GS_PICKUPITEM', { // Possible action IDs: 0x00 - Move item to inventory 0x01 - Move item to cursor buffer
      unitType: 4,
      unitId: item['id']
    })
    bot._client.once('D2GS_REMOVEOBJECT', ({ unitType, unitId }) => { // Maybe its not optimal ? (not sure it's me who picked it)
      bot.say(`Picked up ${item['name']}`)
      if (item['id'] === unitId) {
        bot.inventory.push(item)
      }
      const index = bot.groundItems.findIndex(item => { return item['id'] === unitId }) // Does this works ?
      if (index > -1) {
        bot.groundItems.splice(index, 1)
      }
    })
  }

  // Returns:
  // -1 - Needs iding
  // 0 - Unwanted
  // 1 - NTIP wants
  // 2 - Cubing wants
  // 3 - Runeword wants
  // 4 - Pickup to sell (triggered when low on gold)
  bot.checkItem = (item) => {
    /*
    if (CraftingSystem.checkItem(unit)) {
      return {
        result: 5,
        line: null
      }
    }

    if (Cubing.checkItem(unit)) {
      return {
        result: 2,
        line: null
      }
    }

    if (Runewords.checkItem(unit)) {
      return {
        result: 3,
        line: null
      }
    }
    */
    // TODO: handle cubing, runeword, craft (not urgent at all)
    let itemData
    if (item['is_armor']) {
      itemData = diablo2Data.armor.find(a => a['code'] === item['type'])
    }
    if (item['is_weapon']) {
      itemData = diablo2Data.weapons.find(w => w['code'] === item['type'])
    }
    // It means it's probably a misc item since it's not armor or weapon
    if (itemData === undefined) {
      itemData = diablo2Data.misc.find(m => m['code'] === item['type'])
    }
    // It means we didn't find any data about this item in the txt files (can occur when new item ...)
    if (itemData === undefined) {
      return false
    }
    // console.log(item)
    // console.log(itemData)
    for (let condition of bot.pickit['conditions']) {
      // If the item is in our condition of picking
      // Could we loop over all json properties and compare ? Would be a lot cleaner
      // console.log(item['name'], condition['name'], item['quality'], condition['quality'], item['ethereal'], condition['ethereal'])
      // Either we select an item over name, either over type
      if ((condition.hasOwnProperty('name') && item['name'].toLowerCase() === condition['name']) ||
      (condition.hasOwnProperty('type') && item['type'] === condition['type'])
      /* && item['quality'] === condition['quality'] && item['ethereal'] === condition['ethereal'] */) {
        console.log('Name / type correspond')
        // If there is no properties condition, just name and basic stuff
        if (!condition.hasOwnProperty('properties')) {
          return true
        }
        let correspondingProperties = 0
        condition['properties'].forEach(conditionProperty => {
          item['properties'].forEach(itemProperty => {
            console.log(conditionProperty, itemProperty)
            // Means we find a corresponding property
            if (itemProperty['name'] === conditionProperty['name']) {
              console.log('Property correspond')
              // TODO: Find cleaner solution for operator
              // Checking if the found property is at our wanted value
              if (conditionProperty['operator'] === '=') {
                if (itemProperty['value'] === conditionProperty['value']) {
                  correspondingProperties++
                }
              } else if (conditionProperty['operator'] === '>') {
                if (itemProperty['value'] > conditionProperty['value']) {
                  correspondingProperties++
                }
              } else if (conditionProperty['operator'] === '<') {
                if (itemProperty['value'] < conditionProperty['value']) {
                  correspondingProperties++
                }
              }
            }
          })
        })
        // If we have the corresponding properties we wanted, return true
        if (condition['properties'].length === correspondingProperties) {
          // We also could imagine something like "more or less" these properties
          // So if an item drop which is close to our needs but not in our condition, would still pick it
          return true
        }
      }
    }

    // If total gold is less than 10k pick up anything worth 10 gold per square to sell in town.
    if (bot.gold < 10000) {
      // Gold doesn't take up room, just pick it up
      if (item['type'] === 'gld') {
        return true
      }

      if (itemData['cost'] / (item['width'] * item['height']) >= 10) {
        return true
      }
    }
    return false
  }

  // TODO: handle pickit
  bot.initializePickit = () => {
    if (bot.pickit === undefined) {
      bot.say(`No pickit setup - aborted`)
      return false
    }
    // Context: the bot is farming, an item fell on the ground
    bot._client.on('D2GS_ITEMACTIONWORLD', (item) => {
      if (!item['ground']) {
        return
      }
      bot.say(`${item['name']} has fallen`)
      bot.groundItems.push(item)
      // If yes take, remove from groundItems, check space, go drop stuff in stash if full
      if (bot.checkItem(item)) {
        bot.say(`I'm gonna pick ${item['name']}`)
        bot.pickGroundItem(item)
      } // Else, leave it on the ground, remove the item from groundItems after a few secs ?
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

  // Maybe for both these functions we should exclude stash ? Or add where param idk
  // Do i have this item ? (for example tbk is town book of portal)
  bot.hasItem = (type) => {
    return bot.inventory.find(item => item['type'].includes(type))
  }

  // Return quantity of this item
  bot.hasItems = (type) => {
    let quantity = 0
    bot.inventory.forEach(item => {
      quantity += item['type'].includes(type) ? 1 : 0
    })
    return quantity
  }

  // This should check my space left in the inventory
  bot.spaceLeft = (where) => {
    // Containers
    // 0 = body
    // 2 = inventory
    // 10 = stash
    // 32 = belt
    // (list in item.js)
    let space = 0
    if (where === 0) {
    } else if (where === 2) {
      space = 90
    } else if (where === 10) {
      space = 100
    } else if (where === 32) {
      // Retrieve our belt type and get his size in data
      let myBelt = bot.items.find(item => { return item['directory'] === 8 })
      // Seems to doesn't count base belt size (addition)
      space = diablo2Data.belts.find(b => { return diablo2Data.armor.find(a => { return a['code'] === myBelt['type'] }) })['numboxes'] + 4
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
  bot.stash = async () => {
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
    if (stash === undefined) { // No stash in my area !!!
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
