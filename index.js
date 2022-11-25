
/** @type {HTMLCanvasElement} */
const canvao = document.getElementById("canvao");

/** @type {CanvasRenderingContext2D} */
const ctx = canvao.getContext("2d");

const TAU = 6.28318530;

// Define the points as {x, y}
let start = { x:  50, y:  20  };
let cp1 =   { x: 230, y:  30  };
let cp2 =   { x: 150, y:  80  };
let end =   { x: 250, y: 100 };

ctx.lineWidth *= 3;
const ballSize = 7;

const drawStuff = () => {
	
	// Cubic Bézier curve
	ctx.beginPath();
	ctx.moveTo(start.x, start.y);
	ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
	ctx.stroke();

	// Start and end points
	ctx.fillStyle = 'blue';
	ctx.beginPath();
	ctx.arc(start.x, start.y, ballSize, 0, TAU);
	ctx.arc(end.x,   end.y,   ballSize, 0, TAU);
	ctx.fill();

	// Control points
	ctx.fillStyle = 'red';
	ctx.beginPath();
	ctx.arc(cp1.x, cp1.y, ballSize, 0, TAU);
	ctx.arc(cp2.x, cp2.y, ballSize, 0, TAU);
	ctx.fill();
}

// function resizeCanvas() {
// 	canvao.width = window.innerWidth * 0.3;
// 	canvao.height = window.innerHeight * 0.3;

// 	// Redraw everything after resizing the window
// }
drawStuff();

window.addEventListener('resize', resizeCanvas, false);
resizeCanvas()




