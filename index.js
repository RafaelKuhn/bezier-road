
/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvao");

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");
const canvasRect = canvas.getBoundingClientRect();

const spanN = document.getElementById("n");
const spanH = document.getElementById("h");
const spanArea = document.getElementById("area");
const nSlider = document.getElementById("nSlider");
const nStart = nSlider.value;

// constants
const TAU = 6.28318530;
const NAN = + +'javascript é uma merda kkkkkk';
const coordinateSystemMax = 8;

//  ########################################################################
//  ############################### Bezier #################################
//  ########################################################################
// Points for the curve
const start = { x: 75,  y: 262.5 }; // 1.0, 4.5
const end =   { x: 525, y: 337.5 }; // 7.0, 3.5
const cp1 =   { x: 150, y: 525 };   // 2.0, 1.0
// const cp1 =   { x: 225, y: 450 };   // 3.0, 2.0
const cp2 =   { x: 450, y: 75  };   // 6.0, 7.0

/** @param {{ x: Number, y: Number }} point */
const getCoordinateSystemXFromPoint = (point) => {
	return (point.x / canvas.width) * coordinateSystemMax;
}

/** @param {{ x: Number, y: Number }} point */
const getCoordinateSystemYFromPoint = (point) => {
	return coordinateSystemMax - (point.y / canvas.height) * coordinateSystemMax;
}

const lerp = (a, b, t) => (1 - t) * a + t * b;
const inverseLerp = (a, b, v) => (v - a) / (b - a);

const gridXToLocal = (x) => x / canvas.width * coordinateSystemMax;

/** @param {Number} x */
const bissectionYForX = (x) => {
	x = gridXToLocal(x);
	
	let bisectionLow  = 0;
	let bisectionHigh = 1;
	let bisectionMid = 0.5;

	let xSample = gridXToLocal(sampleCurveXAt(bisectionMid));
	for (let i = 0; i < 50; ++i) {

		const difference = Math.abs(xSample - x);
		if (difference < 0.0001) {
			// console.log(`took ${i} to find t: ${bisectionMid}\nx: ${xSample} ~= ${x}\ny: ${sampleCurveYAt(bisectionMid)}`);
			return sampleCurveYAt(bisectionMid);
		}

		bisectionMid = (bisectionHigh + bisectionLow) * 0.5;
		xSample = gridXToLocal(sampleCurveXAt(bisectionMid));

		if (xSample > x)
			bisectionHigh = bisectionMid;
		else
			bisectionLow  = bisectionMid;
	}

	return sampleCurveYAt(bisectionMid);
}

/** @param {Number} x */
const invertedBissectionYForX = (x) => {
	x = gridXToLocal(x);
	
	let bisectionLow  = 0;
	let bisectionHigh = 1;
	let bisectionMid = 0.5;

	let xSample = gridXToLocal(sampleCurveXAt(1 - bisectionMid));
	for (let i = 0; i < 50; ++i) {

		const difference = Math.abs(xSample - x);
		if (difference < 0.0001) {
			return sampleCurveYAt(1 - bisectionMid);
		}

		bisectionMid = (bisectionHigh + bisectionLow) * 0.5;
		xSample = gridXToLocal(sampleCurveXAt(1 - bisectionMid));

		if (xSample > x)
			bisectionHigh = bisectionMid;
		else
			bisectionLow  = bisectionMid;
	}

	return sampleCurveYAt(1 - bisectionMid);
}

/**
 * @param {Number} x 
 * @returns {Number}
 */
const sampleCurveAt = (t) => {
	const t2 = t * t;
	const t3 = t2 * t;

	const bernstein0 =   -t3 + 3*t2 - 3*t + 1;
	const bernstein1 =  3*t3 - 6*t2 + 3*t;
	const bernstein2 = -3*t3 + 3*t2;
	const bernstein3 =    t3;

	const newX = start.x * bernstein0 +
	               cp1.x * bernstein1 +
							   cp2.x * bernstein2 +
							   end.x * bernstein3;

	const newY = start.y * bernstein0 +
	               cp1.y * bernstein1 +
							   cp2.y * bernstein2 +
							   end.y * bernstein3;

	return { x: newX, y: newY };
}

const sampleCurveYAt = (t) => {
	const t2 = t * t;
	const t3 = t2 * t;

	const bernstein0 =   -t3 + 3*t2 - 3*t + 1;
	const bernstein1 =  3*t3 - 6*t2 + 3*t;
	const bernstein2 = -3*t3 + 3*t2;
	const bernstein3 =    t3;
	return start.y * bernstein0 +
		cp1.y * bernstein1 +
		cp2.y * bernstein2 +
		end.y * bernstein3;
}

const sampleCurveXAt = (t) => {
	const t2 = t * t;
	const t3 = t2 * t;

	const bernstein0 =   -t3 + 3*t2 - 3*t + 1;
	const bernstein1 =  3*t3 - 6*t2 + 3*t;
	const bernstein2 = -3*t3 + 3*t2;
	const bernstein3 =    t3;
	return start.x * bernstein0 +
		cp1.x * bernstein1 +
		cp2.x * bernstein2 +
		end.x * bernstein3;
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

const calculateArea = () => {
	const halfH = mathData.h * 0.5;
	// let aggr = ;

	const lastElement = mathData.n - 1;
	for (let i = 1; i < lastElement; ++i) {
		// aggr
	}

	return "TODO"
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

//  ########################################################################
//  ############################## Graphics ################################
//  ########################################################################
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

	render();
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

//  ########################################################################
//  ################################ HTML ##################################
//  ########################################################################
const coordinateSystemMarkLength = 10;
const pointSize = 7;

const drawStuff = () => {
	// reset
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.setLineDash([0]);
	ctx.lineWidth = 3;

	// draw grid
	const period = canvas.width / coordinateSystemMax;
	ctx.lineWidth = 1;
	ctx.strokeStyle = "#d3d3d3";
	for (let i = 1; i < coordinateSystemMax; ++i) {
		const ourPeriod = period * i;

		// horizontal gray lines
		ctx.beginPath();
		ctx.moveTo(ourPeriod, 0);
		ctx.lineTo(ourPeriod, canvas.height);
		ctx.stroke();
		
		// vertical gray lines
		ctx.beginPath();
		ctx.moveTo(0, ourPeriod);
		ctx.lineTo(canvas.width, ourPeriod);
		ctx.stroke();
	}


	// cubic bézier curve
	ctx.lineWidth = 3;
	ctx.strokeStyle = gameData.isValid ? "black" : "red";
	ctx.beginPath();
	ctx.moveTo(start.x, start.y);
	ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
	ctx.stroke();

	// dashed lines
	ctx.lineWidth = 2;
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

	// point in the middle
	ctx.setLineDash([0]);
	const point = sampleCurveAt(0.5);
	ctx.beginPath();
	ctx.arc(point.x, point.y, pointSize, 0, TAU);
	ctx.stroke();


	// TODO: update area
	// trapezoid boxes
	if (gameData.isValid) {
		ctx.lineWidth = 2;
		ctx.strokeStyle = "#00c380";
		const lastN = mathData.n - 1;

		let xStart = start.x;
		let xEnd   = end.x;
		let bissectY = bissectionYForX;
		if (xStart > xEnd) {
			[xStart, xEnd] = [xEnd, xStart];
			bissectY = invertedBissectionYForX;
		}
		
		let lastX = xStart;
		let lastY = bissectY(lastX);

		ctx.beginPath();
		ctx.moveTo(xStart, canvas.width)
		ctx.lineTo(lastX, lastY)
		ctx.stroke();

		for (let i = 1; i < mathData.n; ++i) {
			const percentage = i / lastN;
			
			// const localX = lerp(xStart, xEnd, percentage);
			// const x = localX / coordinateSystemMax * canvas.width;
			const x = lerp(xStart, xEnd, percentage);
			const y = bissectY(x);

			ctx.beginPath();
			ctx.moveTo(x, canvas.width)
			ctx.lineTo(x, y)
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(lastX, lastY)
			ctx.lineTo(x, y)
			ctx.stroke();

			lastX = x;
			lastY = y;
		}
	}


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

	// cartesian coordinates
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
	
}

const updateDom = () => {
	spanN.textContent = mathData.n;
	spanH.textContent = gameData.isValid ? mathData.h.toFixed(4) : NAN;
	spanH.style.color = gameData.isValid ? "black" : "red";
}

const render = () => {
	drawStuff();
	updateMathData();
	updateDom();
}

window.addEventListener("mousedown", onMouseDown);
window.addEventListener("mouseup",   onMouseUp);
window.addEventListener("mousemove", mouseMove);

nSlider.addEventListener("mousemove", render);

render();
