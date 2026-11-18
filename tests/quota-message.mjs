import assert from 'node:assert/strict';
import {transcriptionError} from '../static/speech-tools.mjs';
const runs=transcriptionError('You have exceeded your ZeroGPU runs limit. Authenticate with a Hugging Face token');
assert.match(runs,/Free demo usage limit/);assert.doesNotMatch(runs,/token|Authenticate/);assert.match(runs,/No automatic retry/);
assert.match(transcriptionError('Quota reached. Try again in 23:01:45.'),/23:01:45/);
assert.equal(transcriptionError('No speech recognized.'),'No speech recognized.');
console.log('Anonymous quota messaging and explicit retry checks passed.');
