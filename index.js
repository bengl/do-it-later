/*
Copyright 2016, Yahoo Inc.
Code licensed under the MIT License.
See LICENSE.txt
*/
function thisTick (func, thisObj) {
    process.nextTick(func, thisObj)
}
exports.thisTick = exports.thisIteration = thisTick

function laterTick (func, thisObj) {
    setImmediate(func, thisObj)
}
exports.laterTick = exports.laterIteration = laterTick
