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
        if (!(position instanceof Vector)) {
            throw new Error('Actor: transmitted position is not a Vector');

        } else if (!(size instanceof Vector)) {
            throw new Error('Actor: transmitted size is not a Vector');

        } else if (!(speed instanceof Vector)) {
            throw new Error('Actor: transmitted speed is not a Vector');
        }

        this.pos = position;
        this.size = size;
        this.speed = speed;
    }

    act() {
        return null;
    }

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
        let thisActor = this;
        if ((anotherActor === undefined) || !(anotherActor instanceof Actor)) {
            throw new Error('Actor: fault in isIntersect');

        } else if (this === anotherActor) {
            return false;

        // MDN 2D Game development - collision detect example
        } else if (thisActor.pos.x < (anotherActor.pos.x + anotherActor.size.y) &&
            (thisActor.pos.x + thisActor.size.x) > anotherActor.pos.x &&
            thisActor.pos.y < (anotherActor.pos.y + anotherActor.size.y) &&
            (thisActor.size.y + thisActor.pos.y) > anotherActor.pos.y) {
            return true;
        }

        return false;
    }
}

class Level {
    constructor(grid, actors) {
        this.grid = grid;
        if (Array.isArray(grid)) {
            this.height = grid.length;

            if (grid.find((element) => Array.isArray(element))) {
                this.width = grid.sort(function (a, b) {
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
        if (actor === undefined || !(actor instanceof Actor)) {
            throw new Error("Level: actorAt's argument is wrong");
        } else if (this.actors == undefined) {
            return undefined;
        }

        for (let thatActor of this.actors) {
            if (thatActor.isIntersect(actor)) {
                return thatActor;
            }
        }
        return undefined;
    }

    obstacleAt(position, size) {
        if (!(position instanceof Vector) && !(size instanceof Vector)) {
            throw new Error("Level: obstacleAt's arguments is wrong");
        }
        let checkedActor = new Actor(position, size);
        if (checkedActor.left < 0 ||
            checkedActor.right > this.width ||
            checkedActor.top < 0) {
            return 'wall';
        } else if (checkedActor.bottom > this.height) {
            return 'lava';
        }

        for (let y = Math.ceil(checkedActor.top); y < Math.ceil(checkedActor.bottom); y++) {
            for (let x = Math.ceil(checkedActor.left); x < Math.ceil(checkedActor.right); x++) {
                if (this.grid[y][x] === 'wall' || 'lava') return this.grid[y][x];
            }
        }
        return undefined;
    }

    removeActor(actor) {
        let thatActorIndex = this.actors.indexOf(actor);
        this.actors[thatActorIndex] = null;
        this.actors = this.actors.filter((thatActor) => thatActor !== null);
    }

    noMoreActors(type) {
        if (Array.isArray(this.actors)) {
            return (!this.actors.find(actor => actor.type === type));
        }
        return true;
    }

    playerTouched(touchedType, actor) {
        if (this.status === null) {
            if (touchedType === 'lava' || touchedType === 'fireball') {
                this.status = 'lost';
            } else if (touchedType === 'coin' && actor.type === 'coin') {
                this.removeActor(actor);

                if (this.noMoreActors('coin')) this.status = 'won';
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
        if (letter === 'x') return 'wall';
        if (letter === '!') return 'lava';
        return undefined;
    }

    createGrid(plan) {
        let grid = [];
        if (!(plan instanceof Actor)) {
            for (let string of plan) {
                let result = [];
                [...string].forEach((symbol) => result.push(this.obstacleFromSymbol(symbol)));
                grid.push(result);
            }
        }
        return grid;
    }

    createActors(actorsKeys) {
        let actors = [];

        if (Array.isArray(actorsKeys)) {
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
        }
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
        if (time === 0) {
            return new Vector(this.pos.x, this.pos.y)
        }
        return new Vector((this.pos.x + (this.speed.x * time)), (this.pos.y + (this.speed.y * time)));
    }

    handleObstacle() {
        this.speed.x = -this.speed.x;
        this.speed.y = -this.speed.y;
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
        this.pos.x += 0.2;
        this.pos.y += 0.1;
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
        return this.pos.plus(this.getSpringVector());
        // переиодически заваливается только 1 тест в моке, а именно:
        // "Координата y новой позиции будет в пределах исходного
        // значения y и y + 1"...
        // Найти ошибку не смог, но комментарий теста такой:
        // AssertionError: expected 5.083119355177926 to be within 5.1..6.1,
    }

    act(time) {
        this.pos = this.getNextPosition(time);
    }
}

class Player extends Actor {
    constructor(pos) {
        super(pos, new Vector(0.8, 1.5));
        this.pos.y -= 0.5
    }

    get type() {
        return 'player';
    }
}