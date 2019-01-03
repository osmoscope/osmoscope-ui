
# Creating Layers for Osmoscope

Creating a layer for use in Osmoscope is pretty easy, provided you already have
some data that you want show. That data must be available somewhere on the web
in [GeoJSON](http://geojson.org/) format or as vector tiles. Then all you have
to do is create a JSON file in a special format that tells Osmoscope where to
find the data, what the name of the layer is, etc.

Note that the format of those JSON files is subject to change. The current
format is just a first idea of what might be useful information and we will
extend it in the future.

## The Layer File

For each layer you want to make available, you have to create a JSON file. This
file contains the metadata about your layer, it will not change when your data
changes. It has the following structure:

```
{
    "id": "ID OF YOUR LAYER",
    "name": "NAME OF YOUR LAYER",
    "doc": {
        "description": "MORE DETAILED DESCRIPTION OF THE LAYER",
        "why_problem": "MORE INFORMATION ON WHY THIS IS A PROBLEM (OPTIONAL)",
        "how_to_fix": "SOME INFORMATION ON HOW TO FIX THE ERROR (IF APPLICABLE)"
    },
    "updates": "HOW OFTEN THE DATA FOR THIS LAYER IS UPDATED",
    "geojson_url": "https://www.example.com/some_layer.json",
    "stats_data_url": "https://www.example.com/stats_for_some_layer.json"
}
```

Of course the URLs shown here are just examples. Any URL will do. Even relative URLs.

If you have the data as vector tiles, you'll need a `vector_tile_url` instead
of a `geojson_url`. The vector tile URL is a template where `{x}` and `{y}` are
replaced by the tile coordinates and `{z}` by the zoom level:

```
"vector_tile_url": "https://www.example.com/tiles/some_layer/{z}/{x}/{y}.pbf"
```

## The DataSource File

If you have several layers that belong together in some form, you can create
a "data source" file, another JSON file, that binds those layers together.
It has an even simpler format than the layer file:

```
{
    "name": "THE NAME OF YOUR DATA SOURCE",
    "layers": [
        "URL OF FIRST LAYER",
        "URL OF SECOND LAYER",
        ...,
        "URL OF LAST LAYER"
    ]
}
```

Note that all the URLs are independent of each other and they can be on
different servers. So you can, for instance, create a "data source" file for
layers other than your own.

## The Geodata

Osmoscope supports all geometry types in your data, points, linestrings, and
polygons. Features should have an ID, otherwise selection of feature might
not work.

If the features in your layer have attributes called `node_id`, `way_id`, or
`relation_id`, those attributes will be recognized as OSM IDs and the UI will
create appropriate links for them.

You should have an attribute `timestamp` on all features containing the date
and time in ISO format when this feature last changed.

For layers with up to a few hundred features, creating a GeoJSON layer is
easy to do and performant enough. For larger layers, you'll probably need
a vector tile layer for performance.

## The Stats Data File
The stats data file provides historic information like the number of the layer's features at a given date. It can be supplied as a json or a CSV file (in the latter case, the URL must end with `.csv`.).

The json format is a simple array of arrays:
```
[
  [
    "2017-03-17",
    311007
  ],
  ...
]
```

The CSV file requires two comma separated columns 'Date' and 'Count', the date is expected in yyyy-MM-dd format:
```
Date,Count
2017-03-17,311007
...
```


## CORS-Headers

All the resources that you publish, ie. the layer and data source JSON files
as well as the geodata in the GeoJSON file or vector tiles must be available
for inclusion into third party web sites. For this your web server has to set
the correct CORS ([Cross-origin resource
sharing](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)) headers.


## Creating Vector Tile Layers with Tippecanoe

You can use [Tippecanoe](https://github.com/mapbox/tippecanoe) to create
sets of vector tiles from GeoJSON that work well with Osmoscope.

Tippecanoe has zillions of options and you might need to make some changes
depending on the kind of data you have. Here is an example to get you going:

```
tippecanoe --output-to-directory new_layer \
           --no-tile-compression \
           --layer=new_layer \
           --name="New Layer" \
           --description="Description of new layer" \
           --attribution='Copyright OpenStreetMap contributors' \
           --base-zoom=6 \
           --maximum-tile-bytes=50000 \
           --drop-densest-as-needed \
           --quiet \
           new_layer.json
```

Tippecanoe will do its magic to generalize your data for smaller zoom levels.
For Osmoscope you usually want to make sure that it removes enough features
that smaller zoom levels are still fast, but keeping enough features so that
you can still, on those smaller zoom levels, see where in the world there are
problems. The `--maximum-tile-bytes=50000` and `--drop-densest-as-needed`
works well for this, but you should play around with the settings to fit your
use case.

The `--output-to-directory` makes Tippecanoe write the output into a directory
hierarchy which can easily be served with any web server. If this option is
not specified, Tippecanoe will create an `mbtiles` file and you'll need a
tile server which understand this format.

The `--no-tile-compression` tells Tippecanoe not to gzip the tiles. This way
they can be served from any web server without any special configuration. For
production use, you want to do the compression but you need to configure your
web server then so it knows the files are compressed and serves them as is
telling the client that they are compressed.

