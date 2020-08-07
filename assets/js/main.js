const clearButton = document.querySelector('.clear');
const undoButton = document.querySelector('.undo');
const redoButton = document.querySelector('.redo');
const downloadButton = document.querySelector('.download')
// const eraseButton = document.querySelector('.erase')
const stroke_weight = document.querySelector('.stroke-weight');
const color_picker = document.querySelector('.color-picker');

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

var isDrawing = false;
const strokeList = [];
var newLine = new Path2D();

canvas.addEventListener('mousedown', start);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stop);
addEventListener('keydown', testing)

window.addEventListener('resize', resizeCanvas);
clearButton.addEventListener('click', clearCanvas);
undoButton.addEventListener('click', clearCanvas);
redoButton.addEventListener('click', clearCanvas);
downloadButton.addEventListener('click', downloadImage);

// display the newLine when you press F
function testing (e) {
    if (e.code === 'KeyF') {
        console.log('prev stroke has been displayed');
        ctx.stroke(newLine);
    } else if (e.code === 'KeyG') {
        console.log('testing G');
        console.log(strokeList.length)
        strokeList.forEach(line => {
            ctx.stroke(line);
        })
    }
}

function start (e) {
    isDrawing = true;
    newLine = new Path2D();
    console.log("start");
    draw(e);
}

function draw ({ clientX: x, clientY: y }) {
    if (!isDrawing) return;

    ctx.lineWidth = stroke_weight.value;
    ctx.lineCap = "round";
    ctx.strokeStyle = color_picker.value;
    document.getElementById("colors").style.background = color_picker.value;

    newLine.lineTo(x, y);

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function stop() {
    isDrawing = false;
    console.log("stop");
    ctx.beginPath();
    strokeList.push(newLine);
    
}

function clearCanvas() {
    console.log("clear");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}


function resizeCanvas () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function downloadImage () {
    let dataURL = canvas.toDataURL('image/png')
    console.log(dataURL)
}

resizeCanvas();