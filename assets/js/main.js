const clearButton = document.querySelector('.clear');
const undoButton = document.querySelector('.undo');
const downloadButton = document.querySelector('.download')
const eraseButton = document.querySelector('.erase')
const stroke_weight = document.querySelector('.stroke-weight');
const color_picker = document.querySelector('.color-picker');

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const WIDTH = 624;
const HEIGHT = 800;

// global variables
var isDrawing = false;
var currentWeight = 3;
var currentColor = "#000000";
var currentLine = new Path2D();
const lineList = [];

// event listeners
canvas.addEventListener('mousedown', start);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stop);
addEventListener('keydown', testing)

// window.addEventListener('resize', resizeCanvas);
clearButton.addEventListener('click', clearCanvas);
undoButton.addEventListener('click', undo);
downloadButton.addEventListener('click', downloadImage);

// display the currentLine when you press F
function testing (e) {
    if (e.code === 'KeyF') {
        // log number of lines
        console.log(lineList.length);
    } else if (e.code === 'KeyG') {
        // trying to convert lines to json
        console.log('testing G');
        console.log(JSON.stringify(lineList[lineList.length-1]));
    }
}

function start(e) {
    isDrawing = true;
    currentLine = new Path2D();
    console.log("start");
    draw(e);
}

function draw({ clientX, clientY}) {
    if (!isDrawing) return;

    x = clientX - (window.innerWidth - WIDTH) / 2;
    y = clientY - (window.innerHeight - HEIGHT) / 2;

    currentWeight = stroke_weight.value;
    currentColor = color_picker.value;

    ctx.lineWidth = currentWeight;
    ctx.strokeStyle = currentColor;
    // ctx.lineCap = "round";
    
    document.getElementById("colors").style.background = currentColor;

    currentLine.lineTo(x, y);

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function stop() {
    isDrawing = false;
    ctx.beginPath();

    currentLine.color = currentColor;
    currentLine.weight = currentWeight;
    lineList.push(currentLine);
}

function clearCanvas() {
    console.log("clear");

    whiteRectangle = new Path2D();
    whiteRectangle.rect(0, 0, WIDTH, HEIGHT);
    whiteRectangle.color = "#FFFFFF";
    lineList.push(whiteRectangle);

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

function undo() {
    lineList.pop();
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    lineList.forEach(line => {
        ctx.lineWidth = line.weight;
        ctx.strokeStyle = line.color;
        ctx.stroke(line);
    })
}

function downloadImage() {
    let dataURL = canvas.toDataURL('image/png');
    downloadButton.href = dataURL;
    console.log(dataURL);
}
canvas.width = WIDTH;
canvas.height = HEIGHT;

ctx.fillStyle = "#FFFFFF";
ctx.fillRect(0, 0, WIDTH, HEIGHT);

ctx.lineCap = "round";