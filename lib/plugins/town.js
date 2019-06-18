const diablo2Data = require('diablo2-data')('pod_1.13d')

function inject (bot) {
  bot.npcShop = [] // Contains the items inside the npc shop
  bot.npcs = [] // Contains the informations about this game npcs
  bot.scrolls = {}
  const callbackShop = (data) => {
    bot.npcShop.push(data)
  }

  // Because npcs are differents every act
  // In diablo 2, all npcs have different roles in every acts
  // Maybe we could add it to node-diablo2-data
  bot.tasks = []
  bot.tasks[1] = { heal: 'Akara', shop: 'Akara', gamble: 'Gheed', repair: 'Charsi', merc: 'Kashya', key: 'Akara', identify: 'Cain' }
  bot.tasks[40] = { heal: 'Fara', shop: 'Drognan', gamble: 'Elzix', repair: 'Fara', merc: 'Greiz', key: 'Lysander', identify: 'Cain' }
  bot.tasks[75] = { heal: 'Ormus', shop: 'Ormus', gamble: 'Alkor', repair: 'Hratli', merc: 'Asheara', key: 'Hratli', identify: 'Cain' }
  bot.tasks[103] = { heal: 'Jamella', shop: 'Jamella', gamble: 'Jamella', repair: 'Halbu', merc: 'Tyrael', key: 'Jamella', identify: 'Cain' }
  bot.tasks[109] = { heal: 'Malah', shop: 'Malah', gamble: 'Anya', repair: 'Larzuk', merc: 'Qual-Kehk', key: 'Malah', identify: 'Cain' }

  // Maybe we could also listen to the npcmove stuff but honestly they don't go too far
  // We can reach them easy with runtoentity
  bot._client.on('D2GS_ASSIGNNPC', (data) => {
    // If we ain't already got the npc in the list
    if (!bot.npcs.find(npc => npc['unitCode'] === data['unitCode'])) {
      bot.npcs.push(data)
      bot.say(`Detected a new npc name:${diablo2Data.npcs[data['unitCode']]['name']},id:${data['unitId']},unitCode:${data['unitCode']},x:${data['x']},y:${data['y']}`)
    }
  })

  // Update our current amount of portal / identify scrolls in our books
  bot._client.on('D2GS_UPDATEITEMSKILL', (data) => {
    if (data['skill'] === 218) {
      bot.scrolls.identify = data['amount']
    }
    if (data['skill'] === 220) {
      bot.scrolls.portal = data['amount']
    }
  })

  // bot.gold is total gold (inventory + stash)
  // bot.goldInInventory is gold in inventory (can be useful to know if we want the bot to put gold in stash to avoid losing it sometimes)
  bot._client.on('D2GS_SETDWORDATTR', (data) => {
    if (data['attribute'] === 15) {
      bot.gold = data['amount'] + bot.goldInInventory
    }
    if (data['attribute'] === 14) {
      bot.goldInInventory = data['amount']
    }
  })
  bot._client.on('D2GS_SETBYTEATTR', (data) => {
    if (data['attribute'] === 15) {
      bot.gold = data['amount'] + bot.goldInInventory
    }
    if (data['attribute'] === 14) {
      bot.goldInInventory = data['amount']
    }
  })

  // This method will check if i have to to go npc trader / healer / repairer / hire / gambler
  // If yes go to npc and buy stuffs
  // Atm we dont care about identify scrolls
  bot.checkTown = async () => {
    // if (bot.spaceLeft(2) < 40) {
    //   await bot.inventoryToStash()
    // }
    const potions = bot.checkPotions()
    const tome = bot.itemByType('tbk', [diablo2Data.itemEnums.ContainerType.inventory,
      diablo2Data.itemEnums.ContainerType.inventory_bottom]) // ibk is identify book
    const repair = bot.checkRepair()
    const merc = bot.checkMerc() // TODO: handle merc (not urgent)
    console.log(potions, tome, bot.scrolls.portal, repair, merc, bot.gold)

    if ((bot.checkHeal() || potions.hp < 0 || potions.mp < 0 || (tome === undefined || bot.scrolls.portal < 21)) && bot.gold > 10000) {
      const npcId = await bot.reachNpc(bot.tasks[bot.area].shop)
      await bot.tradeNpc(npcId)
      // Buy stuff
      while (bot.checkPotions().hp) {
        await bot.buyItem('hp')
      }
      while (bot.checkPotions().mp) {
        await bot.buyItem('mp')
      }
      await bot.buyPotions(npcId, potions.hp, potions.mp)
      if (!tome) {
        await bot.buyItem('tbk')
      }
      while (bot.scrolls.portal < 21) { // isc is identify
        await bot.buyItem('tsc')
      }
      bot.cancelNpc(npcId)
    }

    if (repair.length > 0) {
      const npcId = await bot.reachNpc(bot.tasks[bot.area].repair)
      await bot.tradeNpc(npcId)
      // Repair
      await bot.repair(npcId, repair)
      bot.cancelNpc(npcId)
    }

    /*
    When buying scroll of portal (into a tome)
    D2GS_UPDATEITEMSKILL {"unknown":24,"unitId":1,"skill":220,"amount":16}
    16 corresponds to the quantity of scrolls in the tome
    */
  }

  // Init a npc, handle the case there is a talk, quest ...
  bot.initNpc = async (npcId) => {
    const callback = () => {
      bot._client.write('D2GS_NPCCANCEL', {
        entityType: 1,
        entityId: npcId
      })
      bot._client.write('D2GS_INTERACTWITHENTITY', {
        entityType: 1,
        entityId: npcId
      })
      bot._client.write('D2GS_NPCINIT', {
        entityType: 1,
        entityId: npcId
      })
    }
    bot._client.once('D2GS_GAMEQUESTINFO', callback)
    bot._client.write('D2GS_INTERACTWITHENTITY', {
      entityType: 1,
      entityId: npcId
    })
    bot._client.write('D2GS_NPCINIT', {
      entityType: 1,
      entityId: npcId
    })
    bot._client.removeListener('D2GS_GAMEQUESTINFO', callback)
  }

  bot.tradeNpc = async (npcId) => {
    // Store the list of items of the npc
    bot._client.on('D2GS_ITEMACTIONWORLD', (callbackShop))
    await bot.initNpc(npcId)
    bot._client.write('D2GS_NPCTRADE', {
      tradeType: 1, // TODO: what are the different types
      entityId: npcId,
      unknown: 0
    })
  }

  bot.cancelNpc = (npcId) => {
    bot._client.write('D2GS_NPCCANCEL', {
      entityType: 1,
      entityId: npcId
    })
    bot._client.removeListener('D2GS_ITEMACTIONWORLD', callbackShop)
    bot.npcShop = [] // Atm we don't care about storing npc shops after trading done, whats the point ?
  }

  bot.checkHeal = () => {
    if (bot.life < bot.maxLife || bot.mana < bot.maxMana) {
      return true
    }
    return false
  }

  // We will check if we have enough potions (according to the config)
  bot.checkPotions = () => {
    // For example we want to always have 4 health, 4 mana potions
    return { hp: 4 - bot.itemsByType('hp', [diablo2Data.itemEnums.ContainerType.inventory, diablo2Data.itemEnums.ContainerType.inventory_bottom,
      diablo2Data.itemEnums.ContainerType.belt]).length,
    mp: 4 - bot.itemsByType('mp', [diablo2Data.itemEnums.ContainerType.inventory, diablo2Data.itemEnums.ContainerType.inventory_bottom,
      diablo2Data.itemEnums.ContainerType.belt]).length }
  }

  bot.checkRepair = (treshold) => {
    let toRepair = []

    bot.inventory.forEach(item => {
      // If the equipped item durability is under a treshold, this item has to be repaired
      if (item['equipped'] && item['durability'] < item['maximum_durability'] / 2) {
        toRepair.push(item)
      }
    })

    return toRepair
  }

  bot.checkMerc = () => {
  }

  // Repair a list of items
  // Currently doing only repair all
  bot.repair = async (npcId, repairList) => {
    return new Promise(resolve => {
      bot._client.write('D2GS_REPAIR', {
        id1: npcId,
        id2: 0, // itemid
        id3: 0, // tab
        id4: 2147483648 // unknown ??
      })
      bot._client.once('D2GS_NPCTRANSACTION', (data) => {
        if (data['result'] === 2) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  }

  // Buy one item to npcId
  bot.buyItem = async (npcId, type) => {
    return new Promise(resolve => {
      const callback = (data) => {
        bot.inventory.push(data)
      }
      bot._client.once('D2GS_ITEMACTIONWORLD', callback)
      bot._client.write('D2GS_NPCBUY', {
        npcId: npcId,
        itemId: bot.npcShop.find(item => { return item['type'].include(type) })['id'],
        bufferType: 0,
        cost: 0
      })
      bot._client.once('D2GS_NPCTRANSACTION', ({ tradeType, result, unknown, merchandiseId, goldInInventory }) => {
        bot._client.removeListener('D2GS_ITEMACTIONWORLD')
        if (result === 0) {
          resolve(true)
        } else {
          console.log(`Failed transaction ${type}`)
          resolve(false)
        }
      })
    })
  }

  bot.identify = async (cain = true) => {
    if (cain) {
      await bot.reachNpc('Cain')
      // ???
    } else {

    }
  }

  // TODO: fix reachNpc
  bot.reachNpc = async (npcName) => {
    try {
      console.log('npcindex', diablo2Data.npcs.findIndex(dnpc => dnpc['name'].includes(npcName)))
      bot.npcs.forEach(npc => {
        console.log('bot.npcsindex', npc['unitCode'])
      })
      const npc = bot.npcs.find(npc => npc['unitCode'] === diablo2Data.npcs.findIndex(dnpc => dnpc['name'].includes(npcName))) // BROKEN SOMETIMES
      bot.say(`bot.reachNpc npc ${JSON.stringify(npc)}`)

      await bot.runToEntity(1, npc['unitId'])
      return npc['unitId']
    } catch (error) {
      console.log(`bot.reachNpc ${error}`)
    }
  }
}

module.exports = inject
