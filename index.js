
/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvao");

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");
const canvasRect = canvas.getBoundingClientRect();

const spanN = document.getElementById("n");
const spanH = document.getElementById("h");
const nSlider = document.getElementById("nSlider");
const nStart = nSlider.value;
console.log("default is " + nStart);

// constants
const TAU = 6.28318530;

const pointSize = 7;
const coordinateSystemMax = 8;

// Points for the curve
const start = { x: 75,  y: 262.5 };
const end =   { x: 525, y: 337.5 };
const cp1 =   { x: 150, y: 525 };
const cp2 =   { x: 450, y: 75  };

/** @param {{ x: Number, y: Number }} point */
const getCoordinateSystemXFromPoint = (point) => {
	return (point.x / canvas.width) * coordinateSystemMax;
}

/** @param {{ x: Number, y: Number }} point */
const getCoordinateSystemYFromPoint = (point) => {
	return coordinateSystemMax - (point.y / canvas.height) * coordinateSystemMax;
}

// maths
const calculateHForN = (n) => {
	const b = getCoordinateSystemXFromPoint(end);
	const a = getCoordinateSystemXFromPoint(start);
	return Math.abs(b - a) / n;
}

const mathData = {
	n: nStart,
	h: calculateHForN(nStart),
}

const updateMathData = () => {
	mathData.n = nSlider.value;
	mathData.h = calculateHForN(mathData.n);
}

/** @returns {boolean} */
const getIsValidArea = () => {
	const maxXVertices = Math.max(start.x, end.x);
	const minXVertices = Math.min(start.x, end.x);
	return cp1.x > minXVertices
		&& cp2.x > minXVertices
		&& cp1.x < maxXVertices
		&& cp2.x < maxXVertices;
}


/** 
 * @type {{
 * isHolding: boolean,
 * objBeingHeld: { x: Number, y: Number }
 * isValid : boolean
 * }}
 */
const gameData = {
	isHolding: false,
	objBeingHeld: null,
	isValid: getIsValidArea(),
}

/** @return {Number} */
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

	gameData.objBeingHeld = getNearbyClosestObjectOrNull(mousePos);
	gameData.isHolding = gameData.objBeingHeld != null;
	gameData.isValid = getIsValidArea();

	mouseMove(event);
}

const onMouseUp = () => {
	gameData.isHolding = false;
	gameData.objBeingHeld = null;
}

/** @param {MouseEvent} event */
const mouseMove = (event) => {
	const mousePos = getClampedRelativeMousePos(event);

	const objectBeingHovered = getNearbyClosestObjectOrNull(mousePos);
	document.body.style.cursor = objectBeingHovered == null ? "default" : "pointer";

	if (!gameData.isHolding)	return;

	gameData.objBeingHeld.x = mousePos.x;
	gameData.objBeingHeld.y = mousePos.y;
	gameData.isValid = getIsValidArea();

	drawStuff();
	updateMathData();
	updateDom();
}

/**
 * @param {{ x: Number, y: Number }} point0 
 * @param {{ x: Number, y: Number }} point1 
 */
const distanceTo = (point0, point1) => {
	const pointsVec = { x: point1.x - point0.x, y: point1.y - point0.y }
	return Math.sqrt(pointsVec.x * pointsVec.x + pointsVec.y * pointsVec.y);
}

// HTML
/** @param {{ x: Number, y: Number }} mousePos */
const getNearbyClosestObjectOrNull = (mousePos) => {
	if (distanceTo(mousePos, start) < 20) return start;
	if (distanceTo(mousePos, cp1) < 20)   return cp1;
	if (distanceTo(mousePos, cp2) < 20)   return cp2;
	if (distanceTo(mousePos, end) < 20)   return end;

	return null;
}

const coordinateSystemMarkLength = 10;

const drawStuff = () => {
	// reset
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.setLineDash([0]);
	ctx.lineWidth = 3;

	const period = canvas.width / coordinateSystemMax;

	// draw grid
	ctx.lineWidth = 1;
	ctx.strokeStyle = "#d3d3d3";
	for (let i = 1; i < coordinateSystemMax; ++i) {
		const ourPeriod = period * i;

		// horizontal cartesian coordinates
		ctx.beginPath();
		ctx.moveTo(ourPeriod, 0);
		ctx.lineTo(ourPeriod, canvas.height);
		ctx.stroke();
		
		// vertical cartesian coordinates
		ctx.beginPath();
		ctx.moveTo(0, ourPeriod);
		ctx.lineTo(canvas.width, ourPeriod);
		ctx.stroke();
	}

	// draw cartesian coordinates
	ctx.lineWidth = 2;
	ctx.strokeStyle = "black";
	ctx.fillStyle = "black";
	ctx.font = "24px serif";

	for (let i = 1; i < coordinateSystemMax; ++i) {
		const ourPeriod = period * i;

		// horizontal cartesian coordinates
		ctx.beginPath();
		ctx.moveTo(ourPeriod, canvas.height);
		ctx.lineTo(ourPeriod, canvas.height - coordinateSystemMarkLength);
		ctx.stroke();
		
		ctx.fillText(i, ourPeriod - 6, canvas.height - 15);
		
		// vertical cartesian coordinates
		ctx.beginPath();
		ctx.moveTo(0, ourPeriod);
		ctx.lineTo(coordinateSystemMarkLength, ourPeriod);
		ctx.stroke();

		ctx.fillText(i, 15, canvas.height - ourPeriod + 6);
	}

	// cubic bézier curve
	ctx.strokeStyle = gameData.isValid ? "black" : "red";
	ctx.beginPath();
	ctx.moveTo(start.x, start.y);
	ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
	ctx.stroke();

	// dashed lines
	ctx.setLineDash([5, 7]);
	ctx.strokeStyle = "black";

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
}

const updateDom = () => {
	spanN.textContent = mathData.n;
	spanH.textContent = mathData.h.toFixed(4);

}

window.addEventListener("mousedown", onMouseDown)
window.addEventListener("mouseup",   onMouseUp)
window.addEventListener("mousemove", mouseMove)

nSlider.addEventListener("mousemove", () => {
	drawStuff();
	updateMathData();
	updateDom();	
})

drawStuff();
updateMathData();
updateDom();
