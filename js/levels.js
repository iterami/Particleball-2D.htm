'use strict';

function load_level(id){
    document.getElementById('canvas').style.background = '#3c3c3c';

    // Get half of height and width of game area.
    var gamearea_height_half = storage_data['gamearea-height'] / 2;
    var gamearea_width_half = storage_data['gamearea-width'] / 2;

    // Particle_x_limit is how far particles can go on x axis positive or negative.
    particle_x_limit = gamearea_width_half - 2;

    // Setup player information.
    players = [
      {
       'color': '#2d8930',
        'goal-height': 20,
        'goal-width': 200,
        'goal-x': -100,
        'goal-y': gamearea_height_half + 10,
        'paddle-height': 5,
        'paddle-width': 70,
        'paddle-x': -35,
        'paddle-x-move': 0,
        'paddle-y': gamearea_height_half,
        'score': 0,
      },
      {
        'color': '#f70',
        'goal-height': 20,
        'goal-width': 200,
        'goal-x': -100,
        'goal-y': -gamearea_height_half - 30,
        'paddle-height': 5,
        'paddle-width': 70,
        'paddle-x': -35,
        'paddle-x-move': 0,
        'paddle-y': -gamearea_height_half - 5,
        'score': 0,
      },
    ];

    // Calculate distance between both players.
    gamearea_playerdist = Math.abs(players[1]['paddle-y']) + players[0]['paddle-y'] + 5;

    // Require spawners.
    storage_data['number-of-spawners'] = Math.max(
      storage_data['number-of-spawners'],
      1
    );

    var loop_counter = storage_data['number-of-spawners'] - 1;
    do{
        // new spawner center_x
        var temp0 = random_integer({
          'max': gamearea_width_half * 2,
        }) - gamearea_width_half;
        // new spawner center_y
        var temp1 = random_integer({
          'max': (gamearea_playerdist - 25) / 4,
        });

        // Add new spawner.
        spawners.push([
          temp0,
          temp1,
        ]);

        // Add mirrored version of new spawner.
        spawners.push([
          -temp0,
          -temp1,
        ]);
    }while(loop_counter--);

    if(storage_data['number-of-obstacles'] > 0){
        var loop_counter = storage_data['number-of-obstacles'] - 1;
        do{
            create_obstacle(
              random_integer({
                'max': gamearea_width_half * 2,
              }) - gamearea_width_half,
              random_integer({
                'max': (gamearea_playerdist - 25) / 2,
              })
            );
        }while(loop_counter--);
    }
}
