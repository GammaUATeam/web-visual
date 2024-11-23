// Small device handling
if (window.matchMedia("(min-width: 300px)").matches) {
    connectDevice()
} else {
    let errorText = document.createElement("p");
    errorText.innerHTML = "Window size error - open page on wider device."
    errorText.style = "text-align: center; color: black; margin: 0; padding: 0; width: 70%;"
    document.body.style = "width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center;";
    document.body.innerHTML = ""
    document.body.append(errorText);
}

// Map setup
var map = L.map(document.getElementById("osm-map"));
L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png").addTo(map);
map.setView([49.834956, 24.014456], 14);

var touristCurIcon = L.icon({
    iconUrl: "../img/tourist_icon.png",
    iconSize: [25, 25],
    iconAnchor: [12.5, 12.5],
});
var touristOldIcon = L.icon({
    iconUrl: "../img/tourist_icon.png",
    iconSize: [15, 15],
    iconAnchor: [7.5, 7.5],
});

var lastMarker;
var lastMarkerObject;
var lastCOMPortValue;

var primeColor = "#aa0000";

function connectDevice() {
    document.getElementById("portConnectScreen").addEventListener("click", async() => {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });

        document.getElementById("portConnectScreen").style = "top: 100%;";

        console.log("Port connected");

        const reader = port.readable.getReader();
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                reader.releaseLock();
                break;
            }

            const decoder = new TextDecoder();
            const decodedValue = decoder.decode(value);

            var x = decodedValue.slice(0, 9);
            var y = decodedValue.slice(10, 19);
            var SOS = decodedValue.slice(20, 21);


            var currentTime = getCurrentTime();

            if (SOS == 1) {
                callSOS()
            }

            function checkCoordinates(x, y) {
                if (x.length == 9 && /^\d+$/.test(x * Math.pow(10, 6)) &&
                    y.length == 9 && /^\d+$/.test(y * Math.pow(10, 6))) {
                    return true;
                }
            }

            if (checkCoordinates(x, y)) {
                drawNewPoint(x, y, currentTime);
            } else {
                var twoCOMPortPacks = lastCOMPortValue + decodedValue;
                x = twoCOMPortPacks.slice(0, 9);
                y = twoCOMPortPacks.slice(10, 19);

                if (checkCoordinates(x, y) && decodedValue != "\n") {
                    console.log(`Joined packs ${lastCOMPortValue} + ${decodedValue}`);
                    drawNewPoint(x, y, currentTime);
                } else {
                    console.log(`Ignored data: ${decodedValue}`);
                }
            }

            lastCOMPortValue = decodedValue;
        }
    })
}

function getCurrentTime() {
    var currentDate = new Date();
    return currentDate.getHours() +
        ":" +
        currentDate.getMinutes() +
        ":" +
        currentDate.getSeconds() +
        " " +
        currentDate.getDate() +
        "." +
        (currentDate.getMonth() + 1) +
        "." +
        currentDate.getFullYear();
}

function callSOS() {
    console.log("SOS!");
    var alertElem = document.createElement("p");
    alertElem.innerHTML = getCurrentTime();
    document.getElementById("alerts").prepend(alertElem);
}

function drawNewPoint(x, y, currentTime) {
    console.log(`%c${currentTime} ${x}; ${y}`, 'background: #900000; color: #fff');

    var coordElem = document.createElement("p");
    coordElem.innerHTML = currentTime;
    document.getElementById("coords").prepend(coordElem);

    var newMarker = L.latLng(x, y);

    if (lastMarkerObject != undefined && lastMarker != undefined) {
        var pointList = [newMarker, lastMarker];
        var markerLine = new L.Polyline(pointList, {
            color: primeColor,
            weight: 3,
            opacity: 0.8,
            smoothFactor: 1,
        });
        markerLine.addTo(map);

        map.removeLayer(lastMarkerObject);
        var oldMarker = L.marker(lastMarker, { icon: touristOldIcon });
        oldMarker.addTo(map);
        oldMarker.bindTooltip(`${currentTime}`);
    }

    newMarkerObject = L.marker(newMarker, { icon: touristCurIcon });
    newMarkerObject.addTo(map);

    lastMarker = newMarker;
    lastMarkerObject = newMarkerObject;

}