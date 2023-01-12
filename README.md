# movie-cli-2

a CLI tool to fetch movies and tv series details from omdbApi.com and tmdb, or comparing two movies.
It can optionally save the movie metadata to the clipboard and as a markdown file in a custoôfolder. Metadata are formatted as `property:: value` for Logseq note-taking app. 
# install

```
npm i -g github:cannibalox/movie-cli-2
```
# USAGE

open a terminal and type `movie` followed by search terms :

```
movie star wars             // dislay a list of movies matching `star wars` then lets you pick one
movie Ran::Kegamusha        // use `::` between titles for comparing two movies. it will fetch the closest matching results
```

![Example GIF](https://raw.githubusercontent.com/cannibalox/movie-cli-2/master/screen.gif)

## configuration

- edit the `config.js` file in a text editor and fill in your api keys, change options as required.
- by default, movie info will be saved in the clipboard, this bahavior can be toggled off in the config.js
- for logseq users:
  - the movie info can be saved as a markdown file with `property:: value`
  - don't forget to set your date format n the config file to match your logseq date format
  - the script can optionally ask for a custom rating and watched date, they will be saved as properties `rating::` and `watched:: [[%date%]]`
  - filepaths should have trailing slashes or backslashes - on windows, use double backslashes.

## new features and improvements

the script is forked from Mayankchd's [movie-cli](https://github.com/mayankchd/movie/blob/master/cli.js), tailored for my personal movie tracking workflow in Logseq.
notable differences and new features :
- added a list of matching titles to pick from, to disambiguate titles like `Alone (2008)` vs `Alone (2020)` 
- added save to clipboard and save to file options
- added `original-title::` property using TMDB api for non-English titles
- added custom inputs (ratings, watched date)
- refactor code, updated to ECMAScript modules, update dependencies and removed isomorphic-fetch.

## requirements :

- an api key from [omdbapi.com](https://www.omdbapi.com/apikey.aspx) to fetch movie details 
- a [TMDB api key](https://developers.themoviedb.org/) is required to fetch "original title" property
- NodeJS > 17.5