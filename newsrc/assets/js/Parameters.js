/**
 * ------------------------------------------
 * Parameters.js
 * Definition of a particle
 *
 * ------------------------------------------
*/

/**
 * Constructor
 * Initialize a particle
 */
var Parameters = function(){
	this._dt = 1/60;	// 60 is the selected fps. Change if need be.
	this._mass = 0.8;
	this._kernelSize = 0.5;
	this._gasConstantK = 1;
	this._viscosityConstant = 30;
	this._restDensity = 30;
	this._sigma = 72*Math.exp(-3);
	this._nThreshold = 0.02;
	this._gravityX = 0;
	this._gravityY = -9.82;

/**	this._leftBound = -2;
	this._rightBound = 2;
	this._bottomBound = 0;
	this._topBound = 5;
	this._wallDamper = 0.005;
**/
}

/**
 * Prototype chain.
 */
Parameters.prototype.constructor = Parameters;
