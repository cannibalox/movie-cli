#!/usr/bin/env node
"use strict";

import { Command } from "commander";
import chalk from "chalk";
import elegantSpinner from "elegant-spinner";
import logUpdate from "log-update";
import fetch from "isomorphic-fetch";
import frame from "elegant-spinner";
import cliSelect from "cli-select";
import clipboardy from "node-clipboardy";
import dayjs from "dayjs";

const propsToShow = [
  "Type",
  "Year",
  "Genre",
  "Director",
  "Writer",
  "Actors",
  "Plot",
  "Language",
  "Country",
  "Awards",
  "Metascore",
  "imdbRating",
  "Production",
  "Released",
  "Runtime",
  "BoxOffice",
  "imdbID",
  "Poster",
];
// Title, Rated,imdbVotes, Type, DVD, Production
const propsToCompare = [
  "Title",
  "Year",
  "Released",
  "Runtime",
  "Genre",
  "Metascore",
  "imdbRating",
  "BoxOffice",
  "Production",
  "Director",
  "Writer",
  "Actors",
];
const defaultKey = "5e540903";

const initialUrl = "http://www.omdbapi.com/?apikey=";
const program = new Command();
program
  .description(
    "Get information about a movie or tv series or compare two movies!"
  )
  .parse(process.argv);

if (program.args.length < 1) {
  console.log(chalk.red("Please give a movie name!!"));
  process.exit(1);
}

if (program.args.join().toUpperCase().indexOf("::") !== -1) {
  const movies = program.args.join(" ").toUpperCase().split("::");
  const urls = movies.map(function (mov) {
    return `${initialUrl}${defaultKey}&t=${mov.trim().replace(/ /g, "+")}`;
  });
  //console.log('urls0 : ', urls[0]," >>> url1: ",urls[1]);
  const m0 = fetchMovie(urls[0]);
  const m1 = fetchMovie(urls[1]);
  Promise.all([m0, m1]).then((movies) => {
    compareInfo(movies);
  });
} else {
  const interval = setInterval(function () {
    logUpdate("Loading..." + chalk.cyan.bold.dim(frame()));
  }, 50);
  fetch(
    `${initialUrl}${defaultKey}&s=${program.args
      .join()
      .trim()
      .replace(/ /g, "+")}`
  )
    .then(function (res) {
      return res.json();
    })
    .then(function (mov) {
      clearInterval(interval);
      logUpdate.clear();
      printInfo(mov);
    });
}

async function fetchMovie(url) {
  const interval1 = setInterval(function () {
    logUpdate("Loading..." + chalk.cyan.bold.dim(frame()));
  }, 50);
  const res = await fetch(url);
  const metadata = await res.json();
  clearInterval(interval1);
  logUpdate.clear();
  return metadata;
}

function compareInfo(movies) {
  if (movies[0].Response === "False" || movies[1].Response === "False") {
    console.log(chalk.red("Movie not found!"));
    process.exit(1);
  }

  propsToCompare.forEach(function (prop, i, arr) {
    if (movies[0][prop] === "N/A" && movies[1][prop] === "N/A") {
      return;
    }
    console.log(
      chalk.bold.cyan(prop),
      " ".repeat(13 - prop.length),
      movies[0][prop],
      "",
      " ".repeat(50 - movies[0][prop].length),
      movies[1][prop],
      ""
    );
  });
}

function printInfo(movie) {
  if (movie.Response === "False") {
    console.log(chalk.red("No matching titles found!"));
    process.exit(1);
  }
  const movielist = new Array();
  for (const result of movie["Search"]) {
    movielist.push(result["Title"]);
  }
  cliSelect({
    values: movielist,
    cleanup: true,
    indentation: 3,
    valueRenderer: (value, selected) => {
      if (selected) {
        return chalk.bold.green.underline(value);
      }
      return value;
    },
  })
    .then((value) => {
      console.log(
        chalk.bold.green.underline(
          "\n" + value.value + " (" + movie["Search"][value.id]["Year"] + ")"
        )
      );
      const interval = setInterval(function () {
        logUpdate("Loading..." + chalk.cyan.bold.dim(frame()));
      }, 50);
      fetch(`${initialUrl}${defaultKey}&plot=full&t=${value.value}`)
        .then(function (res) {
          return res.json();
        })
        .then(function (movie) {
          clearInterval(interval);
          logUpdate.clear();
          if (movie.Response === "False") {
            console.log(chalk.red(movie.Error));
            process.exit(1);
          }
          var output = "Tags:: #movies, #watched\n";
          propsToShow.forEach(function (prop, i, arr) {
            if (movie[prop] !== "N/A") {
              console.log(chalk.bold.cyan(prop) + "::", movie[prop], "");
              // === copy to clipboard ====
              if (prop == "Plot" || prop == "BoxOffice" || prop == "Awards") {
                output = output.concat(prop, ':: "', movie[prop], '"\n');
              } else {
                output = output.concat(prop, ":: ", movie[prop], "\n");
              }
            }
          });
          clipboardy.writeSync(output);
          console.log("\n>>> metadata copied to clipboard ! <<<\n\n");
        });
    })
    .catch(() => {
      console.log("cancelled");
    });
}
