export function waitForClientReady(client, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (client?.isReady?.()) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for Discord client to become ready'));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      client.off?.('ready', onReady);
    };

    const onReady = () => {
      cleanup();
      resolve();
    };

    client.once?.('ready', onReady);
  });
}
