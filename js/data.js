'use strict';

function load_data(id){
    obstacles = [];
    particles = [];
    player_controlled = id === 1;
    spawners = [];

    document.getElementById('canvas').style.background = '#3c3c3c';

    // Get half of height and width of game area.
    var gamearea_height_half = core_storage_data['gamearea-height'] / 2;
    var gamearea_width_half = core_storage_data['gamearea-width'] / 2;

    // Particle_x_limit is how far particles can go on x axis positive or negative.
    particle_x_limit = gamearea_width_half - 2;

    // Setup player information.
    players = [
      {
       'color': core_storage_data['color-positive'],
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
        'color': core_storage_data['color-negative'],
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
    core_storage_data['number-of-spawners'] = Math.max(
      core_storage_data['number-of-spawners'],
      1
    );

    var loop_counter = core_storage_data['number-of-spawners'] - 1;
    do{
        var spawner_x = core_random_integer({
          'max': gamearea_width_half * 2,
        }) - gamearea_width_half;
        var spawner_y = core_random_integer({
          'max': (gamearea_playerdist - 25) / 4,
        });

        // Add new spawner and mirror.
        spawners.push(
          [
            spawner_x,
            spawner_y
          ],
          [
            -spawner_x,
            -spawner_y
          ]
        );
    }while(loop_counter--);

    if(core_storage_data['number-of-obstacles'] > 0){
        var loop_counter = core_storage_data['number-of-obstacles'] - 1;
        do{
            create_obstacle(
              core_random_integer({
                'max': gamearea_width_half * 2,
              }) - gamearea_width_half,
              core_random_integer({
                'max': (gamearea_playerdist - 25) / 2,
              })
            );
        }while(loop_counter--);
    }
}
