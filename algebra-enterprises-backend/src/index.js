'use strict';

const { preparePropertyImageUpload } = require('./utils/property-image-admin-upload');

function wrapPropertyImageUploadMethod(strapi, controller, methodName) {
  if (!controller || typeof controller[methodName] !== 'function') {
    return;
  }

  const originalHandler = controller[methodName];

  controller[methodName] = async function wrappedPropertyImageUpload(ctx) {
    const originalBody = ctx.request?.body || {};
    const originalFiles = ctx.request?.files?.files;
    const prepared = await preparePropertyImageUpload(strapi, ctx);

    if (!prepared) {
      return originalHandler.call(this, ctx);
    }

    ctx.request.body = prepared.body;
    ctx.request.files.files = prepared.files;

    try {
      return await originalHandler.call(this, ctx);
    } finally {
      ctx.request.body = originalBody;
      ctx.request.files.files = originalFiles;
      await prepared.cleanup();
    }
  };
}

function wrapPropertyImageUploadController(strapi, controller, methodNames) {
  for (const methodName of methodNames) {
    wrapPropertyImageUploadMethod(strapi, controller, methodName);
  }
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
    wrapPropertyImageUploadController(
      strapi,
      strapi.plugin('upload').controller('admin-upload'),
      ['uploadFiles', 'unstable_uploadFilesStream']
    );
    wrapPropertyImageUploadController(
      strapi,
      strapi.plugin('upload').controller('content-api'),
      ['uploadFiles']
    );
  },
};
