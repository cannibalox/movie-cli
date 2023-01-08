#!/usr/bin/env node
"use strict";

import { Command } from "commander";
import chalk from "chalk";
import elegantSpinner from "elegant-spinner";
import logUpdate from "log-update";
import fetch from "node-fetch";
import frame from "elegant-spinner";
import cliSelect from "cli-select";
import clipboardy from "node-clipboardy";
import dayjs from "dayjs";
import { cfg } from "./config.js";
import fs from "fs";
import sanitize from "sanitize-filename";

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
    return `${initialUrl}${cfg.omdbapiKey}&t=${mov.trim().replace(/ /g, "+")}`;
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
    `${initialUrl}${cfg.omdbapiKey}&s=${program.args
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

  cfg.propsToCompare.forEach(function (prop, i, arr) {
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
  const movieyear = new Array();
  for (const result of movie["Search"]) {
    movielist.push(`${result["Title"]} [[${result["Year"]}]]`);
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
      const movietitle = value.value;
      console.log(chalk.bold.green.underline("\n" + movietitle));
      const interval = setInterval(function () {
        logUpdate("Loading..." + chalk.cyan.bold.dim(frame()));
      }, 50);
      fetch(
        `${initialUrl}${cfg.omdbapiKey}&plot=full&i=${
          movie["Search"][value.id]["imdbID"]
        }`
      )
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
          if (cfg.includeTitleProp === true) {
            var clipboard = `title:: ${movietitle}\ntags:: #movies, #watched\n`;
          } else {
            var clipboard = "tags:: #movies, #watched\n";
          }
          cfg.propsToShow.forEach(function (prop, i, arr) {
            if (movie[prop] !== "N/A") {
              console.log(chalk.bold.cyan(prop) + "::", movie[prop], "");
              // format metadata for logseq properties
              if (prop === "imdbID") {
                clipboard += `imdbID:: [${movie[prop]}](https://www.imdb.com/title/${movie[prop]})\n`;
              } else if (
                prop == "Plot" ||
                prop == "BoxOffice" ||
                prop == "Awards"
              ) {
                clipboard += `${prop}:: "${movie[prop]}"\n`;
              } else {
                clipboard += `${prop}:: ${movie[prop]}\n`;
              }
            }
          });
          console.log(
            chalk.bold.cyan("imdbLink") +
              ":: https://www.imdb.com/title/" +
              movie["imdbID"],
            "\n\n"
          );
          if (cfg.copyToClipboard === true) {
            clipboardy.writeSync(clipboard);
          }
          if (cfg.saveFilePath !== "") {
            cliSelect({
              values: ["Save infos to .md File", "Exit"],
              defaultValue: 1,
              valueRenderer: (val, sel) => {
                if (sel) {
                  return chalk.bold.green.underline(val);
                }
                return val;
              },
            })
              .then((resp) => {
                if (resp.id == 0) {
                  fs.writeFile(
                    `${cfg.saveFilePath}${sanitize(movietitle)}.md`,
                    clipboard,
                    (err) => {
                      if (err) {
                        console.error(err);
                      }
                      console.log(
                        `saved ${sanitize(movietitle)}.md to ${
                          cfg.saveFilePath
                        }`
                      );
                    }
                  );
                }
              })
              .catch((err) => {
                console.log("cancelled");
              });
          }
        });
    })
    .catch(() => {
      console.log("cancelled");
    });
}
