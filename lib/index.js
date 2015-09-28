'use strict';

var Hoek = require('hoek');

// Declare internals
var internals = {};

internals.defaults = {
  sessionId: 'sid',
  segment: 'flash',
  expires: 60 * 60 * 1000 ,  // 60 minutes
  cache: {}
};

exports.register = function (server, options, next) {

  var settings = Hoek.applyToDefaults(internals.defaults, options);
  if(!settings.cache || Object.keys(settings.cache).length === 0) {
    settings.cache = server.cache({
      segment: settings.segment,
      expiresIn: settings.expires
    });
  }

  var returnLink = function () {
    let store = this.plugins['hapi-link-stack'];
    if(store && store.length > 1) {
      return store[store.length - 2];
    } else {
      return { label: 'Home', level: 0, path: '/'}
    }
  };

  server.decorate('request', 'returnLink', returnLink);

  server.ext('onPostAuth', function (request, reply) {
    if(request.auth.isAuthenticated &&
        request.auth.credentials &&
        request.auth.credentials[settings.sessionId]
    ) {

      // Set route settings default
      if (typeof request.route.settings.plugins['hapi-link-stack'] === 'undefined') {
        request.route.settings.plugins['hapi-link-stack'] = { level: 1, label: ''};
      }

      // Retrieve the links stack from the session cache (if there is one).
      settings.cache.get(request.auth.credentials[settings.sessionId], function(err, session) {
        if (err) {
          reply(err);
        } else {
          let linkStack = request.plugins['hapi-link-stack'] = session.linkStack || [];
          // 1. If empty - place 'home' on the stack
          if (linkStack.length === 0) {
            linkStack.push({
              label: 'Home',
              level: 0,
              path: '/'
            });
          }

          // 2. Setup our current request link object
          let link = {
            label: request.route.settings.plugins['hapi-link-stack'].label || '',
            level: request.route.settings.plugins['hapi-link-stack'].level,
            path: request.url.path
          };

          // 3. Remove any equal, or greater level values
          while (linkStack[linkStack.length - 1].level >= link.level) {
            linkStack.pop();
          }

          // 4. Push the incoming link onto the stack
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
            session.linkStack = request.plugins['hapi-link-stack'];
            settings.cache.set(id, session, settings.expires, function (err) {
              if (err) {
                return reply(err);
              } else {
                return reply.continue();
              }
            });
          } else {
            reply.continue();
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