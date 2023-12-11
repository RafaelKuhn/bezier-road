
//  ########################################################################
//  ################################ HTML ##################################
//  ########################################################################
/** @type {HTMLCanvasElement} */

const idCanvao = "canvao";
const canvas = document.getElementById(idCanvao);

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");
const canvasRect = canvas.getBoundingClientRect();

canvas.height = document.body.clientHeight - 16;
canvas.width  = canvas.height;

const img = new Image();
img.src = "serra.jpg"

/** @type {HTMLParagraphElement} */
const curP  = document.getElementById("cur");
const mouzP = document.getElementById("mouz");

const selInicioP = document.getElementById("selInicio");
const selFimP    = document.getElementById("selFim");
const selCompP   = document.getElementById("selComp");
const selAreaP   = document.getElementById("selArea");

const circunfP = document.getElementById("circunf")
const radiusP  = document.getElementById("radius")
const radiusValP  = document.getElementById("radiusVal")

const selecaoDiv = document.getElementById("selecaoDiv");
const circunfDiv = document.getElementById("circunferenciaDiv");

/** @type {HTMLSelectElement} */
const modeSelect = document.getElementById("modos");

const Modes = {
	selecao: 1,
	circunf: 2,
	ancoras: 3,
}

let currentMode = Modes[modeSelect.value];

const changeMode = () => {
	const newMode = Modes[modeSelect.value];
	if (!newMode) { console.error("modo podre selecionado"); return; }

	// console.log(`changed to ${newMode} (${modeSelect.value})`);
	currentMode = newMode;

	if (newMode === Modes.selecao) {
		selecaoDiv.style.display = "block";
		circunfDiv.style.display = "none"

	} else if (newMode === Modes.circunf) {
		selecaoDiv.style.display = "none";
		circunfDiv.style.display = "block"

	} else if (newMode === Modes.ancoras) {
		selecaoDiv.style.display = "none";
		circunfDiv.style.display = "none"

	} else {
		console.error(`modo lixo: ${modeSelect.value}`)
	}
}

modeSelect.onchange = changeMode;

modeSelect.selectedIndex = 0;
// TODO: call onChangeMode here


// constants
const TAU = 6.28318530;
const NAN = + +'javascript é uma merda kkkkkk';
const coordinateSystemMax = 400;
const coordinateSystemIts = 10;
const selectionScale = 7.5;

// TODO: could automate this
const curvesAmount = 10;

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



// maths
const pxToCoord = pixels => pixels / canvas.width        * coordinateSystemMax;
const coordToPx = coords => coords / coordinateSystemMax * canvas.width;


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
	if (event.button !== 0) return;
	if (event.target.id !== idCanvao) return;

	setClampedRelativeMousePos(event);

	// TODO: remove
	// selFimP.textContent = "começo";

	dragState.isDragging = true;
	if (gameData.isCursorCloseEnough) {
		gameData.hasSelection = true;
		gameData.selectionCol = "#FFFFFFFF";

		gameData.selection.startT = gameData.currentCurve.curveIndex + gameData.currentCurve.t;
		gameData.selection.endT  =  gameData.currentCurve.curveIndex + gameData.currentCurve.t;

	} else {
		gameData.hasSelection = false;

		hideSelectedText();
	}

	mouseMove(event);
}

const hideSelectedText = () => {
	selInicioP.textContent = `falso`
	selFimP.textContent  = ``
	selCompP.textContent = ``
	selAreaP.textContent = ``
}


const onMouseUp = (event) => {
	// gameData.objBeingHeld = null;

	// selFimP.textContent = "\xa0\xa0\xa0fim"

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

const accelerationOf = (start, cp1, cp2, end, t, dump) => {
	const deriv0 =  -6*t + 6
	const deriv1 =  18*t - 12
	const deriv2 = -18*t + 6
	const deriv3 =   6*t

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



	if (gameData.hasSelection) {
		let curI;
		curI = clamp(parseInt(gameData.selection.startT), 0, curvesAmount);
		selInicioP.textContent = `Início: Curva ${curI} t: ${(gameData.selection.startT-curI).toFixed(2)}`
		curI = clamp(parseInt(gameData.selection.endT), 0, curvesAmount);
		selFimP.textContent = `\xa0\xa0\xa0Fim: Curva ${curI} t: ${(gameData.selection.endT-curI).toFixed(2)}`
	}

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
const distance = (point0, point1) => {
	const pointsVecX = point1.x - point0.x;
	const pointsVecY = point1.y - point0.y;
	return Math.sqrt(pointsVecX * pointsVecX + pointsVecY * pointsVecY);
}


const subtract = (vec, x, y) => {
	vec.x -= x;
	vec.y -= y;
}

const scale = (vec, scale) => {
	vec.x *= scale;
	vec.y *= scale;
}

const rotate90DegCounterclockwise = vec => {
	const temp = vec.x;
	vec.x = -vec.y
	vec.y =  temp;
}

const rotate90DegClockwise = vec => {
	const temp = vec.x;
	vec.x =  vec.y
	vec.y = -temp;
}

const rotate180 = vec => {
	vec.x = -vec.x;
	vec.y = -vec.y;
}

// TODO: fast approximate normalize for 2D
const normalize = vec => {
	const len = magnitudeOf(vec);
	vec.x /= len;
	vec.y /= len;
}

const magnitudeOf = vec => Math.sqrt(vec.x * vec.x + vec.y * vec.y);

const isApprox = (v, dest) => isApproxThreshold(v, dest, 0.005);
const isApproxThreshold = (v, dest, threshold) => Math.abs(v - dest) < threshold;


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
	drawCircleIn(startLocal.x, startLocal.y, pointSize);

	for (let i = 1; i < spline.length; i += 3) {
		const cp1 = spline[i];
		const cp2 = spline[i + 1];
		const end = spline[i + 2];

		drawBezier(startLocal, cp1, cp2, end);

		ctx.lineWidth = 2;
		drawCircleIn(end.x, end.y, pointSize);

		const its = 6;
		// 0.2 -> 0.8
		for (let i = 1; i <= its - 2; ++i) {
			const t = i / (its - 1);
			
			bezierOf(startLocal, cp1, cp2, end, t, dump);
			drawCircleIn(dump.x, dump.y, pointSize * 0.3);
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

	if (dragState.isDragging) {
		gameData.selection.endT  = refCur.curveIndex + refCur.t;
	}


	if (currentMode != Modes.circunf && gameData.hasSelection)
	{
		drawSelection();
	}

	if (gameData.isCursorCloseEnough || (dragState.isDragging && gameData.hasSelection)) {
		ctx.lineWidth = 3;
		if (currentMode === Modes.selecao) drawNormalSelectionCursor(refCur, gameData.currentCurve.derivDump);
		else if (currentMode === Modes.ancoras) drawNormalAndTanCursor(refCur, gameData.currentCurve.derivDump);
		else if (currentMode === Modes.circunf) drawCircleAtCursor(refCur, gameData.currentCurve.derivDump);
		else console.error(`bad mode selected`);

		curP.textContent = `Sobre a curva: ${formatXYAsCoords(refCur.dump.x, refCur.dump.y)}`	;

		// done in drawCircleAtCursor
		// circunfP.textContent = `falso`;

	} else {
		curP.textContent = `Sobre a curva: falso`;

		circunfP.textContent = `falso`;
		radiusP.textContent = ``;
		radiusValP.textContent = ``

		document.body.style.cursor = 'default';
	}

	window.requestAnimationFrame(render);
	// ctx.setLineDash([5, 7]);
}



const drawNormalSelectionCursor = (refCur, derivDump) => {
	document.body.style.cursor = 'pointer';

	ctx.strokeStyle = "blue";
	drawCircleIn(refCur.dump.x, refCur.dump.y, pointSize * 0.4)

	derivativeOf(refCur.p0, refCur.p1, refCur.p2, refCur.p3, refCur.t, derivDump);
	normalize(derivDump);

	// normal is the derivative rotated 90 degrees counterclockwise
	const normal = { x: 0, y: 0 };
	copyXY(normal, derivDump);
	rotate90DegCounterclockwise(normal);

	const inverseNormal = { x: 0, y: 0 };
	copyXY(inverseNormal, derivDump);
	rotate90DegClockwise(inverseNormal);

	const normalScale = coordToPx(selectionScale);
	scale(normal, normalScale);
	scale(inverseNormal, normalScale);

	ctx.strokeStyle = "lime";
	drawLineBetween(refCur.dump.x, refCur.dump.y, refCur.dump.x + inverseNormal.x, refCur.dump.y + inverseNormal.y);
	drawLineBetween(refCur.dump.x, refCur.dump.y, refCur.dump.x + normal.x, refCur.dump.y + normal.y);
}

const drawNormalAndTanCursor = (refCur, derivDump) => {
	document.body.style.cursor = 'pointer';

	ctx.strokeStyle = "blue";
	drawCircleIn(refCur.dump.x, refCur.dump.y, pointSize * 0.4)

	derivativeOf(refCur.p0, refCur.p1, refCur.p2, refCur.p3, refCur.t, derivDump);
	normalize(derivDump);

	// normal is the derivative rotated 90 degrees counterclockwise
	const normal = { x: 0, y: 0 }
	copyXY(normal, derivDump);
	rotate90DegCounterclockwise(normal);

	const mouseToCurveX = mousePos.x - refCur.dump.x;
	const mouseToCurveY = mousePos.y - refCur.dump.y;

	// console.log(`n: ${formatVec(normal)} ${formatXY(mouseToCurveX, mouseToCurveY)}`);
	const dotProd = dot(normal.x, normal.y, mouseToCurveX, mouseToCurveY)
	if (dotProd < 0) {
		// TODO: rotate180
		rotate180(normal);
		rotate180(derivDump);
	}

	const normalScale = coordToPx(selectionScale);
	scale(derivDump, normalScale);
	scale(normal, normalScale);

	ctx.strokeStyle = "yellow";
	drawLineBetween(refCur.dump.x, refCur.dump.y, refCur.dump.x + derivDump.x, refCur.dump.y + derivDump.y);

	// draw normal
	ctx.strokeStyle = "lime";
	drawLineBetween(refCur.dump.x, refCur.dump.y, refCur.dump.x + normal.x, refCur.dump.y + normal.y);
}

const drawCircleAtCursor = (refCur, derivDump) => {
	document.body.style.cursor = 'default';
	
	const normalScale = coordToPx(selectionScale);
	
	ctx.strokeStyle = "blue";
	drawCircleIn(refCur.dump.x, refCur.dump.y, pointSize * 0.4);

	derivativeOf(refCur.p0, refCur.p1, refCur.p2, refCur.p3, refCur.t, derivDump);
	const speedX   = pxToCoord(derivDump.x);
	const speedY   = pxToCoord(derivDump.y);
	const speedLen = pxToCoord(magnitudeOf(derivDump));

	normalize(derivDump);
	const normalX = derivDump.x;
	const normalY = derivDump.y;

	scale(derivDump, normalScale * 3);
	const derivToDrawX = derivDump.x;
	const derivToDrawY = derivDump.y;

	accelerationOf(refCur.p0, refCur.p1, refCur.p2, refCur.p3, refCur.t, derivDump);
	const accX = pxToCoord(derivDump.x);
	const accY = pxToCoord(derivDump.y);

	normalize(derivDump);
	scale(derivDump, normalScale * 2);
	const accToDrawX = derivDump.x;
	const accToDrawY = derivDump.y;

	const determinant = speedX * accY - speedY * accX;
	const curvature = determinant / (speedLen * speedLen * speedLen)

	const radius = Math.abs(1 / curvature);

	const pxRadius = coordToPx(radius);

	if (isApproxThreshold(curvature, 0, 0.0003)) {
		// draw line
		circunfP.textContent = `≅0 m⁻¹`;

		derivDump.x = normalX;
		derivDump.y = normalY;
		scale(derivDump, canvas.width * 2);
		const lineStartX = refCur.dump.x + derivDump.x;
		const lineStartY = refCur.dump.y + derivDump.y;

		rotate180(derivDump);
		const lineEndX = refCur.dump.x + derivDump.x;
		const lineEndY = refCur.dump.y + derivDump.y;

		ctx.strokeStyle = "orange";
		drawLineBetween(lineStartX, lineStartY, lineEndX, lineEndY);

		radiusP.textContent = `Raio:`;
		radiusValP.textContent = `lim r → ∞ m`
	} else {
		derivDump.x = normalX;
		derivDump.y = normalY;
		scale(derivDump, normalScale);
		rotate90DegCounterclockwise(derivDump);
		if (curvature < 0) {
			rotate180(derivDump);
		}

		// draw circle and normal
		ctx.strokeStyle = "yellow";
		drawLineBetween(refCur.dump.x, refCur.dump.y, refCur.dump.x + derivDump.x, refCur.dump.y + derivDump.y);

		// undoes normalScale, scales by pxRadius
		scale(derivDump, pxRadius / normalScale);
		const circlePosX = refCur.dump.x + derivDump.x;
		const circlePosY = refCur.dump.y + derivDump.y;

		circunfP.textContent = `${curvature.toFixed(4)} m⁻¹`;
		ctx.fillStyle = "yellow";
		fillCircleIn(circlePosX, circlePosY, pointSize * 0.5);
		drawCircleIn(circlePosX, circlePosY, pxRadius);

		radiusP.textContent = `Raio:`;
		radiusValP.textContent = `${radius.toFixed(2)} m`
	}


	// deriv
	ctx.strokeStyle = "blue";
	drawLineBetween(refCur.dump.x, refCur.dump.y, refCur.dump.x + derivToDrawX, refCur.dump.y + derivToDrawY);

	// acceleration
	ctx.strokeStyle = "snow";
	drawLineBetween(refCur.dump.x, refCur.dump.y, refCur.dump.x + accToDrawX, refCur.dump.y + accToDrawY);
}

const drawSelection = () => {

	let startSplineIndex = parseInt(clamp(gameData.selection.startT, 0, curvesAmount));
	let endSplineIndex   = parseInt(clamp(gameData.selection.endT,   0, curvesAmount));

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
	const sp1 = spline[realStartI + 1];
	const sp2 = spline[realStartI + 2];
	const sp3 = spline[realStartI + 3];

	// TODO: put its at like 4 and see if I can draw the area and if its correct
	// const its = 4;
	// const its = 11;
	const its = 31;
	const dumpForSelection = { x: 0, y: 0 };
	const lastIt = {};

	let length = 0;

	// TODO: MAKE THIS SHIT LESS BAD FOR THE LOVE OF GOD
	const ithStart = parseInt(lerp(0, its - 1, startT));
	const ithEnd   = endSplineIndex != startSplineIndex ? its - 1 : (parseInt(lerp(0, its - 1, endT)));

	// TODO: separate function
	const drawSelectionLine = currentMode == Modes.selecao ? drawSelectionAreaSegment : drawSelectionLineSegment;

	const tStart = ithStart / (its - 1);
	// start at the point
	// TODO: draw tangent from point forwards
	bezierOf(sp0, sp1, sp2, sp3, tStart, dumpForSelection);
	copyXY(lastIt, dumpForSelection);
	// const firstIt = { x: dumpForSelection.x, y: dumpForSelection.y };


	// globalCrappyQueue.length = 0;
	if (currentMode != Modes.selecao) {
		startPathIn(dumpForSelection.x, dumpForSelection.y);
	} else {
		const curveX = dumpForSelection.x;
		const curveY = dumpForSelection.y;

		derivativeOf(sp0, sp1, sp2, sp3, tStart, dumpForSelection);
		normalize(dumpForSelection);
		rotate90DegClockwise(dumpForSelection);
		scale(dumpForSelection, coordToPx(selectionScale));

		// TODO: call this to debug retarded logic
		// globalCrappyQueue = []
		
		// if (globalCrappyQueue.length > 0)
		// 	console.log("CRAP " + globalCrappyQueue.length);

		startPathIn(curveX + dumpForSelection.x, curveY + dumpForSelection.y);
		globalCrappyQueue.push(curveX + dumpForSelection.x);
		globalCrappyQueue.push(curveY + dumpForSelection.y);
		
		rotate180(dumpForSelection);
		globalCrappyQueue.push(curveX + dumpForSelection.x);
		globalCrappyQueue.push(curveY + dumpForSelection.y);
	}

	// console.log(`draw START curve ${startSplineIndex}`); // index: realStartI

	// console.log(`start T ${startT.toFixed(2)}, ${ithStart}, inv ${lerp(0, its, startT).toFixed(2)}`);
	ctx.lineWidth = 4;
	for (let j = ithStart; j <= ithEnd; ++j) {
		const t = j / (its - 1);

		drawSelectionLine(sp0, sp1, sp2, sp3, t, dumpForSelection);
		const localLen = distance(dumpForSelection, lastIt);
		length += localLen;
		copyXY(lastIt, dumpForSelection);
	}


	// DRAWS curves in between, from t 0 to 1
	ctx.lineWidth = 4;
	for (let i = firstFull; i <= lastFull; ++i) {

		const realI = i * 3;
		const p0 = spline[realI];
		const p1 = spline[realI + 1];
		const p2 = spline[realI + 2];
		const p3 = spline[realI + 3];

		bezierOf(p0, p1, p2, p3, 0, dumpForSelection);
		copyXY(lastIt, dumpForSelection);

		
		for (let j = 1; j < its; ++j) {
			const t = j / (its - 1);
			
			drawSelectionLine(p0, p1, p2, p3, t, dumpForSelection);
			const localLen = distance(dumpForSelection, lastIt);
			length += localLen;
			copyXY(lastIt, dumpForSelection);
		}	
	}


	const hasMoreThanOneCurve = endSplineIndex > startSplineIndex;
	if (hasMoreThanOneCurve) {

		// console.log(`draw END curve ${endSplineIndex}`); // index realEndI
		const ep0 = spline[realEndI];
		const ep1 = spline[realEndI + 1];
		const ep2 = spline[realEndI + 2];
		const ep3 = spline[realEndI + 3];

		ctx.lineWidth = 4;

		// TODO: check how can I get the last entry here from the last curve to calculate the thing
		const lastIthEnd = (parseInt(lerp(0, its - 1, endT)));
		for (let j = 1; j <= lastIthEnd; ++j) {
			const t = j / (its - 1);

			drawSelectionLine(ep0, ep1, ep2, ep3, t, dumpForSelection);
			const localLen = distance(dumpForSelection, lastIt);
			length += localLen;
			copyXY(lastIt, dumpForSelection);
		}
	}


	const realLength = pxToCoord(length);
	selCompP.textContent = `Comprimento: ${realLength.toFixed(4)} m`
	selAreaP.textContent = `\xa0\xa0\xa0\xa0\xa0\xa0\xa0Área: ${(realLength * selectionScale * 2).toFixed(2)} m²`

	// ctx.strokeStyle = "#FFFFFFBA"
	// ctx.strokeStyle = "#00FFFFBA"
	ctx.strokeStyle = currentMode == Modes.selecao ? "#00FFFFBA" : "white";

	// TODO: make this less terrible
	if (currentMode == Modes.selecao) {
		// dequeue all
		for (let i = 0; i < globalCrappyQueue.length; i += 2) {
			const y = globalCrappyQueue.pop();
			const x = globalCrappyQueue.pop();

			addToPathIn(x, y);
		}

		ctx.strokeStyle = "#00FFFFBA";
		ctx.fillStyle   = "#00FFFFBA";
		// ctx.closePath();
		ctx.fill();
		// ctx.stroke();
	} else {
		
		ctx.strokeStyle = "white";
		ctx.stroke();
	}

	if (isApprox(length, 0)) {
		hideSelectedText()
		return;
	}

} // END DRAW SELECTION

const drawSelectionLineSegment = (p0, p1, p2, p3, t, dump) => {
	bezierOf(p0, p1, p2, p3, t, dump);
	addToPathIn(dump.x, dump.y);
}

let globalCrappyQueue = [];

const drawSelectionAreaSegment = (p0, p1, p2, p3, t, dump) => {
	bezierOf(p0, p1, p2, p3, t, dump);
	const bezX = dump.x;
	const bezY = dump.y;

	derivativeOf(p0, p1, p2, p3, t, dump);

	normalize(dump);
	rotate90DegClockwise(dump)
	scale(dump, coordToPx(selectionScale));
	addToPathIn(bezX + dump.x,  bezY + dump.y);
	
	rotate180(dump)
	// addToPathIn(bezX + dump.x,  bezY + dump.y);
	globalCrappyQueue.push(bezX + dump.x);
	globalCrappyQueue.push(bezY + dump.y);

	dump.x = bezX;
	dump.y = bezY;
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
		const ourLen = i / coordinateSystemIts * coordinateSystemMax;

		// horizontal cartesian coordinates
		drawLineBetween(ourPeriod, canvas.height, ourPeriod, canvas.height - coordinateSystemMarkLength)
		ctx.fillText(ourLen.toFixed(0), ourPeriod - 6, canvas.height - 15);
		
		// vertical cartesian coordinates
		drawLineBetween(0, ourPeriod, coordinateSystemMarkLength, ourPeriod);
		ctx.fillText(ourLen.toFixed(0), 15, canvas.height - ourPeriod + 6);
	}
}

const drawBezier = (startLocal, cp1, cp2, end) => {
	ctx.beginPath();
	ctx.moveTo(startLocal.x, startLocal.y);
	ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
	ctx.stroke();
}

const drawCircleIn = (x, y, size) => {
	ctx.beginPath();
	ctx.arc(x, y, size, 0, TAU);
	ctx.stroke();
}

const fillCircleIn = (x, y, size) => {
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

// const drawPath = () => {
// 	ctx.stroke();
// }




//  ########################################################################
//  ############################# BOOTSTRAP ################################
//  ########################################################################
window.addEventListener("mousedown", onMouseDown);
window.addEventListener("mouseup",   onMouseUp);
window.addEventListener("mousemove", mouseMove);



img.onload = () => {
	// const width  = img.width * 1.3;
	canvas.width = canvas.height = 911;

	window.requestAnimationFrame(render);

	// start in circunferencia
	modeSelect.value = "circunf";
	changeMode();
}



const formatVec = vec => formatXY(vec.x, vec.y);
const formatXY  = (x, y) => `(${x.toFixed(2)},${y.toFixed(2)})`

const formatXYAsCoords = (x, y, digits) => {
	const newX = pxToCoord(x);
	const newY = pxToCoord(canvas.width - y);
	return `(X: ${newX.toFixed(digits)}, Y: ${newY.toFixed(digits)})`
}

