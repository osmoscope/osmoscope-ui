
var EditInOSMControl = function(opt_options) {

    var round_coord = function(value) {
        return Math.round(value * 10000) / 10000;
    };

    var josm_url = function(extent, selection) {
        var bl = ol.proj.transform(extent.slice(0, 2), 'EPSG:3857', 'EPSG:4326');
        var tr = ol.proj.transform(extent.slice(2, 4), 'EPSG:3857', 'EPSG:4326');
        var uri = 'https://127.0.0.1:8112/load_and_zoom'
            + '?left='   + round_coord(bl[0])
            + '&right='  + round_coord(tr[0])
            + '&top='    + round_coord(tr[1])
            + '&bottom=' + round_coord(bl[1])
//        + '&changeset_comment=xxx';

        if (selection !== undefined) {
            uri += '&select=' + selection;
        }

        return uri;
    };

    this.open_in_josm = function(extent, selection) {
        d3.text(josm_url(extent, selection)).then(function(t){
            if (t.indexOf('OK') === -1) {
                show_message("Can not reach JOSM. Is it running?");
            } else {
                show_message("Loading data into JOSM...");
            }
        });
    };

    var open_in_josm_with_view = function() {
        this_.open_in_josm(this_.getMap().getView().calculateExtent());
    };

    var id_url = function(center, selection) {
        var xy = ol.proj.transform(center, 'EPSG:3857', 'EPSG:4326');
        var zoom = this_.getMap().getView().getZoom();
        var uri = 'https://www.openstreetmap.org/edit?editor=id'
            + '&lon=' + round_coord(xy[0])
            + '&lat=' + round_coord(xy[1])
            + '&zoom=' + zoom;
//        + '&comment=xxx';

        if (selection !== undefined) {
            uri += '&' + selection[0] + '=' + selection[1];
        }

        console.log(uri);
        return uri;
    };

    this.open_in_id = function(center, selection) {
        window.open(id_url(center, selection), 'OSMIdWindow');
    };

    var open_in_id_with_view = function() {
        this_.open_in_id(map.getView().getCenter());
    };

    var options = opt_options || {};

    if (options.editor === undefined) {
    } else if (options.editor === 'josm') {
        options.openEditor = open_in_josm_with_view;
        options.title = 'Open current view in JOSM';
        options.icon = 'J';
        options.className = 'edit-in-osm-control-josm';
    } else if (options.editor === 'id') {
        options.openEditor = open_in_id_with_view;
        options.title = 'Open current view in iD';
        options.icon = 'iD';
        options.className = 'edit-in-osm-control-id';
    } else {
        console.log('Unknown editor: ' + options.editor);
        return;
    }

    var button = document.createElement('button');
    button.setAttribute('title', options.title);
    button.innerHTML = options.icon;

    var this_ = this;
    var openEditor = options.openEditor;
    var zoomThreshold = options.zoomThreshold || 15;

    button.addEventListener('click', openEditor, false);
    button.addEventListener('touchstart', openEditor, false);

    var element = document.createElement('div');
    element.className = options.className + ' ol-unselectable ol-control';
    element.appendChild(button);

    ol.control.Control.call(this, {
        element: element,
        target: options.target
    });
};

ol.inherits(EditInOSMControl, ol.control.Control);

