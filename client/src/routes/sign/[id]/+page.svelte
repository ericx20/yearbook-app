<script lang="ts">
	import { onMount } from 'svelte';
	import type { Line, Canvas } from '../../../types.js';
	import { PUBLIC_SERVER_URL } from '$env/static/public';
	import { AppBar, AppShell } from '@skeletonlabs/skeleton';
	import { Modal, modalStore } from '@skeletonlabs/skeleton';
	import type { ModalSettings, ModalComponent } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import penIcon from '$lib/assets/pen.png';
	import eraserIcon from '$lib/assets/eraser.png';
	import undoIcon from '$lib/assets/undo.png';
	import redoIcon from '$lib/assets/redo.png';
	import downloadIcon from '$lib/assets/download.png';
	import deleteIcon from '$lib/assets/delete.png';

	import type { PageData } from './$types';

	export let data: PageData;

	const WIDTH = 500;
	const HEIGHT = 700;
	type Tool = 'pen' | 'eraser';
	type SingleCommand = 'add' | 'remove';
	type MultipleCommand = 'addMany' | 'removeMany';
	type Command = SingleCommand | MultipleCommand;

	let canvasElement: HTMLCanvasElement;
	let downloadButton: HTMLAnchorElement;

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

		const rect = canvasElement.getBoundingClientRect();

		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

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

		const { command, index } = redoCommand;

		// execute the command without adding to history
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

	function downloadImage() {
		let dataURL = canvasElement.toDataURL('image/png');
		downloadButton.href = dataURL;
	}

	async function updatePage(id: string, canvas: Canvas) {
		const response = await fetch(`${PUBLIC_SERVER_URL}page/${id}/`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ canvas })
		});
		return response;
	}

	async function deletePage(id: string, pin: string) {
		const response = await fetch(`${PUBLIC_SERVER_URL}page/${id}?pin=${pin}`, {
			method: 'DELETE'
		});
		return response;
	}

	async function handleSave() {
		const response = await updatePage(data.page._id, canvas);
		if (!response.ok) return;
		// todo: say thanks
		goto('/');
	}

	function handleDelete() {
		const modal: ModalSettings = {
			type: 'prompt',
			title: 'Hold up!',
			body: "Are you sure you want to delete this yearbook? Enter PIN to prove it's yours",
			value: '',
			valueAttr: { type: 'text' },
			response: async (pin) => {
				const response = await deletePage(data.page._id, pin);
				console.log(response);
				if (response.status === 200) {
					goto('/');
					return;
				}
				alert('The PIN is incorrect!');
			}
		};
		modalStore.trigger(modal);
	}

	function beforeUnload(e: BeforeUnloadEvent) {
		e.returnValue = '';
		return '...';
	}

	onMount(() => {
		ctx = canvasElement.getContext('2d');
		if (ctx) ctx.lineCap = 'round';
		redrawCanvas();
	});
</script>

<svelte:window on:beforeunload|preventDefault={beforeUnload} />
<AppShell class="h-screen">
	<svelte:fragment slot="header">
		<AppBar gap="0" slotTrail="place-content-end">
			<h2 class="h2">Sign {data.page.name ? `${data.page.name}'s ` : ''}Yearbook Page</h2>
			<svelte:fragment slot="trail">
				<button class="btn variant-filled" on:click={handleSave}>Sign!</button>
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<svelte:fragment slot="sidebarLeft">
		<div class="sidebar p-3 bg-blue-200">
			<section class="colors mb-[15px]" id="colors">
				<input type="color" class="color-picker" bind:value={currentColor} />
			</section>
			<section class="thickness mb-[15px]">
				<input type="number" class="stroke-weight" bind:value={currentWeight} />
			</section>
			<button
				class="button pen"
				class:selected={activeTool === 'pen'}
				title="Pen (B)"
				on:click={activatePen}
			>
				<!-- TODO: Fix icons -->
				<img src={penIcon} alt="Draw" />
			</button>
			<button
				class="button erase"
				class:selected={activeTool === 'eraser'}
				title="Erase (E)"
				on:click={activateEraser}
			>
				<img src={eraserIcon} alt="Erase" />
			</button>
			<button class="button undo" title="Undo (Ctrl+Z)" on:click={undo}>
				<img src={undoIcon} alt="undo" />
			</button>
			<button class="button redo" title="Redo (Ctrl+Y)" on:click={redo}>
				<img src={redoIcon} alt="redo" />
			</button>
			<a
				bind:this={downloadButton}
				class="button download"
				title="Download image"
				on:click={downloadImage}
				target="_blank"
				download="export.png"
			>
				<img src={downloadIcon} alt="download" />
			</a>
			<button class="button delete" title="Delete" on:click={handleDelete}>
				<img src={deleteIcon} alt="delete" />
			</button>
		</div>
	</svelte:fragment>
	<slot>
		<div class="h-full flex justify-center items-center">
			<canvas
				bind:this={canvasElement}
				width={WIDTH}
				height={HEIGHT}
				on:mousedown={start}
				on:mousemove={draw}
				on:mouseup={stop}
			/>
		</div>
	</slot>
</AppShell>

<style lang="scss">
	$primary: #e9d5ff;
	$dark: #171717;
	$darker: black;
	$light: #f3f3f3;

	.sidebar {
		height: 100%;

		section {
			display: block;
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
			background-color: white;
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
			background-color: white;
			border: none;
			outline: none;
			cursor: pointer;

			&.selected {
				background-color: $primary;
			}

			img {
				padding: 5px;
			}
		}
	}
</style>
