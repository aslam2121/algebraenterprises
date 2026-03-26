'use strict';

async function safeDestroyStrapi(strapi) {
  if (!strapi) {
    return;
  }

  try {
    await strapi.destroy();
  } catch (error) {
    if (error?.message === 'aborted') {
      console.warn('[script-shutdown] Ignored aborted Strapi pool shutdown during script teardown.');
      return;
    }

    throw error;
  }
}

module.exports = { safeDestroyStrapi };
