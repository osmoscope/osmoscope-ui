
# Osmoscope

Osmoscope is an OpenStreetMap quality assurance tool. It runs in the web
browser displaying problems with OSM data and gives you access to the OSM
editors to fix those issues. Additional layers can be added by anyone.


## Status

At the moment this software is only barely usable, more a proof-of-concept.


## To run the web application

To run this yourself, simply serve the contents of the `site` directory
through a webserver and access that site in your browser. No server side
components are necessary besides a web server that can server static pages.

Here are some ways to start a simple web server for development using only
Python2/3 or Ruby. All will serve the current directory on port 8000.

```
cd site
python2 -m SimpleHTTPServer 8000
```

or

```
cd site
python3 -m http.server --bind 127.0.0.1 8000
```

or

```
cd site
ruby -run -ehttpd . -p8000 --bind-address=127.0.0.1
```

A test server is available at http://osmoscope.jochentopf.com/ .


## To add your own layers

For each layer you need to write a JSON file describing this layer. Several
layers can be combined into a *data source* which is also described in a JSON
file. Look at the [example](http://area.jochentopf.com/osmm/layers.json) for
some idea about the format. You must put these JSON files somewhere on the web.
You can access the layers by typing the data source URL into the config dialog
box.

The actual data of the layers has to be in GeoJSON or Mapbox Vector Tile
format and must be put online somewhere also.

For a more detailed description [read this](doc/creating-layers.md).


## Javascript libraries used

* [OpenLayers](https://openlayers.org/)
* [OpenLayers Control Geocoder](https://github.com/jonataswalker/ol-geocoder)
* [OpenLayers LayerSwitcher](https://github.com/walkermatt/ol-layerswitcher)
* [D3](https://d3js.org/)


## License

Copyright (C) 2018  Jochen Topf (jochen@topf.org)

This program is available under the GNU GENERAL PUBLIC LICENSE Version 3.
See the file LICENSE.txt for the complete text of the license.


## Authors

This program was written and is maintained by Jochen Topf (jochen@topf.org).


