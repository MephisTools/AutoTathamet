function inject (bot) {
  bot.say = (message) => { // TODO: Maybe an option to whisper the master
    bot._client.write('D2GS_CHATMESSAGE', {
      type: 1,
      unk1: 0,
      unk2: 0,
      message: message
    })
  }

  bot.sayInSid = (message) => {
    bot._client.write('SID_CHATCOMMAND', {
      text: message
    })
  }

  bot._client.on('SID_CHATEVENT', (data) => {
    if (data['eventId'] === 18) { // Global chat ?
      // bot.say(`${data['username']} said ${data['text']}`)
    }
  })
}

module.exports = inject
