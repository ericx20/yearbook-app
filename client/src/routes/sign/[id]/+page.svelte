<script lang="ts">
	import { onMount } from 'svelte';
	import type { Line, Canvas } from '../../../types.js';
    import { PUBLIC_SERVER_URL } from '$env/static/public';

	export let data;

	const WIDTH = 624;
	const HEIGHT = 800;
	type Tool = 'pen' | 'eraser';
	type SingleCommand = 'add' | 'remove';
	type MultipleCommand = 'addMany' | 'removeMany';
	type Command = SingleCommand | MultipleCommand;

	let canvasElement: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null;

	// drawing state
	let isDrawing = false;
	let activeTool: Tool = 'pen';
	// TODO: pen and eraser button colours are reactive dependency of activeTool
	let currentColor = '#171717';
	let currentWeight = 3;
	let currentLinePoints: { x: number; y: number }[] = [];
	let canvas: Canvas = data.page.canvas;

	// history
	type SingleHistoryItem = { command: SingleCommand; line: Line; index: number };
	type MultipleHistoryItem = { command: MultipleCommand; lines: Line[]; index: number };
	type HistoryItem = SingleHistoryItem | MultipleHistoryItem;

	let undoStack: HistoryItem[] = [];
	let redoStack: HistoryItem[] = [];

	// tools
	function activatePen() {
		activeTool = 'pen';
	}

	function activateEraser() {
		activeTool = 'eraser';
	}

	// TODO hotkeys

	// draw
	function start(e: MouseEvent) {
		isDrawing = true;
		if (activeTool === 'pen') {
			currentLinePoints = [];
		}

		draw(e);
	}

	function draw(e: MouseEvent) {
		if (!isDrawing || !ctx) return;

		const x = e.clientX - (window.innerWidth - WIDTH) / 2;
		const y = e.clientY - (window.innerHeight - HEIGHT) / 2;

		if (activeTool === 'pen') {
			ctx.lineWidth = currentWeight;
			ctx.strokeStyle = currentColor;

			ctx.lineTo(x, y);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(x, y);
			currentLinePoints.push({ x, y });
		} else {
			// eraser is active
			for (let i = canvas.length - 1; i >= 0; i--) {
				const stroke = lineToPath(canvas[i]);
				if (ctx?.isPointInStroke(stroke, x, y)) {
					removeLine(canvas[i], i);
					return;
				}
			}
		}
	}

	function stop() {
		if (!ctx) return;
		isDrawing = false;

		if (activeTool === 'pen') {
			ctx.beginPath();
			// add the current line to the top of the canvas
			addLine(
				{
					points: currentLinePoints,
					color: currentColor,
					weight: currentWeight
				},
				canvas.length
			);
		}
	}

	function fillWithWhite() {
		if (ctx) ctx.fillStyle = '#FFFFFF';
		ctx?.fillRect(0, 0, WIDTH, HEIGHT);
	}

	function lineToPath(line: Line): Path2D {
		const path = new Path2D();
		line.points.forEach((point) => {
			path.lineTo(point.x, point.y);
		});

		return path;
	}

	function drawLine(line: Line) {
		if (!ctx) return;

		const path = lineToPath(line);
		ctx.lineWidth = line.weight;
		ctx.strokeStyle = line.color;
		ctx.stroke(path);
	}

	// function drawTestCanvas() {
	//     testCanvas.forEach(drawLine)
	// }

	function redrawCanvas() {
		fillWithWhite();
		canvas.forEach(drawLine);
	}

	function clearCanvas() {
		// removemanylines
		fillWithWhite();
	}

	// commands
	function addLine(line: Line, index: number, addToHistory = true) {
		canvas.splice(index, 0, line);

		drawLine(line);

		if (addToHistory) {
			// TODO: make this a function
			undoStack.push({ command: 'add', line, index });
			redoStack = [];
		}
	}

	function removeLine(line: Line, index: number, addToHistory = true) {
		canvas.splice(index, 1);

		redrawCanvas();

		if (addToHistory) {
			// TODO: make this a function
			undoStack.push({ command: 'remove', line, index });
			redoStack = [];
		}
	}

	// adds many lines starting at specified index
	// NEVER called by user, only exists as inverse to removeManyLines
	function addManyLines(lines: Line[], index: number) {
		canvas.splice(index, lines.length, ...lines);
		lines.forEach(drawLine);
	}

	// removes many lines starting at specified index
	function removeManyLines(lines: Line[], index: number, addToHistory = true) {
		canvas.splice(index, lines.length);
		redrawCanvas();

		if (addToHistory) {
			undoStack.push({ command: 'removeMany', lines, index });
			redoStack = [];
		}
	}

	// history utilities
	function undo() {
		const undoCommand = undoStack.pop();
    if (!undoCommand) {
      // empty undo stack, can't undo
      return;
    }
		redoStack.push(undoCommand);

		// execute the inverse of the command without adding to history
		const { command, index } = undoCommand;

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
		const redoCommand = redoStack.pop();
    if (!redoCommand) {
      // empty redo stack, can't undo
      return;
    }
		undoStack.push(redoCommand);

		// execute the command NOT as user
		const { command, index } = redoCommand;

		switch (command) {
			case 'add':
				addLine(redoCommand.line, index, false);
				break;
			case 'remove':
				removeLine(redoCommand.line, index, false);
				break;
			case 'addMany':
				addManyLines(redoCommand.lines, index);
				break;
			case 'removeMany':
				removeManyLines(redoCommand.lines, index, false);
		}
	}

	async function updatePage(id: string, canvas: Canvas) {
        const response = await fetch(`${PUBLIC_SERVER_URL}page/${id}/`, {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ canvas })
        })
        return response;
    }

	async function handleSave() {
		await updatePage(data.page._id, canvas)
		// TODO: redirect
	}

	onMount(() => {
		ctx = canvasElement.getContext('2d');
		if (ctx) ctx.lineCap = 'round';
  		redrawCanvas()
	});
</script>

<div class="page">
	<canvas
		bind:this={canvasElement}
		width={WIDTH}
		height={HEIGHT}
		on:mousedown={start}
		on:mousemove={draw}
		on:mouseup={stop}
	/>
	<main>
		<section class="colors" id="colors">
			<input type="color" class="color-picker" bind:value={currentColor} />
		</section>
		<section class="thickness">
			<input type="number" class="stroke-weight" bind:value={currentWeight} />
		</section>
		<button class="button clear" title="Clear canvas (X)" on:click={clearCanvas}>X</button>
		<button class="button pen" title="Pen (B)" on:click={activatePen}>
			<!-- TODO: Fix icons -->
			<img alt="Draw" />
		</button>
		<button class="button erase" title="Erase (E)" on:click={activateEraser}>
			<img alt="Erase" />
		</button>
    <button class="button undo" title="Undo (Ctrl+Z)" on:click={undo}>
        <img alt="undo" />
    </button>
    <button class="button redo" title="Redo (Ctrl+Y)" on:click={redo}>
        <img alt="redo" />
    </button>
    <!-- <a class="button download" title="Download image" on:click={downloadImage} target="_blank" download="export.png" href="">
        <img alt="↓" />
    </a> -->
	<button class="button" on:click={handleSave}>
		<img alt="sign" />
	</button>
	</main>
</div>

<style lang="scss">
	$primary: #ffce00;
	$dark: #171717;
	$darker: black;
	$light: #f3f3f3;

	.page {
		margin: 0;
		padding: 0;
		width: 100vw;
		height: 100vh;
		background: $darker;
		font-family: 'Roboto', 'Helvetica', sans-serif;

		canvas {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			background-color: white;
		}
	}

	main {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		width: 50px;
		background: $dark;

		section {
			display: block;
			margin: 15px auto;
			width: 30px;
			height: 30px;
		}

		.colors {
			.color-picker {
				display: block;
				width: 30px;
				height: 30px;
				padding: 0;
				margin: 0;
			}
		}

		.thickness {
			position: relative;
			background-color: $light;
			&::after {
				content: '';
				position: absolute;
				left: 50%;
				top: 50%;
				transform: translate(-50%, -50%);
				width: 50%;
				height: 50%;
				border-radius: 50%;
				background: $dark;
			}

			.stroke-weight {
				display: none;
				position: absolute;
				width: auto;
				height: 25px;
				left: 30px;
				top: 50%;
				transform: translateY(-50%);

				&:focus {
					display: block;
				}
			}

			&:hover {
				.stroke-weight {
					display: block;
				}
			}
		}

		.button {
			display: block;
			width: 30px;
			height: 30px;
			margin: 0 auto 15px auto;
			color: $dark;
			font-size: 8px;
			font-weight: 900;
			background-color: $light;
			border: none;
			outline: none;
			cursor: pointer;

			img {
				max-width: 100%;
				max-height: 100%;
			}
		}
		.button.clear {
			font-size: 20px;
		}

		.button.download img {
			max-width: 18px;
			max-height: 18px;
			transform: translate(6px, 6px);
		}
	}
</style>
