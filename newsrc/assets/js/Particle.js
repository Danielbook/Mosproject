/**
 * ------------------------------------------
 * particle.js
 * Definition of a particle
 * 
 * ------------------------------------------ 
*/

/**
 * Constructor
 * Initialize a particle
 */
var Particle = function(){
	this._density = 0;
	this._positionX = 0;
	this._positionY = 0;
	this._velocityX = 0;
	this._velocityY = 0;
	this._pressure = 0;
	this._forceX = 0;
	this._forceY = 0;
	this.cs = 0;
}

/**
 * Prototype chain.
 */
Particle.prototype.constructor = Particle;