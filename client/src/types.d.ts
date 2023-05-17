export type Line = {
	points: {
		x: number;
		y: number;
	}[];
	color: string;
	weight: number;
};

export type Canvas = Line[];

export type Page = {
	_id: string;
	canvas: Canvas;
	name: string;
	pin: string;
};
