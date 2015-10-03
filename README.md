# hapi-link-stack

Request interface decorated methods for creating a link stack - for breadcrumb trails, and return urls.
 
## Use Case
 
 hapi-link-stack can be used to maintain a session-based stack of request urls, for breadcrumb trails, and return urls. The stack is based on link levels, and higher levels allow a user to break out of a current task, and return to where they've left off when the side task has been completed. Return urls can also be used to return to dynamic content, like specific page numbers after viewing item details from a given page in a list.  
 
 For example...
 
 <img src="https://raw.githubusercontent.com/58bits/hapi-link-stack/master/images/linkstack.png" width="800" height="159" alt="LinkStack"/>
 
 In this example the current task is to edit user details, however, there's a relationship between users and offices, with each user having one main office. User/1 is moving to a new office, but the office record does not exist in the system yet. The edit/new interface for a user contains a link next to the office selector for the break-out task 'create new office', and the task 'jumps' to the new office screen (the new office screen can also be displayed from an offices maintenance area of the application, and so there are different 'routes' to the new office form). The current link stack settings allows the system user to return to the new user form after the new office has been added. Note: The new office route is set to level 5, so that a 'post redirect to get' pattern can be used to return either to a list of offices, and then the user edit screen, or directly to the user edit screen - for example using [hapi-flash](https://github.com/58bits/hapi-flash).
  
 To support the above use case, core entities or models of greater interest, are given lower links stack values. Reference tables, or lookups, or 'tangential' tasks are given higher values.  
 
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
      method: ['GET', 'POST'],
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
      path: '/offices',
      method: ['GET', 'POST'],
      config: {
        handler: require('./handlers/offices'),
        auth: 'session',
        plugins: {'hapi-link-stack': { level: 4, label: 'Offices'}}
      }
    },
    
    {
      path: '/offices/new',
      method: 'GET',
      config: {
        handler: require('./handlers/offices/new'),
        auth: 'session',
        plugins: {'hapi-link-stack': { level: 5, label: 'New Office'}}
      }
    },
    
    
The hapi-link-stack plugin, decorates the `request` object with a `returnLink` function, and so `request.returnLink();` from anywhere the request interface is available, will return the return link in the stack.

For example, if an object context was being set, for rendering in a handlebars template....


     options.context.returnLink = request.returnLink();
     reply.view(options.template, options.context)
     
     // From inside the handelbars template
     <a class="btn" href="{{returnLink.path}}">Return to {{returnLink.label}}</a>
