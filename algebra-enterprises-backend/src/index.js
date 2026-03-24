'use strict';

const { preparePropertyImageUpload } = require('./utils/property-image-admin-upload');

function wrapPropertyImageUploadController(strapi, controller) {
  if (!controller || typeof controller.uploadFiles !== 'function') {
    return;
  }

  const originalUploadFiles = controller.uploadFiles;

  controller.uploadFiles = async function wrappedUploadFiles(ctx) {
    const originalBody = ctx.request?.body || {};
    const originalFiles = ctx.request?.files?.files;
    const prepared = await preparePropertyImageUpload(strapi, originalBody, originalFiles);

    if (!prepared) {
      return originalUploadFiles.call(this, ctx);
    }

    ctx.request.body = prepared.body;
    ctx.request.files.files = prepared.files;

    try {
      return await originalUploadFiles.call(this, ctx);
    } finally {
      ctx.request.body = originalBody;
      ctx.request.files.files = originalFiles;
      await prepared.cleanup();
    }
  };
}

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    wrapPropertyImageUploadController(strapi, strapi.plugin('upload').controller('admin-upload'));
    wrapPropertyImageUploadController(strapi, strapi.plugin('upload').controller('content-api'));
  },
};
