class PlantIdentificationService {
    constructor() {
        // PlantNet API details
        this.apiKey = "2b10iLYx4XelpJRTKoHMkJY7e"; // Replace with your actual PlantNet API key
        this.apiUrl =`https://my-api.plantnet.org/v2/identify/all`; 
    }

    async identifyPlant(imageFile) {
        const formData = new FormData();
        formData.append('images', imageFile); 
        formData.append('organs', 'leaf'); 
        formData.append('api-key', this.apiKey); 

        try {
            const response = await fetch(`${this.apiUrl}?api-key=${this.apiKey}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to identify plant');
            }

            const result = await response.json();

            // Check if results exist
            if (!result.results || result.results.length === 0) {
                throw new Error('No plant identified');
            }

            return result;
        } catch (error) {
            console.error('Error identifying plant:', error);
            throw error; 
        }
    }

    // Additional method to fetch more plant details
    async getPlantDetails(scientificName) {
        // This is a mock implementation. In a real-world scenario, 
        // you'd use a botanical database API or service
        const plantDetails = {
            'Ficus benjamina': {
                commonName: 'Weeping Fig',
                origin: 'Southeast Asia',
                wateringNeeds: 'Moderate - keep soil consistently moist',
                lightRequirements: 'Bright, indirect light',
                careLevel: 'Intermediate',
                toxicity: 'Toxic to pets if ingested'
            },
            // Add more plant details as needed
            'default': {
                commonName: 'Unknown Plant',
                origin: 'Unknown',
                wateringNeeds: 'Varies',
                lightRequirements: 'Varies',
                careLevel: 'Unknown',
                toxicity: 'Unknown'
            }
        };

        return plantDetails[scientificName] || plantDetails['default'];
    }
}

// Existing DOM element selections
const plantService = new PlantIdentificationService();
const videoElement = document.getElementById('video');
const captureButton = document.getElementById('captureButton');
const imagePreview = document.getElementById('imagePreview');
const canvas = document.getElementById('canvas');
const loadingDiv = document.getElementById('loading');
const resultDiv = document.getElementById('result');
const imageUpload = document.getElementById('imageUpload');

// Camera access remains the same
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(stream) {
            videoElement.srcObject = stream;
        })
        .catch(function(err) {
            console.log("Error accessing camera: " + err);
        });
}

// Image capture and upload event listeners remain the same
captureButton.addEventListener('click', function() {
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    canvas.getContext('2d').drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL('image/png');
    imagePreview.src = imageDataUrl;
    imagePreview.style.display = 'block';
});

imageUpload.addEventListener('change', function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
});

async function identifyPlant() {
    let imageFile;
    if (imagePreview.src.startsWith('data:image')) {
        imageFile = dataURLtoFile(imagePreview.src, 'plant_image.png');
    } else {
        alert('Please capture or upload an image first');
        return;
    }

    resultDiv.innerHTML = '';
    loadingDiv.style.display = 'block';

    try {
        const apiResponse = await plantService.identifyPlant(imageFile);
        await displayPlantDetails(apiResponse);
    } catch (error) {
        resultDiv.innerHTML = `<p>Error identifying plant: ${error.message}</p>`;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

async function displayPlantDetails(apiResponse) {
    const resultDiv = document.getElementById('result');

    if (apiResponse.results && apiResponse.results.length > 0) {
        const plant = apiResponse.results[0];
        const scientificName = plant.species.scientificName;
        
        // Fetch additional plant details
        const details = await plantService.getPlantDetails(scientificName);

        resultDiv.innerHTML = `
            <div class="detail-card">
                <h2>Identified Plant</h2>
                <p><strong>Scientific Name:</strong> ${scientificName}</p>
                <p><strong>Common Name:</strong> ${details.commonName}</p>
                <p><strong>Confidence:</strong> ${(plant.score * 100).toFixed(2)}%</p>
            </div>

            <div class="detail-card">
                <h3>Plant Details</h3>
                <p><strong>Origin:</strong> ${details.origin}</p>
                <p><strong>Watering Needs:</strong> ${details.wateringNeeds}</p>
                <p><strong>Light Requirements:</strong> ${details.lightRequirements}</p>
                <p><strong>Care Level:</strong> ${details.careLevel}</p>
                <p><strong>Toxicity:</strong> ${details.toxicity}</p>
            </div>
        `;
    } else {
        resultDiv.innerHTML = '<p>No plant could be identified. Please try another image.</p>';
    }
}

// Existing dataURLtoFile function remains the same
function dataURLtoFile(dataURL, filename) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);

    for (let n = 0; n < bstr.length; n++) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
}