class Last extends Phaser.Scene {
    constructor() {
        super("Last");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 800;
        this.DRAG = 800;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1000;
        this.JUMP_VELOCITY = -500;
        this.SCALE = 1.5;
        this.dead = false;

        //for water
        this.inDangerZoneTime = 0;
        this.dangerZoneThreshold = 1500; // milliseconds
        this.yThreshold = 387;
    }
    
    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("Last", 18, 18, 70, 25);
        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("tilemap_packed", "tilemap_tiles");

        // Background tilesets
        this.bgTileset1 = this.map.addTilesetImage("bgElements_spritesheet", "bg_elements");
        this.bgTileset2 = this.map.addTilesetImage("tilemap-backgrounds_packed", "bg_packed");
        
        // Create background layers FIRST (so they appear behind everything)
        // Background 2 is furthest back
        this.background2Layer = this.map.createLayer("Background 2", this.bgTileset2, 0, 0);
        
        // Background is in front of Background 2 but behind gameplay elements
        this.backgroundLayer = this.map.createLayer("Background", this.bgTileset1, 0, 0);
        //jump sound
        this.jumpSound = this.sound.add('jump');

        //game over sound
        this.go = this.sound.add("gameOver");

        // level done sound
        this.done = this.sound.add("complete");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        
        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        this.waterLayer = this.map.createLayer("WaterLayer", this.tileset, 0, 0);
        this.waterLayer.setCollisionByExclusion([-1]); // All tiles collide except empty
        

        //Set depth values to ensure proper layering
        if (this.background2Layer) this.background2Layer.setDepth(-2);
        if (this.backgroundLayer) this.backgroundLayer.setDepth(-1);
        this.groundLayer.setDepth(0);
        this.waterLayer.setDepth(1);


        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });

        this.flag = this.map.createFromObjects("Objects", {
            name: "flag",
            key: "tilemap_sheet",
            frame: 112
        });        

        // Create group to manage all meteors
        this.meteorGroup = this.physics.add.group();

        if (!this.hasWon && !this.dead){
           // Spawn meteors every 2 seconds
            this.time.addEvent({
                delay: 2000, // milliseconds
                callback: this.spawnMeteor,
                callbackScope: this,
                loop: true
            }); 
        }
        
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.flag, Phaser.Physics.Arcade.STATIC_BODY);
        
        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);


        // set up player avatar
        this.player = this.physics.add.sprite(25, 10, "platformer_characters", 0);
        
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.player.setCollideWorldBounds(true);

        this.physics.add.overlap(this.player, this.meteorGroup, (player, meteor) => {
            meteor.destroy();
            this.handleDeath();
        });

        // Enable collision handling
        this.physics.add.collider(this.player, this.groundLayer);

        // set up Phaser-provided cursor key input
        this.cursors = this.input.keyboard.createCursorKeys();

        this.physics.add.overlap(this.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
        });

        this.hasWon = false;

        this.physics.add.overlap(this.player, this.flag, (obj1, obj2) => {
            if (!this.hasWon) {
                this.hasWon = true;

                this.done.play();

                this.add.text(this.player.x - 150, this.player.y - 50, "You Win!", {
                    fontSize: '32px',
                    fill: '#000000'
                });

                this.scene.pause();
                
                const restartBtn = document.getElementById("restartButton");
                restartBtn.replaceWith(restartBtn.cloneNode(true));
                const newRestartBtn = document.getElementById("restartButton");
                newRestartBtn.style.display = "block";

                newRestartBtn.addEventListener("click", () => {
                    // Clear checkpoint data when game is completed
                    // Import the Next scene to access its static data
                    if (typeof Next !== 'undefined') {
                        Next.checkpointData.reached = false;
                        Next.checkpointData.x = 0;
                        Next.checkpointData.y = 0;
                    }

                    newRestartBtn.style.display = "none";
                    this.scene.start("platformerScene");
                });
            }
        });

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);


        this.smokeEmitter = this.add.particles(0, 0, 'smoke', {
            speed: { min: -20, max: 20 },
            lifespan: 300,
            scale: { start: 0.1, end: 0 },
            emitting: false // 'on: false' is now 'emitting: false'
        });
        
        this.starEmitter = this.add.particles(0, 0, 'star', {
            speed: { min: -50, max: -100 },
            lifespan: 400,
            scale: { start: 0.5, end: 0 },
            emitting: false
        });
    }

    update() {
        if(this.cursors.left.isDown) {
            this.player.body.setAccelerationX(-this.ACCELERATION);
            this.player.resetFlip();
            this.player.anims.play('walk', true);
            this.smokeEmitter.setPosition(this.player.x + 10, this.player.y + 20);
            this.smokeEmitter.explode(3);
            
        } else if(this.cursors.right.isDown) {
            this.player.body.setAccelerationX(this.ACCELERATION);
            this.player.setFlip(true, false);
            this.player.anims.play('walk', true);
            this.smokeEmitter.setPosition(this.player.x - 10, this.player.y + 20);
            this.smokeEmitter.explode(3);

        } else {
            this.player.body.setAccelerationX(0);
            this.player.body.setDragX(this.DRAG);
            this.player.anims.play('idle');

            this.smokeEmitter.stop();
        }
    
        if(!this.player.body.blocked.down) {
        this.player.anims.play('jump'); // Re-enable this
        }
        
        if(this.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.starEmitter.setPosition(this.player.x, this.player.y + 20);
            this.starEmitter.explode(5); // Emit 5 particles at once
            this.jumpSound.play();
        }

        // Remove meteors that fall below the screen
        this.meteorGroup.getChildren().forEach((meteor) => {
            if (meteor.y > this.map.heightInPixels + 50) {
                meteor.destroy();
            }
        });


        if (this.player.y > this.yThreshold) {
            this.inDangerZoneTime += this.game.loop.delta;
            if (this.inDangerZoneTime >= this.dangerZoneThreshold) {
                this.handleDeath();  // implement or call your death logic here
            }
        } else {
            this.inDangerZoneTime = 0; // reset timer if player is safe
        }
    }

    spawnMeteor(){
        const x = Phaser.Math.Between(0, this.map.widthInPixels);
        const y = -50; // just above screen
    
        const meteor = this.meteorGroup.create(x, y, "meteor");
        meteor.setVelocityY(100); // falls straight down
        meteor.body.setAllowGravity(false);
        meteor.setCollideWorldBounds(false);
        meteor.setScale(0.05); // optional scaling
    }


    handleDeath() {
        if (!this.dead) {
            this.dead = true;
            this.player.setTint(0xff0000);
            this.player.setVelocity(0);
            this.player.anims.play('idle');
            this.add.text(this.player.x - 50, this.player.y - 100, "Game Over", {
                fontSize: '32px',
                fill: '#000000'
            });

            this.go.play();

            this.scene.pause();
    
            const restartBtn = document.getElementById("restartButton");
            restartBtn.replaceWith(restartBtn.cloneNode(true));
            const newRestartBtn = document.getElementById("restartButton");
            newRestartBtn.style.display = "block";

            newRestartBtn.addEventListener("click", () => {
                newRestartBtn.style.display = "none";
                
                // Multiple ways to check for checkpoint data
                let checkpointReached = false;
                
                // Method 1: Try to access Next class directly
                if (typeof Next !== 'undefined' && Next.checkpointData && Next.checkpointData.reached) {
                    checkpointReached = true;
                    console.log("Checkpoint found via Next class");
                }
                
                // Method 2: Check via scene manager
                if (!checkpointReached) {
                    try {
                        const nextScene = this.scene.get('Next');
                        if (nextScene && nextScene.constructor.checkpointData && nextScene.constructor.checkpointData.reached) {
                            checkpointReached = true;
                            console.log("Checkpoint found via scene manager");
                        }
                    } catch (e) {
                        console.log("Scene manager method failed:", e);
                    }
                }
                
                // Method 3: Check global window object (fallback)
                if (!checkpointReached && window.NextCheckpointData && window.NextCheckpointData.reached) {
                    checkpointReached = true;
                    console.log("Checkpoint found via global object");
                }
                
                console.log("Final checkpoint status:", checkpointReached);
                
                if (checkpointReached) {
                    // Player reached checkpoint in Next scene, respawn there
                    console.log("Restarting at Next scene checkpoint");
                    this.scene.start("Next");
                } else {
                    // No checkpoint reached, restart from the very beginning
                    console.log("Restarting from platformer scene");
                    this.scene.start("platformerScene");
                }
            });
        }
    }
}