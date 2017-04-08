# Google Apps Script Manager

Google provide an API to manipulate Apps Script. However, you should first send them to Drive in the appropriate format and send them. The purpose of this package is to simplify that part.

## Getting Started

### Retrieve OAuth2 token 
 
 Use Google OAuth2 Playground to get token data. 

https://developers.google.com/oauthplayground

### Upload your application

```javascript
import Manager from 'GoogleAppsScriptManager';

const oauth2Client = ... // oauth2Client

const manager = new Manager(oauth2Client);

// Folder containing all your JS files
const APP_PATH = './appsScript';

manager.upload({ appPath : './path'
               , name    : 'MyApplication'});
```

## Reference

### `GoogleAppsScriptManager.prototype.upload({appPath, name})`

### `GoogleAppsScriptManager.prototype.run({scriptId})`
