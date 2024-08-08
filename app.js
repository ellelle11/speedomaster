document.addEventListener('DOMContentLoaded', (event) => {
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const speedDisplay = document.getElementById('speedDisplay');
    const directionDisplay = document.getElementById('direction');
    const needle = document.getElementById('needle');

    let watchId;
    let previousTime = 0;
    let previousPosition = null;
    let currentSpeed = 0; // Initial speed in m/s

    function requestMotionPermission() {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        startTracking();
                    } else {
                        alert('Permission to access device motion was denied.');
                    }
                })
                .catch(console.error);
        } else {
            startTracking(); // Non-iOS devices or older iOS versions
        }
    }

    function calculateSpeedFromGPS(currentPosition) {
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

    function updateSpeedFromAcceleration(event) {
        const accel = event.accelerationIncludingGravity;
        const deltaTime = 0.1; // Assume a consistent time step, e.g., 100ms

        // Assuming we're mainly interested in acceleration along the z-axis (up and down)
        currentSpeed += accel.z * deltaTime; // Simple integration

        // Convert speed from m/s to knots
        const speedKnots = currentSpeed / 0.514444;

        // Update the display (Note: this will update very frequently)
        speedDisplay.textContent = `Speed: ${speedKnots.toFixed(2)} knots`;
    }

    function updateCompass(event) {
        const alpha = event.alpha || 0; // Fallback to 0 if alpha is undefined
        const heading = alpha;

        // Update the needle rotation
        needle.style.transform = `rotate(${heading}deg)`;

        // Update the heading display
        directionDisplay.textContent = `Direction: ${Math.round(heading)}°`;
    }

    function startTracking() {
        if ('geolocation' in navigator && 'DeviceOrientationEvent' in window) {
            watchId = navigator.geolocation.watchPosition(position => {
                const gpsSpeed = calculateSpeedFromGPS(position);

                // Blend GPS speed with accelerometer-derived speed
                currentSpeed = (gpsSpeed + currentSpeed) / 2; // Simple blending example

                speedDisplay.textContent = `Speed: ${currentSpeed.toFixed(2)} knots`;

                previousPosition = position;
                previousTime = position.timestamp;
            }, error => {
                console.error(error);
                alert('Unable to retrieve position. Make sure location services are enabled.');
            }, {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 10000
            });

            // Start listening to the accelerometer and compass
            window.addEventListener('devicemotion', updateSpeedFromAcceleration);
            window.addEventListener('deviceorientation', updateCompass);

            startButton.disabled = true;
            stopButton.disabled = false;
        } else {
            alert('Geolocation or device orientation is not supported by your browser.');
        }
    }

    function stopTracking() {
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
            previousPosition = null;
            previousTime = 0;

            // Stop listening to the accelerometer and compass
            window.removeEventListener('devicemotion', updateSpeedFromAcceleration);
            window.removeEventListener('deviceorientation', updateCompass);

            startButton.disabled = false;
            stopButton.disabled = true;
        }
    }

    startButton.addEventListener('click', requestMotionPermission);
    stopButton.addEventListener('click', stopTracking);
});
