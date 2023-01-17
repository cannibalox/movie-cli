# movie-cli-2

a CLI tool to fetch movies and tv series details from omdbApi.com and tmdb, or comparing two movies.
It can optionally save the movie metadata to the clipboard or as a markdown file in a custom folder. Metadata will be formatted as `property:: value` for Logseq note-taking app. 
version : 1.1.0 2022-01-17

# install

```
npm i -g github:cannibalox/movie-cli-2
```

## requirements :

- NodeJS > 17.5
- an api key from [omdbapi.com](https://www.omdbapi.com/apikey.aspx) to fetch movie details 
- a [TMDB api key](https://developers.themoviedb.org/) is required to fetch "original title" property
# USAGE

open a terminal and type `movie` followed by search terms 

```
Usage: movie [title] or [movie1]::[movie2]

Options:
  -v, --version   output the current version
  -k, --key       set and save your apîkeys
  -r, --reset     resets options and clear keys
  -s, --settings  define settings
  -h, --help      display help for command

```
terminal showing info (left) | movie info saved as a md file inside Logseq (right)
![ss_NetMeterEvo_NetMeter_Evo_20230117_zio7Vy0AvC](https://user-images.githubusercontent.com/4605693/212810011-f2243e69-4d22-40a8-abd5-429c3d641c08.png)
demo
![ss_WindowsTerminal_Windows_PowerShell_20230112_Y8WrqVr4In](https://user-images.githubusercontent.com/4605693/212810444-6561117e-eff7-4c68-a7b6-ffad06acf6cd.gif)

## configuration

- on first start, the program should enter configuration mode and will let you choose options (eg: define which metadata to fetch, auto-save to clipboard, etc...)
- please get your own api keys for omdbapi (https://www.omdbapi.com/apikey.aspx) and TMDB (https://www.themoviedb.org/settings/api)
- the configuration is automatically saved, use `movie -v` to see the location of the config file
- use `movie --reset` or `movie --settings` to modify the configuration after the first run 

setup screen
![ss_WindowsTerminal_Windows_PowerShell_20230117_qWz46CpZWY](https://user-images.githubusercontent.com/4605693/212809801-627a80a4-b90f-4753-85d6-8bd138411daa.png)

### for logseq users:
  - the movie metadata can be saved as a markdown file as `property:: value`. It can add a `title::` and fill default `tags::`
  - don't forget to set your date format in the config file to match your logseq date format (like yyyymmdd | yyyy-mm-dd | dddd, MMM do, yyyy | etc...)
    (refer to logseq docs and https://github.com/felixge/node-dateformat#mask-options to see available formats)
  - the script can optionally ask for a custom rating and watched date, they will be saved as properties `rating::` and `watched:: [[%date%]]` (a few custom arguments are possible)
  - filepaths should point to your logseq journals and logseq pages folder (eg: 'c:\\logseq-graph\\journals', 'd:/logseq/pages' or '/Users/path/to/logseq/pages/or/journal/'). Test the output on a temp folder beforehand.
    the folders must exist prior to the execution. the trailing `\` or `/` is not required.
  - the script can optionally set a log line in the daily journal at the %watched date% defined for the movie
![ss_Logseq_Logseq_20230112_wOSbsTATWL](https://user-images.githubusercontent.com/4605693/212810237-7d0c28b4-065e-4831-848a-385affa32b32.gif)

## new features and improvements

the script is forked from Mayankchd's [movie-cli](https://github.com/mayankchd/movie/blob/master/cli.js), tailored for my personal movie tracking workflow in Logseq.
notable differences and new features :
- added a list of matching titles to pick from, to disambiguate titles like `Alone (2008)` vs `Alone (2020)` 
- added save to clipboard and save to file options
- added `original-title::` property using TMDB api for non-English titles
- added custom inputs (ratings, watched date)
- refactor code, updated to ECMAScript modules, update dependencies and removed isomorphic-fetch.

## limitations

in case of errors, try `mmovie -r` or `movie -s` to reset the settings.
only supports markdown, not org-mode format.
the daily page log is crude : it doesn't rely on the logseq API, it's only appending a line at the end of the md file. 
use with wisdom and be careful of your data : backup your logseq folders, test outputs in a temp folder. 



