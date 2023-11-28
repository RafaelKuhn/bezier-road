
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

const lerp = (a, b, t) => (1 - t) * a + t * b;
const inverseLerp = (a, b, v) => (v - a) / (b - a);

const gridXToLocalX = (x) => x / canvas.width * coordinateSystemMax;
const gridYToLocalY = (y) => coordinateSystemMax - (y / canvas.height * coordinateSystemMax);

const localXToGridX = (x) => x / coordinateSystemMax * canvas.width;
const localYToGridY = (y) => canvas.height - (y / coordinateSystemMax * canvas.width);

// Points for the curve
// const start = { x: localXToGridX(1.0), y: localYToGridY(4.5) };
// const end =   { x: localXToGridX(7.0), y: localYToGridY(3.5) };
// const cp1 =   { x: localXToGridX(2.0), y: localYToGridY(1.0) };
// const cp2 =   { x: localXToGridX(6.0), y: localYToGridY(7.0) };

// const start = { x: 839, y: 680 };
// const cp1 =   { x: 718, y: 580 };
// const cp2 =   { x: 638, y: 540 };
// const end =   { x: 747, y: 423 };

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

	{ x: 571, y: 219 },
	{ x: 493, y: 195 },
	{ x: 454, y: 192 }, // 27

	{ x: 368, y: 223 },
	{ x: 287, y: 190 },
	{ x: 238, y: 245 }, // 30

	{ x: 187, y: 273 },
	{ x: 146, y: 216 },
	{ x:  76, y: 148 }, // 33
]


// const it = 12;
// const start = { x: spline[it].x, y: spline[it].y } ;
// const cp1 =   { x: spline[it - 1].x, y: spline[it - 1].y } ;
// const cp2 =   { x: spline[it - 2].x, y: spline[it - 2].y } ;
// const end =   { x: spline[it - 3].x, y: spline[it - 3].y } ;

// TODO: get rid
const globalStart = { x: canvas.width - 15, y: canvas.height - 15 } ;
const globalCp1 =   { x: canvas.width - 15, y: canvas.height - 15 } ;
const globalCp2 =   { x: canvas.width - 15, y: canvas.height - 15 } ;
const globalEnd =   { x: canvas.width - 15, y: canvas.height - 15 } ;


// maths
const pxToCoord = px => {
	return px / canvas.width * coordinateSystemMax;
}

const calculateHForN = n => {
	const b = gridXToLocalX(globalEnd.x);
	const a = gridXToLocalX(globalStart.x);
	return Math.abs(b - a) / (n - 1);
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

/** @return {Number} */
const clamp = (x, min, max) => {
	return Math.max(min, Math.min(x, max));
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

let closestPoint = null;

/** @param {MouseEvent} event */
const mouseMove = (event) => {
	const mousePos = getClampedRelativeMousePos(event);

	
	// first
	const firstPoint = spline[0];
	let minDistSq = distanceSq(firstPoint.x, firstPoint.y, mousePos.x, mousePos.y);
	
	let index = 0;
	closestPoint = firstPoint;

	const penultimateAnchorIndex = spline.length - 3;
	for (let i = 3; i < penultimateAnchorIndex; i += 3) {
		const point = spline[i];
		let distToIthSq = distanceSq(point.x, point.y, mousePos.x, mousePos.y)

		if (distToIthSq < minDistSq) {
			closestPoint = point;
			minDistSq = distToIthSq;
			index = i;
		}
	}

	// last
	const lastIndex = spline.length - 1;
	const lastPoint = spline[lastIndex];
	let lastMinDistSq = distanceSq(lastPoint.x, lastPoint.y, mousePos.x, mousePos.y);
	if (lastMinDistSq < minDistSq) {
		closestPoint = lastPoint;
		minDistSq = lastMinDistSq;
		index = lastIndex;
	}

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

	const objectBeingHovered = getNearbyClosestObjectOrNull(mousePos);
	document.body.style.cursor = objectBeingHovered == null ? "default" : "pointer";

	if (gameData.isHolding) {
		gameData.objBeingHeld.x = mousePos.x;
		gameData.objBeingHeld.y = mousePos.y;
		gameData.isValid = getIsValidArea();
		console.log(gameData.objBeingHeld);
	}

	render();
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

const drawStuff = () => {

	// reset
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.setLineDash([0]);
	// ctx.lineWidth = 3;

	ctx.drawImage(img, 0, 0, canvas.width, canvas.height);


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


	// draw spline
	ctx.strokeStyle = "red";
	let startLocal = spline[0];
	dotIn(startLocal.x, startLocal.y);
	for (let i = 1; i < spline.length; i += 3) {
		const cp1 = spline[i];
		const cp2 = spline[i + 1];
		const end = spline[i + 2];

		ctx.beginPath();
		ctx.moveTo(startLocal.x, startLocal.y);
		ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
		ctx.stroke();

		dotIn(end.x, end.y);

		startLocal = end;
	}

	if (closestPoint) {
		ctx.strokeStyle = "white";
		ctx.beginPath();
		ctx.arc(closestPoint.x, closestPoint.y, pointSize * 3, 0, TAU);
		ctx.stroke();
	}



	// // cubic bézier curve
	// ctx.lineWidth = 3;
	// // ctx.strokeStyle = gameData.isValid ? "black" : "red";
	// ctx.strokeStyle = "black";
	// ctx.beginPath();
	// ctx.moveTo(start.x, start.y);
	// ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
	// ctx.stroke();

	// // dashed lines
	// ctx.lineWidth = 2;
	// ctx.setLineDash([5, 7]);
	// // ctx.strokeStyle = "black";
	// ctx.strokeStyle = "white";

	// ctx.beginPath();
	// ctx.moveTo(start.x, start.y)
	// ctx.lineTo(cp1.x, cp1.y)
	// ctx.stroke();

	// ctx.beginPath();
	// ctx.moveTo(end.x, end.y)
	// ctx.lineTo(cp2.x, cp2.y)
	// ctx.stroke();

	// // point in the middle
	// // ctx.setLineDash([0]);
	// // const point = sampleCurveAt(0.5);
	// // ctx.beginPath();
	// // ctx.arc(point.x, point.y, pointSize, 0, TAU);
	// // ctx.stroke();

	// // start and end points
	// ctx.fillStyle = "blue";
	// ctx.beginPath();
	// ctx.arc(start.x, start.y, pointSize, 0, TAU);
	// ctx.arc(end.x,   end.y,   pointSize, 0, TAU);
	// ctx.fill();

	// // control points
	// ctx.fillStyle = "red";
	// ctx.beginPath();
	// ctx.arc(cp1.x, cp1.y, pointSize, 0, TAU);
	// ctx.arc(cp2.x, cp2.y, pointSize, 0, TAU);
	// ctx.fill();




}

const dotIn = (x, y) => {
	ctx.beginPath();
	ctx.arc(x, y, pointSize, 0, TAU);
	ctx.stroke();
}

const updateDom = () => {
	spanN.textContent = mathData.n - 1;
	if (gameData.isValid) {
		spanH.textContent = mathData.h.toFixed(4);
		spanH.style.color = "black";
		samplesDiv.style.display = "block";
	}
	
	else {
		spanH.textContent	= NAN;
		spanH.style.color = "red"
		samplesDiv.style.display = "none";
	}
}

const render = () => {
	drawStuff();
	updateMathData();
	updateDom();
}

//  ########################################################################
//  ############################# BOOTSTRAP ################################
//  ########################################################################
window.addEventListener("mousedown", onMouseDown);
window.addEventListener("mouseup",   onMouseUp);
window.addEventListener("mousemove", mouseMove);

nSlider.addEventListener("mousemove", render);

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

	render();
}




