class SpawnManager {
    static minRadius = 700;
    static maxRadius = 2000;
    static despawnDist = 2500;
    static table = {
        1: {
            class: Bat,
            size: new Dimension(32, 32),
            density: 20,
            night: true,
            day: false
        },
        2: {
            class: Slime,
            size: new Dimension(55, 37),
            density: 40,
            night: true,
            day: true,
        },
        3: {
            class: Wolf,
            size: new Dimension(32, 64),
            density: 10,
            night: true,
            day: true
        },
        4: {
            class: Bunny,
            size: new Dimension(26, 22),
            density: 25,
            night: false,
            day: true
        }
        // 4: {
        //     class: BearBoss,
        //     size: new Dimension(1.5*56, 1.5*56),
        //     density: 1,
        //     night: true,
        //     day: true
        // }

    }
    static totalDensity = Object.values(SpawnManager.table).reduce((sum, type) => sum + type.density, 0);

    constructor() {
        this.entityList = [];
        this.entityTarget = 50;
        this.pickEntityCode();
        for(let type in SpawnManager.table) {
            SpawnManager.table[type].densityRatio = SpawnManager.table[type].density / SpawnManager.totalDensity;
        }
    }
    update() {
        this.updateEntities();
    }
    updateEntities() {
        // Search and despawn
        for (let i = this.entityList.length - 1; i >= 0; --i) {
            if(getDistance(doug.getCenter(), this.entityList[i].getCenter()) > SpawnManager.despawnDist) {
                this.entityList[i].removeFromWorld = true;
                this.entityList.splice(i, 1);
            }
        }

        //Spawn more if needed
        while (this.entityList.length < this.entityTarget) {
            let timeValid = false;
            while(!timeValid) {
                //Create instance of entity type with null position for now
                const key = this.pickEntityCode();
                const entityClass = SpawnManager.table[key].class;
                const entity = new entityClass(new Vec2(0, 0));

                //Try different points until successful
                let valid = false;
                while(!valid) {
                    const point = radiusPickPoint(doug.getCenter(), SpawnManager.minRadius, SpawnManager.maxRadius);
                    entity.pos.x = point.x;
                    entity.pos.y = point.y;

                    const testBox = new BoundingBox(point, entity.size);
                    valid = !this.checkObstacles(testBox);
                }
                if((lightMap.dayTime && SpawnManager.table[key].day)
                    || (!lightMap.dayTime && SpawnManager.table[key].night === true)) {
                    gameEngine.addEntity(entity, (entity instanceof Bunny ? Layers.GROUND : Layers.FOREGROUND));
                    this.entityList.push(entity);
                    timeValid = true;
                }
            }
        }
    }

    checkObstacles(bb) {
        const list = gameEngine.entities[Layers.FOREGROUND];
        for(let entity in list) {
            if(entity.boundingBox && bb.collide(entity.boundingBox)) return true;
        }
    }

    pickEntityCode() {
        const randomValue = Math.random();
        let accumulatedRatio = 0;

        for (const key in SpawnManager.table) {
            const type = SpawnManager.table[key];
            accumulatedRatio += type.densityRatio;

            if (randomValue <= accumulatedRatio) {
                return key;
            }
        }
    }
}