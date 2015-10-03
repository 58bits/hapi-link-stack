'use strict';

var Hoek = require('hoek');

// Declare internals
var internals = {};

internals.setRouteDefaults = function(request) {
  if (typeof request.route.settings.plugins['hapi-link-stack'] === 'undefined') {
    request.route.settings.plugins['hapi-link-stack'] = { level: 1, label: ''};
  }
};

internals.setLinkStack = function(request, session) {
  request.plugins['hapi-link-stack'] = session.links || [];
  let linkStack = request.plugins['hapi-link-stack'];
  // If empty - place 'home' on the stack
  if (linkStack.length === 0) {
    linkStack.push({
      label: 'Home',
      level: 0,
      path: '/'
    });
  }
  return linkStack;
};

internals.getLinkForRoute = function(request) {
  return {
    label: request.route.settings.plugins['hapi-link-stack'].label,
    level: request.route.settings.plugins['hapi-link-stack'].level,
    path: request.url.path
  };
};

exports.register = function (server, options, next) {

  //NOTE: We can use Hoek.applyDefaults as it will only take a shallow copy of options,
  // and our cache object won't survive.
  var settings = {
    sessionId: options.sessionId,
    cache: options.cache,
    expires: options.expires
  };

  var returnLink = function () {
    if (this.auth.isAuthenticated &&
        this.auth.credentials &&
        this.auth.credentials[settings.sessionId]
    ) {
      let store = this.plugins['hapi-link-stack'];
      if (store.length > 1) {
        return store[store.length - 2];
      } else {
        return store[0];
      }
    } else {
      return {};
    }
  };

  server.decorate('request', 'returnLink', returnLink);

  server.ext('onPostAuth', function (request, reply) {
    if(request.auth.isAuthenticated &&
        request.auth.credentials &&
        request.auth.credentials[settings.sessionId]
    ) {

      internals.setRouteDefaults(request);

      // Retrieve the links stack from the session cache (if there is one).
      settings.cache.get(request.auth.credentials[settings.sessionId], function(err, session) {
        if (err) {
          reply(err);
        } else {

          let linkStack = internals.setLinkStack(request, session);

          let link = internals.getLinkForRoute(request);

          // Remove any equal, or greater level values from the stack
          while (linkStack[linkStack.length - 1].level >= link.level) {
            linkStack.pop();
          }

          // Push the incoming link onto the stack
          linkStack.push(link);

          reply.continue();

        }
      });
    } else {
      reply.continue();
    }
  });

  // Put the linkStack back into the session cache
  server.ext('onPreResponse', function (request, reply) {
    if (request.auth.isAuthenticated &&
        request.auth.credentials &&
        request.plugins['hapi-link-stack'] &&
        request.plugins['hapi-link-stack'].length > 0
    ) {

      let id = request.auth.credentials[settings.sessionId];

      settings.cache.get(id, function(err, session) {
        if (err) {
          reply(err);
        } else {
          if(session) {
            session.links = request.plugins['hapi-link-stack'];
            settings.cache.set(id, session, settings.expires, function (err) {
              if (err) {
                return reply(err);
              } else {
                return reply.continue();
              }
            });
          } else {
            return reply.continue();
          }
        }
      });
    } else {
      return reply.continue();
    }
  });

  return next();
};

exports.register.attributes = {
  pkg: require('../package.json')
};