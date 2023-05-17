/* TO-DO LIST
 - finish node backend
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
// later: some function that restores canvas from save or something

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
                if (e.shiftKey) {
                    redo();  // Ctrl+Shift+Z
                } else {
                    undo();  // Ctrl+Z
                }
            }
            break;
        case 'KeyT':
            if (e.shiftKey) {
                console.log('testing: export');
                exportLines();
            } else {
                console.log('testing: import');
                importLines();
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
        currentLine.points = new Array();
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

        // document.getElementById('colors').style.background = currentColor;

        currentLine.lineTo(x, y);

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);

        currentLine.points.push({x, y});

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

// RENAMED to fillWithWhite()
// overwrites entire canvas with white
function drawWhiteRect() {
    ctx.fillStyle = WHITE;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

// RENAMED to drawLine
// redraws a line with its original style
function redraw(line) {
    // console.log('REDRAW'); // DEBUGGING
    // console.log(line);

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
        // // console.log('NOTHING TO CLEAR');
        return;
    }
    // // console.log('CLEAR');

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
        // // console.log('added line by user');
        undoStack.push({ command: 'add', line, index });
        redoStack = [];
    }
}

// removes one line at specified index of lineList
function removeLine(line, index, byUser = true) {
    lineList.splice(index, 1);

    redrawCanvas()
    
    if (byUser) {
        // // console.log('removed line by user');
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
        // console.log('CANNOT UNDO');
        return;
    }

    // console.log('undo');
    undoCommand = undoStack.pop();
    redoStack.push(undoCommand);

    // execute the inverse of the command, NOT as user
    // as to not add this execution to any undo/redo stacks
    const {command, index} = undoCommand;

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
        // console.log('CANNOT REDO');
        return;
    }

    // console.log('redo');
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


// -------- SERVER STUFF -------- //
function exportLines() {
    var lineListStr = JSON.stringify(lineList);
    console.log(lineListStr);
}

// LINELIST IS STILL HARDCODED!!
function importLines() {
    var lineListStr = `[{"points":[{"x":76,"y":73},{"x":76,"y":74},{"x":76,"y":75},{"x":76,"y":76},{"x":76,"y":77},{"x":76,"y":78},{"x":76,"y":79},{"x":76,"y":80},{"x":76,"y":81},{"x":76,"y":82},{"x":76,"y":83},{"x":76,"y":84},{"x":76,"y":85},{"x":76,"y":86},{"x":76,"y":87},{"x":76,"y":88},{"x":76,"y":89},{"x":76,"y":90},{"x":76,"y":91},{"x":76,"y":92},{"x":76,"y":93},{"x":76,"y":94},{"x":76,"y":95},{"x":76,"y":96},{"x":76,"y":97},{"x":76,"y":98},{"x":76,"y":99},{"x":76,"y":100},{"x":76,"y":101},{"x":76,"y":102},{"x":76,"y":103},{"x":76,"y":104},{"x":76,"y":105},{"x":76,"y":106},{"x":76,"y":107},{"x":76,"y":108},{"x":76,"y":109},{"x":76,"y":110},{"x":76,"y":111},{"x":76,"y":112},{"x":76,"y":113},{"x":76,"y":114},{"x":76,"y":115},{"x":76,"y":116},{"x":76,"y":117},{"x":76,"y":118},{"x":76,"y":119},{"x":76,"y":120},{"x":76,"y":121},{"x":76,"y":122},{"x":76,"y":123},{"x":76,"y":124},{"x":76,"y":125},{"x":76,"y":126},{"x":76,"y":127},{"x":76,"y":128},{"x":76,"y":129},{"x":76,"y":130},{"x":76,"y":131},{"x":76,"y":132},{"x":76,"y":133},{"x":76,"y":134},{"x":76,"y":135},{"x":76,"y":136},{"x":76,"y":137},{"x":76,"y":138},{"x":76,"y":139},{"x":76,"y":140},{"x":76,"y":141},{"x":76,"y":142},{"x":76,"y":143},{"x":75,"y":143},{"x":75,"y":144},{"x":75,"y":145},{"x":75,"y":146},{"x":75,"y":147},{"x":75,"y":148},{"x":74,"y":148},{"x":74,"y":149},{"x":74,"y":150},{"x":74,"y":151},{"x":74,"y":152},{"x":74,"y":153},{"x":74,"y":154},{"x":74,"y":155},{"x":74,"y":156},{"x":74,"y":157},{"x":74,"y":158}],"color":"#FF0000","weight":"3"},{"points":[{"x":116,"y":87},{"x":116,"y":86},{"x":117,"y":85},{"x":118,"y":85},{"x":118,"y":84},{"x":119,"y":84},{"x":120,"y":84},{"x":120,"y":83},{"x":121,"y":83},{"x":122,"y":83},{"x":122,"y":82},{"x":123,"y":82},{"x":124,"y":82},{"x":125,"y":82},{"x":125,"y":81},{"x":126,"y":81},{"x":127,"y":81},{"x":128,"y":80},{"x":129,"y":80},{"x":130,"y":80},{"x":131,"y":80},{"x":131,"y":79},{"x":132,"y":79},{"x":133,"y":79},{"x":134,"y":79},{"x":135,"y":79},{"x":136,"y":79},{"x":137,"y":79},{"x":138,"y":79},{"x":139,"y":79},{"x":140,"y":79},{"x":141,"y":79},{"x":142,"y":79},{"x":143,"y":79},{"x":144,"y":79},{"x":145,"y":79},{"x":146,"y":79},{"x":147,"y":79},{"x":148,"y":79},{"x":149,"y":80},{"x":150,"y":80},{"x":150,"y":81},{"x":151,"y":81},{"x":152,"y":81},{"x":152,"y":82},{"x":153,"y":82},{"x":153,"y":83},{"x":154,"y":84},{"x":155,"y":85},{"x":155,"y":86},{"x":156,"y":86},{"x":156,"y":87},{"x":157,"y":87},{"x":157,"y":88},{"x":157,"y":89},{"x":158,"y":89},{"x":158,"y":90},{"x":158,"y":91},{"x":158,"y":92},{"x":159,"y":92},{"x":159,"y":93},{"x":159,"y":94},{"x":159,"y":95},{"x":159,"y":96},{"x":159,"y":97},{"x":159,"y":98},{"x":159,"y":99},{"x":159,"y":100},{"x":159,"y":101},{"x":159,"y":102},{"x":159,"y":103},{"x":159,"y":104},{"x":159,"y":105},{"x":159,"y":106},{"x":159,"y":107},{"x":159,"y":108},{"x":159,"y":109},{"x":158,"y":109},{"x":158,"y":110},{"x":158,"y":111},{"x":157,"y":112},{"x":157,"y":113},{"x":156,"y":114},{"x":156,"y":115},{"x":155,"y":115},{"x":155,"y":116},{"x":155,"y":117},{"x":154,"y":117},{"x":154,"y":118},{"x":153,"y":119},{"x":152,"y":120},{"x":151,"y":121},{"x":151,"y":122},{"x":150,"y":122},{"x":150,"y":123},{"x":149,"y":124},{"x":148,"y":124},{"x":148,"y":125},{"x":147,"y":126},{"x":146,"y":126},{"x":146,"y":127},{"x":145,"y":128},{"x":144,"y":128},{"x":144,"y":129},{"x":143,"y":130},{"x":142,"y":131},{"x":141,"y":132},{"x":140,"y":133},{"x":139,"y":134},{"x":138,"y":135},{"x":137,"y":136},{"x":136,"y":137},{"x":135,"y":137},{"x":135,"y":138},{"x":134,"y":138},{"x":133,"y":139},{"x":133,"y":140},{"x":132,"y":141},{"x":131,"y":141},{"x":130,"y":142},{"x":129,"y":143},{"x":128,"y":143},{"x":128,"y":144},{"x":127,"y":145},{"x":126,"y":145},{"x":125,"y":146},{"x":124,"y":147},{"x":123,"y":147},{"x":123,"y":148},{"x":122,"y":148},{"x":121,"y":149},{"x":120,"y":149},{"x":120,"y":150},{"x":119,"y":150},{"x":119,"y":151},{"x":118,"y":151},{"x":118,"y":152},{"x":117,"y":152},{"x":117,"y":153},{"x":116,"y":153},{"x":116,"y":154},{"x":115,"y":154},{"x":116,"y":154},{"x":117,"y":154},{"x":118,"y":154},{"x":119,"y":154},{"x":120,"y":154},{"x":121,"y":154},{"x":122,"y":154},{"x":123,"y":154},{"x":124,"y":154},{"x":125,"y":154},{"x":126,"y":154},{"x":127,"y":154},{"x":128,"y":154},{"x":129,"y":154},{"x":130,"y":154},{"x":131,"y":154},{"x":132,"y":154},{"x":133,"y":154},{"x":134,"y":154},{"x":135,"y":154},{"x":136,"y":154},{"x":137,"y":154},{"x":138,"y":154},{"x":139,"y":154},{"x":140,"y":154},{"x":141,"y":154},{"x":142,"y":154},{"x":143,"y":154},{"x":144,"y":154},{"x":145,"y":154},{"x":146,"y":154},{"x":147,"y":154},{"x":148,"y":154},{"x":149,"y":154},{"x":150,"y":154},{"x":151,"y":154},{"x":152,"y":154},{"x":153,"y":154},{"x":154,"y":154},{"x":155,"y":154},{"x":156,"y":154},{"x":157,"y":154},{"x":158,"y":154},{"x":159,"y":154},{"x":159,"y":155},{"x":160,"y":155},{"x":161,"y":155},{"x":162,"y":155}],"color":"#00FF00","weight":"6"},{"points":[{"x":210,"y":78},{"x":210,"y":77},{"x":211,"y":77},{"x":212,"y":77},{"x":212,"y":76},{"x":213,"y":76},{"x":214,"y":76},{"x":214,"y":75},{"x":215,"y":75},{"x":216,"y":75},{"x":217,"y":75},{"x":218,"y":75},{"x":218,"y":74},{"x":219,"y":74},{"x":220,"y":74},{"x":221,"y":74},{"x":222,"y":74},{"x":223,"y":74},{"x":224,"y":74},{"x":225,"y":74},{"x":226,"y":74},{"x":227,"y":74},{"x":228,"y":74},{"x":229,"y":74},{"x":230,"y":74},{"x":230,"y":75},{"x":231,"y":75},{"x":232,"y":75},{"x":232,"y":76},{"x":233,"y":76},{"x":234,"y":77},{"x":235,"y":77},{"x":235,"y":78},{"x":236,"y":78},{"x":236,"y":79},{"x":237,"y":79},{"x":238,"y":79},{"x":238,"y":80},{"x":239,"y":81},{"x":239,"y":82},{"x":240,"y":82},{"x":240,"y":83},{"x":240,"y":84},{"x":241,"y":84},{"x":241,"y":85},{"x":241,"y":86},{"x":242,"y":86},{"x":242,"y":87},{"x":242,"y":88},{"x":242,"y":89},{"x":243,"y":89},{"x":243,"y":90},{"x":243,"y":91},{"x":243,"y":92},{"x":243,"y":93},{"x":243,"y":94},{"x":243,"y":95},{"x":243,"y":96},{"x":243,"y":97},{"x":242,"y":97},{"x":242,"y":98},{"x":242,"y":99},{"x":241,"y":99},{"x":241,"y":100},{"x":240,"y":101},{"x":239,"y":102},{"x":238,"y":102},{"x":238,"y":103},{"x":237,"y":103},{"x":237,"y":104},{"x":236,"y":104},{"x":235,"y":104},{"x":235,"y":105},{"x":234,"y":105},{"x":234,"y":106},{"x":233,"y":106},{"x":232,"y":106},{"x":232,"y":107},{"x":231,"y":107},{"x":230,"y":108},{"x":229,"y":108},{"x":229,"y":109},{"x":228,"y":109},{"x":227,"y":109},{"x":227,"y":110},{"x":226,"y":110},{"x":225,"y":110},{"x":224,"y":110},{"x":224,"y":111},{"x":223,"y":111},{"x":222,"y":111},{"x":221,"y":111},{"x":221,"y":112},{"x":220,"y":112},{"x":219,"y":112},{"x":218,"y":112},{"x":218,"y":113},{"x":217,"y":113},{"x":216,"y":113},{"x":215,"y":114},{"x":214,"y":114},{"x":213,"y":114},{"x":213,"y":115},{"x":212,"y":115},{"x":211,"y":115},{"x":211,"y":116},{"x":210,"y":116},{"x":209,"y":116},{"x":208,"y":116},{"x":209,"y":116},{"x":210,"y":116},{"x":211,"y":117},{"x":212,"y":117},{"x":213,"y":117},{"x":214,"y":117},{"x":215,"y":117},{"x":216,"y":117},{"x":217,"y":117},{"x":218,"y":117},{"x":219,"y":117},{"x":220,"y":117},{"x":220,"y":118},{"x":221,"y":118},{"x":222,"y":118},{"x":223,"y":118},{"x":224,"y":118},{"x":224,"y":119},{"x":225,"y":119},{"x":226,"y":119},{"x":227,"y":119},{"x":228,"y":119},{"x":228,"y":120},{"x":229,"y":120},{"x":230,"y":120},{"x":231,"y":120},{"x":231,"y":121},{"x":232,"y":121},{"x":233,"y":121},{"x":233,"y":122},{"x":234,"y":122},{"x":235,"y":122},{"x":235,"y":123},{"x":236,"y":123},{"x":236,"y":124},{"x":237,"y":124},{"x":238,"y":124},{"x":238,"y":125},{"x":239,"y":125},{"x":239,"y":126},{"x":240,"y":126},{"x":240,"y":127},{"x":241,"y":127},{"x":242,"y":127},{"x":242,"y":128},{"x":243,"y":128},{"x":243,"y":129},{"x":244,"y":129},{"x":244,"y":130},{"x":245,"y":130},{"x":245,"y":131},{"x":245,"y":132},{"x":246,"y":132},{"x":246,"y":133},{"x":246,"y":134},{"x":247,"y":134},{"x":247,"y":135},{"x":247,"y":136},{"x":247,"y":137},{"x":247,"y":138},{"x":247,"y":139},{"x":247,"y":140},{"x":247,"y":141},{"x":247,"y":142},{"x":247,"y":143},{"x":246,"y":144},{"x":246,"y":145},{"x":245,"y":145},{"x":244,"y":146},{"x":243,"y":146},{"x":243,"y":147},{"x":242,"y":147},{"x":242,"y":148},{"x":241,"y":148},{"x":241,"y":149},{"x":240,"y":149},{"x":240,"y":150},{"x":239,"y":150},{"x":239,"y":151},{"x":238,"y":151},{"x":238,"y":152},{"x":237,"y":152},{"x":237,"y":153},{"x":236,"y":153},{"x":235,"y":153},{"x":234,"y":153},{"x":234,"y":154},{"x":233,"y":154},{"x":232,"y":154},{"x":231,"y":154},{"x":230,"y":154},{"x":229,"y":155},{"x":228,"y":155},{"x":227,"y":155},{"x":226,"y":155},{"x":226,"y":156},{"x":225,"y":156},{"x":224,"y":156},{"x":223,"y":156},{"x":223,"y":157},{"x":222,"y":157},{"x":221,"y":157},{"x":220,"y":157},{"x":219,"y":157},{"x":218,"y":157},{"x":217,"y":157},{"x":216,"y":157},{"x":215,"y":157},{"x":214,"y":157},{"x":213,"y":157},{"x":212,"y":157},{"x":211,"y":157},{"x":210,"y":157},{"x":209,"y":157},{"x":208,"y":157},{"x":207,"y":157},{"x":206,"y":158},{"x":205,"y":158}],"color":"#0000FF","weight":"9"}]`;
    lineListJSON = JSON.parse(lineListStr);

    lineList = new Array();
    // path2D data has been lost, so we must make lineList a list of new path2D objects
    lineListJSON.forEach(lineJSON => {
        var curr = new Path2D();
        curr.color = lineJSON.color;
        curr.weight = lineJSON.weight;
        curr.points = new Array();

        lineJSON.points.forEach(point => {
            curr.lineTo(point.x, point.y);
            curr.points.push({x: point.x, y: point.y});
        });
        
        lineList.push(curr);
    });
    console.log(lineList);
    redrawCanvas();
}