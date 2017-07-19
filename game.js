'use strict';
class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    plus(vector) {
        if (!(vector instanceof Vector)) {
            throw new Error('Plus: transmitted not a Vector');
        }

        let sumX = this.x + vector.x;
        let sumY = this.y + vector.y;

        return new Vector(sumX, sumY);
    }

    times(multiplier) {
        return new Vector((this.x * multiplier), (this.y * multiplier));
    }
}

class Actor {
    constructor(position = new Vector(), size = new Vector(1, 1), speed = new Vector()) {
        if ([position, size, speed].some((el) => !(el instanceof Vector))) {
            throw new Error('Actor: transmitted position is not a Vector');
        }

        this.pos = position;
        this.size = size;
        this.speed = speed;
    }

    act() {}

    get type() {
        return 'actor';
    }

    get left() {
        return this.pos.x;
    }

    get right() {
        return this.pos.x + this.size.x;
    }

    get top() {
        return this.pos.y;
    }

    get bottom() {
        return this.pos.y + this.size.y;
    }

    isIntersect(anotherActor) {
        if (!anotherActor || !(anotherActor instanceof Actor)) {
            throw new Error('Actor: fault in isIntersect');

        } else if (this === anotherActor) {
            return false;

        } else if (this.left < anotherActor.right &&
            this.right > anotherActor.left &&
            this.top < anotherActor.bottom &&
            this.bottom > anotherActor.top) {
            return true;
        }
        return false;
    }
}

class Level {
    constructor(grid, actors) {
        if (Array.isArray(grid)) {
            this.grid = grid.slice();
            this.height = this.grid.length;

            if (this.grid.some((element) => Array.isArray(element))) {
                this.width = this.grid.sort(function (a, b) {
                    return b.length - a.length;
                })[0].length;
            } else {
                this.width = 1;
            }

        } else {
            this.height = 0;
            this.width = 0;
        }

        this.status = null;
        this.finishDelay = 1;
        this.actors = actors;

        if (this.actors) {
            this.player = this.actors.find(function (actor) {
                return actor.type === 'player';
            });
        }
    }

    isFinished() {
        return this.status !== null && this.finishDelay < 0;
    }

    actorAt(actor) {
        if (!(actor instanceof Actor)) {
            throw new Error("Level: actorAt's argument is wrong");
        } else if (this.actors == undefined) {
            return undefined;
        }

        for (let thatActor of this.actors) {
            if (thatActor.isIntersect(actor)) {
                return thatActor;
            }
        }
    }

    obstacleAt(position, size) {
        if ([position, size].some((item) => !(item instanceof Vector))) {
            throw new Error("Level: obstacleAt's arguments is wrong");
        }

        const leftBorder = Math.floor(position.x);
        const rightBorder = Math.ceil(position.x + size.x);
        const topBorder = Math.floor(position.y);
        const bottomBorder = Math.ceil(position.y + size.y);

        if (leftBorder < 0 || rightBorder > this.width || topBorder < 0) {
            return 'wall';
        } else if (bottomBorder > this.height) {
            return 'lava';
        }

        for (let y = topBorder; y < bottomBorder; y++) {
            for (let x = leftBorder; x < rightBorder; x++) {
                if (this.grid[y][x]) {
                    return this.grid[y][x];
                }
            }
        }
    }

    removeActor(actor) {
        let thatActorIndex = this.actors.indexOf(actor);
        this.actors.splice(thatActorIndex, 1);
    }

    noMoreActors(type) {
        if (Array.isArray(this.actors)) {
            return (!this.actors.find(actor => actor.type === type));
        }
        return true;
    }

    playerTouched(touchedType, actor) {
        if (this.status === null) {
            if (['lava', 'fireball'].some((el) => el === touchedType)) {
                this.status = 'lost';
            } else if (touchedType === 'coin' && actor.type === 'coin') {
                this.removeActor(actor);
                if (this.noMoreActors('coin')) {
                    this.status = 'won';
                }
            }

        }
    }
}

class LevelParser {
    constructor(actorsLibrary) {
        this.actorsLibrary = actorsLibrary;
    }

    actorFromSymbol(letter) {
        if (typeof letter !== 'string' || !this.actorsLibrary) {
            return undefined;
        }
        return this.actorsLibrary[letter];
    }

    obstacleFromSymbol(letter) {
        let obstacles = {'x': 'wall', '!': 'lava'};
        return obstacles[letter];
    }

    createGrid(plan) {
        if (plan instanceof Actor) {
            return;
        }
        let grid = [];

        for (let lines of plan) {
            let result = [];
            [...lines].forEach((symbol) => result.push(this.obstacleFromSymbol(symbol)));
            grid.push(result);
        }

        return grid;
    }

    createActors(actorsKeys) {
        if (!Array.isArray(actorsKeys)) {
            return;
        }

        let actors = [];
        actorsKeys.forEach((itemY, y) => {
            [...itemY].forEach((itemX, x) => {
                let Constructor = this.actorFromSymbol(itemX);
                let result;
                if (typeof Constructor === 'function') {
                    result = new Constructor(new Vector(x, y));
                }
                if (result instanceof Actor) {
                    actors.push(result);
                }
            });
        });
        return actors;
    }

    parse(plan) {
        let grid = this.createGrid(plan);
        let actors = this.createActors(plan);
        let level = new Level(grid, actors);
        return level;
    }
}

class Fireball extends Actor {
    constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
        super(pos, undefined, speed);
    }

    get type() {
        return 'fireball';
    }

    getNextPosition(time = 1) {
         return this.pos.plus(this.speed.times(time));
    }

    handleObstacle() {
        this.speed = this.speed.times(-1);
    }

    act(time, level) {
        let nextPos = this.getNextPosition(time);
        if (level.obstacleAt(nextPos, this.size)) {
            this.handleObstacle();
        } else {
            this.pos = nextPos;
        }
    }
}

class HorizontalFireball extends Fireball {
    constructor(thisPos) {
        super(thisPos, new Vector(2, 0));
    }
}

class VerticalFireball extends Fireball {
    constructor(thisPos) {
        super(thisPos, new Vector(0, 2));
    }
}

class FireRain extends Fireball {
    constructor(thisPos) {
        super(thisPos, new Vector(0, 3));
        this.startPos = thisPos;
    }

    handleObstacle() {
        this.pos = this.startPos;
    }
}

class Coin extends Actor {
    constructor(pos) {
        super(pos, new Vector(0.6, 0.6));
        this.pos = this.pos.plus(new Vector(0.2, 0.1));
        this.startPos = Object.assign(this.pos);
        this.spring = Math.random() * (Math.PI * 2);
        this.springDist = 0.07;
        this.springSpeed = 8;
    }

    get type() {
        return 'coin';
    }

    updateSpring(time = 1) {
        this.spring += this.springSpeed * time;
    }

    getSpringVector() {
        return new Vector(0, (Math.sin(this.spring) * this.springDist));
    }

    getNextPosition(time = 1) {
        this.updateSpring(time);
        return this.startPos.plus(this.getSpringVector());
    }

    act(time) {
        this.pos = this.getNextPosition(time);
    }
}

class Player extends Actor {
    constructor(pos) {
        super(pos, new Vector(0.8, 1.5));
        this.pos = this.pos.plus(new Vector(0, -0.5));
    }

    get type() {
        return 'player';
    }
}

const actorDict = {
    '@': Player,
    'v': FireRain,
    'o': Coin,
    '=': HorizontalFireball,
    '|': VerticalFireball
};

const parser = new LevelParser(actorDict);

loadLevels()
    .then((res) => {runGame(JSON.parse(res), parser, DOMDisplay)
    .then(() => alert('Вы выиграли!'))});