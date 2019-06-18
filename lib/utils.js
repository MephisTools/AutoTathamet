function getRandomInt (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function degreeBetweenTwoPoints (a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI
}

// Return the coordinate of a point with at a distance dist and degree angle from point point
function coordFromDistanceAndAngle (point, dist, angle) {
  return { x: Math.cos(angle * Math.PI / 180) * dist + point.x, y: Math.sin(angle * Math.PI / 180) * dist + point.y }
}

function distance (a, b) {
  return Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y))
}

function squaredDistance (a, b) {
  return (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y)
}

// Wait some time
// time -> int (miliseconds)
function delay (time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}

function randomString (length) {
  const possible = 'abcdefghijklmnopqrstuvwxyz'
  // Optional parameter ... by default 5
  if (length === undefined) length = 5
  let randomString = ''
  for (let i = 0; i < length; i++) { randomString += possible.charAt(Math.floor(Math.random() * possible.length)) }
  return randomString
}

// Returns a random element among an array
function pickRandom (array) {
  return array[Math.floor(Math.random() * array.length)]
}

module.exports = { getRandomInt, degreeBetweenTwoPoints, coordFromDistanceAndAngle, distance, delay, squaredDistance, randomString, pickRandom }
