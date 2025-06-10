class Next extends Phaser.Scene {
    static checkpointData = {
        reached: false,
        x: 0,
        y: 0
    };

    constructor() {
        super("Next");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 800;
        this.DRAG = 800;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1000;
        this.JUMP_VELOCITY = -500;
        this.SCALE = 1.5;
        this.dead = false;
        this.reachedCheckpoint = false;
        this.checkpointX = 0;
        this.checkpointY = 0;
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("Next", 18, 18, 70, 25);
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

        //checkpoint sound
        this.checkpointerSound = this.sound.add('checkpointer');

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        
        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        //Set depth values to ensure proper layering
        if (this.background2Layer) this.background2Layer.setDepth(-2);
        if (this.backgroundLayer) this.backgroundLayer.setDepth(-1);
        this.groundLayer.setDepth(0);
        
        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });

        this.pass = this.map.createFromObjects("Objects", {
            name: "pass",
            key: "tilemap_sheet",
            frame: 88
        });

        // Create checkpoint objects from your tilemap
        this.checkpoint = this.map.createFromObjects("Objects", {
            name: "checkpoint",  // This should match the name in your Tiled map
            key: "tilemap_sheet",
            frame: 152  // Use the correct frame number for your checkpoint tile
        });

        // set up player avatar
        this.player = this.physics.add.sprite(25, 10, "platformer_characters", 0);

        // Then check if we should move to checkpoint
        if (Next.checkpointData.reached) {
            this.player.setPosition(Next.checkpointData.x, Next.checkpointData.y);
            this.reachedCheckpoint = true;
            this.checkpointX = Next.checkpointData.x;
            this.checkpointY = Next.checkpointData.y;
        }

        // Enable physics for checkpoint (add this check to prevent errors)
        if (this.checkpoint && this.checkpoint.length > 0) {
            this.physics.world.enable(this.checkpoint, Phaser.Physics.Arcade.STATIC_BODY);
            this.checkpointObj = this.checkpoint[0]; // assuming only one

            // Checkpoint collision detection
            this.physics.add.overlap(this.player, this.checkpointObj, () => { 
                this.handleCheckpointReached();    
            });
        }
        
        // Create group to manage all meteors
        this.meteorGroup = this.physics.add.group();

        // Spawn meteors every 2 seconds
        this.time.addEvent({
            delay: 2000, // milliseconds
            callback: this.spawnMeteor,
            callbackScope: this,
            loop: true
        });

        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.pass, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);

        this.physics.add.overlap(this.player, this.meteorGroup, (player, meteor) => {
            meteor.destroy();
            this.handleDeath();        
        });

        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(this.player, this.groundLayer);

        // set up Phaser-provided cursor key input
        this.cursors = this.input.keyboard.createCursorKeys();

        this.physics.add.overlap(this.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
        });

        // When player reaches the flag
        this.physics.add.overlap(this.player, this.pass, (obj1, obj2) => {
            this.scene.start("Last")
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

    // Method to handle when checkpoint is reached
    handleCheckpointReached() {
        if (!this.reachedCheckpoint) {
            this.reachedCheckpoint = true;
            
            // Store the checkpoint position
            this.checkpointX = this.checkpointObj.x;
            this.checkpointY = this.checkpointObj.y - 20; // Spawn slightly above
            
            // Save to static class data
            Next.checkpointData.reached = true;
            Next.checkpointData.x = this.checkpointX;
            Next.checkpointData.y = this.checkpointY;

            // Play checkpoint sound
            this.checkpointerSound.play();

            // Show checkpoint text
            let checkpointText = this.add.text(this.player.x + 50, this.player.y - 50, "Checkpoint!", {
                fontSize: '32px',
                fill: '#000000'
            });
            checkpointText.setDepth(100);

            // Make it fade out after 2 seconds
            this.tweens.add({
                targets: checkpointText,
                alpha: 0,
                duration: 2000,
                onComplete: () => {
                    checkpointText.destroy();
                }
            });
        }
    }

    // Method to handle player death
    handleDeath() {
        if (!this.dead) {
            this.dead = true;
            this.player.setTint(0xff0000);
            this.player.setVelocity(0);
            this.player.anims.play('idle');

            this.go.play();
            
            this.add.text(this.player.x - 50, this.player.y - 50, "Game Over", {
                fontSize: '32px',
                fill: '#000000'
            });

            this.scene.pause();
            
            const restartBtn = document.getElementById("restartButton");
            restartBtn.replaceWith(restartBtn.cloneNode(true));
            const newRestartBtn = document.getElementById("restartButton");
            newRestartBtn.style.display = "block";

            newRestartBtn.addEventListener("click", () => {
                newRestartBtn.style.display = "none";
                
                if (Next.checkpointData.reached) {
                    // Restart the Next scene (player will spawn at checkpoint)
                    this.scene.start("Next");
                } else {
                    // No checkpoint reached, restart from the beginning
                    this.scene.start("platformerScene");
                }
            });
        }
    }

    // Method to respawn player (if you need it elsewhere)
    respawnPlayer() {
        if (this.reachedCheckpoint) {
            this.player.setPosition(this.checkpointX, this.checkpointY);
            this.player.setVelocity(0, 0);
        } else {
            this.player.setPosition(25, 10);
            this.player.setVelocity(0, 0);
        }
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
    }

    spawnMeteor(){
        const x = Phaser.Math.Between(50, this.map.widthInPixels);
        const y = -50; // just above screen
    
        const meteor = this.meteorGroup.create(x, y, "meteor");
        meteor.setVelocityY(120); // falls straight down
        meteor.body.setAllowGravity(false);
        meteor.setCollideWorldBounds(false);
        meteor.setScale(0.1); // optional scaling
    }
}