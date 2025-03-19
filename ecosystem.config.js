module.exports = {
  apps : [{
    name   : "Inspire_Hub",
    script : "./dist/backend/src/app.js",
    env_production:{
      NODE_ENV: "production"
    }
  }]
}
