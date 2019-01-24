const Map = require('../lib/map')
const { findPath, walkNeighborsCandidates, tpNeighborsCandidates } = require('../lib/pathFinding')

function addMaze (map, proba) {
  for (let x = 20; x < 980; x += 20) {
    for (let y = 20; y < 980; y += 20) {
      map.setAtPosition({ x, y }, Math.random() < proba)
    }
  }
}

function addMapBorder (map) {
  for (let x = -60; x <= 1060; x += 20) {
    map.setAtPosition({ x, y: -60 }, true)
    map.setAtPosition({ x, y: -40 }, true)
    map.setAtPosition({ x, y: -20 }, true)
    map.setAtPosition({ x, y: 0 }, true)
    map.setAtPosition({ x, y: 1000 }, true)
    map.setAtPosition({ x, y: 1020 }, true)
    map.setAtPosition({ x, y: 1040 }, true)
    map.setAtPosition({ x, y: 1060 }, true)
  }
  for (let y = -60; y <= 1060; y += 20) {
    map.setAtPosition({ y, x: -60 }, true)
    map.setAtPosition({ y, x: -40 }, true)
    map.setAtPosition({ y, x: -20 }, true)
    map.setAtPosition({ y, x: 0 }, true)
    map.setAtPosition({ y, x: 1000 }, true)
    map.setAtPosition({ y, x: 1020 }, true)
    map.setAtPosition({ y, x: 1040 }, true)
    map.setAtPosition({ y, x: 1060 }, true)
  }
}

function emptyMap (neighborCandidates) {
  const map = new Map()

  const path2 = findPath({ x: 20, y: 20 }, { x: 980, y: 980 }, map, neighborCandidates)

  console.log('empty', JSON.stringify(path2))
}

function withMaze (neighborCandidates, name, proba) {
  const map = new Map()
  addMapBorder(map)
  // full map
  addMaze(map, proba)

  const path2 = findPath({ x: 20, y: 20 }, { x: 980, y: 980 }, map, neighborCandidates)

  console.log(name, JSON.stringify(path2))
}

console.log('walk :')
emptyMap(walkNeighborsCandidates)
withMaze(walkNeighborsCandidates, 'easy', 0.1)
withMaze(walkNeighborsCandidates, 'medium', 0.3)
withMaze(walkNeighborsCandidates, 'hard', 0.5)
withMaze(walkNeighborsCandidates, 'very hard', 0.7)
withMaze(walkNeighborsCandidates, 'impossible', 1)
console.log('')

console.log('tp :')
emptyMap(tpNeighborsCandidates)
withMaze(tpNeighborsCandidates, 'easy', 0.1)
withMaze(tpNeighborsCandidates, 'medium', 0.3)
withMaze(tpNeighborsCandidates, 'hard', 0.5)
withMaze(tpNeighborsCandidates, 'very hard', 0.7)
withMaze(tpNeighborsCandidates, 'very very hard', 0.9)
withMaze(tpNeighborsCandidates, 'very very very hard', 0.95)
withMaze(tpNeighborsCandidates, 'impossible', 1)
