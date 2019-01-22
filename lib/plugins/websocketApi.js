function inject (bot) {
  const WebSocket = require('ws')

  bot.wss = new WebSocket.Server({ port: 8080 })

  bot.wss.broadcast = function broadcast (data) {
    bot.wss.clients.forEach(function each (client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    })
  }

  bot._client.on('packet', ({ protocol, name, params }) => {
    bot.wss.broadcast(JSON.stringify({ protocol, name, params }))
  })
  bot._client.on('sentPacket', ({ protocol, name, params }) => {
    bot.wss.broadcast(JSON.stringify({ protocol, name, params }))
  })
}

module.exports = inject
