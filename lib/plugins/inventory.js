const diablo2Data = require('diablo2-data')('pod_1.13d')
const { delay } = require('../utils')
const fs = require('fs')
const path = require('path')
function inject (bot) {
  // When joining a game you get D2GS_ITEMACTIONOWNED for each items you have equipped,
  // D2GS_ITEMACTIONWORLD for each item in your inventory / stash
  // Save our items in arrays

  const bodyWidth = 12
  const bodyHeight = 1
  const inventoryWidth = 10
  const inventoryHeight = 9
  const stashWidth = 10
  const stashHeight = 10
  const beltWidth = 4 // TODO: get belt size from packets
  const beltHeight = 4

  bot.items = []
  // All containers are matrices so we can access each item by x;y
  // bot.items index is the container enum
  bot.items[diablo2Data.itemEnums.ContainerType.unspecified] = Array(bodyWidth) // Body (equipped items)
    .fill(null)
    .map(() => Array(bodyHeight)
      .fill(null))
  bot.items[diablo2Data.itemEnums.ContainerType.inventory] = Array(inventoryWidth) // Inventory top (extension) + Inventory bottom line (10x10 total)
    .fill(null)
    .map(() => Array(inventoryHeight)
      .fill(null))
  bot.items[diablo2Data.itemEnums.ContainerType.stash] = Array(stashWidth) // Stash top + stash bottom (2 lines) (10x10 total)
    .fill(null)
    .map(() => Array(stashHeight)
      .fill(null))
  bot.items[diablo2Data.itemEnums.ContainerType.belt] = Array(beltWidth) // Belt
    .fill(null)
    .map(() => Array(beltHeight)
      .fill(null))
  /*
    // Code for retrieving belt size but we init the array item size before receiving packets so ...
    let myBelt
    // Retrieve our belt type and get his size in data
    for (const i of bot.items[ContainerType.belt]) {
      myBelt = i.find(item => { return item['directory'] === 8 })
    }
    // Doesn't seem to  count base belt size (addition)
    space = diablo2Data.belts.find(b => { return diablo2Data.armor.find(a => { return a['code'] === myBelt['type'] }) })['numboxes'] + 4
  */

  bot.groundItems = [] // Don't care about position x;y here

  bot.pickit = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../pickitExample.json'), 'utf8'))

  // TODO: Add more things + options maybe to choose what we wanna dump specially
  bot.toString = () => {
    let ret = ''
    ret += `bot.items:\n`
    for (let container of [diablo2Data.itemEnums.ContainerType.unspecified, diablo2Data.itemEnums.ContainerType.inventory,
      diablo2Data.itemEnums.ContainerType.stash, diablo2Data.itemEnums.ContainerType.belt]) {
      ret += `container ${container}\n`
      for (let x = 0; x < bot.items[container].length; x++) {
        ret += `row ${x}:${bot.items[container][x].map(item => `${item !== null ? item['name'] : item}`)}\n`
      }
    }
    return ret
  }

  // Add or remove an item from the bot.items array
  // item -> json
  // add -> boolean (true = add, false = remove)
  function addOrRemove (item, add) {
    console.log(`${item['name']} - ${parseInt(item['width'])} - ${parseInt(item['height'])}`)
    for (let w = 0; w < parseInt(item['width']); w++) {
      for (let h = 0; h < parseInt(item['height']); h++) {
        let index = item['container']
        let x = item['x'] + w
        let y = item['y'] + h
        console.log(`${item['name']} - ${parseInt(item['width'])} - ${parseInt(item['height'])} - ${index} - ${x} - ${y}`)
        // Considering the bottom last line of inventory which is container i_b as the same as inventory container i ...
        if (index === diablo2Data.itemEnums.ContainerType.inventory_bottom) {
          index = diablo2Data.itemEnums.ContainerType.inventory
          y += 7 // Just merging both containers
        }

        // Considering the bottom 2 last line of stash which is container s_b as the same as stash container s ...
        if (index === diablo2Data.itemEnums.ContainerType.stash_bottom) { // TODO: update node data add container 11 and upd this
          index = diablo2Data.itemEnums.ContainerType.stash
          y += 8 // Just merging both containers
        }

        // unspecified is equipped items, we don't care about the space they take, just put in 1D array
        if (index === diablo2Data.itemEnums.ContainerType.unspecified) {
          x = item['x']
          y = item['y']
        }

        console.log(`${item['name']} - ${parseInt(item['width'])} - ${parseInt(item['height'])} - ${index} - ${x} - ${y}`)
        console.log(`${add ? 'Adding' : 'Removing'} ${item['name']} - container ${index} - position ${x};${y}`)

        // Add the item at each spot it takes
        bot.items[index][x][y] = add ? item : null // Add ? Put the item else empty the spot
      }
    }
  }

  const itemCallback = (item) => {
    // If it's not body / inventory / stash / belt, nothing to do
    if (![diablo2Data.itemEnums.ContainerType.unspecified, diablo2Data.itemEnums.ContainerType.inventory, diablo2Data.itemEnums.ContainerType.stash,
      diablo2Data.itemEnums.ContainerType.inventory_bottom, diablo2Data.itemEnums.ContainerType.belt].find(c => c === item['container'])) {
      return
    }
    // TODO: use diablo2Data.itemEnums.Action
    switch (item['action']) { // TODO: handle other containers (trade etc)
      case 1: // inventory opened -> ground -> hand
        break
      case 2: // drop to ground
        break
      case 5: // inventory opened -> inventory -> hand OR inventory -> belt
      case 15: // belt -> inventory
        addOrRemove(item, false)
        break
      case 8: // unequip TODO: handle case when removing belt (it drop potions into inventory non-equipped)
        addOrRemove(item, false)
        break
      case 4: // -> inventory non-equipped
      case 6: // whatever -> equipped
      case 14: // inventory closed -> ground -> inventory OR inventory -> belt
        addOrRemove(item, true)
        break
    }
  }
  bot._client.on('D2GS_ITEMACTIONOWNED', itemCallback)
  bot._client.on('D2GS_ITEMACTIONWORLD', itemCallback)

  // Run to an item and pick it from the ground (inventory closed), return true if succeed, false if timeout 2 seconds
  bot.pickGroundItem = async (item) => {
    return new Promise(async resolve => {
      let timeOut
      const callbackItemActionWorld = (picked) => {
        bot.say(`Picked up ${picked['name']}`)
        bot.checkLifeMana() // Eventually could do that only if it's a potion that has been picked up
        const index = bot.groundItems.findIndex(item => { return item['id'] === picked['id'] }) // Does this works ?
        if (index > -1) {
          bot.groundItems.splice(index, 1)
        }
        // Check if we still have space left in inventory !
        if (bot.spaceLeft(diablo2Data.itemEnums.ContainerType.inventory) > item['width'] * item['height']) {
        // Go to town empty myself whatever ..
        }

        clearTimeout(timeOut)
        resolve(true)
      }

      bot._client.once('D2GS_ITEMACTIONWORLD', callbackItemActionWorld)

      await bot.runToEntity(2, item['id'])
      bot._client.write('D2GS_PICKUPITEM', {
        unitType: 4,
        unitId: item['id']
      })

      timeOut = setTimeout(() => {
      // let's assume failure then
        bot._client.removeListener('D2GS_ITEMACTIONWORLD', callbackItemActionWorld)
        resolve(false)
      }, 2000)
    })
  }

  // Supposed to pick an item from inventory to cursor (maybe works also for ground item, not tested)
  bot.itemToCursor = async (item) => {
    return new Promise(async resolve => {
      let timeOut
      const callbackItemActionOwned = (picked) => {
        console.log(`itemToCursor ${picked['name']}`)
        clearTimeout(timeOut)
        resolve(true)
      }

      bot._client.once('D2GS_ITEMACTIONOWNED', callbackItemActionOwned)
      bot._client.write('D2GS_PICKUPBUFFERITEM', {
        itemId: item['id']
      })

      timeOut = setTimeout(() => {
      // let's assume failure then
        bot._client.removeListener('D2GS_ITEMACTIONOWNED', callbackItemActionOwned)
        resolve(false)
      }, 10000)
    })
  }

  // Drop item on cursor to a container
  // item -> json
  // container -> diablo2Data.itemEnums.ContainerType
  bot.cursorToContainer = async (item, container, x, y) => {
    return new Promise(async resolve => {
      let timeOut
      const callbackItemActionWorld = (picked) => {
        console.log(`cursorToContainer ${picked['name']} in ${container} at ${x};${y}`)
        clearTimeout(timeOut)
        resolve(true)
      }

      // Stupid mapping between different enums of diablo ...
      switch (container) {
        case diablo2Data.itemEnums.ContainerType.unspecified:
        case diablo2Data.itemEnums.ContainerType.inventory:
        case diablo2Data.itemEnums.ContainerType.inventory_bottom:
        case diablo2Data.itemEnums.ContainerType.belt:
        case diablo2Data.itemEnums.ContainerType.item: // Not sure what is "item"
          container = diablo2Data.itemEnums.itemContainerGcType.inventory
          break
        case diablo2Data.itemEnums.ContainerType.trader_offer:
        case diablo2Data.itemEnums.ContainerType.for_trade:
        case diablo2Data.itemEnums.ContainerType.armor_tab:
        case diablo2Data.itemEnums.ContainerType.weapon_tab_1:
        case diablo2Data.itemEnums.ContainerType.weapon_tab_2:
        case diablo2Data.itemEnums.ContainerType.misc_tab:
          container = diablo2Data.itemEnums.itemContainerGcType.trade
          break
        case diablo2Data.itemEnums.ContainerType.cube:
          container = diablo2Data.itemEnums.itemContainerGcType.cube
          break
        case diablo2Data.itemEnums.ContainerType.stash:
          container = diablo2Data.itemEnums.itemContainerGcType.stash
          break
        default: // By default we will take it as inventory item ...
          container = diablo2Data.itemEnums.itemContainerGcType.inventory
      }

      bot._client.once('D2GS_ITEMACTIONWORLD', callbackItemActionWorld)
      bot._client.write('D2GS_ITEMTOBUFFER', {
        itemId: item['id'],
        x: x,
        y: y,
        bufferType: container // Not really sure we even need to send a correct bufferType btw
      })

      timeOut = setTimeout(() => {
      // let's assume failure then
        bot._client.removeListener('D2GS_ITEMACTIONWORLD', callbackItemActionWorld)
        resolve(false)
      }, 10000)
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
      const potion = bot.itemByType(health ? 'hp' : 'mp', [diablo2Data.itemEnums.ContainerType.inventory, diablo2Data.itemEnums.ContainerType.inventory_bottom,
        diablo2Data.itemEnums.ContainerType.belt])
      bot.say(`Found ${potion['name']}`)
      bot._client.write('D2GS_DROPITEM', { // Try both containers xD
        itemId: potion['id']
      })
      bot._client.write('D2GS_REMOVEBELTITEM', {
        itemId: potion['id']
      })
    } catch (error) {
      console.log(error)
    }
  }

  // Do i have this item ? (for example tbk is town book of portal)
  bot.itemByType = (type, containers) => {
    for (const container of containers) {
      // For every cols
      for (let x = 0; x < bot.items[container].length; x++) {
        // Is there this item in any row ?
        const item = bot.items[container][x].find(item => { return item['type'].includes(type) })
        if (item !== undefined) {
          return item
        }
      }
    }
  }
  // Same by name
  bot.itemByName = (name, containers) => {
    for (const container of containers) {
      // For every cols
      for (let x = 0; x < bot.items[container].length; x++) {
        // Is there this item in any row ?
        const item = bot.items[container][x].find(item => { return item['name'].includes(name) })
        if (item !== undefined) {
          return item
        }
      }
    }
  }

  // Return list of this item
  bot.itemsByType = (type, containers) => {
    for (const container of containers) {
      // For every cols
      for (let x = 0; x < bot.items[container].length; x++) {
        // Is there this item in any row ?
        const item = bot.items[container][x].filter(item => { return item['type'].includes(type) })
        if (item !== undefined) {
          return item
        }
      }
    }
  }
  bot.itemsByName = (name, containers) => {
    for (const container of containers) {
      // For every cols
      for (let x = 0; x < bot.items[container].length; x++) {
        // Is there this item in any row ?
        const item = bot.items[container][x].filter(item => { return item['name'].includes(name) })
        if (item !== undefined) {
          return item
        }
      }
    }
  }

  // This should check my space left in the container
  bot.spaceLeft = (where) => {
    let space = 0
    bot.items[where].forEach(x => {
      x.forEach(y => { if (y === undefined) space++ }) // If a case is empty space += 1
    })
    return space
  }

  bot.clickStash = async () => {
    return new Promise(async resolve => {
      let timeOut, stash
      for (let i = bot.objects.length - 1; i > 0; i--) { // We start at the end, just in case, so we check the latest received objects
        if (diablo2Data.objects[bot.objects[i]['objectUniqueCode']]['Name'].includes('bank')) {
          stash = bot.objects[i]
        }
      }
      if (stash === undefined) { // No stash in my area !!!
        bot.say(`No stash in area ${bot.area}`)
        return false
      }
      const callbackTradeAction = () => {
        clearTimeout(timeOut)
        resolve(true)
      }
      await bot.runToEntity(2, stash['objectId'])
      bot._client.write('D2GS_INTERACTWITHENTITY', {
        entityType: 2,
        entityId: stash['objectId']
      })

      bot._client.once('D2GS_TRADEACTION', callbackTradeAction)

      timeOut = setTimeout(() => {
        bot._client.removeListener('D2GS_TRADEACTION', callbackTradeAction)
        resolve(false)
      }, 4000)
    })
  }

  // Put everything in the stash except the required stuff (set a parameter for things we wanna always keep such as book scroll, charms ...)
  // Put extra gold in stash ...
  bot.inventoryToStash = async () => {
    bot.clickStash()
    await bot.containerToContainer(diablo2Data.itemEnums.ContainerType.inventory, diablo2Data.itemEnums.ContainerType.stash)
  }

  // Return x,y top left coord to put in this container for this item
  // Find an empty spot, then check if the spot in x are empty, then check the spot in y
  bot.findSpot = (item, container) => {
    // Iterating through the 2d array of items
    for (let x = 0; x < bot.items[container].length; x++) {
      for (let y = 0; y < bot.items[container][x].length; y++) {
        let emptySpots = 0
        let offsetX = 0
        let offsetY = 0
        // We found an empty spot, check the neighboring spots to see if they're empty too
        while (bot.items[container][x + offsetX][y + offsetY] === null &&
          (offsetX + x < bot.items[container].length && offsetY + y < bot.items[container][x].length)) { // unless we hit the bounds of the inventory
          emptySpots++
          // Once we found enough space in Y, check X
          if (offsetY === parseInt(item['height'], 10)) { // Stupid string
            offsetX++
          } else {
            offsetY++
          }
          console.log(`~~~`)
          console.log(`Found an empty spot at ${x};${y}`)
          console.log(`Bounds ${offsetX + x}-${bot.items[container].length};${offsetY + y}-${bot.items[container][x].length}`)
          console.log(`Empty spots ${emptySpots} offsets ${offsetX};${offsetY}`)
          console.log(`~~~`)
          // If we found as many empty spots than the squared area of the item, valid spot
          if (emptySpots === item['height'] * item['width']) {
            console.log(`Found a valid spot at ${x};${y}`)
            return { x: x, y: y }
          }
        }
      }
    }
    return { x: undefined, y: undefined }
  }

  // Move one item to a container
  // item -> json
  // container -> diablo2Data.itemEnums.ContainerType
  bot.itemToContainer = async (item, container) => {
    let { x, y } = bot.findSpot(item, container)
    if (x === undefined) {
      console.log(`No space left for ${item['name']} in container ${container}`)
      return false
    }
    // Click on item
    await bot.itemToCursor(item)
    // await delay(100) // Server side protections ?
    const result = await bot.cursorToContainer(item, container, x, y) // Drop the item in the found spot
    if (result) { // If it succeed, instead of waiting the server packet (which can be retarded by lag) just update the arrays: faster
      // The server packet will still be received but it won't break anything
      console.log('not packet')
      item['action'] = 5 // Remove
      itemCallback(item)
      item['action'] = 4 // Add
      item['container'] = container
      item['x'] = x
      item['y'] = y
      itemCallback(item)
    }
    return result
  }

  // Move all items from a container to another container
  // containerA -> diablo2Data.itemEnums.ContainerType
  // containerB -> diablo2Data.itemEnums.ContainerType
  bot.containerToContainer = async (containerA, containerB) => {
    // Iterating through the 2d array of items
    for (let x = 0; x < bot.items[containerA].length; x++) {
      for (let y = 0; y < bot.items[containerA][x].length; y++) {
        if (bot.items[containerA][x][y] !== null) { // Found an item
          console.log(`Trying to move ${bot.items[containerA][x][y]['name']}`)
          if (!await bot.itemToContainer(bot.items[containerA][x][y], containerB)) {
            return false // Operation didn't fully succeed, stopping (container full ...)
          }
          console.log(`Moving succeed`)
          await delay(100) // Either wait the packet saying that we moved something, either we can force item callback to speed up ? (that will update arrays)
        }
      }
    }
    return true // Operation fully succeed !
  }
}

module.exports = inject
