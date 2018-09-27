# FullStack Developer assessment

Simple MERN app which implements API that authenticates and registers a user to a MongoDB database.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

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
