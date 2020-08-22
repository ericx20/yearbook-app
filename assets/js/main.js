/* TO-DO LIST
 - get clearing and unclearing canvas working
 - add coords to path object for converting to JSON without loss of path data
 - start working on node backend

   THOUGHTS
 - should addLine and removeLine be combined into one function? (something like runCommand() 
   shares a lot of code and whether it's add/remove can be made into argumnet
   and it gets rid of "if add then add else if remove then remove" logic

*/

// also turns out can't convert path2d to json, therefore...
// will record x & y while drawing into array, add that as custom property to path2d
// when sending off to server, just send the x & y arrays of all strokes + color, weight, etc
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const clearButton = document.querySelector('.clear');
// const undoButton = document.querySelector('.undo');
const downloadButton = document.querySelector('.download');
const penButton = document.querySelector('.pen');
const eraseButton = document.querySelector('.erase');
const stroke_weight = document.querySelector('.stroke-weight');
const color_picker = document.querySelector('.color-picker');

const WIDTH = 624;
const HEIGHT = 800;
const YELLOW = "#FFCE00";
const WHITE = "#FFFFFF";
const BLACK = "000000";

// program states
var isDrawing = false;
var activeTool = "pen";  // either "pen" or "erase"
var currentWeight = 3;
var currentColor = "#171717";
var currentLine = new Path2D();

// history
var lineList = [];  // all lines currently drawn to the canvas
var undoStack = [];  // history of all actions
var redoStack = [];  // history of undone actions that may be redone

// event listeners
canvas.addEventListener('mousedown', start);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stop);
addEventListener('keydown', testing)

// setup canvas
canvas.width = WIDTH;
canvas.height = HEIGHT;
ctx.lineCap = "round";

// testing purposes
function testing(e) {
    if (e.code === 'KeyF') {
        // dump undoStack
        console.log(undoStack);
    } else if (e.code === 'KeyG') {
        // dump redoStack
        console.log(redoStack);
    }
}

// -------- TOOLS -------- //

// sets pen as active tool
function activatePen() {
    console.log("PEN ACTIVATED");
    activeTool = "pen";
    penButton.style.background = YELLOW;
    eraseButton.style.background = WHITE;
}

// sets eraser as active tool
function activateEraser() {
    console.log("ERASER ACTIVATED");
    activeTool = "eraser";
    penButton.style.background = WHITE;
    eraseButton.style.background = YELLOW;
}

// -------- DRAWING -------- //

// starts drawing
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
            if (ctx.isPointInStroke(stroke, x, y)) {
                console.log("hit");
                removeLine(stroke, i);
                return;
            }
        }
    }

}

// stops drawing & saves current line
function stop() {
    console.log("stop");
    isDrawing = false;

    if (activeTool === "pen") {
        ctx.beginPath();
        currentLine.color = currentColor;
        currentLine.weight = currentWeight;
        // add currentLine to the top of the lineList
        addLine(currentLine, lineList.length);
    }
}

// -------- CANVAS -------- //

// overwrites entire canvas with white
function drawWhiteRect() {
    ctx.fillStyle = WHITE;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

// redraws canvas from list of lines
function redrawCanvas() {
    drawWhiteRect();
    lineList.forEach(line => {
        ctx.lineWidth = line.weight;
        ctx.strokeStyle = line.color;
        ctx.stroke(line);
    })
}

// clears everything from canvas
function clearCanvas() {
    console.log("CLEAR DISABLED TEMPORARILY");

    // whiteRectangle = new Path2D();
    // whiteRectangle.rect(0, 0, WIDTH, HEIGHT);
    // whiteRectangle.color = WHITE;
    // // lineList.push(whiteRectangle);

    // drawWhiteRect();
}

// -------- COMMANDS, UNDO, REDO -------- //
// command consists of the following:
// { command: string, line: Path2D, index: int}

// addLine adds a new line at specified index of lineList
function addLine(line, index, byUser = true) {
    lineList.push(line);

    ctx.lineWidth = line.weight;
    ctx.strokeStyle = line.color;
    ctx.stroke(line);

    if (byUser) {
        console.log("added line by user");
        undoStack.push({ command: "add", line, index });
        redoStack = [];
    }
}

// removeLine removes existing line at specified index of lineList
function removeLine(line, index, byUser = true) {
    lineList.splice(index);
    
    redrawCanvas();
    
    if (byUser) {
        console.log("removed line by user")
        undoStack.push({ command: "remove", line, index });
        redoStack = [];
    }
}


// WORK IN PROGRESS... get this done later
// function addLines(lines) {

// }

function undo() {
    console.log("undo");
    undoCommand = undoStack.pop();
    redoStack.push(undoCommand);

    // execute the inverse of the command, NOT as user
    // as to not add this execution to any undo/redo stacks
    const {command, line, index} = undoCommand;
    if (command === "add") {
        removeLine(line, index, false);
    } else if (command === "remove") {
        addLine(line, index, false);
    }
}

function redo() {
    if (redoStack.length === 0) {
        console.log("CANNOT REDO");
        return;
    }

    console.log("redo");
    redoCommand = redoStack.pop();
    undoStack.push(redoCommand);

    // execute the command NOT as user
    const {command, line, index} = redoCommand;
    if (command === "add") {
        addLine(line, index, false);
    } else if (command === "remove") {
        removeLine(line, index, false);
    }
    
}

function downloadImage() {
    console.log("download");
    let dataURL = canvas.toDataURL('image/png');
    downloadButton.href = dataURL;
}


drawWhiteRect();
activatePen();