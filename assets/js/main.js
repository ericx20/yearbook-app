/* TO-DO LIST
 - add coords to path object for converting to JSON without loss of path data
 - start working on node backend
*/

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const downloadButton = document.querySelector('.download');
const penButton = document.querySelector('.pen');
const eraseButton = document.querySelector('.erase');
const stroke_weight = document.querySelector('.stroke-weight');
const color_picker = document.querySelector('.color-picker');

const WIDTH = 624;
const HEIGHT = 800;
const YELLOW = '#FFCE00';
const WHITE = '#FFFFFF';
const BLACK = '000000';

// program states
var isDrawing = false;
var activeTool = 'pen';  // either 'pen' or 'erase'
var currentWeight = 3;
var currentColor = '#171717';
var currentLine = new Path2D();

// history
var lineList = [];   // all lines currently drawn to the canvas
var undoStack = [];  // history of all actions
var redoStack = [];  // history of undone actions that may be redone

// event listeners
canvas.addEventListener('mousedown', start);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stop);
addEventListener('keydown', hotKeys)

// setup canvas
canvas.width = WIDTH;
canvas.height = HEIGHT;
ctx.lineCap = 'round';
drawWhiteRect();
activatePen();

// -------- TOOLS -------- //

// sets pen as active tool
function activatePen() {
    activeTool = 'pen';
    penButton.style.background = YELLOW;
    eraseButton.style.background = WHITE;
}

// sets eraser as active tool
function activateEraser() {
    activeTool = 'eraser';
    penButton.style.background = WHITE;
    eraseButton.style.background = YELLOW;
}

function hotKeys(e) {
    switch (e.code) {
        case 'KeyB':
            activatePen();
            break;
        case 'KeyE':
            activateEraser();
            break;
        case 'KeyX':
            clearCanvas();
            break;
        case 'KeyZ':
            if (e.ctrlKey) {
                undo();  // Ctrl+Z
            }
            break;
        case 'KeyY':
            if (e.ctrlKey) {
                redo();  // Ctrl+Y
            }
    }
}


// -------- DRAWING -------- //

// starts drawing
function start(e) {
    isDrawing = true;
    if (activeTool === 'pen') {
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

    if (activeTool === 'pen') {
        currentWeight = stroke_weight.value;
        currentColor = color_picker.value;

        ctx.lineWidth = currentWeight;
        ctx.strokeStyle = currentColor;

        document.getElementById('colors').style.background = currentColor;

        currentLine.lineTo(x, y);

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);

    } else {  // if pen isn't active, then eraser is active
        for (i = lineList.length - 1; i >= 0; i--) {
            var stroke = lineList[i];

            if (ctx.isPointInStroke(stroke, x, y)) {
                removeLine(stroke, i);
                return;
            }
        }
    }

}

// stops drawing & saves current line
function stop() {
    isDrawing = false;

    if (activeTool === 'pen') {
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

// redraws a line with its original style
function redraw(line) {
    console.log('REDRAW'); // DEBUGGING
    console.log(line);

    ctx.lineWidth = line.weight;
    ctx.strokeStyle = line.color;
    ctx.stroke(line);
}

// redraws canvas from list of lines
function redrawCanvas() {
    drawWhiteRect();
    if (lineList.length > 0) {
        lineList.forEach(line => redraw(line));
    }
}

// clears everything from canvas
function clearCanvas() {
    if (lineList.length === 0) {
        // console.log('NOTHING TO CLEAR');
        return;
    }
    // console.log('CLEAR');

    removeManyLines([...lineList], 0);

    drawWhiteRect();
}

// downloads canvas as image
function downloadImage() {
    let dataURL = canvas.toDataURL('image/png');
    downloadButton.href = dataURL;
}

// -------- COMMANDS, UNDO, REDO -------- //

// adds one line at specified index of lineList
function addLine(line, index, byUser = true) {
    lineList.splice(index, 0, line);

    // make it appear on canvas
    redraw(line);

    if (byUser) {
        // console.log('added line by user');
        undoStack.push({ command: 'add', line, index });
        redoStack = [];
    }
}

// removes one line at specified index of lineList
function removeLine(line, index, byUser = true) {
    lineList.splice(index, 1);

    redrawCanvas()
    
    if (byUser) {
        // console.log('removed line by user');
        undoStack.push({ command: 'remove', line, index });
        redoStack = [];
    }
}


// adds many lines starting at specified index
// NEVER called by user, only exists as inverse to removeManyLines
function addManyLines(lines, index) {
    lineList.splice(index, lines.length, ...lines);
    lines.forEach(line => redraw(line));
}

// removes many lines starting at specified index
function removeManyLines(lines, index, byUser = true) {
    lineList.splice(index, lines.length);
    redrawCanvas();

    if (byUser) {
        undoStack.push({ command: 'removeMany', lines, index });
        redoStack = [];
    }

}

function undo() {
    if (undoStack.length === 0) {
        console.log('CANNOT UNDO');
        return;
    }

    console.log('undo');
    undoCommand = undoStack.pop();
    redoStack.push(undoCommand);

    // execute the inverse of the command, NOT as user
    // as to not add this execution to any undo/redo stacks
    const {command, index} = undoCommand;

    // make this a switch later on (same for redo()), when adding addMany/removeMany
    switch (command) {
        case 'add':
            removeLine(undoCommand.line, index, false);
            break;
        case 'remove':
            addLine(undoCommand.line, index, false);
            break;
        case 'addMany':
            removeManyLines(undoCommand.lines, index, false);
            break;
        case 'removeMany':
            addManyLines(undoCommand.lines, index);
    }
}

function redo() {
    if (redoStack.length === 0) {
        console.log('CANNOT REDO');
        return;
    }

    console.log('redo');
    redoCommand = redoStack.pop();
    undoStack.push(redoCommand);

    // execute the command NOT as user
    const {command, index} = redoCommand;

    switch (command) {
        case 'add':
            addLine(redoCommand.line, index, false);
            break;
        case 'remove':
            removeLine(redoCommand.line, index, false);
            break;
        case 'addMany':
            addManyLines(redoCommand.lines, index, false);
            break;
        case 'removeMany':
            removeManyLines(redoCommand.lines, index, false);
    }
}
