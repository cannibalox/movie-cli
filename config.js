export const cfg = {
  // enter your api keys (enclosed in brackets) here
  omdbapiKey: "5e540903",
  tmdbKey: "2469f2f227b5b0a46ffcbc2053dc356b", // req for Original-Title property

  // general options
  saveFilePath: "d:\\ls-test\\pages\\", // needs to be a valid filepath with trailing salash
  copyToClipboard: true, // true|false
  includeTitleProp: true, // add `title:: movietitle [[year]]`
  DefaultTags: "#watched", // add custom tags property `tags:: #watched`
  addCustomInfo: true, // if `false` it only displays info and exits
  askRating: true, // add custoôrating 1-10 (that gets converted to stars)
  askWatchedDate: true, // add a date formatted as myDateFormat on output
  askAnything: false, // input any text/string
  pathToJournal: "d:\\ls-test\\journals\\",
  mytemplate: "- DONE #watched [[%movietitle%]]",
  encloseStrings: true, // enclose value strings in doublébrackets.
  // for Plot, BoxOffice, Awards
  // if true `plot:: "foo, bar"` else `plot:: foo,bar`
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
