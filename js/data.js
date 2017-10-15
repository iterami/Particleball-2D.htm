'use strict';

function create_obstacle(obstacle_x, obstacle_y){
    var obstacle_height = core_random_integer({
      'max': core_storage_data['obstacle-size'],
    }) + 5;
    var obstacle_width = core_random_integer({
      'max': core_storage_data['obstacle-size'],
    }) + 5;

    // Add new obstacle and mirror.
    core_entity_create({
      'properties': {
        'height': obstacle_height,
        'width': obstacle_width,
        'x': obstacle_x - obstacle_width / 2,
        'y': obstacle_y - obstacle_height / 2,
      },
      'types': [
        'obstacle',
      ],
    });
    core_entity_create({
      'properties': {
        'height': obstacle_height,
        'width': obstacle_width,
        'x': -obstacle_x - obstacle_width / 2,
        'y': -obstacle_y - obstacle_height / 2,
      },
      'types': [
        'obstacle',
      ],
    });
}

function load_data(id){
    player_controlled = id === 1;

    document.getElementById('canvas').style.background = '#3c3c3c';

    // Get half of height and width of game area.
    var gamearea_height_half = core_storage_data['gamearea-height'] / 2;
    var gamearea_width_half = core_storage_data['gamearea-width'] / 2;

    // Particle_x_limit is how far particles can go on x axis positive or negative.
    particle_x_limit = gamearea_width_half - 2;

    // Setup player information.
    core_entity_create({
      'id': 'player-0',
      'properties': {
        'color': core_storage_data['color-positive'],
        'goal-y': gamearea_height_half + 10,
        'paddle-y': gamearea_height_half,
      },
      'types': [
        'player',
      ],
    });
    core_entity_create({
      'id': 'player-1',
      'properties': {
        'color': core_storage_data['color-negative'],
        'goal-y': -gamearea_height_half - 30,
        'paddle-y': -gamearea_height_half - 5,
      },
      'types': [
        'player',
      ],
    });

    // Calculate distance between both players.
    gamearea_playerdist = Math.abs(core_entities['player-1']['paddle-y']) + core_entities['player-0']['paddle-y'] + 5;

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
        core_entity_create({
          'properties': {
            'x': spawner_x,
            'y': spawner_y,
          },
          'types': [
            'spawner',
          ],
        });
        core_entity_create({
          'properties': {
            'x': -spawner_x,
            'y': -spawner_y,
          },
          'types': [
            'spawner',
          ],
        });
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

var gamearea_playerdist = 0;
var particle_x_limit = 0;
var player_controlled = false;
