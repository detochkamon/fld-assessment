# FullStack Developer assessment

Simple MERN app which implements API that authenticates and registers a user to a MongoDB database.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Install
```
# Clone the repository
git clone https://github.com/detochkamon/fld-assessment.git

# Go inside the directory
cd fld-assessment

# Install dependencies
npm install
```

### MongoDB config
Change MongoDB connection string if needed
```
# /src/server/config.js
module.exports = {
    db: {
        connectionString: 'mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]'
    }
}
```

### Starting server

```
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Live demo

http://dysprosiumlabs.com:8080/

## API
All API methods should return JSON response:
```
{
    success: boolean,
    data: object | null,
    [reason: <error_code>]
}
```
See `/src/GenericResponse.js` for available error codes.


| Name | Method | Parameters | Description |
| --- | --- | --- | --- |
| /api/check-username | POST | `username:string` | Checks if user with given `username` already exists |
| /api/register | POST | `fullname:string`<br>`username:string`<br>`password:string` | Registers new user in DB, `fullname` is optional, `username` and `password` should be at least 1 character long. |
| /api/authenticate | POST | `username:string`<br>`password:string` | Authenticates user using give `username` and `password` |
| /api/deauthenticate | GET |  | Deauthenticates previously authenticated user |
| /api/checkLoggedIn | POST |  | Returns `success:true` if user was successfully authenticated |

