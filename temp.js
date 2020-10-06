var sprite;
var game;
var config;
var animation;
var sound = {};

var BOARD_WIDTH = 4000;
var BOARD_HEIGHT = 2000;
var SPEED;
var MAX_LEVEL;
var LEVEL;
var SCORE_PER_LEVEL;
var GAME_STATUS
var TEST_MODE = false;
var MUTE = false;

var board = document.getElementById('board');
var statusBoard = document.getElementById('gameStatus');
var boardCtx = board.getContext('2d');
var statusBoardCtx = statusBoard.getContext('2d');

board.width = BOARD_WIDTH;
board.height = BOARD_HEIGHT;
statusBoard.width = window.innerWidth * 2;
statusBoard.height = window.innerHeight * 2;

function init() {
	sprite = new Image();
	sprite.onload = () => {
	    game = new Game();
		reset(); 
	}
	sprite.src = './sprite.png';
}

function reset() {
	SPEED = 15;
	MAX_LEVEL = 8;
	LEVEL = 1;
	SCORE_PER_LEVEL = 100;
	GAME_STATUS = 'PAUSE';
	setGameConfig();
	setSounds();
    game.ready();
}

function setSounds() {
	sound.bg = document.getElementById('bg-mp3');
	sound.bg.volume = 0.15;
	sound.bg.currentTime = 0;

	sound.jump = document.getElementById('jump-mp3');
	sound.jump.volume = 0.3;
}

function setGameConfig() {
	config = {
		'BG': {
			'TOP' : {
				speed : 5,
				frame: [5, 205],
				frameWidth: sprite.width - 10,
				frameHeight: 580,
			},
			'BOTTOM' : {
				frame: [5, 785],
				frameWidth: sprite.width - 10,
				frameHeight: 180,
			},
		},
		'PLAYER': {
			scale: 1.5,
			jumpHeight: 650,
			jumpSpeed: 30,
			variants :{
				'STAND': {
					frame: [2, 0],
					frameWidth: 102,
					frameHeight: 197,
					position : { x: 100, y: board.height - 630 },
				},
				'MOVE': {
					frame: [104, 18],
					frameWidth: 104,
					frameHeight: 179,
					position : { x: 80, y: board.height - 630 + 18 },
				},
				'MOVE_FRONT': {
					frame: [208, 18],
					frameWidth: 104,
					frameHeight: 179,
					position : { x: 100, y: board.height - 630 + 18 },
				},
				'JUMP': {
					frame: [312, 42],
					frameWidth: 122,
					frameHeight: 155,
					position : { x: 100, y: board.height - 630 + 42 },
				},
				'DEAD': {
					frame: [434, 42],
					frameWidth: 156,
					frameHeight: 145,
					position : { x: 100, y: board.height - 750  },
				}
			}
		},
		'STONE_SMALL': {
			scale: 1.5,
			frameWidth: 148,
			frameHeight: 108,
			position : { x: BOARD_WIDTH, y: board.height - 545 },
			variants: [{
				frame: [605, 0],
			},
			{
				frame: [753, 0],
			},
			{
				frame: [901, 0],
			},
			{
				frame: [1049, 0],
			}],
		},
		'STONE_BIG': {
			scale: 1.5,
			frameWidth: 184,
			frameHeight: 125,
			position : { x: BOARD_WIDTH, y: board.height - 560 },
			variants: [{
				frame: [1197, 0],
			},
			{
				frame: [1381, 0],
			},
			{
				frame: [1565, 0],
			},
			{
				frame: [1749, 0],
			}],
		}
    }
}

function clone(data) {
	return JSON.parse(JSON.stringify(data));
}

function audioController(action, audio) {
	if (!audio || MUTE) return;
	if (action === 'PLAY' && GAME_STATUS === 'RESUME') audio.play();
	else if (action === 'STOP') audio.pause();
}

function Game() {

	function ScoreBoard() {
		let scoreBoard = {};

		let modules = {
			update: function () {
				if (!scoreBoard.startTime) scoreBoard.startTime = new Date();
				let template = '000000';
				let milliseconds = new Date().getTime() - scoreBoard.startTime.getTime();
				let seconds = Math.floor((milliseconds / 1000));
				scoreBoard.score = Math.floor((milliseconds / 1000) * 10);
				let scoreText = template.slice(String(scoreBoard.score).length, -1)+String(scoreBoard.score);
				boardCtx.font = "50px Comic Sans MS";
				boardCtx.fillStyle = 'white';
				boardCtx.fillText('Score ', 60, 95);
				boardCtx.font = "60px Comic Sans MS";
				boardCtx.fillStyle = 'white';
				boardCtx.fillText(scoreText, 220, 100);
			}
		}
		scoreBoard.__proto__ = modules;
		return scoreBoard;
	}

	function Background(data) {
		let bg = clone(data);
		let sky = [clone(bg.TOP), clone(bg.TOP)];
		let road = [clone(bg.BOTTOM), clone(bg.BOTTOM)];
		[...road, ...sky].forEach((e, index) => {
			e.width = BOARD_WIDTH;
			e.height = e.frameHeight * 2.5;
			e.position = { x: (e.width * index), y: BOARD_HEIGHT - e.height };
		})
		sky.forEach((e, index) => {
			e.width = BOARD_WIDTH;
			e.height = BOARD_HEIGHT - road[0].height;
			e.position = { x: (e.width * (index > 0 ? -1 : 0)), y: 0 };
		})

		let modules = {
			init: function () {
				this.draw();
			},
			draw : function () {
				road.forEach((e) => {
					boardCtx.drawImage(sprite, e.frame[0], e.frame[1], e.frameWidth, e.frameHeight, e.position.x, e.position.y, e.width, e.height);
				})
				sky.forEach((e) => {
					boardCtx.drawImage(sprite, e.frame[0], e.frame[1], e.frameWidth, e.frameHeight, e.position.x, e.position.y, e.width, e.height);
				})
			},
			update: function () {
				road.forEach((e, index) => {
					e.position.x -= SPEED;
					if (e.position.x <= -e.width) {
						e.position.x = e.width - (Math.abs(e.width + e.position.x));
					}
				});
				sky.forEach((e, index) => {
					e.position.x += e.speed;
					if (e.position.x >= e.width) {
						e.position.x = -(e.width - (Math.abs(e.width - e.position.x)));
					}
				});
				this.draw();
			}
		}
		bg.__proto__ = modules;
		return bg;
	}

	function Obstacles() {
		let obstacles = [];
		let minGap = 2500, maxGap = 3000;
		let smallStones =  { config : config['STONE_SMALL'], variants: config['STONE_SMALL'].variants };
		let bigStones =  { config : config['STONE_BIG'], variants: config['STONE_BIG'].variants };

		function Stone(variant, config) {
			let data = Object.assign(variant, config);
			delete data.variants;
			let stone = clone(data);
			stone.width = stone.frameWidth * stone.scale;
			stone.height = stone.frameHeight * stone.scale;
			stone.position.y -= Math.abs(stone.height - stone.frameHeight);

			 let modules = {
				draw: function () {
					boardCtx.drawImage(sprite, stone.frame[0], stone.frame[1], stone.frameWidth, stone.frameHeight, stone.position.x, stone.position.y, stone.width, stone.height);
				},
				update: function (i) {
					stone.position.x -= SPEED;
					this.draw();
				}
			};
			stone.__proto__ = modules;
			return stone;
		}

		function configBasedOnLevel() {
			let pairLimit;
			let stoneTypesForPairMapping = { 1: [smallStones, bigStones] };

			if (LEVEL > 6)  {
				pairLimit = 2;
				stoneTypesForPairMapping[pairLimit] = [bigStones, bigStones];
				pairLimit = 3;
				stoneTypesForPairMapping[pairLimit] = [bigStones, bigStones];
			}
			else if (LEVEL >=4 && LEVEL <= 6)  {
				pairLimit = 2;
				stoneTypesForPairMapping[pairLimit] = [smallStones, bigStones];
				pairLimit = 3;
				stoneTypesForPairMapping[pairLimit] = [smallStones, bigStones];
			}
			else if (LEVEL === 3)  {
				pairLimit = 2;
				stoneTypesForPairMapping[pairLimit] = [smallStones, bigStones];
			}
			else {
				pairLimit = 1;
			}

			if (LEVEL === 4 && minGap === 2500) {
				minGap -= 500;
				maxGap -= 500;
			}

			return { pairLimit, stoneTypesForPairMapping };
		}

		function generateStones() {
			let { stoneTypesForPairMapping, pairLimit } = configBasedOnLevel();
			let pair = Math.floor((Math.random() * 10 ) % pairLimit) + 1;
			let result = [];
			for(let i = 0; i<pair; i++) {
				let stoneTypes = stoneTypesForPairMapping[pair];
				let randomStoneType = Math.floor((Math.random() * 10 ) % stoneTypes.length);
				let randomStone = Math.floor((Math.random() * 10 ) % 4);
				let selectedType = stoneTypes[randomStoneType];
				result.push(new Stone(selectedType.variants[randomStone], selectedType.config));
			}

			for(let i = 1; i<pair; i++) {
				result[i].position.x = result[i-1].position.x + result[i-1].width;
			}

			return result;
		}

		function addObstacles() {
			let random = Math.floor(Math.random() * (((maxGap - minGap) / 100) + 1));
			let gap = minGap + (random * 100);
			let lastStone = obstacles[obstacles.length - 1];
			if (!lastStone || (BOARD_WIDTH - lastStone.position.x + lastStone.width) >= gap) {
				obstacles.push(...generateStones());
			}
		}

		function validateObstacles() {
			let validObstacles = obstacles;
			validObstacles.forEach((each, index) => {
				if (each.position.x <= -each.width) {
					validObstacles.splice(index, 1);
				}
			});
			obstacles = validObstacles;
		}

		function checkClash(player, obj) {
			let objX1 = obj.position.x , objX2 = obj.position.x + obj.width - (player.width / 2);
			let objY1 = obj.position.y , objY2 = obj.position.y + obj.height;

			let plyX1 = player.position.x , plyX2 = player.position.x + player.width / 2;
			let plyY1 = player.position.y , plyY2 = player.position.y + player.height;

			if (((plyX2 >= objX1 && plyX2 <= objX2) && (plyY2 >= objY1))
				|| ((plyX1 >= objX1 && plyX1 <= objX2) && (plyY2 >= objY1))) {
				return true && !TEST_MODE;
			}
			return false;
		}

		function findCollision() {
			obstacles.forEach((each) => {
				let clashed = checkClash(player, each);
				if (clashed) {
					player.handleEvent(-1);
					GAME_STATUS = 'END'
				}
			});
		}

		return {
			init: function () {
				this.update();
			},
			update: function () {
				obstacles.forEach((e, index) => e.update(index));
				findCollision();
				validateObstacles();
				addObstacles();
			}
		}

	}

	function Player(data) {
		let player = clone(data);
		let actualVariants = clone(data.variants);
		let velocity = -player.jumpSpeed;
		updatePlayerStatus('STAND');

		function updatePlayerStatus(status) {
			if (status === player.status) return;
			let defaultPosition = clone(actualVariants[status].position);	
			player.status = status;
			player.width = player.variants[status].frameWidth * player.scale;
			player.height = player.variants[status].frameHeight * player.scale;
			player.position = defaultPosition;
			player.position.y -= Math.abs(player.height - player.variants[status].frameHeight);
			player.actualPosition = clone(player.position);

			if (status === 'JUMP') audioController('PLAY', sound.jump);
		}

		let modules = {
			init: function () {
				this.draw();
			},
			draw : function () {
				let config = player.variants[player.status];
				let frame = config.frame;
				boardCtx.drawImage(sprite, frame[0], frame[1], config.frameWidth, config.frameHeight, player.position.x, player.position.y, player.width, player.height);
			},
			handleEvent: function (code) {
				if (code === 32 && player.status === 'STAND') updatePlayerStatus('MOVE');
				else if (code === 32) {
					updatePlayerStatus('JUMP');
				}
				else if (code === -1) updatePlayerStatus('DEAD');
			},
			update: function() {
				let status = player.status;
				let actualPosition = player.actualPosition;

				if (status === 'JUMP') {
					player.position.y += velocity;
					var percentageReached = Number(Math.abs((player.position.y - actualPosition.y) / player.jumpHeight) * 100);
					if (velocity < 0) {
						if (percentageReached < 85) velocity = -player.jumpSpeed * 1.5;
						if (percentageReached >= 85) velocity = -player.jumpSpeed * 0.4;
						if (percentageReached >= 100) velocity =  player.jumpSpeed * 0.4;
					}

					if (velocity > 0) {
						if (percentageReached <= 85) velocity = player.jumpSpeed;
						if (player.position.y + velocity >= actualPosition.y) {
							player.position.y = actualPosition.y;
							updatePlayerStatus('MOVE');
							velocity = -player.jumpSpeed;
						}
					}
				}
				if (status === 'MOVE' && scoreBoard.score % 10 === 0) {
					player.status = 'MOVE_FRONT';
				} else if (status === 'MOVE_FRONT' && scoreBoard.score % 10 !== 0) {
					player.status = 'MOVE';
				}

				this.draw();
			}
		}
		player.__proto__ = modules;
		return player;
	}

	function controller() {
		if (GAME_STATUS === 'PAUSE') {
			tapToStart();
		}
		else if (GAME_STATUS === 'END') {
			cancelAnimationFrame(animation);
			audioController('STOP', sound.bg);
			animation = requestAnimationFrame(GameOver().init);
		}
		else {
		 	scoreBoard.update();
		 	animation = requestAnimationFrame(render);
		}
		
		if (scoreBoard.score && scoreBoard.score > (LEVEL * SCORE_PER_LEVEL) && LEVEL < MAX_LEVEL) {
			SPEED += 3;
			LEVEL += 1;
		}
	}

	function GameOver() {
		this.fontSize = 20;
		function showScore() {
			log({score: scoreBoard.score});
			clear();
			let x = statusBoard.width/2, y = statusBoard.height/2;
			statusBoardCtx.font = "50px Comic Sans MS";
			statusBoardCtx.fillStyle = '#332f74';
			statusBoardCtx.textAlign = "center";
			statusBoardCtx.fillText('Your Score - '+scoreBoard.score, x, y);
			setTimeout(() => {
				clear();
				reset();
			}, 2000);
		}

		function init() {
			let x = statusBoard.width/2, y = statusBoard.height/2;
			clear();
			statusBoardCtx.font = fontSize+"px Comic Sans MS";
			statusBoardCtx.fillStyle = '#332f74';
			statusBoardCtx.textAlign = "center";
			statusBoardCtx.fillText('G A M E  O V E R', x, y);
			if (this.fontSize >= 60)  {
				cancelAnimationFrame(animation);
				setTimeout(() => showScore(), 2000);
			} else animation = requestAnimationFrame(init);
			this.fontSize += 2;
		}

		function clear() {
			statusBoardCtx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
		}

		return { init };
	}

	function tapToStart() {
		statusBoardCtx.font = "60px Comic Sans MS";
		statusBoardCtx.fillStyle = 'white';
		statusBoardCtx.textAlign = "center";
		statusBoardCtx.fillText('Tap To Start', statusBoard.width/2, statusBoard.height/2);
		document.addEventListener('click', initEvent);
		document.removeEventListener('touchstart', handleEvent);
		document.removeEventListener('keydown', handleEvent);
	}

	function timer(value, callback) {
		statusBoardCtx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
		statusBoardCtx.font = "100px Comic Sans MS";
		statusBoardCtx.fillStyle = 'white';
		statusBoardCtx.textAlign = "center";
		statusBoardCtx.fillText(value, statusBoard.width/2, statusBoard.height/2);
		if (value === 0) {
			callback();
		} else setTimeout(() => timer(value-1, callback), 1000);
	}

	function render() {
		boardCtx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
		bg.update();
		obstacles.update();
		player.update();
		controller();
	}

	 function handleEvent() {
		if (GAME_STATUS === 'PAUSE') {
			GAME_STATUS = 'RESUME';
			statusBoardCtx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
			animation = requestAnimationFrame(render);
			player.handleEvent(32);
			audioController('PLAY', sound.bg);
		}
		else player.handleEvent(32);
	}

	let bg, player, obstacles, scoreBoard;

	function ready() {
		bg = new Background(config['BG']);
		player = new Player(config['PLAYER']);
		obstacles = new Obstacles();
		scoreBoard = new ScoreBoard();
		bg.init();
		obstacles.init();
		player.init();
		controller();
	}


	function initEvent() {
		timer(3, () => {
			handleEvent();
			document.addEventListener('touchstart', handleEvent);
			document.addEventListener('keydown', handleEvent);
		});
		document.removeEventListener('click', initEvent);
	}

	return { ready };
}

window.onload = () =>  {
	init();
	TEST_MODE = window.location.href.includes('test');
	MUTE = window.location.href.includes('mute');
	log();
}

function log(data) {
	if (TEST_MODE) return;
	let username = window.location.search.substr(window.location.search.indexOf('username='));
	username = username ? username.split('&')[0].split('username=')[1] : '';
	var http = new XMLHttpRequest();
	var url = 'https://analytics.cureskin.com/api/web/log';
	var params = Object.assign({ username, logSource: 'WEB_APP', event: 'GAME' }, data || {});
	http.open('POST', url, true);
 	http.setRequestHeader("Authorization", 'token prod'); 
	http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	http.send(JSON.stringify(params));
}

window.onbeforeunload = () => { cancelAnimationFrame(animation); }
