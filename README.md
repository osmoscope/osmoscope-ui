
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

A test server is available at https://osmoscope.jochentopf.com/ .


## To add your own layers

For each layer you need to write a JSON file describing this layer. Several
layers can be combined into a *data source* which is also described in a JSON
file. Look at the [example](http://area.jochentopf.com/osmm/layers.json) for
some idea about the format. You must put these JSON files somewhere on the web.
You can access the layers by typing the data source URL into the config dialog
box.

The actual data of the layers has to be in GeoJSON or Mapbox Vector Tile
format and must be put online somewhere also.


## License

Copyright (C) 2018  Jochen Topf (jochen@topf.org)

This program is available under the GNU GENERAL PUBLIC LICENSE Version 3.
See the file LICENSE.txt for the complete text of the license.


## Authors

This program was written and is maintained by Jochen Topf (jochen@topf.org).


