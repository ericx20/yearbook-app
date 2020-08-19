// NOTE: if i'm gonna implement erasing, i have to implement undo/redo stack
// and that will change the way clearCanvas() works

// also turns out can't convert path2d to json, therefore...
// will record x & y while drawing into array, add that as custom property to path2d
// when sending off to server, just send the x & y arrays of all strokes + color, weight, etc

// fix order of these queryselectors, change to target ID instead...
const clearButton = document.querySelector('.clear');
const undoButton = document.querySelector('.undo');
const downloadButton = document.querySelector('.download');
const penButton = document.querySelector('.pen');
const eraseButton = document.querySelector('.erase');
const stroke_weight = document.querySelector('.stroke-weight');
const color_picker = document.querySelector('.color-picker');

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const WIDTH = 624;
const HEIGHT = 800;
const YELLOW = "#FFCE00";
const WHITE = "#FFFFFF";
const BLACK = "000000";


// initialize global variables
var isDrawing = false;
var activeTool = "pen";  // either "pen" or "erase"
var currentWeight = 3;
var currentColor = "#171717";
var currentLine = new Path2D();
const lineList = [];

// event listeners
canvas.addEventListener('mousedown', start);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stop);
addEventListener('keydown', testing)

penButton.addEventListener('click', makePenActive);
eraseButton.addEventListener('click', makeEraserActive);
clearButton.addEventListener('click', clearCanvas);
undoButton.addEventListener('click', undo);
downloadButton.addEventListener('click', downloadImage);

// setup canvas
canvas.width = WIDTH;
canvas.height = HEIGHT;
ctx.lineCap = "round";

// display the currentLine when you press F
function testing (e) {
    if (e.code === 'KeyF') {
        // log number of lines
        console.log(lineList.length);
    } else if (e.code === 'KeyG') {
        // trying to convert lines to json, but it always returns empty object????
        console.log('testing G');
        console.log(JSON.stringify(lineList[lineList.length-1]));
        console.log(lineList[lineList.length-1]);
    }
}

function makePenActive() {
    console.log("PEN ACTIVATED");
    activeTool = "pen";
    penButton.style.background = YELLOW;
    eraseButton.style.background = WHITE;
}

function makeEraserActive() {
    console.log("ERASER ACTIVATED");
    activeTool = "eraser";
    penButton.style.background = WHITE;
    eraseButton.style.background = YELLOW;
}

function start(e) {
    console.log("start");
    isDrawing = true;
    if (activeTool === "pen") {
        currentLine = new Path2D();
    }
    
    draw(e);
}

// draw() handles both pen and eraser tool
// writing and erasing both count as drawing
function draw({ clientX, clientY }) {
    if (!isDrawing) return;

    x = clientX - (window.innerWidth - WIDTH) / 2;
    y = clientY - (window.innerHeight - HEIGHT) / 2;

    if (activeTool === "pen") {
        currentWeight = stroke_weight.value;
        currentColor = color_picker.value;
    
        ctx.lineWidth = currentWeight;
        ctx.strokeStyle = currentColor;
    
        document.getElementById("colors").style.background = currentColor;
    
        currentLine.lineTo(x, y);
    
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);

    } else {  // eraser time
        for (i = lineList.length - 1; i >= 0; i--) {
            var stroke = lineList[i];
            if (ctx.isPointInStroke(stroke, x, y) && stroke.erasable) {
                console.log("hit");
                lineList.splice(i);
                redrawCanvas();
                return;
            }
        }
    }

}

function stop() {
    console.log("stop");
    isDrawing = false;
    
    if (activeTool === "pen") {
        ctx.beginPath();
        currentLine.color = currentColor;
        currentLine.weight = currentWeight;
        currentLine.erasable = true;
        lineList.push(currentLine);
    }

}

function drawWhiteRect() {
    ctx.fillStyle = WHITE;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function redrawCanvas() {
    drawWhiteRect();
    lineList.forEach(line => {
        ctx.lineWidth = line.weight;
        ctx.strokeStyle = line.color;
        ctx.stroke(line);
    })
}

// clearing canvas = drawing white rectangle over everything
function clearCanvas() {
    console.log("clear");

    whiteRectangle = new Path2D();
    whiteRectangle.rect(0, 0, WIDTH, HEIGHT);
    whiteRectangle.color = WHITE;
    whiteRectangle.erasable = false;
    lineList.push(whiteRectangle);

    drawWhiteRect();
}

function undo() {
    console.log("undo");
    lineList.pop();
    redrawCanvas();
}

function downloadImage() {
    console.log("download");
    let dataURL = canvas.toDataURL('image/png');
    downloadButton.href = dataURL;
}


drawWhiteRect();
makePenActive();