const canvas = document.getElementById('heartCanvas');
const ctx = canvas.getContext('2d');
let width, height;
let heartScale, centerX, centerY;

const targetLangs = ["Ti amo", "I love you", "Je t'aime"];
const languages = [
    ...targetLangs,
    "Ich liebe dich", "Te amo",
    "Eu te amo", "أحبك", "я тебя люблю", "愛してる", "사랑해",
    "我爱你", "Σ' αγαπώ", "Mahal kita", "Seni seviyorum", "Volim te"
];

let heartItems = [];
let startTime = null;
let animationStartTime = 0;

// Stato introduzione
let introDone = false;
const introLines = [
    { text: "Se anche", duration: 2.5 },
    { text: "Dovessi avere cento dubbi su di noi", duration: 2.5 },
    { text: "Centouno volte ti farò innamorare", duration: 2.5 },
    { text: "Perchè", duration: 2.5 },
    { text: "Voglio essere nel tupo percorso", duration: 2.5 },
    { text: "E soprattutto perchè", duration: 2.5 },
    { text: "Ti amo", duration: 3.0 }
];

// Stato Animazione Target
let activeTarget = {
    item: null,
    startTime: 0,
    duration: 3.0
};

function setHeartPath(s, cx, cy) {
    ctx.beginPath();
    for (let t = 0; t <= Math.PI * 2; t += 0.01) {
        let x = 16 * Math.pow(Math.sin(t), 3) * s / 15 + cx;
        let y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s / 15 + cy;
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
}

function updateTarget(elapsed) {
    let possibleLangs = targetLangs.filter(l => l !== (activeTarget.item ? activeTarget.item.text : ""));
    let newLang = possibleLangs[Math.floor(Math.random() * possibleLangs.length)];

    // Cerca un item esistente che corrisponda alla lingua
    let candidates = heartItems.filter(item => item.text === newLang);
    if (candidates.length > 0) {
        activeTarget.item = candidates[Math.floor(Math.random() * candidates.length)];
    } else {
        // Fallback: se non trova la lingua, usa un item a caso
        activeTarget.item = heartItems[Math.floor(Math.random() * heartItems.length)];
    }

    activeTarget.startTime = elapsed;
}

function initializeScene() {
    heartItems = [];
    heartScale = Math.min(width, height) * 0.4;
    centerX = width / 2;
    centerY = height / 2 + (heartScale * 0.1);

    setHeartPath(heartScale, centerX, centerY);

    const fontSize = 16;
    const rowHeight = fontSize * 1.5;

    let y = centerY - heartScale;
    while (y < centerY + heartScale) {
        let x = centerX - heartScale * 1.2;
        while (x < centerX + heartScale) {
            if (ctx.isPointInPath(x, y)) {
                const phrase = languages[Math.floor(Math.random() * languages.length)];
                const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                heartItems.push({
                    text: phrase,
                    x: x,
                    y: y,
                    phaseOffset: Math.random() * 10.0,
                    delay: dist / 400
                });
            }
            x += ctx.measureText(languages[0]).width + 10;
        }
        y += rowHeight;
    }
    // Inizializza con un target casuale
    activeTarget.startTime = animationStartTime;
    updateTarget(animationStartTime);
}

function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = (timestamp - startTime) / 1000;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    if (!introDone) {
        let currentTime = 0;
        let currentLine = null;
        let linePhase = 0;

        for (let i = 0; i < introLines.length; i++) {
            if (elapsed < currentTime + introLines[i].duration) {
                currentLine = introLines[i];
                linePhase = (elapsed - currentTime) / introLines[i].duration;
                break;
            }
            currentTime += introLines[i].duration;
        }

        if (!currentLine) {
            introDone = true;
            animationStartTime = elapsed;
            initializeScene();
        } else {
            let opacity = Math.sin(linePhase * Math.PI);
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(currentLine.text, width / 2, height / 2);
        }
        requestAnimationFrame(animate);
        return;
    }

    ctx.save();
    setHeartPath(heartScale, centerX, centerY);
    ctx.clip();

    // Animazione Target
    const timeInTarget = elapsed - activeTarget.startTime;
    if (timeInTarget >= activeTarget.duration) {
        updateTarget(elapsed);
    }

    // Disegna scritte
    heartItems.forEach((item) => {
        const apparitionSpeed = 0.3;
        const apparitionOpacity = Math.min(1, (elapsed - animationStartTime) * apparitionSpeed);
        const phase = (elapsed + item.phaseOffset) % 10.0;

        let finalOpacity;

        if (item === activeTarget.item) {
            // Ciclo colore: Rosso -> Bianco -> Nero
            let lerp = timeInTarget / activeTarget.duration;
            if (lerp < 0.5) { // Da Rosso a Bianco
                let f = lerp * 2;
                ctx.fillStyle = `rgb(${220 + 35 * f}, ${20 + 235 * f}, ${60 + 195 * f})`;
            } else { // Da Bianco a Nero
                let f = (lerp - 0.5) * 2;
                ctx.fillStyle = `rgb(${255 * (1-f)}, ${255 * (1-f)}, ${255 * (1-f)})`;
            }
            finalOpacity = 1;
        } else {
            // Pulsazione rossa normale
            let pulseOpacity = 0.3 + Math.abs(Math.sin(phase * Math.PI / 5.0)) * 0.7;
            finalOpacity = pulseOpacity * apparitionOpacity;
            ctx.fillStyle = `rgba(220, 20, 60, ${finalOpacity})`;
        }

        ctx.font = '16px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.text, item.x, item.y);
    });

    ctx.restore();
    requestAnimationFrame(animate);
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();
requestAnimationFrame(animate);
