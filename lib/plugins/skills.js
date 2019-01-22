function inject (bot) {
  bot.castSkillOnLocation = (x, y, skill) => {
    return new Promise(resolve => {
      bot._client.write('D2GS_SWITCHSKILL', {
        skill: skill,
        unk1: 0,
        hand: 0, // 0 = right, 128 = left
        unknown: [255, 255, 255, 255]
      })
      bot._client.once('D2GS_SETSKILL', () => {
        bot._client.write('D2GS_RIGHTSKILLONLOCATION', {
          x: parseInt(x),
          y: parseInt(y)
        })
        resolve()
      })
    })
  }

  bot.castSkillOnEntity = (type, id, skill) => {
    bot._client.write('D2GS_SWITCHSKILL', {
      skill: skill,
      unk1: 0,
      hand: 0, // 0 = right, 128 = left
      unknown: [255, 255, 255, 255, 255]
    })
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
