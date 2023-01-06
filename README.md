<!--
  Copyright (c) 2023 Michael Federczuk
  SPDX-License-Identifier: CC-BY-SA-4.0
-->

# youtube-dl-playlist #

[version_shield]: https://img.shields.io/badge/version-1.0.0--indev08-informational.svg
[release_page]: https://github.com/mfederczuk/youtube-dl-playlist/releases/tag/v1.0.0-indev08 "Release v1.0.0-indev08"
[![version: 1.0.0-indev08][version_shield]][release_page]
[![Changelog](https://img.shields.io/badge/-Changelog-informational.svg)](CHANGELOG.md "Changelog")

## About ##

**youtube-dl-playlist** is a **[Node.js]** program that uses **[youtube-dl]** or **[cURL]** to download an entire
playlist loaded in from a **JSON** file.  
The program automatically will download all tracks with the best audio available, then convert them into `mp3` files
using **[FFmpeg]** and add **ID3v2** frames to the file.

[Node.js]: https://nodejs.org
[youtube-dl]: https://github.com/ytdl-org/youtube-dl
[cURL]: https://curl.se
[FFmpeg]: https://ffmpeg.org

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
	"url"?: string,
	"fallback_urls"?: string[],
	"file"?: string,
	"fallback_files"?: string[],
	"other"?: any
}
```

URLs in `"url"` and `"fallback_urls"` will be download using **youtube-dl** and all URLs in `"file"` and
`"fallback_files"` will be downloaded using **cURL**.

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

**youtube-dl**, **cURL** and **FFmpeg** needs be installed on the system and their binaries must be available on your
`PATH`.

## Installation ##

Install using **npm**:

```sh
npm i -g @mfederczuk/youtube-dl-playlist
```

## Contributing ##

Read through the [Contribution Guidelines](CONTRIBUTING.md) if you want to contribute to this project.

## License ##

**youtube-dl-playlist** is licensed under the [**GNU General Public License v3.0 or later**](LICENSES/GPL-3.0.txt).  
For more information about copying and licensing, see the [`COPYING.txt`](COPYING.txt) file.
