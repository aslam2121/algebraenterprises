'use strict';

async function safeDestroyStrapi(strapi) {
  if (!strapi) {
    return;
  }

  let deferredError = null;
  let ignoredAbort = false;
  const ignoreAbortError = (error) => {
    if (error?.message === 'aborted') {
      ignoredAbort = true;
      return true;
    }

    return false;
  };
  const handleUnhandledRejection = (reason) => {
    if (ignoreAbortError(reason)) {
      return;
    }

    deferredError = deferredError || reason;
  };
  const handleUncaughtException = (error) => {
    if (ignoreAbortError(error)) {
      return;
    }

    deferredError = deferredError || error;
  };

  process.prependListener('unhandledRejection', handleUnhandledRejection);
  process.prependListener('uncaughtException', handleUncaughtException);

  try {
    await strapi.destroy();
  } catch (error) {
    if (!ignoreAbortError(error)) {
      throw error;
    }
  } finally {
    await new Promise((resolve) => setImmediate(resolve));
    process.removeListener('unhandledRejection', handleUnhandledRejection);
    process.removeListener('uncaughtException', handleUncaughtException);
  }

  if (ignoredAbort) {
    console.warn('[script-shutdown] Ignored aborted Strapi pool shutdown during script teardown.');
  }

  if (deferredError) {
    throw deferredError;
  }
}

module.exports = { safeDestroyStrapi };
