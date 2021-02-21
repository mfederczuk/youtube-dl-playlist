# youtube-dl-playlist #

**youtube-dl-playlist** is a **[Node.js]** program that uses **[youtube-dl]** to download an entire playlist loaded in
from a **JSON** file.  
The program automatically will download all tracks with the best audio available, then convert them into `mp3` files and
add **ID3v2** frames to the file.

[youtube-dl]: https://github.com/ytdl-org/youtube-dl
[Node.js]: https://nodejs.org

## Download / Installation ##

Install using **npm**:

```sh
npm i -g @mfederczuk/youtube-dl-playlist
```

## Usage ##

Only one path must be given the program.  
The given file must be a **JSON** array where each item must match the following schema:

```typescript
{
	"title": string,
	"artist": string,
	"featured_artists"?: string[],
	"album"?: string,
	"nr"?: number,
	"year"?: number,
	"comments"?: string | string[],
	"url": string,
	"fallback_urls"?: string[],
	"other"?: any
}
```

The following options can be specified:

* `--download`  
  Download the playlist
* `--high-effort`  
  Downloads the playlist faster, but uses more system resources.  
  Implies the `--download` option
* `--compact`  
  Overwrite the given file with compact JSON. Saves some space
* `--pretty=(tab|<number_of_spaces>)`  
  Overwrite the given file with formatted JSON, either with tabs as indentation or with the number of spaces specified.
  Good for editing and viewing
* `--sort`  
  Also sort the playlist before overwriting.  
  Requires either the `--compact` or the `--pretty` option

It's not allowed to give both the `--compact` and the `--pretty` options at once.  
The `--download` and one of the overwrite options (`--compact` and `--pretty`) are both allowed to be given at once.

## License ##

[GNU GPL-3.0](LICENSE)
