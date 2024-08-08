document.addEventListener('DOMContentLoaded', (event) => {
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const speedDisplay = document.getElementById('speedDisplay');

    let watchId;
    let previousTime = 0;
    let previousPosition = null;

    function calculateSpeed(currentPosition) {
        if (previousPosition) {
            const deltaTime = (currentPosition.timestamp - previousTime) / 1000; // In seconds
            const distance = haversineDistance(previousPosition.coords, currentPosition.coords); // In meters

            const speedMps = distance / deltaTime; // Speed in m/s
            const speedKnots = speedMps / 0.514444; // Speed in knots

            return speedKnots;
        }
        return 0;
    }

    function haversineDistance(coords1, coords2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = degreesToRadians(coords2.latitude - coords1.latitude);
        const dLon = degreesToRadians(coords2.longitude - coords1.longitude);

        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(degreesToRadians(coords1.latitude)) *
                  Math.cos(degreesToRadians(coords2.latitude)) *
                  Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    function degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    function startTracking() {
        if ('geolocation' in navigator) {
            watchId = navigator.geolocation.watchPosition(position => {
                const speed = calculateSpeed(position);
                speedDisplay.textContent = `Velocità: ${speed.toFixed(2)} nodi`;

                previousPosition = position;
                previousTime = position.timestamp;
            }, error => {
                console.error(error);
                alert('Impossibile ottenere la posizione. Assicurati che i servizi di localizzazione siano attivi.');
            }, {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 10000
            });

            startButton.disabled = true;
            stopButton.disabled = false;
        } else {
            alert('Geolocalizzazione non supportata dal tuo browser.');
        }
    }

    function stopTracking() {
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
            previousPosition = null;
            previousTime = 0;

            startButton.disabled = false;
            stopButton.disabled = true;
        }
    }

    startButton.addEventListener('click', startTracking);
    stopButton.addEventListener('click', stopTracking);
});
