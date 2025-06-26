// index.tsx
const latitudeEl = document.getElementById('latitude') as HTMLDivElement;
const longitudeEl = document.getElementById('longitude') as HTMLDivElement;
const accuracyEl = document.getElementById('accuracy') as HTMLDivElement;
const radiusInputEl = document.getElementById('radiusInput') as HTMLInputElement;
const mapEl = document.getElementById('map') as HTMLDivElement;
const radiusCircleEl = document.getElementById('radiusCircle') as HTMLDivElement;
const statusMessageEl = document.getElementById('statusMessage') as HTMLDivElement;
const getLocationBtnEl = document.getElementById('getLocationBtn') as HTMLButtonElement;

// The conceptual width/height of the map in meters that corresponds to the map's pixel dimension
const MAP_VISUAL_SPAN_METERS = 1000; 

function updateStatus(message: string, isError: boolean = false): void {
    if (!statusMessageEl) return;
    statusMessageEl.textContent = message;
    // Setting className directly replaces all existing classes.
    statusMessageEl.className = `status ${isError ? 'error' : 'success'}`;
}

function updateMapView(radiusMeters: number): void {
    if (!radiusCircleEl || !mapEl) return;

    const effectiveRadiusMeters = Math.max(0, radiusMeters);
    const diameterMeters = effectiveRadiusMeters * 2;

    const currentMapDimensionPx = mapEl.offsetWidth; 

    let pixelDiameter = (diameterMeters * currentMapDimensionPx) / MAP_VISUAL_SPAN_METERS;
    
    pixelDiameter = Math.min(pixelDiameter, currentMapDimensionPx);
    pixelDiameter = Math.max(0, pixelDiameter);

    radiusCircleEl.style.width = `${pixelDiameter}px`;
    radiusCircleEl.style.height = `${pixelDiameter}px`;
    radiusCircleEl.setAttribute('aria-label', `範圍指示圈，半徑 ${effectiveRadiusMeters} 公尺`);
}

function displayLocation(position: GeolocationPosition): void {
    const { latitude, longitude, accuracy } = position.coords;
    if (latitudeEl) latitudeEl.textContent = `緯度: ${latitude.toFixed(6)}`;
    if (longitudeEl) longitudeEl.textContent = `經度: ${longitude.toFixed(6)}`;
    if (accuracyEl) accuracyEl.textContent = `精確度: ${accuracy.toFixed(0)} 公尺`;
    
    updateStatus("成功獲取位置!", false);
    
    if (radiusInputEl) {
        const currentRadius = parseFloat(radiusInputEl.value);
        if (!isNaN(currentRadius)) {
            updateMapView(currentRadius);
        }
    }
}

function handleLocationError(error: GeolocationPositionError): void {
    let message: string;

    if (error.code === error.PERMISSION_DENIED) {
        message = "無法獲取位置：權限已被瀏覽器拒絕。請檢查瀏覽器的網站設定，並允許此頁面存取您的位置。";
        updateStatus(message, true);
    } else {
        message = "獲取位置時發生錯誤: ";
        switch (error.code) {
            case error.POSITION_UNAVAILABLE:
                message += "目前無法取得位置資訊。請稍後再試或檢查您的網路連線。";
                break;
            case error.TIMEOUT:
                message += "獲取使用者位置請求超時。請檢查您的網路連線。";
                break;
            default:
                message += `發生未知錯誤 (${error.code}): ${error.message}`;
                break;
        }
        updateStatus(message, true);
    }

    // Update coordinate display regardless of the specific error
    if (latitudeEl) latitudeEl.textContent = `緯度: 獲取失敗`;
    if (longitudeEl) longitudeEl.textContent = `經度: 獲取失敗`;
    if (accuracyEl) accuracyEl.textContent = `精確度: 無`;

    // Still update map view with default/current radius, even if location fails
    if (radiusInputEl) {
        const currentRadius = parseFloat(radiusInputEl.value);
        if (!isNaN(currentRadius)) {
            updateMapView(currentRadius);
        }
    }
}

function requestLocation(): void {
    if (navigator.geolocation) {
        // This message will be shown if requestLocation is called and geolocation is supported.
        updateStatus("正在請求位置資訊...", false); 
        navigator.geolocation.getCurrentPosition(
            displayLocation,
            handleLocationError,
            {
                enableHighAccuracy: true,
                timeout: 15000, 
                maximumAge: 0 
            }
        );
    } else {
        updateStatus("此瀏覽器不支援地理位置功能。", true);
        if (latitudeEl) latitudeEl.textContent = `緯度: 不支援`;
        if (longitudeEl) longitudeEl.textContent = `經度: 不支援`;
        if (accuracyEl) accuracyEl.textContent = `精確度: 無`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!radiusInputEl || !latitudeEl || !longitudeEl || !accuracyEl || !mapEl || !radiusCircleEl || !statusMessageEl || !getLocationBtnEl) {
        console.error("Essential UI elements are missing from the DOM.");
        const errorMessage = "頁面初始化錯誤，缺少必要的 UI 元件。";
        if (statusMessageEl) {
            updateStatus(errorMessage, true);
        } else {
            alert(errorMessage);
        }
        return;
    }

    radiusInputEl.addEventListener('input', () => {
        const radiusValue = parseFloat(radiusInputEl.value);
        const minRadius = parseFloat(radiusInputEl.min);

        if (!isNaN(radiusValue) && radiusValue >= minRadius) {
            updateMapView(radiusValue);
        } else if (!isNaN(radiusValue) && radiusValue < minRadius) {
            radiusInputEl.value = minRadius.toString();
            updateMapView(minRadius);
        }
    });

    getLocationBtnEl.addEventListener('click', () => {
        // Immediate feedback upon click, before calling requestLocation.
        // This helps confirm the event listener is firing and statusMessageEl is accessible.
        if (statusMessageEl) {
            statusMessageEl.textContent = '按鈕點擊已偵測，開始請求位置...';
            statusMessageEl.className = 'status'; // Use a neutral style for this temp message
        }
        requestLocation();
    });
    
    const initialRadius = parseFloat(radiusInputEl.value);
    if (!isNaN(initialRadius)) {
        updateMapView(initialRadius);
    }
    // Initial status message is set in HTML: "請點擊按鈕以獲取您的位置。"
});