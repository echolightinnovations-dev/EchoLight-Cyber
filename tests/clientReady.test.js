import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';

import { waitForClientReady } from '../src/utils/clientReady.js';

test('waitForClientReady resolves once the client is ready', async () => {
  const client = new EventEmitter();
  client.isReady = () => false;

  const pending = waitForClientReady(client, 50);
  client.emit('ready');

  await assert.doesNotReject(pending);
});

test('waitForClientReady rejects when the client never becomes ready', async () => {
  const client = new EventEmitter();
  client.isReady = () => false;

  await assert.rejects(() => waitForClientReady(client, 10), /timed out/i);
});
