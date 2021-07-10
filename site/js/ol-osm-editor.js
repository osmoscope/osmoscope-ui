
class EditInOSMControl extends ol.control.Control {

    constructor(opt_options) {
        var options = opt_options || {};

        if (options.editor === undefined) {
            console.log('Missing editor option');
            return;
        } else if (options.editor === 'josm') {
            options.title = 'Open current view in JOSM';
            options.icon = 'J';
            options.className = 'edit-in-osm-control-josm';
        } else if (options.editor === 'id') {
            options.title = 'Open current view in iD';
            options.icon = 'iD';
            options.className = 'edit-in-osm-control-id';
        } else {
            console.log('Unknown editor: ' + options.editor);
            return;
        }

        const button = document.createElement('button');
        button.setAttribute('title', options.title);
        button.innerHTML = options.icon;

        const element = document.createElement('div');
        element.className = options.className + ' ol-unselectable ol-control';
        element.appendChild(button);

        super({
            element: element,
            target: options.target
        });

        const openEditor =
            (options.editor === 'josm' ? this.open_in_josm_with_view.bind(this)
                                       : this.open_in_id_with_view.bind(this));

        button.addEventListener('click', openEditor, false);
        button.addEventListener('touchstart', openEditor, false);
    }

    round_coord(value) {
        return Math.round(value * 10000) / 10000;
    }

    id_url(center, selection) {
        const xy = ol.proj.transform(center, 'EPSG:3857', 'EPSG:4326');
        const zoom = this.getMap().getView().getZoom();
        var uri = 'https://www.openstreetmap.org/edit?editor=id'
            + '&lon=' + this.round_coord(xy[0])
            + '&lat=' + this.round_coord(xy[1])
            + '&zoom=' + zoom;
//        + '&comment=xxx';

        if (selection !== undefined) {
            uri += '&' + selection[0] + '=' + selection[1];
        }

        console.log(uri);
        return uri;
    }

    open_in_id(center, selection) {
        window.open(this.id_url(center, selection), 'OSMIdWindow');
    }

    open_in_id_with_view() {
        this.open_in_id(this.getMap().getView().getCenter());
    }

    josm_url(extent, selection) {
        const bl = ol.proj.transform(extent.slice(0, 2), 'EPSG:3857', 'EPSG:4326');
        const tr = ol.proj.transform(extent.slice(2, 4), 'EPSG:3857', 'EPSG:4326');
        var uri = 'http://127.0.0.1:8111/load_and_zoom'
            + '?left='   + this.round_coord(bl[0])
            + '&right='  + this.round_coord(tr[0])
            + '&top='    + this.round_coord(tr[1])
            + '&bottom=' + this.round_coord(bl[1])
//        + '&changeset_comment=xxx';

        if (selection !== undefined) {
            uri += '&select=' + selection;
        }

        return uri;
    }

    open_in_josm(extent, selection) {
        d3.text(this.josm_url(extent, selection)).then(function(t){
            if (t.indexOf('OK') === -1) {
                show_message("Can not reach JOSM. Is it running?");
            } else {
                show_message("Loading data into JOSM...");
            }
        });
    }

    open_in_josm_with_view() {
        this.open_in_josm(this.getMap().getView().calculateExtent());
    }

}

