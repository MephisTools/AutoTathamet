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
