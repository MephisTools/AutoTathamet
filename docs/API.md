# API

## autotathamet.createBot(options)

Connect to diablo and returns a promise resolving to a `ClientDiablo` instance

`options` is an object containing the properties :
 * username : username of the account
 * password : password of the account
 * host : sid host : diablo server host
 

## autotathamet.Bot

### gold

integer

current total gold (inventory + stash)

### inventory

array

current items (body + inventory + stash + belt)

### npcShop

array

current items in npcShop (cleared when cancelling npc)

### npcs

array

npcs data

### scrolls

object

mp: total amount of mp potions in bot.inventory

hp: total amount of hp potions in bot.inventory

### tasks

array

indexed by area id contains object linking npc role to his name

### master

object

id: id of master player

name: name of master player

### playerList

array

objects containing players data in current game

### warps

array

warps data encountered

### objects

array

objects encountered

### area

integer

current area id

### x

integer

current position x

### y

integer

current position y

### life

integer

current life

### maxLife

integer

maximum life

### mana

integer

current mana

### maxMana

integer

maximum mana

### rightHand

integer

current skill in right hand

### leftHand

integer

current skill in left hand

### selectCharacter(character)

select a character and returns a promise

### createGame(gameName, gamePassword, gameServer, difficulty)

create and join the specified game and returns a promise


### say(message)

says `message`

### pickupItems()

starts picking up close by items

### run(x, y)

run to this position

### runToWrap()

returns the closest wrap

## castSkillOnLocation(x, y, skill)

cast given skill on this location

### playerList

contains the player list

### bot._client

bot._client is the low level API and should be avoided if possible

#### bot._client.on("packetName", params)

for each diablo2 packet (see data/d2gs.json, data/mcp.json, data/bnftp.json, data/sid.json)
emit an event when a packet is received

#### bot._client.on("packet", name, params)

emit an event with `name` and `params`

#### bot._client.write(name, params)

sends the packet `name` with `params` to the corresponding server
