import {Feature, Map, View} from 'ol/index';
import Layer from 'ol/layer/Layer';
import {Vector as VectorSource} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';
import {Point} from 'ol/geom';
import {composeCssTransform} from 'ol/transform';
import {useGeographic} from 'ol/proj';
import {createStringXY} from 'ol/coordinate';
import {defaults as defaultInteractions} from 'ol/interaction/defaults';
import MousePosition from 'ol/control/MousePosition';
import {Circle, Fill, Stroke, Style, Text} from 'ol/style';
import {getVectorContext} from 'ol/render';
import LineString from 'ol/geom/LineString';
import Overlay from 'ol/Overlay';

import tippy, {followCursor, hideAll} from 'tippy.js';
import 'tippy.js/animations/scale.css';

const mousePositionControl = new MousePosition({
  coordinateFormat: createStringXY(4),
  projection: 'EPSG:4326',
  // comment the following two lines to have the mouse position
  // be placed within the map.
  className: 'custom-mouse-position',
  target: document.getElementById('mouse-position'),
});

useGeographic();

const svgContainer = document.createElement('div');
const xhr = new XMLHttpRequest();
xhr.open('GET', `${window.location.origin}/data/world.svg`);
xhr.addEventListener('load', function () {
  const svg = xhr.responseXML.documentElement;
  svgContainer.ownerDocument.importNode(svg);
  svgContainer.appendChild(svg);
});
xhr.send();

const width = 1866;
const height = 900;
const svgResolution = 360 / width;
svgContainer.style.width = width + 'px';
svgContainer.style.height = height + 'px';
svgContainer.style.transformOrigin = 'top left';
svgContainer.className = 'svg-layer';

const maplayer = new Layer({
  render: function (frameState) {
    const scale = svgResolution / frameState.viewState.resolution;
    const center = frameState.viewState.center;
    const size = frameState.size;
    const cssTransform = composeCssTransform(
      size[0] / 2,
      size[1] / 2,
      scale,
      scale,
      frameState.viewState.rotation,
      -center[0] / svgResolution - width / 2,
      center[1] / svgResolution - height / 2
    );
    svgContainer.style.transform = cssTransform;
    svgContainer.style.opacity = this.getOpacity();
    return svgContainer;
  },
});

const pointsStyle = new Style({
  image: new Circle({
    radius: 4,
    fill: new Fill({
      color: '#E22A24',
    }),
  }),
});

const selectStyle = new Style({
  image: new Circle({
    radius: 8,
    stroke: new Stroke({
      color: '#E22A24',
      width: 1,
    })
  }),
});

const invisStyle = new Style({
  image: new Circle({
    radius: 16,
    fill: new Fill({
      color: [0,0,0,0],
    })
  }),
});

function getOffset(feature){
  let offset = {};
  offset.x = -20;
  offset.y = 30;
  if(feature.get('name') === 'iraq') {
    offset.y = 60;
  }
  return offset;
}

function hoverStyleFunction(feature){

  const hoverStyle = new Style({
    text: new Text({
      font: '24px Bebas Neue',
      textAlign: 'right',
      text: feature.get('name'),
      fill: new Fill({
        color: [255, 255, 255, 1],
      }),
      offsetX: getOffset(feature).x,
      offsetY: getOffset(feature).y,
    }),
  });
  return hoverStyle;
}
function hoverStyleFunction2(feature){
  const hoverStyle = new Style({
    text: new Text({
      font: 'italic 12px PT Serif',
      textAlign: 'right',
      text: feature.get('subname'),
      fill: new Fill({
        color: [255, 255, 255, 1],
      }),
      offsetX: getOffset(feature).x,
      offsetY: getOffset(feature).y + 15,
    }),
  });
  return hoverStyle;
}

let pointsLayer = new VectorLayer({
  source: new VectorSource({
  }),
  style: pointsStyle
});

let grid = new VectorLayer({
  source: new VectorSource({
      features: [new Feature(new Point([0,0]))]
  }),
  style: new Style({
      image: new Circle({
          radius: 0
      })
  }),
  renderBuffer: Infinity,
});

grid.on('prerender', function(event) {

  let unitSplit = .15; // every .1 m
  let pxToUnit = map.getView().getResolution();
  let pxSplit = unitSplit / pxToUnit;

  let [xmin, ymin, xmax, ymax] = event.frameState.extent

  while (pxSplit * 2 < 30) {
    unitSplit *= 2;
    pxSplit = unitSplit / pxToUnit; // distance between two lines
  }

  let startX = Math.round(xmin / unitSplit) * unitSplit; // first line
  let endX = Math.round(xmax / unitSplit) * unitSplit; // last line

  let ctx = getVectorContext(event);

  let lineStyle = new Style({ stroke: new Stroke({ color: [112, 112, 112, 0.45], width: 1 }) });
  ctx.setStyle(lineStyle);

  // drawing lines
  for (let i = startX; i <= endX; i = i + unitSplit) {
    ctx.drawLineString(new LineString([[i, ymin], [i, ymax]])); // draw
  }
  
});

const map = new Map({
  interactions: defaultInteractions({
    mouseWheelZoom: false
  }),
  controls: [mousePositionControl],
  layers: [
    grid,
    maplayer,
    pointsLayer,
  ],
  target: 'map',
  view: new View({
    center: [-30, 12],
    extent: [-180, -90, 180, 90],
    projection: 'EPSG:4326',
    resolution: 0.2,
    enableRotation: false,
  }),
});

for (let i = 0; i < places.length; i++) {
  pointsLayer.getSource().addFeature(new Feature({
    geometry: new Point(places[i].points),
    name: places[i].name,
    subname: places[i].subname,
    highlight: places[i].highlight
  }));
}
let features = pointsLayer.getSource().getFeatures();
features.forEach(function (el) {
  el.setStyle([pointsStyle, invisStyle]);
});

let selected = null;
let shown = false;
let i = 0;
function showTip(e){
  if (selected !== null) {
    if(!shown) {
      instances1.forEach(function(el,index){
        if(el.reference.id === selected.get('name')){
          el.show();
          const slug = selected.get('highlight');
          if(slug !== null){
            const highlight = document.querySelector(`.locations [href*="${slug}"]`);
            if(highlight){
              highlight.classList.add("highlight");
            }
          }
        }
      });
    }
    shown = true;
  } else {
    if(shown){
      var elems = document.querySelectorAll(".highlight");
      [].forEach.call(elems, function(el) {
          el.classList.remove("highlight");
      });

      hideAll();
    }
    shown = false;
  }
}
window.showTipSmall = function(name){
    let features = pointsLayer.getSource().getFeatures();
    features.forEach(function(el, index){
      if(el.get('highlight') === name){
        selected = el;
        el.setStyle([hoverStyleFunction(el), hoverStyleFunction2(el), selectStyle, pointsStyle, invisStyle]);
        return true;
      }
    })
}

map.on('pointermove', function (e) {
  if (selected !== null) {
    selected.setStyle([pointsStyle, invisStyle]);
    selected = null;
  }
  map.forEachFeatureAtPixel(e.pixel, function (f) {
    selected = f;
    f.setStyle([pointsStyle, selectStyle, invisStyle]);
    return true;
  });
  showTip(e);
});

map.on('singleclick', function (e) {
  if (selected !== null) {
    selected.setStyle([pointsStyle, invisStyle]);
    selected = null;
  }
  map.forEachFeatureAtPixel(e.pixel, function (f) {
    selected = f;
    f.setStyle([pointsStyle, selectStyle, invisStyle]);
    return true;
  });
  showTip(e);
});

window.hideSelected = function(){
  let features = pointsLayer.getSource().getFeatures();
  features.forEach(function (el) {
		el.setStyle([pointsStyle, invisStyle]);
	});
  hideAll();
}

window.addEventListener('scroll', (e) => {
  hideSelected();
});

const instances1 = tippy(document.querySelectorAll('.popup'), {
  followCursor: true,
  plugins: [followCursor],
  placement: 'top-start',
  theme: 'map',
  maxWidth: 343,
  maxHeight: 288,
  offset: [0, -25],
  animation: 'scale',
  interactive: true,
  allowHTML: true,
  content(reference) {
    return reference.innerHTML;
  }
});



