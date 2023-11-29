
//  ########################################################################
//  ################################ HTML ##################################
//  ########################################################################
/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvao");

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");
const canvasRect = canvas.getBoundingClientRect();

canvas.height = document.body.clientHeight - 16;
canvas.width  = canvas.height;

const img = new Image();
img.src = "serra.jpg"

const spanN    = document.getElementById("n");
const spanH    = document.getElementById("h");
const spanArea = document.getElementById("area");
const nSlider  = document.getElementById("nSlider");
const samplesDiv = document.getElementById("samplesDiv");
const samplesContainer = document.getElementById("samples");

const nMax = nSlider.max;
const nStart = nSlider.value;

const samplePElements = [];

const createPForSample = () => {
	const p = document.createElement("p");
	p.classList.add("center");
	
	return p;
}

const updateP = (i, x, y) => {
	samplePElements[i].textContent = `${x.toFixed(4)} | ${y.toFixed(4)}`;
}

const setPasBlank = (i) => {
	samplePElements[i].textContent = "";
}

for (let i = 0; i < nMax; ++i) {
	const p = createPForSample();
	samplePElements.push(p);
	samplesContainer.appendChild(p)
}


// constants
const TAU = 6.28318530;
const NAN = + +'javascript é uma merda kkkkkk';
const coordinateSystemMax = 600;
const coordinateSystemIts = 10;

//  ########################################################################
//  ############################### Beziér #################################
//  ########################################################################

/** @return {Number} */
const clamp = (x, min, max) => Math.max(min, Math.min(x, max));

/** @return {Number} */
const lerp = (a, b, t) => (1 - t) * a + t * b;
/** @return {Number} */
const inverseLerp = (a, b, v) => (v - a) / (b - a);

const gridXToLocalX = (x) => x / canvas.width * coordinateSystemMax;
const gridYToLocalY = (y) => coordinateSystemMax - (y / canvas.height * coordinateSystemMax);

const localXToGridX = (x) => x / coordinateSystemMax * canvas.width;
const localYToGridY = (y) => canvas.height - (y / coordinateSystemMax * canvas.width);

const spline = [
	{ x: 839, y: 680 }, // 0

	{ x: 718, y: 580 },
	{ x: 638, y: 540 },
	{ x: 747, y: 423 }, // 3

	{ x: 817, y: 341 },
	{ x: 863, y: 296 },
	{ x: 823, y: 279 }, // 6

	{ x: 797, y: 263 },
	{ x: 745, y: 287 },
	{ x: 649, y: 394 }, // 9

	{ x: 605, y: 440 },
	{ x: 519, y: 451 },
	{ x: 508, y: 397 }, // 12

	{ x: 509, y: 318 },
	{ x: 675, y: 319 },
	{ x: 635, y: 270 }, // 15

	{ x: 618, y: 249 },
	{ x: 579, y: 258 },
	{ x: 478, y: 321 }, // 18

	{ x: 434, y: 335 },
	{ x: 448, y: 484 },
	{ x: 385, y: 460 }, // 21

	{ x: 349, y: 444 },
	{ x: 368, y: 407 },
	{ x: 425, y: 326 }, // 24

	{ x: 564, y: 210 },
	{ x: 493, y: 195 },
	{ x: 454, y: 192 }, // 27

	{ x: 337, y: 218 },
	{ x: 287, y: 190 },
	{ x: 238, y: 245 }, // 30

	{ x: 187, y: 273 },
	{ x: 146, y: 216 },
	{ x:  76, y: 148 }, // 33
]


// TODO: get rid
const it = 27;
const globalStart = { x: spline[it].x, y: spline[it].y } ;
const globalCp1 =   { x: spline[it - 1].x, y: spline[it - 1].y } ;
const globalCp2 =   { x: spline[it - 2].x, y: spline[it - 2].y } ;
const globalEnd =   { x: spline[it - 3].x, y: spline[it - 3].y } ;


// maths
const pxToCoord = px => {
	return px / canvas.width * coordinateSystemMax;
}


/** @returns {boolean} */
const getIsValidArea = () => {
	const maxXVertices = Math.max(globalStart.x, globalEnd.x);
	const minXVertices = Math.min(globalStart.x, globalEnd.x);
	return globalCp1.x > minXVertices
		&& globalCp2.x > minXVertices
		&& globalCp1.x < maxXVertices
		&& globalCp2.x < maxXVertices;
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

/**
 * @param {MouseEvent} event
 * @returns {{ x: Number, y: Number }}
 */
const getClampedRelativeMousePos = (event) => {
	const x = event.pageX - canvasRect.left;
	const y = event.pageY - canvasRect.top;

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

const sampleFrom = (startIndex, t, dump) => {
	const start = spline[startIndex];
	const cp1   = spline[startIndex + 1];
	const cp2   = spline[startIndex + 2];
	const end   = spline[startIndex + 3];

	bezierOf(start, cp1, cp2, end, t, dump);
}

const bezierOf = (start, cp1, cp2, end, t, dump) => {
	const t2 =  t * t;
	const t3 = t2 * t;

	const bernstein0 =   -t3 + 3*t2 - 3*t + 1;
	const bernstein1 =  3*t3 - 6*t2 + 3*t;
	const bernstein2 = -3*t3 + 3*t2;
	const bernstein3 =    t3;

	const newX =
		start.x * bernstein0 +
	  cp1.x   * bernstein1 +
		cp2.x   * bernstein2 +
		end.x   * bernstein3;

	const newY =
		start.y * bernstein0 +
	  cp1.y   * bernstein1 +
		cp2.y   * bernstein2 +
		end.y   * bernstein3;

	dump.x = newX;
	dump.y = newY;
}

// TODO: get rid of
const bernsteinOf = (start, cp1, cp2, end, b0, b1, b2, b3, dump) => {
	const newX =
		start.x * b0 +
	  cp1.x   * b1 +
		cp2.x   * b2 +
		end.x   * b3;

	const newY =
		start.y * b0 +
	  cp1.y   * b1 +
		cp2.y   * b2 +
		end.y   * b3;

	dump.x = newX;
	dump.y = newY;
}


let ClosestPoint = null;

let Start = 0;
let End   = -1;


/** @param {MouseEvent} event */
const mouseMove = (event) => {
	const mousePos = getClampedRelativeMousePos(event);


	// first
	const firstPoint = spline[0];
	let minDistSq = distanceSq(firstPoint.x, firstPoint.y, mousePos.x, mousePos.y);

	let index = 0;
	ClosestPoint = firstPoint;
	Start = index;

	let currentFirstPoint = firstPoint;

	const dumpMiddlePoint = { x: 0, y: 0 };
	const penultimateAnchorIndex = spline.length - 3;
	for (let i = 1; i <= penultimateAnchorIndex; i += 3) {
		// const point = spline[i - 1];
		
		const distToIthSq = distanceSq(currentFirstPoint.x, currentFirstPoint.y, mousePos.x, mousePos.y)
		if (distToIthSq < minDistSq) {
			// TODO: func
			ClosestPoint = currentFirstPoint;
			minDistSq = distToIthSq;
			index = i;
			Start = Math.max(i - 1 - 3, 0);
			End = i + 2;
		}

		// const start = spline[i - 3];
		// const cp1   = spline[i - 2];
		// const cp2   = spline[i - 1];
		// const end   = spline[i];
		
		const start = currentFirstPoint;
		const cp1   = spline[i];
		const cp2   = spline[i+1];
		const end   = spline[i+2];
		
		bezierOf(start, cp1, cp2, end, 0.2, dumpMiddlePoint);
		const distToSample0 = distanceSq(dumpMiddlePoint.x, dumpMiddlePoint.y, mousePos.x, mousePos.y);
		if (distToSample0 < minDistSq) {
			ClosestPoint = { x: dumpMiddlePoint.x, y: dumpMiddlePoint.y };
			minDistSq = distToSample0;
			index = i;
			Start = i - 1;
			End = i + 2;
		}

		bezierOf(start, cp1, cp2, end, 0.4, dumpMiddlePoint);
		const distToSample1 = distanceSq(dumpMiddlePoint.x, dumpMiddlePoint.y, mousePos.x, mousePos.y);
		if (distToSample1 < minDistSq) {
			ClosestPoint = { x: dumpMiddlePoint.x, y: dumpMiddlePoint.y };
			minDistSq = distToSample1;
			index = i;
			Start = i - 1;
			End = i + 2;
		}
	
		bezierOf(start, cp1, cp2, end, 0.6, dumpMiddlePoint);
		const distToSample2 = distanceSq(dumpMiddlePoint.x, dumpMiddlePoint.y, mousePos.x, mousePos.y);
		if (distToSample2 < minDistSq) {
			ClosestPoint = { x: dumpMiddlePoint.x, y: dumpMiddlePoint.y };
			minDistSq = distToSample2;
			index = i;
			Start = i - 1;
			End = i + 2;
		}

		bezierOf(start, cp1, cp2, end, 0.8, dumpMiddlePoint);
		const distToSample3 = distanceSq(dumpMiddlePoint.x, dumpMiddlePoint.y, mousePos.x, mousePos.y);
		if (distToSample3 < minDistSq) {
			ClosestPoint = { x: dumpMiddlePoint.x, y: dumpMiddlePoint.y };
			minDistSq = distToSample3;
			index = i;
			Start = i - 1;
			End = i + 2;
		}

		currentFirstPoint = end;
	}

	// last point
	const distToIthSq = distanceSq(currentFirstPoint.x, currentFirstPoint.y, mousePos.x, mousePos.y)
	if (distToIthSq < minDistSq) {
		// TODO: func
		ClosestPoint = currentFirstPoint;
		minDistSq = distToIthSq;
		index = spline.length - 1;
	}

	
	// last
	// const lastIndex = spline.length - 1;
	// const lastPoint = spline[lastIndex];
	// let lastMinDistSq = distanceSq(lastPoint.x, lastPoint.y, mousePos.x, mousePos.y);
	// if (lastMinDistSq < minDistSq) {
	// 	ClosestPoint = lastPoint;
	// 	// TODO: func
	// 	minDistSq = lastMinDistSq;
	// 	index = lastIndex;
	// }





	const distanceThreshold = canvas.width / coordinateSystemIts;
	const distanceThresholdSq = distanceThreshold * distanceThreshold;

	// 6 -> 2 | 33 -> 11
	const splineIndex = index / 3;




	// TODO: check for last after for
	// if (minDistSq > distanceThresholdSq) {
	// 	closestPoint = null;
	// } else {
	// 	console.log(`valid at ${index/3}`);
	// }

	// console.log("min dist is " + minDistSq);





	// TODO: get rid, holding object
	const objectBeingHovered = getNearbyClosestObjectOrNull(mousePos);
	// console.log(objectBeingHovered);
	document.body.style.cursor = objectBeingHovered == null ? "default" : "pointer";
	if (gameData.isHolding) {
		gameData.objBeingHeld.x = mousePos.x;
		gameData.objBeingHeld.y = mousePos.y;
		gameData.isValid = getIsValidArea();
		console.log(gameData.objBeingHeld);
	}

	update();
}

/** @param {Number} p0x @param {Number} p1x  @param {Number} p1x  @param {Number} p1y */
const distanceSq = (p0x, p0y, p1x, p1y) => {
	// const pointsVec = { x: point1.x - point0.x, y: point1.y - point0.y }
	const pointsVecX = p1x - p0x;
	const pointsVecY = p1y - p0y;
	return pointsVecX * pointsVecX + pointsVecY * pointsVecY;
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
	return null;

	if (distanceTo(mousePos, globalStart) < 20) return globalStart;
	if (distanceTo(mousePos, globalCp1) < 20)   return globalCp1;
	if (distanceTo(mousePos, globalCp2) < 20)   return globalCp2;
	if (distanceTo(mousePos, globalEnd) < 20)   return globalEnd;
	
	return null;
}

//  ########################################################################
//  ################################ HTML ##################################
//  ########################################################################
const coordinateSystemMarkLength = 10;
const pointSize = 7;

const render = () => {

	// reset
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.setLineDash([0]);

	ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

	drawGrid();

	const dump = { x: 0, y: 0 }

	// draw spline
	ctx.strokeStyle = "red";

	let startLocal = spline[0];

	ctx.lineWidth = 2;
	dotIn(startLocal.x, startLocal.y, pointSize);

	for (let i = 1; i < spline.length; i += 3) {
		const cp1 = spline[i];
		const cp2 = spline[i + 1];
		const end = spline[i + 2];

		ctx.beginPath();
		ctx.moveTo(startLocal.x, startLocal.y);
		ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
		ctx.stroke();

		ctx.lineWidth = 2;
		dotIn(end.x, end.y, pointSize);

		bezierOf(startLocal, cp1, cp2, end, 0.5, dump);
		dotIn(dump.x, dump.y, pointSize * 0.7);
		// sampleFrom(i - 3, 0.5, dumpMiddlePoint);

		startLocal = end;
	}

	if (ClosestPoint) {
		ctx.strokeStyle = "white";
		// dotIn(ClosestPoint.x, ClosestPoint.y, pointSize * 3);
	}

	ctx.strokeStyle = "white";
	// console.log(`will draw thing at ${Start} .. ${End}`);
	startLocal = spline[Start];
	for (let i = Start + 1; i <= End; i += 3) {
		const cp1 = spline[i];
		const cp2 = spline[i + 1];
		const end = spline[i + 2];

		ctx.beginPath();
		ctx.moveTo(startLocal.x, startLocal.y);
		ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
		ctx.stroke();

		startLocal = end;
	}








	// TODO: get rid, draws controllable points
	// ctx.lineWidth = 3;
	// // ctx.strokeStyle = gameData.isValid ? "black" : "red";
	// ctx.strokeStyle = "black";
	// ctx.beginPath();
	// ctx.moveTo(globalStart.x, globalStart.y);
	// ctx.bezierCurveTo(globalCp1.x, globalCp1.y, globalCp2.x, globalCp2.y, globalEnd.x, globalEnd.y);
	// ctx.stroke();

	// // dashed lines
	// ctx.lineWidth = 2;
	// ctx.setLineDash([5, 7]);
	// // ctx.strokeStyle = "black";
	// ctx.strokeStyle = "white";

	// ctx.beginPath();
	// ctx.moveTo(globalStart.x, globalStart.y)
	// ctx.lineTo(globalCp1.x, globalCp1.y)
	// ctx.stroke();

	// ctx.beginPath();
	// ctx.moveTo(globalEnd.x, globalEnd.y)
	// ctx.lineTo(globalCp2.x, globalCp2.y)
	// ctx.stroke();

	// // start and end points
	// ctx.fillStyle = "blue";
	// ctx.beginPath();
	// ctx.arc(globalStart.x, globalStart.y, pointSize, 0, TAU);
	// ctx.arc(globalEnd.x,   globalEnd.y,   pointSize, 0, TAU);
	// ctx.fill();

	// // control points
	// ctx.fillStyle = "red";
	// ctx.beginPath();
	// ctx.arc(globalCp1.x, globalCp1.y, pointSize, 0, TAU);
	// ctx.arc(globalCp2.x, globalCp2.y, pointSize, 0, TAU);
	// ctx.fill();




}



const drawGrid = () => {
	// draw grid
	ctx.lineWidth = 0.5;
	ctx.strokeStyle = "#d3d3d3";

	const period = canvas.width / coordinateSystemMax;

	const coordPeriod = coordinateSystemMax / coordinateSystemIts;
	for (let i = 1; i < coordinateSystemIts; ++i) {
		const ourPeriod = period * coordPeriod * i;

		// horizontal (X) gray lines
		ctx.beginPath();
		ctx.moveTo(ourPeriod, 0);
		ctx.lineTo(ourPeriod, canvas.height);
		ctx.stroke();
		
		// vertical (Y) gray lines
		ctx.beginPath();
		// console.log(ourPeriod, canvas.width - ourPeriod);
		ctx.moveTo(0, canvas.width - ourPeriod);
		ctx.lineTo(canvas.width, canvas.width - ourPeriod);
		ctx.stroke();
	}


	// cartesian coordinates
	ctx.lineWidth = 2;
	ctx.strokeStyle = "white";
	ctx.fillStyle = "white";
	ctx.font = "24px serif";

	for (let i = 1; i < coordinateSystemIts; ++i) {
		const ourPeriod = period * coordPeriod * i;

		// horizontal cartesian coordinates
		ctx.beginPath();
		ctx.moveTo(ourPeriod, canvas.height);
		ctx.lineTo(ourPeriod, canvas.height - coordinateSystemMarkLength);
		ctx.stroke();
		
		const ourLen = i / coordinateSystemIts * coordinateSystemMax;
		ctx.fillText(ourLen.toFixed(0), ourPeriod - 6, canvas.height - 15);
		
		// vertical cartesian coordinates
		ctx.beginPath();
		ctx.moveTo(0, ourPeriod);
		ctx.lineTo(coordinateSystemMarkLength, ourPeriod);
		ctx.stroke();

		ctx.fillText(ourLen.toFixed(0), 15, canvas.height - ourPeriod + 6);
	}
}


const dotIn = (x, y, size) => {
	ctx.beginPath();
	ctx.arc(x, y, size, 0, TAU);
	ctx.stroke();
}



const update = () => {
	render();
}

//  ########################################################################
//  ############################# BOOTSTRAP ################################
//  ########################################################################
window.addEventListener("mousedown", onMouseDown);
window.addEventListener("mouseup",   onMouseUp);
window.addEventListener("mousemove", mouseMove);

nSlider.addEventListener("mousemove", update);

// render();


const bezierIn = (start, anchor0, anchor1, end) => {
	ctx.fillStyle = "blue";
	ctx.lineWidth = 4;
	ctx.beginPath();
	ctx.arc(start.x, start.y, pointSize, 0, TAU);
	ctx.arc(end.x,   end.y,   pointSize, 0, TAU);
	ctx.fill();
	
	ctx.fillStyle = "cyan";
	ctx.beginPath();
	ctx.arc(anchor0.x, anchor0.y, pointSize, 0, TAU);
	ctx.arc(anchor1.x, anchor1.y, pointSize, 0, TAU);
	ctx.fill();
	
	ctx.strokeStyle = "red";
	ctx.beginPath();
	ctx.moveTo(start.x, start.y);
	ctx.bezierCurveTo(anchor0.x, anchor0.y, anchor1.x, anchor1.y, end.x, end.y);
	ctx.stroke();
}


img.onload = () => {
	// const width  = img.width * 1.3;
	// canvas.width = width;

	update();
}




