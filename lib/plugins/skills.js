function inject (bot) {
  bot.castSkillOnLocation = (x, y, skill) => {
    return new Promise(resolve => {
      bot.switchSkill(0, skill) // Why would we use left hand ?
      bot._client.once('D2GS_SETSKILL', () => {
        bot._client.write('D2GS_RIGHTSKILLONLOCATION', {
          x: parseInt(x),
          y: parseInt(y)
        })
        resolve()
      })
    })
  }

  bot.switchSkill = (hand, skill) => {
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
  }

  bot.castSkillOnEntity = (type, id, skill) => {
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
