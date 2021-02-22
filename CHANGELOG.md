<!-- markdownlint-disable MD024 -->

# Changelog #

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] ##

[Unreleased]: https://github.com/mfederczuk/youtube-dl-playlist/compare/v1.0.0-indev05...master

## [1.0.0-indev05] - 2021-02-15 ##

[1.0.0-indev05]: https://github.com/mfederczuk/youtube-dl-playlist/releases/tag/v1.0.0-indev05

### Added ###

* `"featured_artists"`, `"comments"` and `"other"` track fields
* The `"comments"` field will now also be written to the ID3v2 tags, along with a base comment.  
  Also, the URL that was used to download the track is now also saved in the ID3v2 tags

## [1.0.0-indev04] - 2021-02-11 ##

[1.0.0-indev04]: https://github.com/mfederczuk/youtube-dl-playlist/releases/tag/v1.0.0-indev04

### Changed ###

* Sorting order was slightly changed: album position has higher sorting priority than the title when both tracks have
  albums
* When at least one track fails to download, the program will exit with code `32`

## [1.0.0-indev03] - 2021-02-11 ##

[1.0.0-indev03]: https://github.com/mfederczuk/youtube-dl-playlist/releases/tag/v1.0.0-indev03

### Added ###

* Playlist JSON warnings are being displayed

### Fixed ###

* Some processes would never end be when downloading small playlists

## [1.0.0-indev02] - 2021-02-11 ##

[1.0.0-indev02]: https://github.com/mfederczuk/youtube-dl-playlist/releases/tag/v1.0.0-indev02

### Fixed ###

* Added a missing babel dependency - was required for the program to run

## [1.0.0-indev01] - 2021-02-10 ##

[1.0.0-indev01]: https://github.com/mfederczuk/youtube-dl-playlist/releases/tag/v1.0.0-indev01

### Added ###

* Base program
