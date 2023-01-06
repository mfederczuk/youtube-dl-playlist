<!--
  Copyright (c) 2023 Michael Federczuk
  SPDX-License-Identifier: CC-BY-SA-4.0
-->

<!-- markdownlint-disable no-duplicate-heading -->

# Changelog #

All notable changes to this project will be documented in this file.
The format is based on [**Keep a Changelog v1.0.0**](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [**Semantic Versioning v2.0.0**](https://semver.org/spec/v2.0.0.html).

## [v1.0.0-indev08] - 2021-05-22 ##

[v1.0.0-indev08]: https://github.com/mfederczuk/youtube-dl-playlist/releases/tag/v1.0.0-indev08

### Changed ###

* Checks for **cURL** and **FFmpeg** in the `PATH` are now only done when they are actually needed to download tracks

### Fixed ###

* Tracks downloaded with **cURL** would "fail" when the file was already an mp3 file

## [v1.0.0-indev07] - 2021-05-13 ##

[v1.0.0-indev07]: https://github.com/mfederczuk/youtube-dl-playlist/releases/tag/v1.0.0-indev07

### Fixed ###

* Tracks with titles that do not contain any letters or digits would fail to download

## [v1.0.0-indev06] - 2021-02-24 ##

[v1.0.0-indev06]: https://github.com/mfederczuk/youtube-dl-playlist/releases/tag/v1.0.0-indev06

### Added ###

* `"file"`, `"fallback_files"` track fields.  
  These URLs will be downloaded with **cURL** instead of **youtube-dl**

## [v1.0.0-indev05] - 2021-02-15 ##

[v1.0.0-indev05]: https://github.com/mfederczuk/youtube-dl-playlist/releases/tag/v1.0.0-indev05

### Added ###

* `"featured_artists"`, `"comments"` and `"other"` track fields
* The `"comments"` field will now also be written to the ID3v2 tags, along with a base comment.  
  Also, the URL that was used to download the track is now also saved in the ID3v2 tags

## [v1.0.0-indev04] - 2021-02-11 ##

[v1.0.0-indev04]: https://github.com/mfederczuk/youtube-dl-playlist/releases/tag/v1.0.0-indev04

### Changed ###

* Sorting order was slightly changed: album position has higher sorting priority than the title when both tracks have
  albums
* When at least one track fails to download, the program will exit with code `32`

## [v1.0.0-indev03] - 2021-02-11 ##

[v1.0.0-indev03]: https://github.com/mfederczuk/youtube-dl-playlist/releases/tag/v1.0.0-indev03

### Added ###

* Playlist JSON warnings are being displayed

### Fixed ###

* Some processes would never end be when downloading small playlists

## [v1.0.0-indev02] - 2021-02-11 ##

[v1.0.0-indev02]: https://github.com/mfederczuk/youtube-dl-playlist/releases/tag/v1.0.0-indev02

### Fixed ###

* Added a missing babel dependency - was required for the program to run

## [v1.0.0-indev01] - 2021-02-10 ##

[v1.0.0-indev01]: https://github.com/mfederczuk/youtube-dl-playlist/releases/tag/v1.0.0-indev01

Initial release
