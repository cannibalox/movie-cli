#!/usr/bin/env node
"use strict";

import { Command } from "commander";
import chalk from "chalk";
import elegantSpinner from "elegant-spinner";
import logUpdate from "log-update";
import cliSelect from "cli-select";
import clipboardy from "node-clipboardy";
import dateFormat, { masks } from "dateformat";
// import { cfg } from "./config.js";
import fs from "fs";
import sanitize from "sanitize-filename";
import prompts from "prompts";
import Conf from "conf";
import isFirstRun from "first-run";
const omdbUrl = "http://www.omdbapi.com/?apikey=";
const tmdbUrlfind = "https://api.themoviedb.org/3/find/";
const program = new Command();
const frame = elegantSpinner();
const now = new Date();
const cfg = new Conf();
var clipboard = "";
var movietitle = "";
var originalTitle = "";
//const { version } = JSON.parse(fs.readFileSync("./package.json"));
////// MAIN
var settings = {
  //omdbapiKey: "", //"5e540903",
  //tmdbKey: "", //"1a8d1689f01251ca6ee058b29622441e",
  saveFilePath: "d:\\ls-test\\pages\\",
  copyToClipboard: true,
  DefaultTags: "#watched",
  addCustomInfo: true, // if `false` it only displays info and exits
  askRating: true, // add custoôrating 1-10 (that gets converted to stars)
  askWatchedDate: true, // add a date formatted as myDateFormat on output
  askAnything: false, // input any text/string
  pathToJournal: "d:\\ls-test\\journals\\",
  mytemplate: "- DONE #watched [[%movietitle%]]", //text that will be appended to daily journam
  encloseStrings: true, // enclose value strings in doublébrackets (for plot,awards, boxoffice )
  myDateFormat: "yyyymmdd", // see https://github.com/felixge/node-dateformat#mask-options
  fetchOriginalTitle: true, // add original title property. requires TMDB api key`
  // define properties to fetch for movie details
  propsToShow: [
    //  "Title"
    //  "Type",
    "original-title", // is a special case handled by TMDB
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
    //  "imdbVotes",
    "Production",
    "Released",
    "Runtime",
    //  "Rated",
    //  "DVD",
    "BoxOffice",
    "imdbID",
    "Poster",
  ],
  // properties to show when comparing movies
  propsToCompare: [
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
  ],
};

// map settiongs
for (const [key, value] of Object.entries(settings)) {
  cfg.set(key,value);
//  console.log(`${key}`, cfg.get(key), `= ${value}`);
};

program
.version('1.0.7', '-v, --version', 'output the current version')
.description("Get information about a movie or tv series or compare two movies")
.option('-k, --key', 'enter your apîkeys')
.option('-r, --reset', 'Clear Config')
.addHelpText('after', `

Examples:
> movie Brazil                 
> movie star wars::star trek   // will compare 'star wars' and 'star trek'
`);
program.parse(process.argv);
const options = program.opts();
  if (program.args.length < 1) {
    console.log(chalk.red("Please give a movie name!!"));
    console.log(options);
    
    process.exit(1);
  }
  
console.log('first run ? ',isFirstRun({ name: "movie-cli-2" }));
console.log("movie-cli-2 v",program.version());
if (program.reset) {
   firstRun.clear();
   console.log('cleared prefs');
   process.exit(1);
} 

if (program.args.join().toUpperCase().indexOf("::") !== -1) {
  compareInfo();
} else {
  if (cfg.get("omdbapiKey") === undefined || program.key) {
    // await askuser("omdbapiKey");
    async function askuser(dispKey) {
      var prName = await prompts({
        type: "text",
        name: "prOmdb",
        message: `enter your ${dispKey} key:`,
      });
      console.log(" response:", prName.prOmdb);
      cfg.set(dispKey, prName.prOmdb);
      console.log(`saved ${dispKey} : ${cfg.get(dispKey)} in ${cfg.path}`);
    }
  }
  fetchMovie(
    `${omdbUrl}${cfg.get('omdbapiKey')}&s=${program.args
      .join()
      .trim()
      .replace(/ /g, "+")}`
  )
    .then(async (mov) => {
      await printInfo(mov);
    })
    .then(async () => {
      if (cfg.addCustomInfo === true) {
        await addCustomInfo();
      }
    })
    .catch((error) => {
      console.error(chalk.red(error));
    });
}

async function fetchMovie(url) {
  const interval = setInterval(function () {
    logUpdate("Loading..." + chalk.cyan.bold.dim(frame()));
  }, 50);
  try {
    const res = await fetch(url);
    const data = await res.json();
    clearInterval(interval);
    logUpdate.clear();
    if (data.Response === "False") {
      console.log(chalk.red("ERROR : can't find matching title !\n"));
      process.exit(1);
    }
    return data;
  } catch (error) {
    logUpdate.clear();
    console.log(chalk.red("ERROR !", error));
    process.exit(1);
  }
}

function compareInfo() {
  const movies = program.args.join(" ").toUpperCase().split("::");
  const urls = movies.map(function (mov) {
    return `${omdbUrl}${cfg.get('omdbapiKey')}&t=${mov.trim().replace(/ /g, "+")}`;
  });
  const m0 = fetchMovie(urls[0]);
  const m1 = fetchMovie(urls[1]);
  Promise.all([m0, m1]).then((movies) => {
    cfg.propsToCompare.forEach((prop) => {
      if (movies[0][prop] === undefined) {
        movies[0][prop] = "N/A";
      }
      if (movies[1][prop] === undefined) {
        movies[1][prop] = "N/A";
      }
      console.log(
        chalk.bold.cyan(prop),
        " ".repeat(13 - prop.length),
        movies[0][prop],
        " ".repeat(50 - movies[0][prop].length),
        movies[1][prop],
        ""
      );
    });
  });
}

async function printInfo(movie) {
  const movielist = new Array();
  //const movieyear = new Array();
  for (const result of movie["Search"]) {
    movielist.push(`${result["Title"]} [[${result["Year"]}]]`);
  }
  await cliSelect({
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
    .then(async (value) => {
      //console.log('value:',value);
      movietitle = value.value;
      console.log(chalk.bold.green.underline("\n" + movietitle));
      const movieinfo = await fetchMovie(
        `${omdbUrl}${cfg.get('omdbapiKey')}&plot=full&i=${
          movie["Search"][value.id]["imdbID"]
        }`
      );
      //console.log("movieinfo:", movieinfo);
      logUpdate.clear();
      // custom tags
      var mytag = "";
      if (cfg.includeTitleProp === true) {
        if (movieinfo.Type === "movie") {
          mytag = "#movies";
        } else if (movieinfo.Type === "series") {
          mytag = "#TV";
        }
        var clipboard = `title:: ${movietitle}\ntags:: ${cfg.DefaultTags}, ${mytag}\n`;
      } else {
        var clipboard = `tags:: ${cfg.DefaultTags}, ${movieinfo.Type}\n`;
      }

      // check original title
      if (cfg.fetchOriginalTitle === true) {
        const tmdbinfo = await fetchMovie(
          `${tmdbUrlfind}${movieinfo.imdbID}?api_key=${cfg.tmdbKey}&language=en-US&external_source=imdb_id`
        );
        //console.log('tmdb :', tmdbinfo);
        //map only if original_title is different from title
        if (tmdbinfo["movie_results"].length > 0) {
          if (
            tmdbinfo["movie_results"][0]["original_title"] !==
            tmdbinfo["movie_results"][0]["title"]
          ) {
            originalTitle = tmdbinfo["movie_results"][0]["original_title"];
          }
        } else {
          originalTitle = "N/A";
        }
      }
      // loop through keys
      cfg.get('propsToShow').forEach(function (prop, i, arr) {
        const dispValue = Object.create(movieinfo);
        // reformat specific properties::values
        switch (prop) {
          case "original-title":
            dispValue[prop] = `${originalTitle}`;
            //console.log(prop, ' >>>> ',dispValue[prop] );
            break;
          case "imdbID":
            dispValue[
              prop
            ] = `[${movieinfo[prop]}](https://www.imdb.com/title/${movieinfo[prop]})`;
            break;
          case "Plot":
          case "BoxOffice":
          case "Awards":
            if (cfg.encloseStrings === true) {
              dispValue[prop] = '"' + dispValue[prop] + '"';
            }
            break;
          case "Year":
            dispValue[prop] = "[[" + dispValue[prop] + "]]";
            break;
          // case 'Released':
          //   const formattedDate = dateFormat(dispValue[prop], cfg.myDateFormat);
          //   dispValue[prop] = '['+dispValue[prop]+']('+formattedDate+')';
          //   break;
          default:
            dispValue[prop] = `${movieinfo[prop]}`;
        }
        if (dispValue[prop] !== "N/A" && dispValue[prop] !== undefined) {
          console.log(
            chalk.bold.cyan(prop) +
              " ".repeat(15 - prop.length) +
              ": " +
              dispValue[prop] +
              ""
          );
          clipboard += `${prop}:: ${dispValue[prop]}\n`;
        }
      });
      console.log(
        chalk.bold.cyan("imdbLink") +
          " ".repeat(7) +
          ": https://www.imdb.com/title/",
        movieinfo["imdbID"] + "\n\n"
      );
      if (cfg.copyToClipboard === true) {
        clipboardy.write(clipboard);
      }
    })
    .catch((err) => {
      console.log(" - cancelled -", err);
    });
}

async function addCustomInfo() {
  const onCancel = (resp) => {
    return true; // keep asking questions on Esc
  };
  const resp = await prompts(
    [
      {
        type: cfg.askRating === true ? "number" : null,
        name: "rating",
        message: "input rating:: (0-10)  > ",
        initial: 5,
        increment: 1,
        round: 1,
        min: 0,
        max: 10,
      },
      {
        type: cfg.askWatchedDate === true ? "date" : null,
        name: "watchdate",
        message: "input watched:: (date) > ",
        initial: now,
        mask: "YYYY-MM-DD",
      },
      {
        type: cfg.askAnything === true ? "text" : null,
        name: "customtext",
        message: "input custom text > ",
      },
      {
        type: "toggle",
        name: "appendToJournal",
        message: "Append entry to Journal Page ?",
        initial: true,
        active: "yes",
        inactive: "no",
      },
      {
        type: "toggle",
        name: "saveToFile",
        message: `Save details as ${movietitle}.md ?`,
        initial: false,
        active: "yes",
        inactive: "no",
      },
    ],
    { onCancel }
  );

  if (cfg.copyToClipboard === true) {
    var clip = await clipboardy.read();
    clipboard += clip + convertToStars(resp.rating) + "\n";
    clipboard +=
      "watched:: [[" + dateFormat(resp.watchdate, cfg.myDateFormat) + "]]\n";
    if (resp.customtext !== undefined) {
      clipboard += resp.customtext;
    }
    //console.log(clipboard);
    clipboardy.write(clipboard);
  }
  if (resp.appendToJournal === true) {
    //console.log(movietitle);
    fs.appendFile(
      `${cfg.pathToJournal}${dateFormat(resp.watchdate, "yyyy_mm_dd")}.md`,
      "\n\n" + cfg.mytemplate.replace("%movietitle%", movietitle),
      "utf-8",
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );
  }
  if (resp.saveToFile === true) {
    fs.writeFile(
      `${cfg.saveFilePath}${sanitize(movietitle)}.md`,
      clipboard,
      (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log(
            chalk.green(
              `saved '${sanitize(movietitle)}.md' to '${cfg.saveFilePath}'\n\n`
            )
          );
        }
      }
    );
  }
}

function convertToStars(val) {
  var result = "rating:: ";
  if (val === 0) {
    result += "[[💣]]";
    return result;
  }
  result += "[[" + "⭐".repeat(Math.trunc(val / 2));
  if (val % 2 !== 0) {
    result += "½]]";
  } else {
    result += "]]";
  }
  return result;
}

async function askuser(dispKey) {
   var prName = await prompts({
     type: "text",
     name: "prOmdb",
     message: `enter your ${dispKey} key:`,
   });
   console.log(" response:", prName.prOmdb);
   cfg.set(dispKey, prName.prOmdb);
   console.log(`saved ${dispKey} : ${cfg.get(dispKey)} in ${cfg.path}`);
 };

