# movie-cli-2

a CLI tool to fetch information about a movie or serie from OmdbApi.com and comparing two movies.
It can optionally save the movie metadata to the clipboard, formatted as properties for Logseq note-taking app, or save them as a markdown file in a custom directory.

requirements :
- to fetch movie details you need an api key from omdbapi.com
- to fetch original titles and keywords, you need a TMDB api key (https://developers.themoviedb.org/)
# install

```
npm i -g github.com:cannibalox/movie-cli-2
```

# usage

edit the `vonfig.js` file in a text editor and fill your api keys, change options as required.
open a terminal and type `movie` followed by search terms :

```
movie star wars                    // get a list of movies matching `star wars` then lets you pick one
movie Into The Wild :: Wild        // For comparing two movies
```

![Example GIF](https://raw.githubusercontent.com/mayankchd/movie/master/screen.gif)
