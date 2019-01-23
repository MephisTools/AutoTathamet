const astar = require('a-star')
const Map = require('./map')
const { squaredDistance } = require('./utils')

function walkNeighborsCandidates ({ x, y }) {
  return [
    { x: x + 1, y: y },
    { x: x, y: y + 1 },
    { x: x + 1, y: y + 1 },
    { x: x - 1, y: y },
    { x: x - 1, y: y - 1 },
    { x: x, y: y - 1 },
    { x: x - 1, y: y + 1 },
    { x: x + 1, y: y - 1 }
  ]
}

function tpNeighborsCandidates ({ x, y }) {
  const candidates = []
  for (let xc = x; xc < x + 5; xc++) {
    for (let yc = y; yc < y + 5; yc++) {
      candidates.push({ x: xc, y: yc })
    }
  }
  return candidates
}

function findPath (startPosition, destination, map, neighborsCandidates = walkNeighborsCandidates, timeout = 1000) {
  const startCell = map.coordsToCell(startPosition)
  const destinationCell = map.coordsToCell(destination)
  const cellsPath = astar({
    start: startCell,
    isEnd: c => squaredDistance(c, destinationCell) === 0,
    neighbor: (p) => neighborsCandidates(p).filter(c => map.isCellWalkable(c)),
    distance: (a, b) => squaredDistance(a, b),
    heuristic: (c) => squaredDistance(c, destinationCell),
    hash: c => Map.hashCell(c),
    timeout
  })
  if (cellsPath === null) {
    return null
  }
  const { status, cost, path } = cellsPath
  return { status, cost, path: path.map(c => map.cellToCoord(c)) }
}

module.exports = { findPath, walkNeighborsCandidates, tpNeighborsCandidates }
