# AutoTathamet
[![NPM version](https://img.shields.io/npm/v/autotathamet.svg)](http://npmjs.com/package/autotathamet)
[![Build Status](https://img.shields.io/circleci/project/MephisTools/AutoTathamet/master.svg)](https://circleci.com/gh/MephisTools/AutoTathamet) 
[![Discord Chat](https://img.shields.io/badge/discord-here-blue.svg)](https://discord.gg/FY4hG8)  

Create Diablo2 bots with a powerful, stable, and high level JavaScript API.

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
    host: 'battlenetip',
    username: 'myusername',
    password: 'mypassword'
  })
  await bot.selectCharacter('mycharacter')
  await bot.createGame('mygame', '', 'game server', 0)
}

start()

```

## Documentation

* See docs/API.md
