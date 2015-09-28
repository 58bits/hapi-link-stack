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

