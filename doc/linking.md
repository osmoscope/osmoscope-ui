
# Linking to Osmoscope

Osmoscope changes its URL to reflect the state it is in. So whenever you, for
instance, pan around the map or select a different layer, this will show up in
the URL. So you can copy and paste the URL to get the same state as before.

## URL Format

The URL has a format like this:

http://HOST/#map=6/23.89784/43.30961&op=0.8

Named parameters follow after the main URL and a hash (`#`) character.
Parameters are separated by an Ampersand ('&'). All parameters are optional.

Parameters are:

| Name | Default      | Description                                        |
| ---- | ------------ | -------------------------------------------------- |
| bl   | `OS`         | Background layer (OSM Standard `OS` or Toner `Tn`) |
| l    | (none)       | Overlay layer URL                                  |
| map  | `2/0.0/20.0` | Map coordinates in format `ZOOM/LON/LAT`           |
| op   | `0.5`        | Opacity of background map (between 0.0 and 1.0)    |
| tab  | `m`          | Tab (Map `m`, Statistics `s`, or Layer Info `i`)   |

