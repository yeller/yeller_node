# yeller_node

[Yeller](http://yellerapp.com) notifier for node.js

## Get started: report errors to yeller in 30 seconds

```javascript
var yeller = require('./yeller_node')
var yellerClient = yeller.client({token: 'YOUR_API_TOKEN_HERE'})
yellerClient.report(new Error('an message'));
```

## Including additional information

Often you'll want to include more information about what was going on when the error happened

```javascript
yellerClient.report(new Error('an message'),
 {location: 'myhandler', url: 'http://example.com'
  customData: {userID: 1}});
```

Here are the available options that you can pass to `report` to give additional information:

- `location`: the name of what kind of program was running when this error happened. For http requests, this might be the name of the handler, for background jobs, the name of the job, etc
- `url` (http only): the url of the http request that caused this error
- `customData`: this is an arbitrary JSON hash of any information you want to send along with the error. Typical suspects: http params, http session, current job params, data about the currently logged in user, etc

## Questions

If you have any questions, feel free to shoot me an email, [tcrayford@yellerapp.com](mailto:tcrayford@yellerapp.com).

## Bug Reports And Contributions

Think you've found a bug? Sorry about that. Please open an issue on Github, or
email me at [tcrayford@yellerapp.com](mailto:tcrayford@yellerapp.com) and I'll
check it out as soon as possible.
