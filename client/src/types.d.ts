export type Line = {
    points: {
        x: number;
        y: number;
    }[];
    color: string;
    weight: number;
}

export type Canvas = Line[]
