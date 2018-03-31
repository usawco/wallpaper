#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');
const path = require('path');
const app = require('../lib/index.js');

const pkgJson = fs.readFileSync(path.resolve( __dirname, '../package.json'));
const json = JSON.parse( pkgJson );
program
  .version(json.version)
  .description('set random desktop background image');
  //.option('-a, --autodetect', 'Detect desktop resolution and update queries')

program
  .command('exec')
  //.arguments()
  .description('Generate a new random image and set desktop')
  .action(() => execute() );

program
  .command('gen')
  //.arguments()
  .description('Generate a new random image')
  .action(() => generate() );

program   
  .command('set')
  //.arguments()
  .description('Set desktop background with the current generated image')
  .action(() => setDesktop() );

program
  .command('get')
  //.arguments()
  .description('Get current desktop image metadata')
  .action( () => console.log(app.getLastEntry()) );

program.parse(process.argv);

function execute() {
  app.generateImage(true);
}

function generate() {
    app.generateImage(false);
}

function setDesktop() {
    app.setBackground();
}

