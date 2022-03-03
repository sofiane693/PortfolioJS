

(function () {

	var ParticleNetworkAnimation, PNA;
	ParticleNetworkAnimation = PNA = function () { };

	PNA.prototype.init = function (element) {
		this.$el = $(element);

		this.container = element;
		this.canvas = document.createElement('canvas');
		this.sizeCanvas();
		this.container.appendChild(this.canvas);
		this.ctx = this.canvas.getContext('2d');
		this.particleNetwork = new ParticleNetwork(this);

		this.bindUiActions();

		return this;
	};

	PNA.prototype.bindUiActions = function () {
		$(window).on('resize', function () {

			
			this.sizeCanvas();
			this.particleNetwork.createParticles();
		}.bind(this));
	};

	PNA.prototype.sizeCanvas = function () {
		this.canvas.width = this.container.offsetWidth;
		this.canvas.height = this.container.offsetHeight;
	};

	var Particle = function (parent, x, y) {
		this.network = parent;
		this.canvas = parent.canvas;
		this.ctx = parent.ctx;
		
		this.radius = getLimitedRandom(1.5, 2.5);
		this.opacity = 0,2;
		this.x = x || Math.random() * this.canvas.width;
		this.y = y || Math.random() * this.canvas.height;
		this.velocity = {
			x: (Math.random() - 0.5) * parent.options.velocity,
			y: (Math.random() - 0.5) * parent.options.velocity
		};
	};

	Particle.prototype.update = function () {
		if (this.opacity < 1) {
			this.opacity += 0.01;
		} else {
			this.opacity = 1;
		}
		
		if (this.x > this.canvas.width + 100 || this.x < -100) {
			this.velocity.x = -this.velocity.x;
		}
		if (this.y > this.canvas.height + 100 || this.y < -100) {
			this.velocity.y = -this.velocity.y;
		}

		
		this.x += this.velocity.x;
		this.y += this.velocity.y;
	};

	Particle.prototype.draw = function () {
		// création des étoiles 
		this.ctx.beginPath();
		this.ctx.fillStyle = this.particleColor;
		this.ctx.globalAlpha = this.opacity;
		this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
		this.ctx.fill();
	};

	var ParticleNetwork = function (parent) {
		this.options = {
			velocity: 1,
			density: 10000,
			netLineDistance: 210,
			netLineColor: '#929292',
			particleColor: '#929292',
			
		};
		this.canvas = parent.canvas;
		this.ctx = parent.ctx;

		this.init();
	};

	ParticleNetwork.prototype.init = function () {

		this.createParticles(true);


		this.animationFrame = requestAnimationFrame(this.update.bind(this));

		this.bindUiActions();
	};

	ParticleNetwork.prototype.createParticles = function (isInitial) {

		var me = this;
		this.particles = [];
		var quantity = this.canvas.width * this.canvas.height / this.options.density;

		if (isInitial) {
			var counter = 0;
			clearInterval(this.createIntervalId);
			this.createIntervalId = setInterval(function () {
				if (counter < quantity - 1) {

					this.particles.push(new Particle(this));
				}
				else {
					clearInterval(me.createIntervalId);
				}
				counter++;
			}.bind(this), 250);
		}
		else {

			for (var i = 0; i < quantity; i++) {
				this.particles.push(new Particle(this));
			}
		}
	};

	ParticleNetwork.prototype.createInteractionParticle = function () {

		this.interactionParticle = new Particle(this);
		this.interactionParticle.velocity = {
			x: 0,
			y: 0
		};
		this.particles.push(this.interactionParticle);
		return this.interactionParticle;
	};

	ParticleNetwork.prototype.removeInteractionParticle = function () {

		var index = this.particles.indexOf(this.interactionParticle);
		if (index > -1) {

			this.interactionParticle = undefined;
			this.particles.splice(index, 1);
		}
	};

	ParticleNetwork.prototype.update = function () {
		if (this.canvas) {

			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this.ctx.globalAlpha = 1;


			for (var i = 0; i < this.particles.length; i++) {
				for (var j = this.particles.length - 1; j > i; j--) {
					var distance, p1 = this.particles[i], p2 = this.particles[j];

					distance = Math.min(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));
					if (distance > this.options.netLineDistance) {
						continue;
					}


					distance = Math.sqrt(
						Math.pow(p1.x - p2.x, 2) +
						Math.pow(p1.y - p2.y, 2)
					);
					if (distance > this.options.netLineDistance) {
						continue;
					}

					this.ctx.beginPath();
					this.ctx.strokeStyle = this.options.netLineColor;
					this.ctx.globalAlpha = (this.options.netLineDistance - distance) / this.options.netLineDistance * p1.opacity * p2.opacity;
					this.ctx.lineWidth = 0.7;
					this.ctx.moveTo(p1.x, p1.y);
					this.ctx.lineTo(p2.x, p2.y);
					this.ctx.stroke();
				}
			}


			for (var i = 0; i < this.particles.length; i++) {
				this.particles[i].update();
				this.particles[i].draw();
			}

			if (this.options.velocity !== 0) {
				this.animationFrame = requestAnimationFrame(this.update.bind(this));
			}

		}
		else {
			cancelAnimationFrame(this.animationFrame);
		}
	};

	ParticleNetwork.prototype.bindUiActions = function () {
		this.spawnQuantity = 3;
		this.mouseIsDown = false;
		this.touchIsMoving = false;

		this.onMouseMove = function (e) {
			if (!this.interactionParticle) {
				this.createInteractionParticle();
			}
			this.interactionParticle.x = e.offsetX;
			this.interactionParticle.y = e.offsetY;
		}.bind(this);

		this.onTouchMove = function (e) {
			e.preventDefault();
			this.touchIsMoving = true;
			if (!this.interactionParticle) {
				this.createInteractionParticle();
			}
			this.interactionParticle.x = e.changedTouches[0].clientX;
			this.interactionParticle.y = e.changedTouches[0].clientY;
		}.bind(this);

		this.onMouseDown = function (e) {
			this.mouseIsDown = true;
			var counter = 0;
			var quantity = this.spawnQuantity;
			var intervalId = setInterval(function () {
				if (this.mouseIsDown) {
					if (counter === 1) {
						quantity = 1;
					}
					for (var i = 0; i < quantity; i++) {
						if (this.interactionParticle) {
							this.particles.push(new Particle(this, this.interactionParticle.x, this.interactionParticle.y));
						}
					}
				}
				else {
					clearInterval(intervalId);
				}
				counter++;
			}.bind(this), 50);
		}.bind(this);

		this.onTouchStart = function (e) {
			e.preventDefault();
			setTimeout(function () {
				if (!this.touchIsMoving) {
					for (var i = 0; i < this.spawnQuantity; i++) {
						this.particles.push(new Particle(this, e.changedTouches[0].clientX, e.changedTouches[0].clientY));
					}
				}
			}.bind(this), 200);
		}.bind(this);

		this.onMouseUp = function (e) {
			this.mouseIsDown = false;
		}.bind(this);

		this.onMouseOut = function (e) {
			this.removeInteractionParticle();
		}.bind(this);

		this.onTouchEnd = function (e) {
			e.preventDefault();
			this.touchIsMoving = false;
			this.removeInteractionParticle();
		}.bind(this);

	
	};





	var getLimitedRandom = function (min, max, roundToInteger) {
		var number = Math.random() * (max - min) + min;
		if (roundToInteger) {
			number = Math.round(number);
		}
		return number;
	};

	var returnRandomArrayitem = function (array) {
		return array[Math.floor(Math.random() * array.length)];
	};

	pna = new ParticleNetworkAnimation(); pna.init($('.particle-network-animation')[0]);

	

}());