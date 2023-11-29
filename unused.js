
const start = { x: 1110, y: 889 };
const cp1 =   { x: 933,  y: 755 };
const cp2 =   { x: 825,  y: 696 };
const end =   { x: 965,  y: 547 };


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

	const newX = globalStart.x * bernstein0 +
	               globalCp1.x * bernstein1 +
							   globalCp2.x * bernstein2 +
							   globalEnd.x * bernstein3;

	const newY = globalStart.y * bernstein0 +
	               globalCp1.y * bernstein1 +
							   globalCp2.y * bernstein2 +
							   globalEnd.y * bernstein3;

	return { x: newX, y: newY };
}


const sampleCurveYAt = (t) => {
	const t2 = t * t;
	const t3 = t2 * t;

	const bernstein0 =   -t3 + 3*t2 - 3*t + 1;
	const bernstein1 =  3*t3 - 6*t2 + 3*t;
	const bernstein2 = -3*t3 + 3*t2;
	const bernstein3 =    t3;
	return globalStart.y * bernstein0 +
		globalCp1.y * bernstein1 +
		globalCp2.y * bernstein2 +
		globalEnd.y * bernstein3;
}

const sampleCurveXAt = (t) => {
	const t2 = t * t;
	const t3 = t2 * t;

	const bernstein0 =   -t3 + 3*t2 - 3*t + 1;
	const bernstein1 =  3*t3 - 6*t2 + 3*t;
	const bernstein2 = -3*t3 + 3*t2;
	const bernstein3 =    t3;
	return globalStart.x * bernstein0 +
		globalCp1.x * bernstein1 +
		globalCp2.x * bernstein2 +
		globalEnd.x * bernstein3;
}




/** @param {Number} x (x is in pixel coordinates) */
const bissectionYForX = (x) => {
	x = gridXToLocalX(x);
	
	let bisectionLow  = 0;
	let bisectionHigh = 1;
	let bisectionMid = 0.5;

	let xSample = gridXToLocalX(sampleCurveXAt(bisectionMid));
	for (let i = 0; i < 50; ++i) {

		const difference = Math.abs(xSample - x);
		if (difference < 0.0001) {
			// console.log(`took ${i} to find t: ${bisectionMid}\nx: ${xSample} ~= ${x}\ny: ${sampleCurveYAt(bisectionMid)}`);
			return sampleCurveYAt(bisectionMid);
		}

		bisectionMid = (bisectionHigh + bisectionLow) * 0.5;
		xSample = gridXToLocalX(sampleCurveXAt(bisectionMid));

		if (xSample > x)
			bisectionHigh = bisectionMid;
		else
			bisectionLow  = bisectionMid;
	}

	return sampleCurveYAt(bisectionMid);
}

/** @param {Number} x (x is in pixel coordinates) */
const invertedBissectionYForX = (x) => {
	x = gridXToLocalX(x);
	
	let bisectionLow  = 0;
	let bisectionHigh = 1;
	let bisectionMid = 0.5;

	let xSample = gridXToLocalX(sampleCurveXAt(1 - bisectionMid));
	for (let i = 0; i < 50; ++i) {

		const difference = Math.abs(xSample - x);
		if (difference < 0.0001) {
			return sampleCurveYAt(1 - bisectionMid);
		}

		bisectionMid = (bisectionHigh + bisectionLow) * 0.5;
		xSample = gridXToLocalX(sampleCurveXAt(1 - bisectionMid));

		if (xSample > x)
			bisectionHigh = bisectionMid;
		else
			bisectionLow  = bisectionMid;
	}

	return sampleCurveYAt(1 - bisectionMid);
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

// called in render()
const updateMathData = () => {
	mathData.n = nSlider.value;
	mathData.h = calculateHForN(mathData.n);
}


// called in render()
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

