const astar = require('a-star')
const Map = require('./map')
const { squaredDistance } = require('./utils')

function findPath (startPosition, destination, map, timeout = 1000) {
  const startCell = map.coordsToCell(startPosition)
  const destinationCell = map.coordsToCell(destination)
  const cellsPath = astar({
    start: startCell,
    isEnd: c => squaredDistance(c, destinationCell) === 0,
    neighbor: ({ x, y }) => [
      { x: x + 1, y: y },
      { x: x, y: y + 1 },
      { x: x + 1, y: y + 1 },
      { x: x - 1, y: y },
      { x: x - 1, y: y - 1 },
      { x: x, y: y - 1 },
      { x: x - 1, y: y + 1 },
      { x: x + 1, y: y - 1 }
    ].filter(c => map.isCellWalkable(c)),
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

module.exports = findPath
