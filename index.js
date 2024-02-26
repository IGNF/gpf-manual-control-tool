const center = [48.84497573035927, 2.4247001358237523];

function convertToGpfWmtsURL(gppURL) {
  return "https://data.geopf.fr/wmts?"
  // return gppURL
}

function convertToGpfWmsURL(gppURL) {
  return "https://data.geopf.fr/wms-v/ows?"
  // return gppURL
}

const mapGpp = L.map('mapGpp', {
    center: center,
    zoom: 12
});

mapGpp.attributionControl.setPrefix('');

const mapGpf = L.map('mapGpf', {
    center: center,
    zoom: 18,
    zoomControl: false
});

mapGpp.sync(mapGpf);
mapGpf.sync(mapGpp);

Gp.Services.getConfig({
  customConfigFile: 'fullConfig.json',
  onSuccess: go,
  onFailure: (e) => {console.log(e)}
});

function go () {
  const $textField = document.getElementById("gppId");
  const $autocomplete = document.getElementById("autocomplete");
  let pleaseRemoveAuto = true;

  const allLayers = Object.keys(Gp.Config.layers).map((x) => x.split('$'));
  const allWMTSLayers = allLayers.filter((x) => x[1] == "GEOPORTAIL:OGC:WMTS").map((x) => x[0]);
  const allWMSVLayers = allLayers.filter((x) => x[1] == "GEOPORTAIL:OGC:WMS").map((x) => x[0]);

  let currentLayers = allWMTSLayers;

  function renderNames(arrayOfNames) {
    $autocomplete.innerHTML = "";
    for (let i = 0; i < arrayOfNames.length; i++) {
      let newli = document.createElement("p");
      newli.innerText = arrayOfNames[i];
      newli.addEventListener("mouseup", () => {
        $textField.value = arrayOfNames[i];
        document.getElementById("submit").click();
        $autocomplete.classList.add("d-none");
        pleaseRemoveAuto = true;
      })
      $autocomplete.appendChild(newli);
    }
  }

  renderNames(currentLayers);

  filterNames = (event) => {
    if (event.key === 'Enter' || event.keyCode === 13) {
      $textField.blur();
      document.getElementById("submit").click();
      return
    }
    var searchvalue = event.target.value;
    var filterNames = currentLayers.filter((v) => {
      return v.includes(searchvalue);
    });
    renderNames(filterNames);
  }

  document.getElementById("radioWMTS").addEventListener("change", () => {
    const service = document.querySelector('input[name="radioService"]:checked').value;
    if (service == "wmts") {
      currentLayers = allWMTSLayers;
    } else {
      currentLayers = allWMSVLayers
    }
    renderNames(currentLayers);
  })

  document.getElementById("radioWMS").addEventListener("change", () => {
    const service = document.querySelector('input[name="radioService"]:checked').value;
    if (service == "wmts") {
      currentLayers = allWMTSLayers;
    } else {
      currentLayers = allWMSVLayers
    }
    renderNames(currentLayers);
  })

  $textField.addEventListener("keyup", filterNames);
  $textField.addEventListener("focus", () => {
    $autocomplete.classList.remove("d-none");
  });
  $textField.addEventListener("focusout", () => {
    setTimeout(() => {
      if (pleaseRemoveAuto) {
        $autocomplete.classList.add("d-none");
      }
    }, 150);
  });
  $autocomplete.addEventListener("mousedown", () => {
    pleaseRemoveAuto = false;
  });

  mapGpp.on("zoomend", () => {
    document.getElementById("currentZoom").innerText = mapGpp.getZoom();
  });

  const search = L.geoportalControl.SearchEngine({});
  mapGpp.addControl(search);

  const lyrGppPlan = L.geoportalLayer.WMTS({
    layer  : "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2",
  },
  {
    opacity : 0.1
  });
  const lyrGpfPlan = L.geoportalLayer.WMTS({
    layer  : "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2",
  },
  {
    opacity : 0.1
  });
  gpfUrl = convertToGpfWmtsURL(lyrGppPlan._url);
  lyrGpfPlan._url = gpfUrl;
  lyrGppPlan.addTo(mapGpp);
  lyrGpfPlan.addTo(mapGpf);

  const lyrGpp = L.geoportalLayer.WMTS({
    layer  : "ORTHOIMAGERY.ORTHOPHOTOS"
  });
  const lyrGpf = L.geoportalLayer.WMTS({
    layer  : "ORTHOIMAGERY.ORTHOPHOTOS"
  });
  gpfUrl = convertToGpfWmtsURL(lyrGpp._url);
  lyrGpf._url = gpfUrl;
  lyrGpp.addTo(mapGpp);
  lyrGpf.addTo(mapGpf);

  document.getElementById("submit").addEventListener("click", () => {
    const service = document.querySelector('input[name="radioService"]:checked').value;
    let lyrGpp;
    let lyrGpf;
    let gpfUrl;
    if (service === "wmts") {
      lyrGpp = L.geoportalLayer.WMTS({
        layer: $textField.value,
      });
      lyrGpf = L.geoportalLayer.WMTS({
        layer: $textField.value,
      });
      gpfUrl = convertToGpfWmtsURL(lyrGpp._url);
    } else if (service === "wms") {
      lyrGpp = L.geoportalLayer.WMS({
        layer: $textField.value,
      });
      lyrGpp.options.styles = "";
      lyrGpp.wmsParams.styles = "";
      lyrGpf = L.geoportalLayer.WMS({
        layer: $textField.value,
      });
      lyrGpf.options.styles = "";
      lyrGpf.wmsParams.styles = "";
      gpfUrl = convertToGpfWmsURL(lyrGpp._url);
    }
    lyrGpf._url = gpfUrl;
    if ($textField.value.split("_")[0] == "ENR") {
      var array = $textField.value.split("_");
      array.shift();
      array.splice(-4);
      var newLayerName = array.join(".");
      lyrGpf._wmtsParams.layer = newLayerName;
    }
    mapGpp.eachLayer(function (layer) {
      mapGpp.removeLayer(layer);
    });
    mapGpf.eachLayer(function (layer) {
      mapGpf.removeLayer(layer);
    });
    lyrGppPlan.addTo(mapGpp);
    lyrGpfPlan.addTo(mapGpf);
    lyrGpp.addTo(mapGpp);
    lyrGpf.addTo(mapGpf);
  });
}

