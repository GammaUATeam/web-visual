// Map settings
var map = L.map(document.getElementById('osm-map'));
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);

map.setView([49.834956, 24.014456], 14);

var touristCurIcon = L.icon({
    iconUrl: 'img/tourist_icon.png',
    iconSize: [25, 25],
    iconAnchor: [12.5, 12.5]
});

var touristOldIcon = L.icon({
    iconUrl: 'img/tourist_icon.png',
    iconSize: [15, 15],
    iconAnchor: [7.5, 7.5]
});

var lastMarker;
var lastMarkerObject;


// Main script
document.getElementById("portConnectScreen").addEventListener("click", async () => {

    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });

    document.getElementById("portConnectScreen").style = "top: 100%;";

    console.log("Port connected");
    const reader = port.readable.getReader();

    var lastValue;

    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            reader.releaseLock();
            break;
        }

        const decoder = new TextDecoder();
        const decodedValue = decoder.decode(value);


        x = decodedValue.slice(0, 9);
        y = decodedValue.slice(10, 19);


        var currentDate = new Date;
        var currentTime = currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds() + " "
            + currentDate.getDate() + "." + (currentDate.getMonth() + 1) + "." + currentDate.getFullYear();


        function isCoordinate(coord) {
            if (coord.length == 9 && /^\d+$/.test(coord * Math.pow(10, 6))) {
                return true;
            }
        }

        function outputData(x, y, currentTime) {
            drawNewPoint(x, y, currentTime);
            console.log(`${currentTime} ${x};${y}`);
        }

        if (isCoordinate(x) && isCoordinate(y)) {
            outputData(x, y, currentTime)
        }
        else {
            twoPacksString = lastValue + decodedValue;
            x = twoPacksString.slice(0, 9);
            y = twoPacksString.slice(10, 19);

            if (isCoordinate(x) && isCoordinate(y)) {
                outputData(x, y, currentTime)
            }
            else {
                console.log(`Ignored data: ${twoPacksString}`)
            }
        }

        lastValue = decodedValue;
    }
})

function drawNewPoint(x, y, currentTime) {

    var newMarker = L.latLng(x, y);

    if (lastMarkerObject != undefined && lastMarker != undefined) {

        var pointList = [newMarker, lastMarker];
        var markerLine = new L.Polyline(pointList, {
            color: '#007800',
            weight: 3,
            opacity: 0.8,
            smoothFactor: 1
        });
        markerLine.addTo(map);


        map.removeLayer(lastMarkerObject);
        var oldMarker = L.marker(lastMarker, { icon: touristOldIcon })
        oldMarker.addTo(map);
        oldMarker.bindTooltip(`${currentTime}`);
    }

    newMarkerObject = L.marker(newMarker, { icon: touristCurIcon });
    newMarkerObject.addTo(map);

    lastMarker = newMarker;
    lastMarkerObject = newMarkerObject;

}