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

var isDrawing = false;
const strokeList = [];
var newLine = new Path2D();


// event listeners
canvas.addEventListener('mousedown', start);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stop);
addEventListener('keydown', testing)

// window.addEventListener('resize', resizeCanvas);
clearButton.addEventListener('click', clearCanvas);
undoButton.addEventListener('click', undo);
downloadButton.addEventListener('click', downloadImage);

// display the newLine when you press F
function testing (e) {
    if (e.code === 'KeyF') {
        console.log('prev stroke has been displayed');
        ctx.stroke(newLine);
    } else if (e.code === 'KeyG') {
        console.log('testing G');
        ctx.strokeStyle = "#FF0000";
        ctx.stroke(strokeList[strokeList.length-1]);
        console.log(JSON.stringify(strokeList[0]));
    }
}

function start(e) {
    isDrawing = true;
    newLine = new Path2D();
    console.log("start");
    draw(e);
}

function draw({ clientX, clientY}) {
    if (!isDrawing) return;

    x = clientX - (window.innerWidth - WIDTH) / 2;
    y = clientY - (window.innerHeight - HEIGHT) / 2;

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
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function undo() {
    strokeList.pop();
    clearCanvas()
    strokeList.forEach(line => {
        ctx.stroke(line);
    })
}


// function resizeCanvas () {
//     canvas.width = window.innerWidth;
//     canvas.height = window.innerHeight;
// }

function downloadImage() {
    let dataURL = canvas.toDataURL('image/png');
    downloadButton.href = dataURL;
    console.log(dataURL);
}
canvas.width = WIDTH;
canvas.height = HEIGHT;

// resizeCanvas();
ctx.fillStyle = "#FFFFFF";
ctx.fillRect(0, 0, WIDTH, HEIGHT);