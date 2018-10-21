
var map, base_layers = [], vt_layer, data_sources = [], data_layers = {};
var unique_id_counter = 1, highlight = null;

var data_layer_num = 0;

var base_layer_opacity = 0.5;

var zoom = 2;
var center = [0, 20];

var josm_control, id_control;

var shouldUpdate = true;

var re_numeric = /^[0-9]+$/;

if (window.location.hash !== '') {
    var hash = window.location.hash.replace('#map=', '');
    var parts = hash.split('/');
    if (parts.length === 3) {
        zoom = parseInt(parts[0], 10);
        center = [
            parseFloat(parts[1]),
            parseFloat(parts[2])
        ];
    }
}

var styles = {
    Point: [
        new ol.style.Style({
            image:
                new ol.style.Circle({
                    fill: new ol.style.Fill({
                    color: 'rgba(255,255,255,1)'
                }),
                radius: 5
            })
        }),
        new ol.style.Style({
            image:
                new ol.style.Circle({
                    fill: new ol.style.Fill({
                    color: 'rgba(200,0,0,1)'
                }),
                radius: 4
            })
        }),
    ],
    LineString: [
        new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(255,255,255,1)',
                width: 6
            }),
        }),
        new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(200,0,0,1)',
                width: 3
            }),
        }),
        new ol.style.Style({
            image:
                new ol.style.Circle({
                    fill: new ol.style.Fill({
                    color: 'rgba(255,255,255,1)'
                }),
                radius: 5
            }),
            geometry: function(feature) {
                var coordinates = feature.getGeometry().getCoordinates();
                return new ol.geom.MultiPoint(coordinates);
            }
        }),
        new ol.style.Style({
            image:
                new ol.style.Circle({
                    fill: new ol.style.Fill({
                    color: 'rgba(200,0,0,1)'
                }),
                radius: 4
            }),
            geometry: function(feature) {
                var coordinates = feature.getGeometry().getCoordinates();
                return new ol.geom.MultiPoint(coordinates);
            }
        })
    ]
};

var entity_map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

function escape_html(string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
        return entity_map[s];
    });
}

function DataLayer(url, data) {
    this.url      = url;
    this.id       = escape_html(data.id);
    this.raw_data = data;

    this.name = function() {
        return escape_html(data.name);
    };

    this.description = function() {
        return escape_html(data.doc.description);
    };

    this.why_problem = function() {
        return escape_html(data.doc.why_problem);
    };

    this.how_to_fix = function() {
        return escape_html(data.doc.how_to_fix);
    };

    this.vector_tile_url = function() {
        return data.vector_tile_url;
    };

    this.geojson_url = function() {
        return data.geojson_url;
    };

    this.stats_data_url = function() {
        return data.stats_data_url;
    };

    this.style = function() {
        return data.style;
    };

    this.updates = function() {
        return data.updates ? escape_html(data.updates) : '<i>unknown</i>';
    }

    this.fill_meta_tab = function() {
        document.getElementById('layer-meta-name').textContent = this.name();
        document.getElementById('layer-meta-desc').textContent = this.description();
        document.getElementById('layer-meta-updates').innerHTML = this.updates();
        document.getElementById('layer-meta-url').textContent = this.url;
        document.getElementById('layer-meta-url').setAttribute('href', this.url);
    };
}

function show_message(text) {
    var message_box = document.getElementById('messages');
    message_box.textContent = text;
    message_box.style.display = 'block';
    window.setTimeout(function() {
        message_box.style.display = 'none';
    }, 3000);
}

function update_opacity(value) {
    base_layer_opacity = value;
    base_layers.forEach(function(l) {
        l.setOpacity(value);
    });
}

function get_selection_object(feature) {
    var props = feature.getProperties();

    if (props.node_id !== undefined) {
        return ['node', props.node_id];
    }
    if (props.way_id !== undefined) {
        return ['way', props.way_id];
    }

    return undefined
}

function popup_content(feature) {
    var props = feature.getProperties();

    var out = '<div><h2>Selection</h2>';
    out += '<button id="selection-id">iD</button> ';
    out += '<button id="selection-josm">JOSM</button>';
    out += '<table class="desc">';
    for (var p in props) {
        if (props.hasOwnProperty(p)) {
            var value = props[p].toString();
            if (p == 'geometry') {
                continue;
            } else if (p == 'node_id' && value.match(re_numeric)) {
                p = 'Node ID';
                value = '<a target="_blank" href="https://www.openstreetmap.org/node/' + value + '">' + value + '</a>';
            } else if (p == 'way_id' && value.match(re_numeric)) {
                p = 'Way ID';
                value = '<a target="_blank" href="https://www.openstreetmap.org/way/' + value + '">' + value + '</a>';
            } else if (p == 'relation_id' && value.match(re_numeric)) {
                p = 'Relation ID';
                value = '<a target="_blank" href="https://www.openstreetmap.org/relation/' + value + '">' + value + '</a>';
            } else if (p == 'timestamp') {
                p = 'Timestamp';
                value = value.replace(/^([0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9])T([0-9][0-9]:[0-9][0-9]:[0-9][0-9])Z$/, "$1 $2");
            } else if (p == 'layer') {
                p = 'Layer';
            } else {
                value = escape_html(value);
            }
            out += '<tr><th>' + escape_html(p) + '</th><td>' + value + '</td></tr>';
        }
    }
    out += '</table></div>';

    return out;
}

function switch_to_layer(id) {
    var layer = data_layers[id];

    document.getElementById('canvas_stats').textContent = '';

    document.querySelector('#title h1').textContent = layer.name();
    layer.fill_meta_tab();

    if (vt_layer !== undefined) {
        map.removeLayer(vt_layer);
    }

    if (layer.vector_tile_url()) {
        vt_layer = new ol.layer.VectorTile({
            source: new ol.source.VectorTile({
                format: new ol.format.MVT({featureClass: ol.Feature}),
                tileGrid: ol.tilegrid.createXYZ({maxZoom: 14}),
                url: layer.vector_tile_url(),
                wrapX: false
            }),
            style: function(feature) {
                return styles[feature.getGeometry().getType()];
            }
        });

        map.addLayer(vt_layer);
    } else if (layer.geojson_url()) {
        vt_layer = new ol.layer.Vector({
            source: new ol.source.Vector({
                url: layer.geojson_url(),
                format: new ol.format.GeoJSON(),
                wrapX: false
            }),
        //    style: styles.LineString
        });
        map.addLayer(vt_layer);
    }

    if (layer.stats_data_url()) {
        d3.json(layer.stats_data_url()).then(init_stats);
    }
}

function add_data_layer(url, data) {
    console.log('Add data layer ' + data_layer_num + ': ' + url, data);

    data_layers[url] = new DataLayer(url, data);

    var li = document.createElement('li');
    li.innerHTML = '<button id="layer_'+ data_layer_num + '" href="' + url + '">' + escape_html(data.name) + '</button>';

    var layerlist = document.getElementById('layerlist');
    layerlist.appendChild(li);

    li.children[0].addEventListener('click', function(event) {
        layerlist.querySelectorAll('button').forEach(function(element) {
            remove_class(element, 'selected');
        });
        add_class(this, 'selected');
        event.preventDefault();
        switch_to_layer(url);
    });

    var hover_desc = document.getElementById('hover-desc');
    layerlist.querySelectorAll('button').forEach(function(element) {
        var layer = data_layers[element.getAttribute('href')];
        var timeout;

        element.addEventListener('mouseover', function(event) {
            hover_desc.innerHTML = '<div><b>' + layer.name() + '</b></div><p>' + layer.description() + '</p>';
            hover_desc.style.top = '' + (this.getBoundingClientRect().top - 8) + 'px';
            timeout = window.setTimeout(function() {
                hover_desc.style.display = 'block';
            }, 500);
        });

        element.addEventListener('mouseout', function(event) {
            window.clearTimeout(timeout);
            hover_desc.style.display = 'none';
        });

    });

    ++data_layer_num;
}

function load_data_layer(url) {
    console.log("Loading data layer " + url + " ...");
    d3.json(url).then(function(data) {
        add_data_layer(url, data)
    });
}

function load_data_source(url) {
    console.log("load_data_source ", url);
    d3.json(url).then(function(data) {
        data_sources.push(data);
        data.layers.forEach(function(url) {
            load_data_layer(url);
        });
        var fieldset = document.getElementById('overlay-layers').querySelectorAll('fieldset')[0];
        var len = fieldset.querySelectorAll('input').length;

        var div = document.createElement('div');
        div.innerHTML = '<input type="checkbox" checked="checked" id="my-checkbox' + len + '"></input> ' +
                        '<label for="my-checkbox' + len + '" class="">' + escape_html(data.name) + ' (' + escape_html(url) + ')</label>';
        fieldset.append(div);
    });
}

function init_stats(data) {
    data.forEach(function(d) {
        d[0] = new Date(d[0]);
    });

    var radius = 1.5,
        w = document.getElementById('main-tabs').clientWidth - 140;
        h = 400,
        margin = { top: 20, right: 20, bottom: 20, left: 70 };

    var t0 = data[0][0];
        t1 = data[data.length - 1][0];

    document.getElementById('layer-meta-last-update').textContent = t1.toISOString().substring(0, 10);

/*    var t0 = new Date('2017-01-01');
        t1 = new Date('2017-08-01');*/

    var max = d3.max(data, function(d) {
        return d[1];
    });

    var scale_x = d3.scaleTime()
                    .domain([t0, t1])
                    .range([0, w]);

    var scale_y = d3.scaleLinear()
                    .domain([0, max])
                    .range([h, 0]);

    var chart = d3.select('#canvas_stats').append('svg')
                    .attr('width', w + margin.left + margin.right)
                    .attr('height', h + margin.top + margin.bottom)
                    .append('g')
                        .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
                        .call(function(c) {
                            c.append('rect')
                                .attr('width', w + 10)
                                .attr('height', h + 10)
                                .attr('x', -5)
                                .attr('y', -5)
                                .style('fill', '#f0f0f0')
                                .style('stroke', '#d0d0c8')
                        });

    chart.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0, ' + (h + 5) + ')')
        .call(d3.axisBottom(scale_x));

    chart.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(-5, 0)')
        .call(d3.axisLeft(scale_y));

    var line = d3.line()
        .x(function(d) { return scale_x(d[0]); })
        .y(function(d) { return scale_y(d[1]); });

    chart.selectAll('.line')
        .data(["foo"])
        .enter()
        .append('path')
            .datum(data)
            .attr("class", "line")
            .attr("d", line);

    chart.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
            .style('fill', '#083e76')
            .attr('cx', function(d, i) { return scale_x(d[0]); })
            .attr('cy', function(d) { return scale_y(d[1]); })
            .attr('r', radius)
            .attr('title', function(d, i) { return d3.timeFormat('%Y-%m-%d')(d[0]) + ': ' + d[1]; });
}

function updateZoomSliderText() {
    document.querySelector('#map .ol-zoomslider-thumb').textContent = parseInt(map.getView().getZoom());
}

function updatePermalink() {
    if (!shouldUpdate) {
        // do not update the URL when the view was changed in the 'popstate' handler
        shouldUpdate = true;
        return;
    }

    var center = ol.proj.transform(map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326');
    var hash = '#map=' +
        map.getView().getZoom() + '/' +
        Math.round(center[0] * 100) / 100 + '/' +
        Math.round(center[1] * 100) / 100;
    var state = {
        zoom: map.getView().getZoom(),
        center: map.getView().getCenter()
    };
    window.history.pushState(state, 'map', hash);
}

function has_class(element, class_name) {
    if (element.classList) {
        return element.classList.contains(class_name);
    }
    return new RegExp('(^| )' + class_name + '( |$)', 'gi').test(element.class_name);
}

function add_class(element, class_name) {
    if (element.classList) {
        element.classList.add(class_name);
    } else {
        element.className += ' ' + class_name;
    }
}

function remove_class(element, class_name) {
    if (element.classList) {
        element.classList.remove(class_name);
    } else {
        element.className = element.className.replace(new RegExp('(^|\\b)' + class_name.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
}

function switch_tab(event) {
    var id = event.target.id;

    ['map', 'stats', 'meta'].forEach(function(tab) {
        var nid = 'tab-' + tab + '-button';
        var nid_el = document.getElementById(nid);

        if (nid === id) {
            add_class(nid_el, 'active');
        } else {
            remove_class(nid_el, 'active');
        }

        var display = (nid === id) ? 'block' : 'none';
        var tid = 'tab-' + tab;
        document.getElementById(tid).style.display = display;
    });
}

function open_layers_config() {
    add_class(document.getElementById('everything'), 'overlay-shader');
    document.getElementById('overlay-layers').style.display = 'block';
}

function close_layers_config() {
    document.getElementById('overlay-layers').style.display = 'none';
    remove_class(document.getElementById('everything'), 'overlay-shader');
}

document.addEventListener('DOMContentLoaded', function() {

    var osm_layer = new ol.layer.Tile({
        source: new ol.source.OSM({
            attributions: 'Base map &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors.' +
                          'Tiles <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>.',
            wrapX: false
        }),
        type: 'base',
        title: "OSM Standard",
        opacity: base_layer_opacity
    })

    var toner_layer = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'http://tile.stamen.com/toner/{z}/{x}/{y}.png',
            minZoom: 1,
            maxZoom: 19,
            attributions: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="https://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>.' +
                          'Data by <a href="https://openstreetmap.org/">OpenStreetMap</a>, under <a href="https://www.openstreetmap.org/copyright">ODbL</a>.',
            wrapX: false
        }),
        type: 'base',
        title: "OSM Toner",
        opacity: base_layer_opacity
    })

    base_layers = [toner_layer, osm_layer];

    map = new ol.Map({
        layers: base_layers,
        target: 'map',
        controls: [new ol.control.Zoom, new ol.control.Attribution],
        view: new ol.View({
            center: ol.proj.transform(center, 'EPSG:4326', 'EPSG:3857'),
            zoom: zoom,
            minZoom: 1,
            maxZoom: 19
        })
    });

    map.on('moveend', updatePermalink);

    // restore the view state when navigating through the history, see
    // https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpopstate
    window.addEventListener('popstate', function(event) {
        if (event.state === null) {
            return;
        }
        map.getView().setCenter(event.state.center);
        map.getView().setZoom(event.state.zoom);
        shouldUpdate = false;
    });

    var mouseposition = new ol.control.MousePosition({
        coordinateFormat: ol.coordinate.createStringXY(4),
        projection: 'EPSG:4326',
    });
    map.addControl(mouseposition);

    var zoomslider = new ol.control.ZoomSlider();
    map.addControl(zoomslider);

    map.getView().on('change:resolution', updateZoomSliderText);
    updateZoomSliderText();

    var scaleline = new ol.control.ScaleLine();
    map.addControl(scaleline);

    var layerSwitcher = new ol.control.LayerSwitcher();
    map.addControl(layerSwitcher);

    var select = new ol.interaction.Select({
        hitTolerance: 3
    });
    map.addInteraction(select);
    select.on('select', function(e) {
        var features = e.selected;
        if (features.length > 0) {
            document.getElementById('highlight-data').innerHTML = popup_content(features[0]);
            var selection = get_selection_object(features[0]);
            var extent = features[0].getProperties().geometry.getExtent();
            var buffered_extent = ol.extent.buffer(extent, 500);
            document.getElementById('selection-josm').addEventListener('click', function() {
                if (selection === undefined) {
                    josm_control.open_in_josm(buffered_extent);
                } else {
                    josm_control.open_in_josm(buffered_extent, selection[0] + selection[1]);
                }
            });
            document.getElementById('selection-id').addEventListener('click', function() {
                id_control.open_in_id(ol.extent.getCenter(extent), selection);
            });
        }
    });

    var geocoder = new Geocoder('nominatim', {
        placeholder: 'Search for a place',
    });
    map.addControl(geocoder);

    josm_control = new EditInOSMControl({ editor: 'josm' });
    id_control = new EditInOSMControl({ editor: 'id' });
    map.addControl(josm_control);
    map.addControl(id_control);

    document.getElementById('tab-nav').querySelectorAll('button').forEach(function(child) {
        child.addEventListener('click', switch_tab, false);
    });

    load_data_source('http://area.jochentopf.com/osmm/layers.json');

    document.getElementById('add_source').addEventListener('change', function(event) {
        load_data_source(this.value);
    });

    document.getElementById('overlay-layers-open').addEventListener('click', open_layers_config);
    document.getElementById('overlay-layers-close').addEventListener('click', close_layers_config);

    document.addEventListener('keyup', function(e) {
        if (e.keyCode === 27) { // esc
            close_layers_config();
        }
    });

    var layer_filter_el = document.getElementById('layer-filter');
    layer_filter_el.addEventListener('input', function() {
        var value = layer_filter_el.value.toLowerCase();

        document.getElementById('layerlist').querySelectorAll('button').forEach(function(layer) {
            if (layer.textContent.toLowerCase().includes(value)) {
                layer.innerHTML = layer.textContent.replace(new RegExp(value, 'ig'), '<b>$&</b>');
                layer.style.color = '#000000';
                layer.style.display = 'block';
            } else {
                layer.textContent = layer.textContent;
                if (has_class(layer, 'selected')) {
                    layer.style.color = '#808080';
                } else {
                    layer.style.display = 'none';
                }
            }
        });
    });
});

