const WebSocket = require("ws");

class Grid {
	constructor(width, height, generator=function(posn) { return 0; }) {
		this.data = [];
		this.flags = {};
		this.width = width;
		this.height = height;
		this.length = this.width * this.height;
		this.generator = generator;

		this.generate();
	}

	indexToPosn(index) {
		var y = Math.floor(index / this.width);
		var x = index - (y * this.width);
		return new Vector(x, y);
	}

	posnToIndex(posn) {
		return (posn.y * this.width) + posn.x;
	}

	generate() {
		this.data = [];
		for (var i = 0; i < this.length; i++) {
			var coord = this.indexToPosn(i);
			var value = this.generator(coord);
			this.data.push(value);
		}
	}

	fill(value) {
		for (var i = 0; i < this.length; i++) {
			this.data[i] = value;
		}
	}

	iterate(func) {
		var parent = this;
		this.data.forEach(function(value, index) {
			var posn = parent.indexToPosn(index);
			func(posn, value);
		});
	}

	iterateRange(xmin, xmax, ymin, ymax, func) {
		for (var x = xmin; x < xmax; x++) {
			for (var y = ymin; y < ymax; y++) {
				var posn = new Vector(x, y);
				var value = this.getPosn(posn);
				func(posn, value);
			}
		}
	}

	getPosn(posn) {
		var index = this.posnToIndex(posn);
		return this.data[index];
	}

	setPosn(posn, value) {
		var index = this.posnToIndex(posn);
		this.data[index] = value;
	}

	validPoint(posn) {
		return posn.x >= 0 && posn.y >= 0
				&& posn.x < this.width && posn.y < this.height;
	}

	static IsGrid(obj) {
		return obj instanceof Grid;
	}

	static Add(inp1, inp2) {
		return new Grid(inp1.width, inp1.height, function(pt) {
			var v = inp1.getPosn(pt);
			if (Grid.IsGrid(inp2)) return v + inp2.getPosn(pt);
			else return v + inp2;
		});
	}

	static Subtract(inp1, inp2) {
		return new Grid(inp1.width, inp1.height, function(pt) {
			var v = inp1.getPosn(pt);
			if (Grid.IsGrid(inp2)) return v - inp2.getPosn(pt);
			else return v - inp2;
		});
	}

	static Multiply(inp1, inp2) {
		return new Grid(inp1.width, inp1.height, function(pt) {
			var v = inp1.getPosn(pt);
			if (Grid.IsGrid(inp2)) return v * inp2.getPosn(pt);
			else return v * inp2;
		});
	}

	static Divide(inp1, inp2) {
		return new Grid(inp1.width, inp1.height, function(pt) {
			var v = inp1.getPosn(pt);
			if (Grid.IsGrid(inp2)) return v / inp2.getPosn(pt);
			else return v / inp2;
		});
	}
}

class Vector {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	static get Empty() {
		return {x: 0, y: 0};
	}

	static IsVector(vector) {
		return vector.hasOwnProperty("x") && vector.hasOwnProperty("y");
	}

	static Inverse(vector) {
		return Vector.Multiply(vector, -1);
	}

	static Add() {
		var total = new Vector(0, 0);
		for (var i = 0; i < arguments.length; i++ ) {
			if (Vector.IsVector(arguments[i])) {
				total.x += arguments[i].x;
				total.y += arguments[i].y;
			} else {
				total.x += arguments[i];
				total.y += arguments[i];
			}
		}
		return total;
	}

	static Subtract() {
		var total = new Vector(arguments[0].x, arguments[0].y);
		for (var i = 1; i < arguments.length; i++ ) {
			if (Vector.IsVector(arguments[i])) {
				total.x -= arguments[i].x;
				total.y -= arguments[i].y;
			} else {
				total.x -= arguments[i];
				total.y -= arguments[i];
			}
		}
		return total;
	}

	static Multiply() {
		var total = new Vector(1, 1);
		for (var i = 0; i < arguments.length; i++ ) {
			if (Vector.IsVector(arguments[i])) {
				total.x *= arguments[i].x;
				total.y *= arguments[i].y;
			} else {
				total.x *= arguments[i];
				total.y *= arguments[i];
			}
		}
		return total;
	}

	static Divide() {
		var total = new Vector(arguments[0].x, arguments[0].y);
		for (var i = 1; i < arguments.length; i++ ) {
			if (Vector.IsVector(arguments[i])) {
				total.x /= arguments[i].x;
				total.y /= arguments[i].y;
			} else {
				total.x /= arguments[i];
				total.y /= arguments[i];
			}
		}
		return total;
	}
}

const States = {
	Blank: 0,
	X: 1,
	O: 2
}

const Returns = {
	InvalidPoint: 0,
	NotTurn: 1,
	Good: 2,
	WinX: 3,
	WinO: 4,
	Tie: 5
}

class Game {
	constructor() {
		this.grid = new Grid(3, 3);
		this.grid.fill(States.Blank);
		this.playing = true;

		this.turn = States.X;
	}

	checkWin() {
		if (this.grid.data.indexOf(0) == -1) {
			return Returns.Tie;
		}

		var win = null;
		if (this.grid.data[0] == this.grid.data[1] && this.grid.data[0] == this.grid.data[2]) win = this.grid.data[0];
		if (this.grid.data[3] == this.grid.data[4] && this.grid.data[3] == this.grid.data[5]) win = this.grid.data[3];
		if (this.grid.data[6] == this.grid.data[7] && this.grid.data[6] == this.grid.data[8]) win = this.grid.data[6];

		if (this.grid.data[0] == this.grid.data[3] && this.grid.data[0] == this.grid.data[6]) win = this.grid.data[0];
		if (this.grid.data[1] == this.grid.data[4] && this.grid.data[1] == this.grid.data[7]) win = this.grid.data[1];
		if (this.grid.data[2] == this.grid.data[5] && this.grid.data[2] == this.grid.data[8]) win = this.grid.data[2];

		if (this.grid.data[0] == this.grid.data[4] && this.grid.data[0] == this.grid.data[8]) win = this.grid.data[0];
		if (this.grid.data[2] == this.grid.data[4] && this.grid.data[2] == this.grid.data[6]) win = this.grid.data[2];

		if (win == States.X) return Returns.WinX;
		if (win == States.O) return Returns.WinO;

		else return 0;
	}

	do_move(posn, player) {
		if (this.turn == player) {
			var at_point = this.grid.getPosn(posn);

			if (at_point == States.Blank && this.grid.validPoint(posn)) {
				this.grid.setPosn(posn, this.turn);

				if (this.turn == States.X) this.turn = States.O;
				else this.turn = States.X;

				var win = this.checkWin();

				if (win != 0) return win;
				else return Returns.Good;
			} else {
				return Returns.InvalidPoint;
			}
		} else {
			return Returns.NotTurn;
		}
	}
}

class Lobby {
	constructor(player) {
		this.game = new Game();
		this.playerX = player;
		this.playerO = null;
		this.full = false;

		this.playerX.lobby = this;
		this.playerX.kind = States.X;

		console.log("NEW LOBBY")
	}

	refresh() {
		if (this.full) {
			this.playerX.socket.send("REFRESH");
			this.playerO.socket.send("REFRESH");
		}
	}

	join(player) {
		console.log("Lobby FILLED");
		if (!this.playerO) this.playerO = player;
		this.playerO.lobby = this;
		this.playerO.kind = States.O;
		this.full = true;
	}
}

class Player {
	constructor(socket) {
		this.socket = socket;
		this.lobby = null;
		this.kind = null;

		var parent = this;
		this.socket.on("message", function(msg) {
			parent.handle(msg);
		});
	}

	join(lobby) {
		if (lobbies[lobby]) lobbies[lobby].join(this);
		else lobbies[lobby] = new Lobby(this);

		this.socket.send("JOINED");
	}

	change(str_point) {
		var point = new Vector(parseInt(str_point[0]), parseInt(str_point[1]));

		var resp = this.lobby.game.do_move(point, this.kind);
		this.lobby.refresh();
		this.socket.send(`RESULT|${resp}`);
	}

	query(str_point) {
		var point = new Vector(parseInt(str_point[0]), parseInt(str_point[1]));

		var resp = this.lobby.game.grid.getPosn(point);
		this.socket.send(`POINT|${point.x},${point.y}|${resp}`);
	}

	handle(message) {
		var data = message.split("|");
		console.log(data);

		if (data[0] == "JOIN") this.join(data[1]);
		if (data[0] == "CHANGE") this.change(data[1].split(","));
		if (data[0] == "QUERY") this.query(data[1].split(","));
	}
}

const PORT = 5500;
const server = new WebSocket.Server({ port: PORT });

var lobbies = {};

console.log(`Server listening on port ${PORT}`);
server.on("connection", function(client) {
	console.log("new client");
	new Player(client);
});