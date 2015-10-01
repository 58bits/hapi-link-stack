# hapi-link-stack

Request interface decorated methods for creating a link stack - for breadcrumb trails, and return urls.
 
## Installation

`npm install hapi-link-stack --save`

## Registering the Plugin


    server.register(require('hapi-link-stack'), function(err) {
      if (err) {
        console.log('Failed loading plugin');
      }
    });
    
or
   
    server.register({
        register: require('hapi-link-stack'),
        options: {
            sessionId: 'sid',
            segment: 'link-stack',
            expires: 60 * 60 * 1000 ,  // 60 minutes
        }
     }, function (err) {
         if (err) {
             console.log('Failed loading plugin');
         }
     });

## Usage

Routes are decorated with linkStack values (they default to 1, and an empty label).

For example...

    {
      path: '/users',
      method: 'GET',
      config: {
        handler: require('./handlers/users/index'),
        auth: 'session',
        plugins: {'hapi-link-stack': { level: 1, label: 'Users'}}
      }
    },
    
    {
      path: '/users/{id}',
      method: 'GET',
      config: {
        handler: require('./handlers/users/show'),
        auth: 'session',
        validate: {
          params: {
            id: Joi.number().integer().min(1)
          }
        },
        plugins: {'hapi-link-stack': { level: 2, label: 'User'}}
      }
    },
    
    {
      path: '/users/{id}/edit',
      method: ['GET', 'PUT'],
      config: {
        handler: require('./handlers/users/edit'),
        auth: 'session',
        validate: {
          params: {
            keyId: Joi.number().integer().min(1)
          }
        },
        plugins: {'hapi-link-stack': { level: 3, label: 'Edit User'}}
      }
    },
    
    {
      path: '/offices/new',
      method: ['GET', 'POST'],
      config: {
        handler: require('./handlers/offices/new'),
        auth: 'session',
        plugins: {'hapi-link-stack': { level: 4, label: 'New Office'}}
      }
    },
    
    
The hapi-link-stack plugin, decorates the `request` object with a `returnLink` function, and so `request.returnLink();` from anywhere the request interface is available, will return the return link in the stack.

For example, if an object context was being set, for rendering in a handlebars template....


     options.context.returnLink = request.returnLink();
     reply.view(options.template, options.context)
     
     // From inside the handelbars template
     <a class="btn" href="{{returnLink.path}}">Return</a>


Here's an image that illustrates the linkStack settings above...

<img src="https://raw.githubusercontent.com/58bits/hapi-link-stack/master/images/linkstack.png" width="800" height="159" alt="LinkStack"/>

In this example the current task is to edit user details, however, there's a relationship between users and offices, with each user having one main office. In the quintessential example above, the user is moving to a new office, but the office record does not exist in the system yet. In this case the interface contains a link next to the office selector on the user edit form, for 'create new office', and the task 'jumps' to the new office screen (the new office screen can also be display from an offices maintenance area of the application, and so there are different 'routes' to the new office form). The current link stack settings allow the task to return to the new user form after the new office has been created.
 
To support the above use case, core entities or models of greater interest, are given lower links stack values. Reference tables, or lookups, or 'tangential' tasks are given higher values.  