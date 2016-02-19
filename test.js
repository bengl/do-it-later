var thisTick = require('./index').thisTick
var laterTick = require('./index').laterTick

var resultArray = []

function log (item) {
    resultArray.push(item)
}

thisTick(function () { log(1) })
laterTick(function () { log(2) })
process.nextTick(function () { log(3) })
setImmediate(function () { log(4) })
thisTick(function () { log(5) })
laterTick(function () { log(6) })


// In 100 ms we'll for sure be done.
// Never do this though. This is merely to test thisTick and laterTick without
// using setImmediate.
setTimeout(function () {
    console.assert(1 * resultArray.join('') === 135246)
    console.log('passed')
}, 100)
