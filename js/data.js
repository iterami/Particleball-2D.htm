'use strict';

function create_obstacle(id, obstacle_x, obstacle_y){
    let obstacle_height = core_random_integer({
      'max': core_storage_data['obstacle-size'],
    }) + 5;
    let obstacle_width = core_random_integer({
      'max': core_storage_data['obstacle-size'],
    }) + 5;

    // Add new obstacle and mirror.
    core_entity_create({
      'id': 'obstacle-a' + id,
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
      'id': 'obstacle-b' + id,
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
    canvas_properties['clearColor'] = '#3c3c3c';

    player_controlled = id === 1;

    // Get half of height and width of game area.
    let gamearea_height_half = core_storage_data['gamearea-height'] / 2;
    let gamearea_width_half = core_storage_data['gamearea-width'] / 2;

    // How far particles can go on x axis positive or negative.
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

    // Enforce valid spawners.
    core_storage_data['spawner-count'] = Math.max(
      core_storage_data['spawner-count'],
      1
    );
    core_storage_data['spawner-distance'] = Math.min(
      core_storage_data['spawner-distance'],
      core_storage_data['gamearea-width'] / 2 - 5
    );

    let loop_counter = core_storage_data['spawner-count'] - 1;
    do{
        let spawner_x = core_random_integer({
          'max': gamearea_width_half * 2,
        }) - gamearea_width_half;
        let spawner_y = core_random_integer({
          'max': (gamearea_playerdist - 25) / 4,
        });
        if(Math.abs(spawner_x) < core_storage_data['spawner-distance']){
            spawner_x += core_storage_data['spawner-distance'] * (spawner_x > 0
              ? 1
              : -1);
        }

        // Add new spawner and mirror.
        core_entity_create({
          'id': 'spawner-a' + loop_counter,
          'properties': {
            'x': spawner_x,
            'y': spawner_y,
          },
          'types': [
            'spawner',
          ],
        });
        core_entity_create({
          'id': 'spawner-b' + loop_counter,
          'properties': {
            'x': -spawner_x,
            'y': -spawner_y,
          },
          'types': [
            'spawner',
          ],
        });
    }while(loop_counter--);

    if(core_storage_data['obstacle-count'] > 0){
        let loop_counter = core_storage_data['obstacle-count'] - 1;
        do{
            let obstacle_x = core_random_integer({
              'max': gamearea_width_half * 2,
            }) - gamearea_width_half;
            if(Math.abs(obstacle_x) < core_storage_data['obstacle-distance']){
                obstacle_x += core_storage_data['obstacle-distance'] * (obstacle_x > 0
                  ? 1
                  : -1);
            }

            create_obstacle(
              loop_counter,
              obstacle_x,
              core_random_integer({
                'max': (gamearea_playerdist - 25) / 2,
              })
            );
        }while(loop_counter--);
    }
}
