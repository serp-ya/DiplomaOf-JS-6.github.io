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
                this.width = 1; // возращаю 1, т.к. длина строки в случае даже нахождения внутри массива
                                // undefined логически == 1, но я не уверен на 100%
            }
            // Закоментированный способ, приведённый ниже, работает отлично,
            // если соблюдается условие задачи, что входящий аргумент
            // grid === двумерному массиву. Но в некоторых тестах нам закидывают
            // одномерный массив, наполненный undefined, из-за чего у меня
            // падала вся программа и многие тесты, по-этому, пришлось выкручиваться
            // тем, что написано выше...
            //
            // this.width = grid.sort(function (a, b) {
            //     return b.length - a.length;
            // })[0].length;

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
            // Дмитрий, посоветуйте, как лучше писать подобные проверки? В данном
            // случае, мне показалось, что второй метод проще в данном контексте,
            // но если будет больше строк для сравнения, проще через массив
            //
            // if (['lava', 'fireball'].find((type) => type === touchedType)) {
            //     this.status = 'lost';
            // }
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
        if (this.actorsLibrary) {
            this.actorsLibrary = [].push(actorsLibrary);
        }

        this.actorsLibrary = this.actorsLibrary.push(actorsLibrary);

    }

    // actorFromSymbol(letter) {
    //     if (this.actorsLibrary.find(letter)) {
    //         return true;
    //     }
    //     return undefined;
    // }

    obstacleFromSymbol(letter) {
        if (letter === 'x') return 'wall';
        if (letter === '!') return 'lava';
        return undefined;
    }
}