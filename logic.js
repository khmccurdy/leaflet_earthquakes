// Store our API endpoint as queryUrl
const earthquakeUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_week.geojson"
const plateUrl = "plate_boundaries.json";
const circleScale = 15000;
const timeDiff = 5e6;
// Perform a GET request to the query URL
d3.json(earthquakeUrl, function(error, response) {
  if (error) console.warn(error);
  // Create the timeline and controls
  var timelineControl = L.timelineSliderControl(
    {formatOutput: date=>{return (new Date(date)).toString()}}
  );

  var timeline = L.timeline(response,{
    getInterval: d=>{
      return {
        start: d.properties.time, 
        end: d.properties.time + timeDiff,
      }
    },
    pointToLayer: d=>{
      let c = d.geometry.coordinates;
      let mag = +d.properties.mag;

      return L.circle([c[1], c[0]], {
        color: 'black',
        opacity: 0.5,
        weight: 1,
        fillColor: colorScale(mag),
        fillOpacity: 0.8,
        radius: mag*circleScale,
      })//.addTo(earthquakes)
        .bindPopup(`<p>${mag}</p>`);
      }
  })

  timelineControl.addTo(map);
  timelineControl.addTimelines(timeline);
  timeline.addTo(earthquakes);
  // L.geoJson(response, earthquakeStyle).addTo(earthquakes);
  for (var i in response.features){
    break;
    let f = response.features[i];
    let c = f.geometry.coordinates;
    let mag = +f.properties.mag;

    L.circle([c[1], c[0]], {
      color: 'black',
      opacity: 0.5,
      weight: 1,
      fillColor: colorScale(mag),
      fillOpacity: 0.8,
      radius: mag*circleScale,
    }).addTo(earthquakes)
      .bindPopup(`<p>${mag}</p>`);
  }
});

d3.json(plateUrl, (error,response)=>{
  if (error) console.warn(error);
  L.geoJSON(response.features, {
    style: {
      color: "orange",
      weight: 1.5,
    }
  }).addTo(plates)
})

// Color for earthquake markers

var colorScale = d3.scaleLinear()
    .domain([0,8])
    .range(["green", "red", "black"])
    .interpolate(d3.interpolateHsl);

// Define base layers
var streetmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?" +
  `access_token=${mapboxKey}`);

var darkmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?" +
  `access_token=${mapboxKey}`);
// Define overlay layers

var earthquakes = L.layerGroup();
var plates = L.layerGroup();

// Define a baseMaps object to hold our base layers
var baseMaps = {
  "Light Map": streetmap,
  "Dark Map": darkmap,
};

var overlayMaps = {
  "Earthquakes": earthquakes,
  "Plate Boundaries": plates,
};

// Legend

var $legend = L.control({ position: 'bottomright' });

$legend.onAdd = function() {
  var div = L.DomUtil.create('div', 'info legend');
  var limits = d3.range(9);
  // console.log(colors)
  var labels = []

  // Add min & max
  div.innerHTML = `<h1>Earthquake Intensity</h1>
    <div class="labels">
      <div class="min">0</div> 
      <div class="max">8+</div>
    </div>`;

  limits.forEach((d,i)=> {
    labels.push('<li style="background-color: ' + colorScale(i) + '"></li>')
  })
  // console.log(labels)

  div.innerHTML += '<ul>' + labels.join('') + '</ul>';
  // console.log(div.innerHTML)
  return div
};


// Create the map
var map = L.map("map", {
  center: [
    37.09, -95.71
  ],
  zoom: 5,
  layers: [streetmap, earthquakes, plates]
});

// Create a layer control containing our baseMaps
// Be sure to add an overlay Layer containing the earthquake GeoJSON
L.control.layers(baseMaps,overlayMaps,{collapsed: false}).addTo(map);
$legend.addTo(map);
