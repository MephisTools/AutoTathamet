function inject (bot) {
  bot.castSkillOnLocation = async (x, y, skill) => {
    bot.say(`Casting ${skill} at ${x}:${y}`)
    await bot.switchSkill(0, skill) // Why would we use left hand ?
    bot._client.write('D2GS_RIGHTSKILLONLOCATION', {
      x: parseInt(x),
      y: parseInt(y)
    })
  }

  bot.switchSkill = (hand, skill) => {
    return new Promise(resolve => {
      const callback = () => {
        resolve(false)
      }
      const timeOut = setTimeout(() => { // SETSKILL doesn't proc means ain't got this skill
        bot._client.removeListener('D2GS_SETSKILL', callback)
        bot.say(`I don't have skill ${skill}`)
      }, 2000)
      bot._client.on('D2GS_SETSKILL', callback)
      if (hand === 0) {
        if (bot.rightHand !== skill) {
          bot._client.write('D2GS_SWITCHSKILL', {
            skill: skill,
            unk1: 0,
            hand: 0, // 0 = right, 128 = left
            unknown: [255, 255, 255, 255]
          })
          bot.rightHand = skill
        }
      } else {
        if (bot.leftHand !== skill) {
          bot._client.write('D2GS_SWITCHSKILL', {
            skill: skill,
            unk1: 0,
            hand: 128, // 0 = right, 128 = left
            unknown: [255, 255, 255, 255]
          })
          bot.leftHand = skill
        }
      }
      clearTimeout(timeOut)
      resolve(true)
    })
  }

  bot.castSkillOnEntity = (type, id, skill) => {
    bot.say(`Casting ${skill} on ${id}`)
    bot.switchSkill(0, skill)
    bot._client.write('D2GS_RIGHTSKILLONENTITYEX3', {
      entityType: type,
      entityId: id
    })
  }

  // Handle leveling up skills
  bot.autoSkill = () => {
  }
}

module.exports = inject
