module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/properties/my-properties',
      handler: 'property.findMyProperties',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/properties/my-properties',
      handler: 'property.createMyProperty',
      config: {
        auth: {
          scope: ['api::property.property.create'],
        },
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/properties/my-properties/:documentId',
      handler: 'property.updateMyProperty',
      config: {
        auth: {
          scope: ['api::property.property.update'],
        },
        policies: [],
        middlewares: [],
      },
    },
  ],
};
