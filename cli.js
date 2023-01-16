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
// import isFirstRun from "first-run";
// import clearFirstRun from "first-run";
import isFirstRun, { clearFirstRun } from "first-run";
const omdbUrl = "http://www.omdbapi.com/?apikey=";
const tmdbUrlfind = "https://api.themoviedb.org/3/find/";
const program = new Command();
const options = program.opts();
const frame = elegantSpinner();
const now = new Date();
const cfg = new Conf({
  projectName: 'movie-cli-2'
});
var clipboard = "";
var movietitle = "";
var originalTitle = "";

////// MAIN
// var settings = {
//   //omdbapiKey: "", //"5e540903",
//   //tmdbKey: "", //"1a8d1689f01251ca6ee058b29622441e",
//   saveFilePath: "d:\\ls-test\\pages\\",
//   copyToClipboard: true,
//   DefaultTags: "#watched",
//   addCustomInfo: true, // if `false` it only displays info and exits
//   askRating: true, // add custoôrating 1-10 (that gets converted to stars)
//   askWatchedDate: true, // add a date formatted as myDateFormat on output
//   askAnything: false, // input any text/string
//   pathToJournal: "d:\\ls-test\\journals\\",
//   mytemplate: "- DONE #watched [[%movietitle%]]", //text that will be appended to daily journam
//   encloseStrings: true, // enclose value strings in doublébrackets (for plot,awards, boxoffice )
//   myDateFormat: "yyyymmdd", // see https://github.com/felixge/node-dateformat#mask-options
//   fetchOriginalTitle: true, // add original title property. requires TMDB api key`
//   // define properties to fetch for movie details
//   propsToShow: [
//     //  "Title"
//     //  "Type",
//     "original-title", // is a special case handled by TMDB
//     "Year",
//     "Genre",
//     "Director",
//     "Writer",
//     "Actors",
//     "Plot",
//     "Language",
//     "Country",
//     "Awards",
//     "Metascore",
//     "imdbRating",
//     //  "imdbVotes",
//     "Production",
//     "Released",
//     "Runtime",
//     //  "Rated",
//     //  "DVD",
//     "BoxOffice",
//     "imdbID",
//     "Poster",
//   ],
//   // properties to show when comparing movies
//   propsToCompare: [
//     "Title",
//     "Year",
//     "Released",
//     "Runtime",
//     "Genre",
//     "Metascore",
//     "imdbRating",
//     "BoxOffice",
//     "Production",
//     "Director",
//     "Writer",
//     "Actors",
//   ],
// };

program
  .name("movie")
  .usage("[title] or [movie1]::[movie2]")
  .version(
    `movie-cli-2 1.0.7\nsettings are saved in ${cfg.path}`,
    "-v, --version",
    "output the current version"
  )
  .description(
    "Get information about a movie or tv series or compare two movies"
  )
  .option("-k, --key", "set and save your apîkeys")
  .option("-r, --reset", "resets options and clear keys")
  .option("-s, --settings", "define settings")
  .addHelpText(
    "after",
    `\n\nExamples:\n> movie Brazil\n> movie star wars::star trek   // will compare 'star wars' and 'star trek'

settings are saved in ${cfg.path}`
  )
  .showHelpAfterError()
  .parse(process.argv);

 // console.log(`movie-cli-2 v${program.version()} - first run ? ${isFirstRun({ name: "movie-cli-2" })}`);

if ((isFirstRun({ name: "movie-cli-2" }) === true  && !options.reset) || options.settings) {
  console.log(`Thank you for using ${program.version()}\n`+
    chalk.cyan(`This configuration step should only appear on the first run, or after using the --reset or --settings options.\n`));
  await setConfig();   
}
if (options.reset && isFirstRun({ name: "movie-cli-2" }) !== true) {
   clearFirstRun({name: 'movie-cli-2'});
   cfg.clear();
   console.log('cleared prefs\n');
   process.exit(1);
} 
if (options.key) {
  //console.log("current omdb api key is", cfg.get("omdbapiKey"));
  await askuser(
    "omdbapiKey",`enter your omdb api key :`,
    cfg.get("omdbapiKey", `2. enter your new tmdb api key :`, cfg.get("tmdbKey"))
  ); 
 // console.log("current tmdb api key is", cfg.get("tmdbKey"));
  await askuser(
    "tmdbKey",
    `2. enter your new tmdb api key :`,
    cfg.get("tmdbKey")
  ); 
}

if (program.args.length < 1) {
  console.log(chalk.red("\nPlease input a movie name\n"));
  program.help();
  process.exit(1);
}
if (program.args.join().toUpperCase().indexOf("::") !== -1) {
  compareInfo();
} else {
  if (cfg.get("omdbapiKey") === undefined) {
    await askuser("omdbapiKey");    
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
      if (cfg.get("addCustomInfo") === true) {
        await addCustomInfo();
      }
    })
    .catch((error) => {
      console.error(chalk.red('fetch error :', error));
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
      console.log(chalk.red("ERROR : can't find matching title using ",url,"\n"));
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
    cfg.get("propsToCompare").forEach((prop) => {
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
      if (cfg.get("includeTitleProp") === true) {
        if (movieinfo.Type === "movie") {
          mytag = "#movies";
        } else if (movieinfo.Type === "series") {
          mytag = "#TV";
        }
        var clipboard = `title:: ${movietitle}\ntags:: ${cfg.get("DefaultTags")}, ${mytag}\n`;
      } else {
        var clipboard = `tags:: ${cfg.get("DefaultTags")}, ${movieinfo.Type}\n`;
      }

      // check original title
      if (cfg.get("fetchOriginalTitle") === true) {
        const tmdbinfo = await fetchMovie(
          `${tmdbUrlfind}${movieinfo.imdbID}?api_key=${cfg.get("tmdbKey")}&language=en-US&external_source=imdb_id`
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
            if (cfg.get("encloseStrings") === true) {
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
      if (cfg.get("copyToClipboard") === true) {
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
        type: cfg.get("askRating") === true ? "number" : null,
        name: "rating",
        message: "input rating:: (0-10)  > ",
        initial: 5,
        increment: 1,
        round: 1,
        min: 0,
        max: 10,
      },
      {
        type: cfg.get("askWatchedDate") === true ? "date" : null,
        name: "watchdate",
        message: "input watched:: (date) > ",
        initial: now,
        mask: "YYYY-MM-DD",
      },
      {
        type: cfg.get("askAnything") === true ? "text" : null,
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

  if (cfg.get("copyToClipboard") === true) {
    var clip = await clipboardy.read();
    clipboard += clip + convertToStars(resp.rating) + "\n";
    clipboard +=
      "watched:: [[" + dateFormat(resp.watchdate, cfg.get("myDateFormat)") + "]]\n";
    if (resp.customtext !== undefined) {
      clipboard += resp.customtext;
    }
    //console.log(clipboard);
    clipboardy.write(clipboard);
  }
  if (resp.appendToJournal === true) {
    //console.log(movietitle);
    fs.appendFile(
      `${cfg.get("pathToJournal")}${dateFormat(resp.watchdate, "yyyy_mm_dd")}.md`,
      "\n\n" + cfg.get("dailylogtemplate").replace("%movietitle%", movietitle),
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
      `${cfg.get("saveFilePath")}${sanitize(movietitle)}.md`,
      clipboard,
      (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log(
            chalk.green(
              `saved '${sanitize(movietitle)}.md' to '${cfg.get("saveFilePath")}'\n\n`
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

async function askuser(dispKey, msg, initial) {
   var prName = await prompts({
     type: "text",
     name: "prOmdb",
     message: msg,
     initial: initial !== undefined ? initial : "",
   });
   cfg.set(dispKey, prName.prOmdb);
 }

async function setConfig() {
  if (cfg.get("omdbapiKey") !== undefined && cfg.get("omdbapiKey") !== "") 
    {var init1 = cfg.get("omdbapiKey")} else {var init1 = "5e540903"}
  if (cfg.get("tmdbKey") !== undefined && cfg.get("tmdbKey") !== "") {
      var init2 = cfg.get("tmdbKey");
    } else {
      var init2 = "1a8d1689f01251ca6ee058b29622441e";
    }
  await askuser("omdbapiKey", `1. enter your new omdb api key :`, init1); 
  await askuser("tmdbKey", `2. enter your new tmdb api key :`, init2);  

  const ask = await prompts([
    {
      type: "multiselect",
      name: "propsToShow",
      message: `3. select metadata to display when SEARCHING :`,
      choices: [
        { title: "original-title", value: "original-title" },
        { title: "Year", value: "Year" },
        { title: "Genre", value: "Genre" },
        { title: "Director", value: "Director" },
        { title: "Writer", value: "Writer" },
        { title: "Actors", value: "Actors" },
        { title: "Plot", value: "Plot" },
        { title: "Language", value: "Language" },
        { title: "Country", value: "Country" },
        { title: "Awards", value: "Awards" },
        { title: "Metascore", value: "Metascore" },
        { title: "imdbRating", value: "imdbRating" },
        { title: "imdbVotes", value: "imdbVotes" },
        { title: "Production", value: "Production" },
        { title: "Released", value: "Released" },
        { title: "Runtime", value: "Runtime" },
        { title: "Rated", value: "Rated" },
        { title: "DVD", value: "DVD" },
        { title: "BoxOffice", value: "BoxOffice" },
        { title: "imdbID", value: "imdbID" },
        { title: "Poster", value: "Poster" },
      ],
      optionsPerPage: 28,
      min: 1,
    },
    {
      type: "multiselect",
      name: "propsToCompare",
      message: `4. select metadata to fetch when COMPARING items :`,
      choices: [
        { title: "Title", value: "Title" },
        { title: "Year", value: "Year" },
        { title: "Released", value: "Released" },
        { title: "Runtime", value: "Runtime" },
        { title: "Genre", value: "Genre" },
        { title: "Metascore", value: "Metascore" },
        { title: "imdbRating", value: "imdbRating" },
        { title: "BoxOffice", value: "BoxOffice" },
        { title: "Production", value: "Production" },
        { title: "Director", value: "Director" },
        { title: "Writer", value: "Writer" },
        { title: "Actors", value: "Actors" },
      ],
      optionsPerPage: 14,
      min: 1,
    },
    {
      type: "toggle",
      name: "copyToClipboard",
      message: `5. automatically save movie details to the clipboard (only for single search) ?`,
      initial: true,
      active: "yes",
      inactive: "no",
    },
    {
      type: "toggle",
      name: "saveToFile",
      message: `6. display option to "Save to file" after each search ?`,
      initial: true,
      active: "yes",
      inactive: "no",
    },
  ]);

  const ask2 = await prompts([
    {
      type:
        ask.copyToClipboard === true || ask.saveToFile === true
          ? "toggle"
          : null,
      name: "includeTitleProp",
      message: `   - include "Title:: %movie% [[%year]]" property when saving?`,
      initial: true,
      active: "yes",
      inactive: "no",
    },
    {
      type:
        ask.copyToClipboard === true || ask.saveToFile === true
          ? "toggle"
          : null,
      name: "addDefaultTags",
      message: `   - include "Tags:: %type%" property when saving ?`,
      initial: true,
      active: "yes",
      inactive: "no",
    },
    {
      type: (prev) => (prev === true ? "text" : null),
      name: "DefaultTags",
      message: `   - enter default tags (string) :`,
      initial: "#watched",
    },
    {
      type: "toggle",
      name: "askRating",
      message: `7. prompt for user Rating (0-10) and add "rating::" property ? `,
      initial: true,
      active: "yes",
      inactive: "no",
    },
    {
      type: ask.ask4 === true ? "toggle" : null,
      name: "ratingStars",
      message: `   - convert rating to stars (else keep number) ?`,
      initial: true,
      active: "yes",
      inactive: "no",
    },
    {
      type: "toggle",
      name: "askWatchedDate",
      message: `8. prompt for watched date and add "watched:: [[%date%]]" property ?`,
      initial: true,
      active: "yes",
      inactive: "no",
    },
    {
      type: "toggle",
      name: "askAnything",
      message: `9. enable extra input (add a line with a note or review) ? `,
      initial: false,
      active: "yes",
      inactive: "no",
    },
    {
      type: "toggle",
      name: "addToJournal",
      message: `10.[logseq] append a log line in the daily journal page ?`,
      initial: true,
      active: "yes",
      inactive: "no",
    },
    {
      type: (prev) => (prev === true ? "text" : null),
      name: "dailylogtemplate",
      message: `   - set the log template (where %movie% will be replaced by the title):`,
      initial: "- DONE #watched [[%movie%]]",
    },
    {
      type: "text",
      name: "myDateFormat",
      message: `11.date format (see https://github.com/felixge/node-dateformat#mask-options) :`,
      initial: "yyyymmdd",
    },
    {
      type: "text",
      name: "pathToJournal",
      message: `12.path to logseq journals :`,
      initial: "d:\\logseq\\journals\\",
    },
    {
      type: "text",
      name: "saveFilePath",
      message: `13.path to save files (eg: logseq/pages) :`,
      initial: "d:\\logseq\\pages\\",
    },
  ]);
  //map settings to config file
  const mapset = (ask) => {
  for (const [key, value] of Object.entries(ask)) {
      cfg.set(key, value);
    }}
  mapset(ask);
  mapset(ask2);  

  console.log('\n\nThank you ! settings are saved in :', chalk.yellow(cfg.path));
}
