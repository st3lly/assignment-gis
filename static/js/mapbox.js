/*
------------------------------------------
    ***** GLOBAL VARIABLES *****
------------------------------------------
*/
var mymap = L.map('mapbox');
mymap.on('load', onMapLoad);
mymap.setView([48.55, 18.8], 8.5);
mymap.on('click', onMapClick);
var layerControl;
var mennekesGeojsonLayer;
var ceeGeojsonLayer;
var chademoGeojsonLayer;
var jGeojsonLayer;
var teslaGeojsonLayer;
var positionMarker;
var radius;
var positionMarkerCoordinates = null;
var districtPolygon;
var amenityRadius;
var geoJsonAmenities;

//markers for stations
var mennekesGeojsonIcon = L.AwesomeMarkers.icon({
    icon: 'plug',
    prefix: 'fa',
    markerColor: 'green'
});

var ceeGeojsonIcon = L.AwesomeMarkers.icon({
    icon: 'plug',
    prefix: 'fa',
    markerColor: 'darkred'
});

var chademoGeojsonIcon = L.AwesomeMarkers.icon({
    icon: 'plug',
    prefix: 'fa',
    markerColor: 'blue'
});

var jGeojsonIcon = L.AwesomeMarkers.icon({
    icon: 'plug',
    prefix: 'fa',
    markerColor: 'purple'
});

var teslaGeojsonIcon = L.AwesomeMarkers.icon({
    icon: 'plug',
    prefix: 'fa',
    markerColor: 'red'
});



//other markers
var positionMarkerIcon = L.AwesomeMarkers.icon({
    icon: 'male',
    prefix: 'fa',
    markerColor: 'orange'
});

var pubMarkerIcon = L.AwesomeMarkers.icon({
    icon: 'beer',
    prefix: 'fa',
    iconColor: '#00FA9A',
    markerColor: 'cadetblue'
});

var foodMarkerIcon = L.AwesomeMarkers.icon({
    icon: 'cutlery',
    prefix: 'fa',
    iconColor: '#00FA9A',
    markerColor: 'cadetblue'
});

var cafeMarkerIcon = L.AwesomeMarkers.icon({
    icon: 'coffee',
    prefix: 'fa',
    iconColor: '#00FA9A',
    markerColor: 'cadetblue'
});

L.tileLayer('https://api.mapbox.com/styles/v1/st3lly/cja6r5yx64pvk2snu2ecaf1qm/tiles/256/{z}/{x}/{y}?access_token=' + access_token, {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.streets'
}).addTo(mymap);



/*
------------------------------------------
    ***** FUNCTIONS DEFINITIONS *****
------------------------------------------
*/

function onMapLoad() {
    getData('/api/get/all');
    districtsSelection();
};

//returns json data from api
function getData(url, toMap = true) {
    var data;
    $.ajax(url, {
        data: data,
        success: function(data){
            if(toMap) {
                mapData(mymap, data);
            } else {
                amenityData(mymap, data);
            }
        }
    })
}

// makes a result div element
function resultDiv(map, entry) {
    var resultDiv = document.createElement('div');
    var titleDiv = document.createElement('div');
    var townDiv = document.createElement('div');
    resultDiv.className = 'result';
    townDiv.className = 'town';
    resultDiv.addEventListener('click', function(){
        resultClick.call(this, map, entry[0].geometry.coordinates[0], entry[0].geometry.coordinates[1]);
    });
    townDiv.append(entry[0].properties.address_town);
    titleDiv.append(entry[0].properties.address_title);
    resultDiv.append(titleDiv);
    resultDiv.append(townDiv);
    $('#results-wraper').append(resultDiv);
}


//makes a select element of districts
function districtsSelection() {
    var data;
    $.ajax('/api/get/districts', {
        data: data,
        success: function(data){
            data.forEach(function(entry) {
                var option = document.createElement('option');
                option.append(entry);
                $('#select_district').append(option)
            });
        }
    });
}

//draws district boundary (polygon) to map
function drawDistrict(district) {
    var data;
    $.ajax('/api/get/boundary/' + district, {
        data: data,
        success: function(data){
            districtPolygon = L.geoJson(data[0]).addTo(mymap);
            mymap.fitBounds(districtPolygon.getBounds());
        }
    });
}

//binfs onChange event to element with ID select_district 
$('#select_district').bind('change', function() {
    if(districtPolygon) {
        districtPolygon.remove();
    }

    if(positionMarker) {
        positionMarker.remove();
    }

    if(radius) {
        radius.remove();
    }

    if(amenityRadius) {
        amenityRadius.remove();
    }

    if(geoJsonAmenities) {
        geoJsonAmenities.remove();
    }

    if($('#select_district option:selected').text() != '-- none --') {
        var district = $('#select_district option:selected').text()
        drawDistrict(district);

        removeStationsFromMap();

        getData('api/get/from/' + district);
    } else {
        getData('api/get/all');
        mymap.setView([48.55, 18.8], 8.5);
    }
});

//removes all result div from #results-wraper
function removeResults() {
    $('.result').remove();
}

//onclick function for result div element
function resultClick(map, lon, lat) {
    map.setView([lat, lon], 14);
}

//adds charging stations data from API to map
function mapData(map, data) { 
    //creates geojson container objects
    var mennekesGeojson = {
        "type": "FeatureCollection",
        "features": []
    };
    var ceeGeojson = {
        "type": "FeatureCollection",
        "features": []
    };
    var chademoGeojson = {
        "type": "FeatureCollection",
        "features": []
    };
    var jGeojson = {
        "type": "FeatureCollection",
        "features": []
    };
    var teslaGeojson = {
        "type": "FeatureCollection",
        "features": []
    };

    removeResults();
    data.forEach(function(entry) {
        switch(entry[0].properties['connection_type_title']) {
            case 'Mennekes (Type 2)':
            case 'Mennekes (Type 2, Tethered Connector) ':
                mennekesGeojson.features.push(entry[0]);
                break;
            case 'CEE 5 Pin':
            case 'CEE 7/5':
                ceeGeojson.features.push(entry[0]);
                break;
            case 'CHAdeMO':
                chademoGeojson.features.push(entry[0]);
                break;
            case 'J1772':
                jGeojson.features.push(entry[0]);
                break;
            case 'Tesla Supercharger':
                teslaGeojson.features.push(entry[0]);
                break;
            default:
                break;
        }
        resultDiv(map, entry);
    });
    
    mennekesGeojsonLayer = L.geoJson(mennekesGeojson, {
        pointToLayer: function(feature, latlng) {
            return L.marker(latlng, {icon: mennekesGeojsonIcon}).bindPopup(popupDivStation(feature)).openPopup();
        }
    }).addTo(map);

    ceeGeojsonLayer = L.geoJson(ceeGeojson, {
        pointToLayer: function(feature, latlng) {
            return L.marker(latlng, {icon: ceeGeojsonIcon}).bindPopup(popupDivStation(feature)).openPopup();
        }
    }).addTo(map);

    chademoGeojsonLayer = L.geoJson(chademoGeojson, {
        pointToLayer: function(feature, latlng) {
            return L.marker(latlng, {icon: chademoGeojsonIcon}).bindPopup(popupDivStation(feature)).openPopup();
        }
    }).addTo(map);

    jGeojsonLayer = L.geoJson(jGeojson, {
        pointToLayer: function(feature, latlng) {
            return L.marker(latlng, {icon: jGeojsonIcon}).bindPopup(popupDivStation(feature)).openPopup();
        }
    }).addTo(map);

    teslaGeojsonLayer = L.geoJson(teslaGeojson, {
        pointToLayer: function(feature, latlng) {
            return L.marker(latlng, {icon: teslaGeojsonIcon}).bindPopup(popupDivStation(feature)).openPopup();
        }
    }).addTo(map);

    var baseObj;
    var overlayObj = {
        "<span style='color: green'><b>Mennekes (Type 2)</b></span>": mennekesGeojsonLayer,
        "<span style='color: darkred'><b>CEE</b></span>": ceeGeojsonLayer,
        "<span style='color: blue'><b>CHAdeMO</b></span>": chademoGeojsonLayer,
        "<span style='color: purple'><b>J1772</b></span>": jGeojsonLayer,
        "<span style='color: red'><b>Tesla Supercharger</b></span>": teslaGeojsonLayer
    };
    layerControl = L.control.layers(baseObj, overlayObj).addTo(map);
}

//removes layer control and all charging stations data from map 
function removeStationsFromMap() {
    if(mennekesGeojsonLayer) {
        mennekesGeojsonLayer.remove();
    }

    if(ceeGeojsonLayer) {
        ceeGeojsonLayer.remove();
    }

    if(chademoGeojsonLayer) {
        chademoGeojsonLayer.remove();
    }

    if(jGeojsonLayer) {
        jGeojsonLayer.remove();
    }

    if(teslaGeojsonLayer) {
        teslaGeojsonLayer.remove();
    }

    if(layerControl) {
        mymap.removeControl(layerControl)
    }
}

//adds amenities data to map
function amenityData(map, data) {
    var geojson = {
        "type": "FeatureCollection",
        "features": []
    };

    data.forEach(function(entry) {
        geojson.features.push(entry[0]);
    });

    geoJsonAmenities = L.geoJson(geojson, {
        pointToLayer: function(feature, latlng) {
            if(feature.properties['amenity'] == 'bar' || feature.properties['amenity'] == 'pub') {
                return L.marker(latlng, {icon: pubMarkerIcon}).bindPopup(popupDivAmenity(feature)).openPopup();
            } else if(feature.properties['amenity'] == 'cafe') {
                return L.marker(latlng, {icon: cafeMarkerIcon}).bindPopup(popupDivAmenity(feature)).openPopup();
            } else {
                return L.marker(latlng, {icon: foodMarkerIcon}).bindPopup(popupDivAmenity(feature)).openPopup();
            }
        }
    }).addTo(map);
}

//makes a div element for popup on markers of charging stations
function popupDivStation(feature) {
    var lat = feature.geometry.coordinates[1];
    var lng = feature.geometry.coordinates[0];
    var html = `
        <div class='popup'>
            <h1>${feature.properties['address_title']}</h1>
            <div class="row"><strong>lat:&nbsp;</strong>${lat}</div>
            <divclass="row"><strong>lng:&nbsp;</strong>${lng}</div>
    `;
    if(feature.properties['operator_title'] != null) {
        html += `<div class="row"><strong>operator:&nbsp;</strong>${feature.properties['operator_title']}</div>`;
    }

    if(feature.properties['operator_url'] != null) {
        html += `<div class="row"><strong>link:&nbsp;</strong>${feature.properties['operator_url']}</div>`;
    }

    if(feature.properties['operator_mail'] != null) {
        html += `<div class="row"><strong>operator mail:&nbsp;</strong>${feature.properties['operator_mail']}</div>`;
    }

    if(feature.properties['is_pay_at_location'] != null) {
        var pay;
        if(feature.properties['is_pay_at_location']) {
            pay = 'yes';
        } else {
            pay = 'no';
        }
        html += `<div class="row"><strong>pay at location:&nbsp;</strong>${pay}</div>`;
    }

    if(feature.properties['is_membership_required'] != null) {
        var membership;
        if(feature.properties['is_membership_required']) {
            membership = 'yes';
        } else {
            membership = 'no';
        }
        html += `<div class="row"><strong>membership required:&nbsp;</strong>${membership}</div>`;
    }

    if(feature.properties['usage_cost'] != null) {
        html += `<div class="row"><strong>usage cost:&nbsp;</strong>${feature.properties['usage_cost']}</div>`;
    }

    if(feature.properties['address_line1'] != null) {
        html += `<div class="row"><strong>address line:&nbsp;</strong>${feature.properties['address_line1']}</div>`;
    }

    if(feature.properties['address_line2'] != null) {
        html += `<div class="row"><strong>address line 2:&nbsp;</strong>${feature.properties['address_line2']}</div>`;
    }

    if(feature.properties['address_town'] != null) {
        html += `<div class="row"><strong>town:&nbsp;</strong>${feature.properties['address_town']}</div>`;
    }

    if(feature.properties['address_postcode'] != null) {
        html += `<div class="row"><strong>postcode:&nbsp;</strong>${feature.properties['address_postcode']}</div>`;
    }

    if(feature.properties['contact_phone'] != null) {
        html += `<div class="row"><strong>phone:&nbsp;</strong>${feature.properties['contact_phone']}</div>`;
    }

    if(feature.properties['number_of_points'] != null) {
        html += `<div class="row"><strong>number of points:&nbsp;</strong>${feature.properties['number_of_points']}</div>`;
    }

    if(feature.properties['connection_type_title'] != null) {
        html += `<div class="row"><strong>connection type title:&nbsp;</strong>${feature.properties['connection_type_title']}</div>`;
    }

    if(feature.properties['connection_type_name'] != null) {
        html += `<div class="row"><strong>connection type name:&nbsp;</strong>${feature.properties['connection_type_name']}</div>`;
    }

    if(feature.properties['connection_amps'] != null) {
        html += `<div class="row"><strong>amps:&nbsp;</strong>${feature.properties['connection_amps']}</div>`;
    }

    if(feature.properties['connection_voltage'] != null) {
        html += `<div class="row"><strong>voltage:&nbsp;</strong>${feature.properties['connection_voltage']}</div>`;
    }

    if(feature.properties['connection_power'] != null) {
        html += `<div class="row"><strong>connection power:&nbsp;</strong>${feature.properties['connection_power']}</div>`;
    }

    if(feature.properties['connection_current_type'] != null) {
        html += `<div class="row"><strong>connection current:&nbsp;</strong>${feature.properties['connection_current_type']}</div>`;
    }

    if(feature.properties['connection_current_desc'] != null) {
        html += `<div class="row"><strong>connection current desc:&nbsp;</strong>${feature.properties['connection_current_desc']}</div>`;
    }

    html += `
        <divclass="row">
            <br>
            <button id="poi-btn" type="button" onclick="amenities(${lat}, ${lng})" class="btn btn-success">Show points of interest</button>
        </div>
    </div>`;
    return html;
}

//makes a div element for popup on markers of amenities
function popupDivAmenity(feature) {
    var lat = feature.geometry.coordinates[1];
    var lng = feature.geometry.coordinates[0];
    var html = `
        <div class='popup'>
            <h1>${feature.properties['name']}</h1>
            <div class='row'><strong>lat:&nbsp;</strong>${lat}</div>
            <div class='row'><strong>lng:&nbsp;</strong>${lng}</div>
            <div class='row'><strong>type:&nbsp;</strong> ${feature.properties['amenity']}</div>
        </div>
    `;
    return html;
}

//onClick event for map which creates position marker and radius
function onMapClick(e) {
    removeStationsFromMap();
    getData('/api/get/' + $('#radius').val() * 1000 + '/' + e.latlng.lat + '/' + e.latlng.lng);

    $('#select_district').each(function() {
        $(this)[0].selectedIndex=0;
    });

    if(positionMarker) {
        positionMarker.remove();
    }

    if(radius) {
        radius.remove();
    }

    if(districtPolygon) {
        districtPolygon.remove();
    }

    positionMarkerCoordinates = e.latlng;

    positionMarker = L.marker(e.latlng, {icon: positionMarkerIcon}).addTo(mymap);
    positionMarker.addEventListener('click', removePositionMarker);
    radius = L.circle(e.latlng, {
        color: '#99CBED',
        fillColor: '#3498DB',
        fillOpacity: 0.2,
        radius: $('#radius').val() * 1000
    }).addTo(mymap);
    mymap.fitBounds(radius.getBounds());
}

//onClick event for position markers, which removes this marker
function removePositionMarker() {
    if(positionMarker) {
        positionMarker.remove();
    }

    if(radius) {
        radius.remove();
    }
    positionMarkerCoordinates = null;
    removeStationsFromMap();
    getData('api/get/all');
}

//onChane event for input type number whith ID radius for radius settings
$('#radius').bind('change', function () {
    if(positionMarkerCoordinates != null) {
        removeStationsFromMap();
        getData('/api/get/' + $('#radius').val() * 1000 + '/' + positionMarkerCoordinates.lat + '/' + positionMarkerCoordinates.lng);
        if(radius) {
            radius.remove();
            radius = L.circle(positionMarkerCoordinates, {
                color: '#99CBED',
                fillColor: '#3498DB',
                fillOpacity: 0.2,
                radius: $('#radius').val() * 1000
            }).addTo(mymap);
            mymap.fitBounds(radius.getBounds());
        }
    }
});

//binds onClick event to reset button for reset all filters from the map
$('#reset-btn').bind('click', function() {
    mymap.setView([48.55, 18.8], 8.5);

    if(positionMarker) {
        positionMarker.remove();
    }

    if(radius) {
        radius.remove();
    }

    if(amenityRadius) {
        amenityRadius.remove();
    }

    if(districtPolygon) {
        districtPolygon.remove();
    }

    if(positionMarker) {
        positionMarker.remove();
    }

    removeStationsFromMap();

    if(geoJsonAmenities) {
        geoJsonAmenities.remove();
    }
    positionMarkerCoordinates = null;

    $('#select_district').each(function() {
        $(this)[0].selectedIndex=0;
    });

    getData('/api/get/all');
})

//onClick event on button with ID poi-btn, which shows amenities on the map
function amenities(lat, lng) {
    if(geoJsonAmenities) {
        geoJsonAmenities.remove();
    }

    if(amenityRadius) {
        amenityRadius.remove();
    }

    amenityRadius = L.circle([lat, lng], {
        color: '#99CBED',
        fillColor: '#3498DB',
        fillOpacity: 0.2,
        radius: 500
    }).addTo(mymap);
    mymap.fitBounds(amenityRadius.getBounds());
    getData('api/get/amenity/' + lat + '/' + lng, false);
}