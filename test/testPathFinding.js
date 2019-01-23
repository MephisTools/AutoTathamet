const Map = require('../lib/map')
const findPath = require('../lib/pathFinding')

function emptyMap () {
  const map = new Map()

  const path = findPath({ x: 20, y: 20 }, { x: 980, y: 980 }, map)

  console.log('empty', JSON.stringify(path))
}

emptyMap()

function addMaze (map, proba) {
  for (let x = 20; x < 980; x += 20) {
    for (let y = 20; y < 980; y += 20) {
      map.setAtPosition({ x, y }, Math.random() < proba)
    }
  }
}

function addMapBorder (map) {
  for (let x = 0; x <= 1000; x += 20) {
    for (let y = 0; y <= 1000; y += 1000) {
      map.setAtPosition({ x, y }, true)
    }
  }
  for (let x = 0; x <= 1000; x += 1000) {
    for (let y = 0; y <= 1000; y += 20) {
      map.setAtPosition({ x, y }, true)
    }
  }
}

function easyMaze () {
  const map = new Map()
  addMapBorder(map)
  // full map
  addMaze(map, 0.1)

  const path2 = findPath({ x: 20, y: 20 }, { x: 980, y: 980 }, map)

  console.log('easy', JSON.stringify(path2))
}

easyMaze()

function mediumMaze () {
  const map = new Map()
  addMapBorder(map)
  // full map
  addMaze(map, 0.3)

  const path2 = findPath({ x: 20, y: 20 }, { x: 980, y: 980 }, map)

  console.log('medium', JSON.stringify(path2))
}

mediumMaze()

function hardMaze () {
  const map = new Map()
  addMapBorder(map)
  // full map
  addMaze(map, 0.5)

  const path2 = findPath({ x: 20, y: 20 }, { x: 980, y: 980 }, map)

  console.log('hard', JSON.stringify(path2))
}

hardMaze()

function veryHardMaze () {
  const map = new Map()
  addMapBorder(map)
  // full map
  addMaze(map, 0.7)

  const path2 = findPath({ x: 20, y: 20 }, { x: 980, y: 980 }, map)

  console.log('very hard', JSON.stringify(path2))
}

veryHardMaze()

function impossibleMaze () {
  const map = new Map()
  addMapBorder(map)
  // full map
  addMaze(map, 1)

  const path2 = findPath({ x: 20, y: 20 }, { x: 980, y: 980 }, map)

  console.log('impossible', JSON.stringify(path2))
}

impossibleMaze()
