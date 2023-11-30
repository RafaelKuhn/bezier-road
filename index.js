
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

// /** @type {HTMLDivElement} */
// const hidDiv = document.getElementById("hid");

/** @type {HTMLParagraphElement} */
const curP  = document.getElementById("cur");
const mouzP = document.getElementById("mouz");
const selInicioP = document.getElementById("selInicio");
const selFimP = document.getElementById("selFim");

/** @type {HTMLSelectElement} */
const modeSelect = document.getElementById("modos");

const Modes = {
	selecao: "MODO selecao",
	circunferencia: "MODO circunferencia",
	ancoras: "MODO ancoras",
}

modeSelect.onchange = () => {
	const mode = Modes[modeSelect.value];
	console.log(`changed to ${mode}`);
}

modeSelect.selectedIndex = 0;
// TODO: call onChangeMode here


// const spanH    = document.getElementById("h");
// const spanArea = document.getElementById("area");
// const samplesDiv = document.getElementById("samplesDiv");
// const samplesContainer = document.getElementById("samples");
// const nSlider  = document.getElementById("nSlider");
// const spanN    = document.getElementById("n");
// const nMax = nSlider.max;
// const nStart = nSlider.value;
//
// const samplePElements = [];
//
// const createPForSample = () => {
// 	const p = document.createElement("p");
// 	p.classList.add("center");
//
// 	return p;
// }
//
// const updateP = (i, x, y) => {
// 	samplePElements[i].textContent = `${x.toFixed(4)} | ${y.toFixed(4)}`;
// }
//
// const setPasBlank = (i) => {
// 	samplePElements[i].textContent = "";
// }
//
// for (let i = 0; i < nMax; ++i) {
// 	const p = createPForSample();
// 	samplePElements.push(p);
// 	samplesContainer.appendChild(p)
// }


// constants

const TAU = 6.28318530;
const NAN = + +'javascript é uma merda kkkkkk';
const coordinateSystemMax = 400;
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

/** @return {Number} */
const dot = (x0, y0, x1, y1) => x0 * x1 + y0 * y1;

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
const pxToCoord = pixels => pixels / canvas.width        * coordinateSystemMax;
const coordToPx = coords => coords / coordinateSystemMax * canvas.width;


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

// /** 
//  * @type {{
// * isCursorCloseEnough: boolean,
// * }}
// */
const gameData = {
	isCursorCloseEnough: false,

	hasSelection: false,
	currentCurve: {
		p0: { x: 0, y: 0 },
		p1: { x: 0, y: 0 },
		p2: { x: 0, y: 0 },
		p3: { x: 0, y: 0 },
		curveIndex: 0,
		t: 0,
		dump: { x: 0, y: 0 },
		derivDump: { x: 0, y: 0 },
	},

	hasSelection: false,
	selectionCol: "#FFFFFFFF",
	selection: {
		startT: 0,
		endT:   0,
	},

	// TODO: get rid of
	objBeingHeld: null,
}

const setCurrentCurveAnchors = (p0, p1, p2, p3, t, curr) => {
	gameData.currentCurve.p0 = p0;
	gameData.currentCurve.p1 = p1;
	gameData.currentCurve.p2 = p2;
	gameData.currentCurve.p3 = p3;
	gameData.currentCurve.t  = t;
	gameData.currentCurve.curveIndex = curr;
}

const relativeMousePos = {
	x: 0,
	y: 0,
}
// lazyness
const mousePos = relativeMousePos;

const dragState = {
	isDragging: false,
}

/** * @param {MouseEvent} event */
const setClampedRelativeMousePos = (event) => {
	const x = event.pageX - canvasRect.left;
	const y = event.pageY - canvasRect.top;

	relativeMousePos.x = x;
	relativeMousePos.y = y;

	const clampedX = clamp(x, 0, canvas.width);
	const clampedY = clamp(y, 0, canvas.height);
	mouzP.textContent = `Mouse: ${formatXYAsCoords(clampedX, clampedY, 0)}`;
}

/** @param {MouseEvent} event */
const onMouseDown = (event) => {
	if (event.button != 0) return;

	setClampedRelativeMousePos(event);

	// TODO: remove
	selFimP.textContent = "começo";

	dragState.isDragging = true;
	if (gameData.isCursorCloseEnough) {
		gameData.hasSelection = true;
		gameData.selectionCol = "#FFFFFFFF";

		gameData.selection.startT = gameData.currentCurve.curveIndex + gameData.currentCurve.t;
		gameData.selection.endT  =  gameData.currentCurve.curveIndex + gameData.currentCurve.t;

	} else {
		gameData.hasSelection = false;
	}

	mouseMove(event);
}



const onMouseUp = (event) => {
	// gameData.objBeingHeld = null;

	selFimP.textContent = "\xa0\xa0\xa0fim"

	// call once before setting isDragging because it's used to set end of selection state
	mouseMove(event);
	dragState.isDragging = false;
	mouseMove(event);
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

const derivativeOf = (start, cp1, cp2, end, t, dump) => {
	const t2 =  t * t;

	const deriv0 = -3*t2 +  6*t - 3;
	const deriv1 =  9*t2 - 12*t + 3;
	const deriv2 = -9*t2 +  6*t;
	const deriv3 =  3*t2;

	const newX =
		start.x * deriv0 +
	  cp1.x   * deriv1 +
		cp2.x   * deriv2 +
		end.x   * deriv3;

	const newY =
		start.y * deriv0 +
	  cp1.y   * deriv1 +
		cp2.y   * deriv2 +
		end.y   * deriv3;

	dump.x = newX;
	dump.y = newY;
}


// TODO: game data?
let ClosestPoint = null;

let StartI = 0;
let EndI   = -1;


/** @param {MouseEvent} event */
const mouseMove = (event) => {
	setClampedRelativeMousePos(event);

	// first
	const firstPoint = spline[0];
	let minDistSq = distanceSq(firstPoint.x, firstPoint.y, mousePos.x, mousePos.y);

	ClosestPoint = firstPoint;
	StartI = 0;

	let currentFirstPoint = firstPoint;

	const dumpMiddlePoint = { x: 0, y: 0 };
	const penultimateAnchorIndex = spline.length - 3;
	for (let i = 1; i <= penultimateAnchorIndex; i += 3) {

		// distance to bigger points
		const distToIthSq = distanceSq(currentFirstPoint.x, currentFirstPoint.y, mousePos.x, mousePos.y)
		if (distToIthSq < minDistSq) {
			// TODO: func
			ClosestPoint = currentFirstPoint;
			minDistSq = distToIthSq;
			StartI = Math.max(i - 1 - 3, 0);
			EndI = i + 2;
		}

		const start = currentFirstPoint;
		const cp1   = spline[i];
		const cp2   = spline[i+1];
		const end   = spline[i+2];

		const its = 6;
		// // 0.2 -> 0.8
		for (let ij = 1; ij <= its - 2; ++ij) {
			const t = ij / (its - 1);

			bezierOf(start, cp1, cp2, end, t, dumpMiddlePoint);
			const distToSample = distanceSq(dumpMiddlePoint.x, dumpMiddlePoint.y, mousePos.x, mousePos.y);
			if (distToSample < minDistSq) {
				ClosestPoint = { x: dumpMiddlePoint.x, y: dumpMiddlePoint.y };
				minDistSq = distToSample;
				StartI = i - 1;
				EndI = i + 2;
			}
		}

		currentFirstPoint = end;
	}

	// last point
	const distToIthSq = distanceSq(currentFirstPoint.x, currentFirstPoint.y, mousePos.x, mousePos.y)
	if (distToIthSq < minDistSq) {
		// TODO: func
		ClosestPoint = currentFirstPoint;
		minDistSq = distToIthSq;
		StartI = spline.length - 1 - 3;
		EndI = spline.length - 1;
	}


	// TODO: get rid, holding object
	const objectBeingHovered = getNearbyClosestObjectOrNull(mousePos);
	// console.log(objectBeingHovered);
	
	document.body.style.cursor = objectBeingHovered == null ? "default" : "pointer";

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

const scale = (vec, scale) => {
	vec.x *= scale;
	vec.y *= scale;
}

const tryNormalize = vec => {
	const len = lengthOfVec(vec);
	vec.x /= len;
	vec.y /= len;
}

const lengthOfVec = vec => Math.sqrt(vec.x * vec.x + vec.y * vec.y);

const isApprox = (v, dest) => Math.abs(v - dest) < 0.001


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
	drawDotIn(startLocal.x, startLocal.y, pointSize);

	for (let i = 1; i < spline.length; i += 3) {
		const cp1 = spline[i];
		const cp2 = spline[i + 1];
		const end = spline[i + 2];

		drawBezier(startLocal, cp1, cp2, end);

		ctx.lineWidth = 2;
		drawDotIn(end.x, end.y, pointSize);

		const its = 6;
		// 0.2 -> 0.8
		for (let i = 1; i <= its - 2; ++i) {
			const t = i / (its - 1);
			
			bezierOf(startLocal, cp1, cp2, end, t, dump);
			drawDotIn(dump.x, dump.y, pointSize * 0.3);
		}

		startLocal = end;
	}

	if (ClosestPoint) {
		ctx.strokeStyle = "white";
		// DEBUG
		// drawDotIn(ClosestPoint.x, ClosestPoint.y, pointSize * 3);
	}


	// TODO: figure out real closest point in the thing, a way of selecting it
	// TODO: draw area from there until the next


	// DRAWS ARE IN BETWEEN START AND END SEARCH POINT
	const derivDump = gameData.currentCurve.derivDump;
	const localDerivDump = { x: derivDump.x, y: derivDump.y };

	startLocal = spline[StartI];
	for (let i = StartI + 1; i <= EndI; i += 3) {
		const cp1 = spline[i];
		const cp2 = spline[i + 1];
		const end = spline[i + 2];

		// DRAW SELECTION BEZIER
		// if (gameData.isCursorCloseEnough) {
		// 	ctx.strokeStyle = "white";
		// 	drawBezier(startLocal, cp1, cp2, end);
		// }

		const its = 9;
		for (let i = 0; i < its; ++i) {
			const t = i / (its - 1);
		
			bezierOf(startLocal, cp1, cp2, end, t, dump);

			derivativeOf(startLocal, cp1, cp2, end, t, derivDump);

			localDerivDump.x = derivDump.x;
			localDerivDump.y = derivDump.y;
			tryNormalize(localDerivDump);

			const normalScale = coordToPx(7.5);
			scale(localDerivDump, normalScale);
		}

		startLocal = end;
	}



	startLocal = spline[StartI];

	setCurrentCurveAnchors(startLocal, spline[1], spline[2], spline[2], 0, 0);
	const refCur = gameData.currentCurve;

	bezierOf(refCur.p0, refCur.p1, refCur.p2, refCur.p3, 0, refCur.dump);

	let minDistSq2 = distanceSq(startLocal.x, startLocal.y, mousePos.x, mousePos.y);
	for (let i = StartI + 1; i <= EndI; i += 3) {
		const cp1 = spline[i];
		const cp2 = spline[i + 1];
		const end = spline[i + 2];

		// go through Start .. End of the spline, iterating 150 times for the closest position to the mouse
		const its = 150;
		for (let j = 0; j < its; ++j) {
			const t = j / (its - 1);

			bezierOf(startLocal, cp1, cp2, end, t, refCur.dump);
			const dist = distanceSq(refCur.dump.x, refCur.dump.y, mousePos.x, mousePos.y);
			if (dist < minDistSq2) {
				minDistSq2 = dist;
				const currentCurveI = parseInt( (i - 1) / 3 );
				setCurrentCurveAnchors(startLocal, cp1, cp2, end, t, currentCurveI);
			}

		}

		startLocal = end;
	}

	const oneQuadrant = canvas.width / coordinateSystemIts;
	const distanceThresholdSq = oneQuadrant * oneQuadrant;
	gameData.isCursorCloseEnough = minDistSq2 < distanceThresholdSq;

	bezierOf(refCur.p0, refCur.p1, refCur.p2, refCur.p3, refCur.t, refCur.dump);

	if (gameData.isCursorCloseEnough || (dragState.isDragging && gameData.hasSelection)) {

		// log real coordinates
		// const fixedX = refCur.dump.x / canvas.width * coordinateSystemMax;
		// const fixedY = (canvas.width - refCur.dump.y) / canvas.width * coordinateSystemMax
		// console.log(`${formatXY(fixedX, fixedY)}`);

		ctx.strokeStyle = "blue";
		drawDotIn(refCur.dump.x, refCur.dump.y, pointSize * 0.4)

		derivativeOf(refCur.p0, refCur.p1, refCur.p2, refCur.p3, refCur.t, derivDump);
		// console.log(`deriv ${formatVec(derivDump)}`);
		tryNormalize(derivDump);

		// normal is the derivative rotated 90 degrees counterclockwise
		const normal = { x: derivDump.y, y: -derivDump.x }

		const mouseToCurveX = mousePos.x - refCur.dump.x;
		const mouseToCurveY = mousePos.y - refCur.dump.y;

		// console.log(`n: ${formatVec(normal)} ${formatXY(mouseToCurveX, mouseToCurveY)}`);
		const dotProd = dot(normal.x, normal.y, mouseToCurveX, mouseToCurveY)
		if (dotProd < 0) {
			normal.x = -normal.x;
			normal.y = -normal.y;
			derivDump.x = -derivDump.x;
			derivDump.y = -derivDump.y;
		}

		const normalScale = coordToPx(15);
		scale(derivDump, normalScale);
		scale(normal, normalScale);

		ctx.strokeStyle = "red";
		drawLineBetween(refCur.dump.x, refCur.dump.y, refCur.dump.x + derivDump.x, refCur.dump.y + derivDump.y);

		ctx.strokeStyle = "lime";
		drawLineBetween(refCur.dump.x, refCur.dump.y, refCur.dump.x + normal.x, refCur.dump.y + normal.y);

		curP.textContent = `Curva: ${formatXYAsCoords(refCur.dump.x, refCur.dump.y)}`
	} else {
		curP.textContent = `Curva: falso`
	}


	// RENDER SELECTION
	if (dragState.isDragging) {
		gameData.selection.endT  = refCur.curveIndex + refCur.t;
	}

	// console.log(gameData.hasSelection);
	if (gameData.hasSelection)
	{
		drawSelection();
	}




	// TODO: get rid, draws controllable points
	// ctx.lineWidth = 3;
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

const drawSelection = () => {

	if (isApprox(gameData.selection.startT, gameData.selection.endT)) return;

	ctx.strokeStyle = "white";

	let startSplineIndex = parseInt(clamp(gameData.selection.startT, 0, 10));
	let endSplineIndex   = parseInt(clamp(gameData.selection.endT,   0, 10));

	let startT = gameData.selection.startT - startSplineIndex;
	let endT   = gameData.selection.endT   - endSplineIndex;

	if (gameData.selection.startT > gameData.selection.endT) {
		[startSplineIndex, endSplineIndex] = [endSplineIndex, startSplineIndex];
		[startT, endT] = [endT, startT];
	}

	const realStartI = startSplineIndex * 3;
	const realEndI   = endSplineIndex * 3;

	const firstFull = startSplineIndex + 1;
	const lastFull  = endSplineIndex   - 1;

	// DRAW start curve from startT to 1
	const sp0 = spline[realStartI];
	const sp1 = spline[realStartI+1];
	const sp2 = spline[realStartI+2];
	const sp3 = spline[realStartI+3];

	// TODO: put its at like 3 and see if I can draw the area and if its correct
	const its = 30;
	const dumpForSelection = {};
	const lastIt = {};

	// TODO: could use arclen
	const ithStart = parseInt(lerp(0, its, startT));
	// min is because they could have been switched before
	const ithEnd   = endSplineIndex != startSplineIndex ? its - 1 : parseInt(lerp(0, its, Math.max(startT, endT)));
	
	

	bezierOf(sp0, sp1, sp2, sp3, startT, dumpForSelection);
	// copyXY(lastIt, dumpForSelection);
	startPathIn(dumpForSelection.x, dumpForSelection.y);

	console.log(`draw START curve ${startSplineIndex}`); // index: realStartI
	// console.log(`start T ${startT.toFixed(2)}, ${ithStart}, inv ${lerp(0, its, startT).toFixed(2)}`);
	ctx.lineWidth = 4;
	for (let j = ithStart; j <= ithEnd; ++j) {
		const t = j / (its - 1);

		bezierOf(sp0, sp1, sp2, sp3, t, dumpForSelection);
		// drawLineBetween(lastIt.x, lastIt.y, dumpForSelection.x, dumpForSelection.y);
		addToPathIn(dumpForSelection.x, dumpForSelection.y);
		copyXY(lastIt, dumpForSelection);
	}
	

	// DRAWS curves in between, from t 0 to 1
	ctx.lineWidth = 4;
	for (let i = firstFull; i <= lastFull; ++i) {

		console.log(`draw fully curve ${i}`);

		const realI = i * 3;
		const p0 = spline[realI];
		const p1 = spline[realI + 1];
		const p2 = spline[realI + 2];
		const p3 = spline[realI + 3];

		bezierOf(p0, p1, p2, p3, 0, dumpForSelection);
		copyXY(lastIt, dumpForSelection);

		for (let j = 1; j < its; ++j) {
			const t = j / (its - 1);

			bezierOf(p0, p1, p2, p3, t, dumpForSelection);
			// drawLineBetween(lastIt.x, lastIt.y, dumpForSelection.x, dumpForSelection.y)
			addToPathIn(dumpForSelection.x, dumpForSelection.y);
			copyXY(lastIt, dumpForSelection);
		}
	
	}

	const hasEndAndIsDifferentThanStart = endSplineIndex > startSplineIndex;
	if (hasEndAndIsDifferentThanStart) {

		console.log(`draw END curve ${endSplineIndex}`); // index realEndI
		const ep0 = spline[realEndI];
		const ep1 = spline[realEndI + 1];
		const ep2 = spline[realEndI + 2];
		const ep3 = spline[realEndI + 3];
		
		// draw end curve from 0 to endT
		ctx.lineWidth = 4;
		// drawBezier(ep0, ep1, ep2, ep3);

		// TODO: check how can I get the last entry here from the last curve to calculate the thing
		const lastIthEnd = parseInt(lerp(0, its, endT));
		for (let j = 1; j <= lastIthEnd; ++j) {
			const t = j / (its - 1);

			bezierOf(ep0, ep1, ep2, ep3, t, dumpForSelection);
			// drawLineBetween(lastIt.x, lastIt.y, dumpForSelection.x, dumpForSelection.y);
			addToPathIn(dumpForSelection.x, dumpForSelection.y);
			copyXY(lastIt, dumpForSelection);
		}
	}

	console.log();


	drawPath();



	// console.log(`drawing between ${(startSplineIndex * 3).toFixed(2)} and ${(endSplineIndex   * 3 + 3).toFixed(2)}`);

}


const copyXY = (dest, source) => {
	dest.x = source.x;
	dest.y = source.y;
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

const drawBezier = (startLocal, cp1, cp2, end) => {
	ctx.beginPath();
	ctx.moveTo(startLocal.x, startLocal.y);
	ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
	ctx.stroke();
}

const drawDotIn = (x, y, size) => {
	ctx.beginPath();
	ctx.arc(x, y, size, 0, TAU);
	ctx.stroke();
}

const fillDotIn = (x, y, size) => {
	ctx.beginPath();
	ctx.arc(x, y, size, 0, TAU);
	ctx.fill();
}

const drawLineBetween = (x0, y0, x1, y1) => {
	ctx.beginPath();
	ctx.moveTo(x0, y0);
	ctx.lineTo(x1, y1);
	ctx.stroke();
}

const startPathIn = (x, y) => {
	ctx.beginPath();
	ctx.moveTo(x, y);
}

const addToPathIn = (x, y) => {
	ctx.lineTo(x, y);
}

const drawPath = () => {
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



img.onload = () => {
	// const width  = img.width * 1.3;
	canvas.width = canvas.height = 911;

	update();
}



const formatVec = vec => formatXY(vec.x, vec.y);
const formatXY  = (x, y) => `(${x.toFixed(2)},${y.toFixed(2)})`

const formatXYAsCoords = (x, y, digits) => {
	const newX = pxToCoord(x);
	const newY = pxToCoord(canvas.width - y);
	return `(X: ${newX.toFixed(digits)}, Y: ${newY.toFixed(digits)})`
}

