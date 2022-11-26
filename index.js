
/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvao");

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

const canvasRect = canvas.getBoundingClientRect();

const TAU = 6.28318530;

const pointSize = 7;
// const coordinateSystemMax = 16;
const coordinateSystemMax = 8;

// Points for the curve
let start = { x: 54,  y: 260 };
let end =   { x: 511, y: 339 };
let cp1 =   { x: 120, y: 501 };
let cp2 =   { x: 442, y: 91  };

/** @type {{ isHolding: boolean, objBeingHold: { x: Number, y: Number } }} */
const mouseData = {
	isHolding: false,
	objBeingHold: null,
}

const clamp = (x, min, max) => {
	return Math.max(min, Math.min(x, max));
}

/**
 * @param {MouseEvent} event
 * @returns {{ x: Number, y: Number }}
 */
const getClampedRelativeMousePos = (event) => {
	const x = event.clientX - canvasRect.left;
	const y = event.clientY - canvasRect.top;

	return { x: clamp(x, 0, canvas.width), y: clamp(y, 0, canvas.height) };
}

/** @param {MouseEvent} event */
const onMouseDown = (event) => {
	const mousePos = getClampedRelativeMousePos(event);

	mouseData.objBeingHold = getNearbyClosestObjectOrNull(mousePos);
	mouseData.isHolding = mouseData.objBeingHold != null;

	mouseMove(event);
}


// /** @param {MouseEvent} event */
const onMouseUp = () => {
	mouseData.isHolding = false;
	mouseData.objBeingHold = null;
}

/** @param {MouseEvent} event */
const mouseMove = (event) => {
	const mousePos = getClampedRelativeMousePos(event);

	const objectBeingHovered = getNearbyClosestObjectOrNull(mousePos);
	document.body.style.cursor = objectBeingHovered == null ? "default" : "pointer";

	if (!mouseData.isHolding)	return;

	mouseData.objBeingHold.x = mousePos.x;
	mouseData.objBeingHold.y = mousePos.y;

	drawStuff();
}

/**
 * @param {{ x: Number, y: Number }} point0 
 * @param {{ x: Number, y: Number }} point1 
 */
const distanceTo = (point0, point1) => {
	const pointsVec = { x: point1.x - point0.x, y: point1.y - point0.y }
	return Math.sqrt(pointsVec.x * pointsVec.x + pointsVec.y * pointsVec.y);
}

/** @param {{ x: Number, y: Number }} mousePos */
const getNearbyClosestObjectOrNull = (mousePos) => {
	if (distanceTo(mousePos, start) < 20) return start;
	if (distanceTo(mousePos, cp1) < 20)   return cp1;
	if (distanceTo(mousePos, cp2) < 20)   return cp2;
	if (distanceTo(mousePos, end) < 20)   return end;

	return null;
}

const drawStuff = () => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.setLineDash([0]);
	ctx.lineWidth = 3;


	ctx.lineWidth = 2;
	ctx.setLineDash([0]);
	ctx.fillStyle = "black";
	ctx.font = "24px serif";

	const period = canvas.width / coordinateSystemMax;
	for (let i = 1; i < coordinateSystemMax; ++i) {
		const ourPeriod = period * i;

		// horizontal cartesian coordinates
		ctx.beginPath();
		ctx.moveTo(ourPeriod, canvas.height);
		ctx.lineTo(ourPeriod, canvas.height - 10);
		ctx.stroke();
		
		ctx.fillText(i, ourPeriod - 6, canvas.height - 15);
		
		// vertical cartesian coordinates
		ctx.beginPath();
		ctx.moveTo(0, ourPeriod);
		ctx.lineTo(10, ourPeriod);
		ctx.stroke();

		ctx.fillText(i, 15, canvas.height - ourPeriod + 6);
	}


	// cubic Bézier curve
	ctx.beginPath();
	ctx.moveTo(start.x, start.y);
	ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
	ctx.stroke();

	// dashed lines
	ctx.setLineDash([5, 7]);
	
	ctx.beginPath();
	ctx.moveTo(start.x, start.y)
	ctx.lineTo(cp1.x, cp1.y)
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(end.x, end.y)
	ctx.lineTo(cp2.x, cp2.y)
	ctx.stroke();

	// start and end points
	ctx.fillStyle = "blue";
	ctx.beginPath();
	ctx.arc(start.x, start.y, pointSize, 0, TAU);
	ctx.arc(end.x,   end.y,   pointSize, 0, TAU);
	ctx.fill();

	// control points
	ctx.fillStyle = "red";
	ctx.beginPath();
	ctx.arc(cp1.x, cp1.y, pointSize, 0, TAU);
	ctx.arc(cp2.x, cp2.y, pointSize, 0, TAU);
	ctx.fill();

	// determine if it's valid
	const maxXVertices = Math.max(start.x, end.x);
	const minXVertices = Math.min(start.x, end.x);
	const isValid = cp1.x > minXVertices
	&& cp2.x > minXVertices
	&& cp1.x < maxXVertices
	&& cp2.x < maxXVertices;

	canvas.style.backgroundColor = isValid ? "beige" : "magenta";

	
}

window.addEventListener("mousedown", onMouseDown)
window.addEventListener("mouseup",   onMouseUp)
window.addEventListener("mousemove", mouseMove)

drawStuff();
