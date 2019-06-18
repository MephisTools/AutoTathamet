const { createBot } = require('../index')
const { randomString, pickRandom, delay } = require('../lib/utils')
const assert = require('assert')
const diablo2Data = require('diablo2-data')('pod_1.13d')

async function createRandomGame () {
  const bot = await createBot({
    host: 's.pathofdiablo.com',
    username: 'ogagal',
    password: 'bzkl12'
  })
  await bot.selectCharacter('oculus')
  let rnd = randomString(5)
  console.log(`Trying to create game ${rnd}//${rnd} ...`)
  await bot.createGame(rnd, rnd, pickRandom([2, 4, 6, 9, 23]), 0) // Trying with some random european game servers
  console.log(`Successfully joined ${rnd}`)

  return bot
}

async function testItemToContainer (bot) {
  // assert(await bot.clickStash(), 'Failed clickStash')
  console.log('testItemToContainer')
  await bot.clickStash()

  let containerA = diablo2Data.itemEnums.ContainerType.inventory
  let containerB = diablo2Data.itemEnums.ContainerType.stash
  for (let x = 0; x < bot.items[containerA].length; x++) {
    for (let y = 0; y < bot.items[containerA][x].length; y++) {
      // console.log(`item : ${bot.items[containerA][x][y]['name']}`)
      if (bot.items[containerA][x][y] !== null) {
        console.log(`Trying to move ${bot.items[containerA][x][y]['name']}`)
        if (await bot.itemToContainer(bot.items[containerA][x][y], containerB)) {
          console.log(`Moving succeed`)
          return true
        }
      }
    }
  }
}

async function testContainerToContainer (bot) {
  // assert(await bot.clickStash(), 'Failed clickStash')
  await bot.clickStash()

  // Move stuff from inventory to stash
  assert(await bot.containerToContainer(diablo2Data.itemEnums.ContainerType.stash, diablo2Data.itemEnums.ContainerType.inventory), 'Failed containerToContainer')
}

async function runEverything () {
  const bot = await createRandomGame()
  await delay(3000) // Let come WORLDOBJECT packets
  console.log(bot.toString())
  // await testItemToContainer(bot)
  // await testContainerToContainer(bot)
}

runEverything()
