class Map {
  constructor (cellSize = 20) {
    this.data = {}
    this.cellSize = cellSize
  }

  coordsToCell ({ x, y }) {
    return { x: Math.floor(x / this.cellSize), y: Math.floor(y / this.cellSize) }
  }

  static hashCell ({ x, y }) {
    return x + ',' + y
  }

  cellToCoord ({ x, y }) {
    // middle of the cell
    return { x: (x + 0.5) * this.cellSize, y: (y + 0.5) * this.cellSize }
  }

  isPositionWalkable (c) {
    const v = this.getAtPosition(c)
    return v === undefined || v === false
  }

  isCellWalkable (c) {
    const v = this.getAtCell(c)
    return v === undefined || v === false
  }

  // map is a grid of 20x20 cells
  // undefined : unknown
  // true : wall
  // false : ground
  getAtPosition (p) {
    return this.getAtCell(this.coordsToCell(p))
  }

  setAtPosition (p, isWall) {
    this.setAtCell(this.coordsToCell(p), isWall)
  }

  getAtCell (c) {
    return this.data[Map.hashCell(c)]
  }

  setAtCell (c, isWall) {
    this.data[Map.hashCell(c)] = isWall
  }
}

module.exports = Map
