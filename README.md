# AutoTathamet
[![NPM version](https://img.shields.io/npm/v/autotathamet.svg)](http://npmjs.com/package/autotathamet)
[![Build Status](https://img.shields.io/circleci/project/MephisTools/AutoTathamet/master.svg)](https://circleci.com/gh/MephisTools/AutoTathamet)
[![Discord Chat](https://img.shields.io/badge/discord-here-blue.svg)](https://discord.gg/9RqtApv)
[![Try it on gitpod](https://img.shields.io/badge/try-on%20gitpod-brightgreen.svg)](https://gitpod.io/#https://github.com/MephisTools/AutoTathamet)

Create Diablo2 bots with a powerful, stable, and high level JavaScript API.

<img src="docs/images/follow_example.gif" width="300" height="300"><img src="docs/images/pickit_example.gif" width="300" height="300">

## Features

* chat
* follow
* pick up items

## Roadmap

* map
* inventory

## Usage

```js
const { createBot } = require('autotathamet')

async function start () {
  const bot = await createBot({
    host: 'battlenetIp',
    username: 'myUser',
    password: 'myPassword',
    version: '1.14',
    keyClassic: 'my16CharsKey',
    keyExtension: 'my16CharsKey'
  })
  await bot.selectCharacter('mycharacter')
  await bot.createGame('mygame', '', 'game server', 0)
}

start()

```

## Documentation

* See docs/API.md
