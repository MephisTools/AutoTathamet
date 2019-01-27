const diablo2Data = require('diablo2-data')('pod_1.13d')

function inject (bot) {
  bot.npcShop = [] // Contains the items inside the npc shop
  bot.npcs = [] // Contains the informations about this game npcs
  bot.scrolls = {}
  // when buying id scroll D2GS_UPDATEITEMSKILL {"unknown":152,"unitId":1,"skill":218,"amount":8}

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

  // d2gsToClient :  D2GS_SETDWORDATTR {"attribute":15,"amount":338947}
  // d2gsToClient :  D2GS_SETBYTEATTR {"attribute":14,"amount":0}
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
  /*
    TODO: Put everything in properties (received when joining game)
    received compressed packet D2GS_ATTRIBUTEUPDATE {"unitId":1,"attribute":67,"amount":100}
    received compressed packet D2GS_ATTRIBUTEUPDATE {"unitId":1,"attribute":68,"amount":100}
    received compressed packet D2GS_ATTRIBUTEUPDATE {"unitId":1,"attribute":12,"amount":78}
    received compressed packet D2GS_ATTRIBUTEUPDATE {"unitId":1,"attribute":0,"amount":76}
    received compressed packet D2GS_ATTRIBUTEUPDATE {"unitId":1,"attribute":2,"amount":25}
    received compressed packet D2GS_SETBYTEATTR {"attribute":12,"amount":93}
    received compressed packet D2GS_SETBYTEATTR {"attribute":0,"amount":93}
    received compressed packet D2GS_SETBYTEATTR {"attribute":2,"amount":25}
    received compressed packet D2GS_SETBYTEATTR {"attribute":0,"amount":93}
    received compressed packet D2GS_SETBYTEATTR {"attribute":1,"amount":125}
    received compressed packet D2GS_SETBYTEATTR {"attribute":2,"amount":25}
    received compressed packet D2GS_SETWORDATTR {"attribute":3,"amount":297}
    received compressed packet D2GS_SETDWORDATTR {"attribute":7,"amount":192512}
    received compressed packet D2GS_SETDWORDATTR {"attribute":9,"amount":102144}
    received compressed packet D2GS_SETDWORDATTR {"attribute":11,"amount":141568}
    received compressed packet D2GS_SETBYTEATTR {"attribute":12,"amount":93}
    received compressed packet D2GS_SETDWORDATTR {"attribute":15,"amount":1062774}
  */

  // This method will check if i have to to go npc trader / healer / repairer / hire / gambler
  // If yes go to npc and buy stuffs
  // Atm we dont care about identify scrolls
  bot.checkTown = async () => {
    // if (bot.spaceLeft(2) < 40) {
    //   await bot.stash()
    // }
    const potions = bot.checkPotions()
    const tome = bot.hasItem('tbk') // ibk is identify book
    const repair = bot.checkRepair()
    const merc = bot.checkMerc() // TODO: handle merc (not urgent)
    console.log(potions, tome, bot.scrolls.portal, repair, merc, bot.gold)

    if ((bot.checkHeal() || potions.hp > 0 || potions.mp > 0 || (!tome || bot.scrolls.portal < 21)) && bot.gold > 10000) {
      const npcId = await bot.reachNpc(bot.tasks[bot.area].shop)
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
    /*
    d2gsToServer : D2GS_TOWNFOLK {"unk1":1,"unk2":8,"unk3":4677,"unk4":6099}
    d2gsToServer : D2GS_INTERACTWITHENTITY {"entityType":1,"entityId":8}
    d2gsToClient :  D2GS_NPCINFO {"unitType":1,"unitId":8,"unknown":[5,0,2,0,73,0,2,0,89,0,2,0,157,0,2,0,137,0,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0]}
    d2gsToClient :  D2GS_GAMEQUESTINFO {"unknown":[0,0,0,0,0,0,0,0,0,160,0,0,0,128,0,0,0,32,0,0,0,0,0,160,0,160,0,128,0,128,0,0,0,0,0,0,0,128,0,0,0,0,0,160,0,160,0,0,0,0,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,160,0,0,0,0,0,128,0,0,0,0,0,0,0,128,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}
    d2gsToClient :  D2GS_QUESTINFO {"unknown":[1,8,0,0,0,0,1,0,12,0,8,0,8,0,25,144,20,0,25,16,1,0,1,0,0,0,1,16,5,16,129,17,5,16,37,16,1,0,0,0,0,0,1,16,0,0,0,0,9,16,1,18,1,0,0,0,4,0,1,16,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,33,16,0,0,8,0,0,0,9,16,85,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}
    d2gsToClient :  D2GS_NPCSTOP {"unitId":8,"x":4678,"y":6100,"unitLife":128}
    d2gsToServer : D2GS_NPCINIT {"entityType":1,"entityId":8}
    d2gsToServer : D2GS_QUESTMESSAGE {"unk1":8,"unk2":36}
    d2gsToClient :  D2GS_NPCMOVE {"unitId":9,"type":1,"x":4713,"y":6119,"unknown":5}
    d2gsToClient :  D2GS_NPCSTOP {"unitId":6,"x":4682,"y":6155,"unitLife":128}
    d2gsToClient :  D2GS_NPCMOVE {"unitId":9,"type":1,"x":4712,"y":6123,"unknown":5}
    d2gsToClient :  D2GS_NPCMOVE {"unitId":5,"type":1,"x":4734,"y":6117,"unknown":5}
    d2gsToClient :  D2GS_NPCSTOP {"unitId":8,"x":4678,"y":6100,"unitLife":128}
    d2gsToClient :  D2GS_NPCSTOP {"unitId":6,"x":4682,"y":6155,"unitLife":128}
    d2gsToServer : D2GS_NPCCANCEL {"entityType":1,"npcId":8} // <=== Here i canceled his message to reinit
    d2gsToClient :  D2GS_NPCSTOP {"unitId":8,"x":4678,"y":6100,"unitLife":128}
    d2gsToServer : D2GS_TOWNFOLK {"unk1":1,"unk2":8,"unk3":4677,"unk4":6099}
    d2gsToServer : D2GS_INTERACTWITHENTITY {"entityType":1,"entityId":8}
    d2gsToClient :  D2GS_NPCINFO {"unitType":1,"unitId":8,"unknown":[4,0,2,0,73,0,2,0,89,0,2,0,157,0,2,0,137,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}
    d2gsToClient :  D2GS_GAMEQUESTINFO {"unknown":[0,0,0,0,0,0,0,0,0,160,0,0,0,128,0,0,0,32,0,0,0,0,0,160,0,160,0,128,0,128,0,0,0,0,0,0,0,128,0,0,0,0,0,160,0,160,0,0,0,0,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,160,0,0,0,0,0,128,0,0,0,0,0,0,0,128,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}
    d2gsToClient :  D2GS_QUESTINFO {"unknown":[1,8,0,0,0,0,1,0,12,0,8,0,8,0,25,144,20,0,25,16,1,0,1,0,0,0,1,16,5,16,129,17,5,16,37,16,1,0,0,0,0,0,1,16,0,0,0,0,9,16,1,18,1,0,0,0,4,0,1,16,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,33,16,0,0,8,0,0,0,9,16,85,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}
    */
    // Above dump of case when npc has something to say to us (quest ...)
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

  bot.cancelNpc = (npcId, callback) => {
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
    return { hp: 4 - bot.hasItems('hp'), mp: 4 - bot.hasItems('mp') }
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
    /*
    // When doing repair all
    d2gsToServer : D2GS_REPAIR {"id1":8,"id2":0,"id3":0,"id4":2147483648}
    d2gsToClient :  D2GS_NPCSTOP {"unitId":6,"x":4682,"y":6155,"unitLife":128}
    d2gsToClient :  D2GS_UPDATEITEMSTATS {"unknown":[7]}
    d2gsToClient :  D2GS_MERCFORHIRE {"mercId":49442,"unknown":0} // <= TODO: wtf is mercforhire doing here when trading someone who repair ?
    // After receiving tons of GAMELOADING =>
    d2gsToClient :  D2GS_NPCTRANSACTION {"tradeType":1,"result":2,"unknown":155876362,"merchandiseId":4294967295,"goldInInventory":0}
    // TODO: is merchandiseId correct ? whats unknown ? (result 2 seems to be successful transaction)
    d2gsToClient :  D2GS_SETDWORDATTR {"attribute":15,"amount":346339} // TODO: what is saying ?
    */

    /*
    // When doing repair 1 item (weapon in that case)
    d2gsToServer : D2GS_REPAIR {"id1":8,"id2":25,"id3":0,"id4":13}
    d2gsToClient :  D2GS_UPDATEITEMSTATS {"unknown":[7]}
    d2gsToClient :  D2GS_UNUSED8 {}
    d2gsToClient :  D2GS_NPCTRANSACTION {"tradeType":1,"result":2,"unknown":155876362,"merchandiseId":4294967295,"goldInInventory":0}
    d2gsToClient :  D2GS_SETDWORDATTR {"attribute":15,"amount":346204}
    */
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
      /*
      d2gsToServer : D2GS_USEITEM {"itemId":163,"x":4679,"y":6098}
      d2gsToClient :  D2GS_USESTACKABLEITEM {"unknown":[0,163,0,0,0,218,0]}
      d2gsToServer : D2GS_PING {"tickCount":7627312,"delay":45,"wardenResponse":0}
      d2gsToClient :  D2GS_PONG {"tickCount":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}
      d2gsToServer : D2GS_IDENTIFYITEM {"id1":32,"id2":163}
      d2gsToClient :  D2GS_UPDATEITEMSTATS {"unknown":[7]}
      d2gsToClient :  D2GS_UNUSED23 {}
      d2gsToClient :  D2GS_WADDEXP {"amount":113}
      d2gsToClient :  D2GS_GAMELOADING {}
      d2gsToClient :  D2GS_UPDATEITEMSKILL {"unknown":152,"unitId":1,"skill":218,"amount":7}
      d2gsToClient :  D2GS_USESCROLL {"type":4,"itemId":163}
      d2gsToClient :  D2GS_USESTACKABLEITEM {"unknown":[255,163,0,0,0,255,255]}
      d2gsToClient :  D2GS_ITEMACTIONOWNED {"action":21,"category":50,"id":32 ...
      d2gsToClient :  D2GS_RELATOR1 {"param1":0,"unityId":1,"param2":0}
      d2gsToClient :  D2GS_RELATOR2 {"param1":0,"unityId":1,"param2":0}
      d2gsToClient :  D2GS_PLAYSOUND {"unitType":0,"unitId":1,"sound":6}
      */
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

      await bot.moveToEntity(false, npc['unitId'])
      // bot.tradeNpc(npc.id)
      return npc['unitId']
    } catch (error) {
      console.log(`bot.reachNpc ${error}`)
    }
  }
}

module.exports = inject
