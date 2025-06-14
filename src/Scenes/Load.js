class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");
    
        // Load characters spritesheet (assuming you have a simple image, not an atlas)
        this.load.spritesheet("platformer_characters", "platformer_characters.png", {
            frameWidth: 24,  
            frameHeight: 24 
        });
    
        
        this.load.audio('jump', 'pixel-jump.mp3');
        this.load.audio('checkpointer', 'checkpoint.mp3');
        this.load.audio('gameOver', 'gameover.mp3');
        this.load.audio('complete', 'finished.mp3');

        // Load tilemap information
        this.load.image("tilemap_tiles", "tilemap_packed.png");
        

        this.load.spritesheet("bg_elements", "bgElements_spritesheet.png", {
            frameWidth: 18,  // Adjust this to match your background tile size
            frameHeight: 18  // Adjust this to match your background tile size
        });
        
        this.load.spritesheet("bg_packed", "tilemap-backgrounds_packed.png", {
            frameWidth: 18,  // Adjust this to match your background tile size  
            frameHeight: 18  // Adjust this to match your background tile size
        });


        //Load Meteor
        this.load.image("meteor", "meteor.png");

        this.load.spritesheet("tilemap_sheet", "tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });
        
        this.load.tilemapTiledJSON("platformer-level-1", "platform-level-1.json");
        this.load.tilemapTiledJSON("Last", "Last.json");
        this.load.tilemapTiledJSON("Next", "Next.json");


        // Particle images from png folder
        this.load.setPath("./assets/PNG (Transparent)/");

        //this.load.image("circle1", "circle_01.png");
        
        this.load.image('smoke', "smoke_02.png");
        this.load.image('star', "star_05.png");

        


    }

    create() {
        // Create animations using frame numbers instead of named frames
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('platformer_characters', {
                start: 0,
                end: 1
            }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('platformer_characters', {
                start: 0,
                end: 0
            }),
            frameRate: 1,
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNumbers('platformer_characters', {
                start: 1,
                end: 1
            }),
            frameRate: 1
        });
        // ...and pass to the next Scene
        this.scene.start("platformerScene");
    }
    
    // Never get here since a new scene is started in create()
    update() {
    }
}