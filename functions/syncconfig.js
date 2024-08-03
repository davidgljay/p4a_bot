const fs = require('fs');
const { exec } = require('child_process');


// Read the .runtimeconfig.json file
const config = JSON.parse(fs.readFileSync('.runtimeconfig.json', 'utf8'));

// Function to set a config variable
function setConfig(path, value) {
  const command = `firebase functions:config:set ${path}="${value}"`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Stdout: ${stdout}`);
  });
}

// Function to traverse the config object
function traverse(obj, path = '') {
  for (const key in obj) {
    setTimeout(() => {}, 100);
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      // If the value is an object, recurse
      traverse(obj[key], `${path}${key}.`);
    } else {
      // If the value is not an object, set the config variable
      setConfig(`${path}${key}`, obj[key]);
    }
  }
}

// Start the traversal
traverse(config);