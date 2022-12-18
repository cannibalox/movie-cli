#!/usr/bin/env node
'use strict';

import program from 'commander';
import clipboardy from 'clipboardy';
import chalk from 'chalk';
import elegantSpinner from 'elegant-spinner';
import logUpdate from 'log-update';
import fetch from 'isomorphic-fetch';
const frame = elegantSpinner();

const propsToShow = [
  'Year', 'Genre', 'Director', 'Writer', 'Actors',
  'Plot', 'Language', 'Country', 'Awards', 
  'Metascore', 'imdbRating', 'Production', 'Released', 'Runtime', 'BoxOffice', 'Poster'
]; // 'Title'
  
const propsToCompare = [
  'Title', 'Year', 'Released', 'Runtime',
  'Genre', 'Metascore', 'imdbRating', 'tomatoMeter',
  'BoxOffice', 'Production'
];

const defaultKey = '5e540903';

const initialUrl = 'http://www.omdbapi.com/?apikey=';
  
program
.description('Get information about a movie or tv series or compare two movies!')
.parse(process.argv);

if(program.args.length < 1) {
  console.log(chalk.red('Please give a movie name!!')); 
  process.exit(1);
}

if(program.args.join().toUpperCase().indexOf('::') !== -1) {
  const interval1 = setInterval(function() {
  logUpdate("Loading..." + chalk.cyan.bold.dim(frame()));
  }, 50)
  const movies = program.args.join(" ").toUpperCase().split("::");
  const urls = movies.map(function(mov) {
    return `${initialUrl}${defaultKey}&t='${mov.trim().replace(/ /g,"+")}`
  });
  
  Promise.all(urls.map(fetch)).
  then(function(res) { return Promise.all(res.map(function(res) { return res.json()})) }).
  then(function(movies) { 
    clearInterval(interval1); 
    logUpdate.clear();
    compareInfo(movies) 
  });
  }
else {
  const interval = setInterval(function() {
  logUpdate("Loading..." + chalk.cyan.bold.dim(frame()));
  }, 50)
  fetch(`${initialUrl}${defaultKey}&t=${program.args.join().trim().replace(/ /g,"+")}`)
  .then(function(res) { return res.json()})
  .then(function(mov) {
    clearInterval(interval); 
    logUpdate.clear();
    printInfo(mov)});
}

function compareInfo(movies) {
  if(movies[0].Response === 'False' || movies[1].Response === 'False') {
    console.log(chalk.red('Movie not found!'));
    process.exit(1);
  }
  
  propsToCompare.forEach(function(prop, i, arr) {
        if(movies[0][prop] === 'N/A' && movies[1][prop] === 'N/A') {
          return ;
        }
        console.log(chalk.bold.cyan(prop), " ".repeat(13-prop.length), movies[0][prop], "", 
        " ".repeat(50-movies[0][prop].length), movies[1][prop], ""
        );
  });
  
}

function printInfo(movie) {
  if(movie.Response === 'False') {
    console.log(chalk.red(movie.Error));
    process.exit(1);
  }
  var output = "Tags:: #movies, #watched\n"; // hpx
  propsToShow.forEach(function(prop, i, arr) {
        if(movie[prop] !== 'N/A'){
        console.log(chalk.bold.cyan(prop)+"::", movie[prop], "");

        // === coopy to clipboard hpx====
        if (prop == 'Plot' || prop == 'BoxOffice' || prop == 'Awards') {output = output.concat(prop,':: "', movie[prop], '"\n');}
          else
        {output = output.concat(prop,":: ", movie[prop], "\n");} //hpx
        }
  });
// copy to clipboard
clipboardy.writeSync(output);
console.log('\n>>>>>>  copied to clipboard ! <<<<<<<<<<<<<');
}

