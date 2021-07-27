const { execSync } = require("child_process");
const fs = require('fs')

let envFilePath = ""
if (process.env.GITHUB_ACTIONS) { //Always set to true within github actions
    console.log("🤖 Running in Github Actions; linking rnuc to example .env file")
    envFilePath = ".env/.env.example"
}else{
    console.log("Running locally, linking rnuc to live .env file")
    envFilePath = ".env/.env"
    if (!fs.existsSync(envFilePath)) console.log(`⚠️ WARNING! Couldn't find ${envFilePath}`)
}

stdout = execSync(`yarn rnuc ${envFilePath}`,  {stdio: 'inherit'});