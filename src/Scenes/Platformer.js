class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 800;
        this.DRAG = 800;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1000;
        this.JUMP_VELOCITY = -500;
        this.SCALE = 1.5;
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 70, 25);
        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("tilemap_packed", "tilemap_tiles");
        

        //jump sound
        this.jumpSound = this.sound.add('jump');

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        
        //Title Text
        this.add.text(150, 150, "Welcome to Meteor Trouble by Anish Bansal", {
            fontSize: '16px',
            fill: '#000000'
        });


        //tutorial
        this.add.text(150, 200, "Dodge meteors and don't stay in the water for too long!", {
            fontSize: '16px',
            fill: '#000000'
        });

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        
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
        
        

        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.pass, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);

        // set up player avatar
        this.player = this.physics.add.sprite(400, 300, "platformer_characters", 0);
        
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
            //document.getElementById("restartButton").style.display = "block";
            this.scene.start("Next");
        });

        /*
        /// Only show restart when level is completed
        const restartBtn = document.getElementById("restartButton");
        restartBtn.replaceWith(restartBtn.cloneNode(true));  // Remove any previous listeners
        const newRestartBtn = document.getElementById("restartButton");

        newRestartBtn.addEventListener("click", () => {
            newRestartBtn.style.display = "none";  // Hide the button again
            this.scene.restart();                  // Restart the level
        });
        */

        

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


    ///end check    

    }

}