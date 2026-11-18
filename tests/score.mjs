import assert from 'node:assert/strict';
import {deliveryScore} from '../static/speech-tools.mjs';
assert.equal(deliveryScore({seconds:5,words:20},120),null);
assert.deepEqual(deliveryScore({seconds:120,words:240,wpm:120,quiet:[]},120),{total:100,completion:40,pace:30,continuity:30});
assert.deepEqual(deliveryScore({seconds:60,words:120,wpm:120,quiet:[[0,30]]},120),{total:65,completion:20,pace:30,continuity:15});
console.log('Delivery rubric checks passed.');
