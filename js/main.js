'use strict';

function draw_logic(){
    canvas_buffer.save();
    canvas_buffer.translate(
      canvas_properties['width-half'],
      canvas_properties['height-half']
    );

    // Draw gamearea background.
    canvas_setproperties({
      'properties': {
        'fillStyle': '#000',
      },
    });
    canvas_buffer.fillRect(
      -core_storage_data['gamearea-width'] / 2,
      -core_storage_data['gamearea-height'] / 2,
      core_storage_data['gamearea-width'],
      core_storage_data['gamearea-height']
    );
    canvas_buffer.fillRect(
      -core_storage_data['goal-width'] / 2,
      -core_storage_data['gamearea-height'] / 2 - 20,
      core_storage_data['goal-width'],
      gamearea_playerdist + 40
    );

    // Draw obstacles.
    canvas_setproperties({
      'properties': {
        'fillStyle': '#3c3c3c',
      },
    });
    entity_group_modify({
      'groups': [
        'obstacle',
      ],
      'todo': function(entity){
          canvas_buffer.fillRect(
            entity_entities[entity]['x'],
            entity_entities[entity]['y'],
            entity_entities[entity]['width'],
            entity_entities[entity]['height']
          );
      },
    });

    // Draw spawners.
    canvas_setproperties({
      'properties': {
        'fillStyle': '#476291',
      },
    });
    entity_group_modify({
      'groups': [
        'spawner',
      ],
      'todo': function(entity){
          canvas_buffer.fillRect(
            entity_entities[entity]['x'] - 4,
            entity_entities[entity]['y'] - 4,
            8,
            8
          );
      },
    });

    // Draw particles.
    entity_group_modify({
      'groups': [
        'particle',
      ],
      'todo': function(entity){
          canvas_setproperties({
            'properties': {
              'fillStyle': entity_entities[entity]['owner'] === false
                ? core_storage_data['particle-color']
                : entity_entities[entity_entities[entity]['owner']]['color'],
            },
          });
          canvas_buffer.fillRect(
            Math.round(entity_entities[entity]['x']) - 2,
            Math.round(entity_entities[entity]['y']) - 2,
            4,
            4
          );
      },
    });

    entity_group_modify({
      'groups': [
        'player',
      ],
      'todo': function(entity){
          // Set color to player color.
          canvas_setproperties({
            'properties': {
              'fillStyle': entity_entities[entity]['color'],
            },
          });

          // Draw paddle.
          canvas_buffer.fillRect(
            entity_entities[entity]['paddle-x'],
            entity_entities[entity]['paddle-y'],
            core_storage_data['paddle-width'],
            entity_entities[entity]['paddle-height']
          );

          // Draw goal.
          canvas_buffer.fillRect(
            -core_storage_data['goal-width'] / 2 - 20,
            entity_entities[entity]['goal-y'],
            core_storage_data['goal-width'] + 40,
            20
          );

          // Draw score.
          canvas_setproperties({
            'properties': {
              'fillStyle': '#fff',
            },
          });
          canvas_buffer.fillText(
            entity_entities[entity]['score'] + '/' + core_storage_data['score-goal'] + (entity === winner ? ' WINNER': ''),
            entity_entities[entity]['paddle-x'],
            entity_entities[entity]['paddle-y'] + (entity === 'player-0' ? 60 : -35)
          );
      },
    });

    canvas_buffer.restore();
}

function logic(){
    if(entity_info['spawner']['count'] === 0){
        return;
    }

    // Check if a new particle should be added.
    if(particle_frames >= core_storage_data['particle-frames']){
        // If the current number of particles is less than max, add new particle.
        if(entity_info['particle']['count'] < core_storage_data['particle-max']){
            let random_spawner = core_random_key({
              'object': entity_groups['spawner'],
            });
            let x_speed = Math.random() * (core_storage_data['particle-speed'] * 2) - core_storage_data['particle-speed'];
            let y_speed = Math.random() * (core_storage_data['particle-speed'] * 2) - core_storage_data['particle-speed'];

            entity_create({
              'properties': {
                'x': entity_entities[random_spawner]['x'],
                'x-speed': x_speed,
                'y': entity_entities[random_spawner]['y'],
                'y-speed': y_speed,
              },
              'types': [
                'particle',
              ],
            });

            if(core_storage_data['spawner-mirror']){
                let id = 'spawner-';
                id += random_spawner[8] === 'a'
                  ? 'b'
                  : 'a';
                id += random_spawner[9];

                entity_create({
                  'properties': {
                    'x': entity_entities[id]['x'],
                    'x-speed': -x_speed,
                    'y': entity_entities[id]['y'],
                    'y-speed': -y_speed,
                  },
                  'types': [
                    'particle',
                  ],
                });
            }

            particle_frames = 0;
        }

    }else{
        particle_frames++;
    }

    let goal_width_half = core_storage_data['goal-width'] / 2;
    let paddle_x_max = goal_width_half - core_storage_data['paddle-width'];

    // Reset movements for recalculation.
    entity_entities['player-0']['target'] = false;
    entity_entities['player-1']['target'] = false;

    entity_group_modify({
      'groups': [
        'particle',
      ],
      'todo': function(entity){
          // If particle is within goal_width_half pixels of center of goal.
          if(Math.abs(entity_entities[entity]['x']) < goal_width_half){
              // If particle is moving downwards...
              if(entity_entities[entity]['y-speed'] > 0){
                  // Link player 0 AI to track this particle if it is closest.
                  if((entity_entities['player-0']['target'] === false || entity_entities[entity]['y'] > entity_entities[entity_entities['player-0']['target']]['y'])
                    && entity_entities[entity]['y'] < entity_entities['player-0']['paddle-y']){
                      entity_entities['player-0']['target'] = entity;
                  }

              // ...else link player 1 AI to track this particle if it is closest.
              }else if((entity_entities['player-1']['target'] === false || entity_entities[entity]['y'] < entity_entities[entity_entities['player-1']['target']]['y'])
                && entity_entities[entity]['y'] > entity_entities['player-1']['paddle-y']){
                  entity_entities['player-1']['target'] = entity;
              }
          }

          // If particle has collided with a goal.
          if(entity_entities[entity]['y'] + 2 > entity_entities['player-0']['goal-y']
            || entity_entities[entity]['y'] - 2 < entity_entities['player-1']['goal-y'] + 20){
              // Determine which player scored a goal.
              let temp_player = 0;
              if(entity_entities[entity]['y'] + 2 > entity_entities['player-0']['goal-y']){
                  temp_player = 1;
              }

              // If score can decrease and score is greater than 0, decrease the other players score by 1.
              if(core_storage_data['score-decrease']
                && entity_entities['player-' + (1 - temp_player)]['score'] > 0){
                  entity_entities['player-' + (1 - temp_player)]['score'] -= 1;
              }

              // Increase the scoring players score by 1.
              if(entity_entities[entity]['owner'] === 'player-' + temp_player){
                  entity_entities['player-' + temp_player]['score'] += 1;
              }

              if(entity_entities['player-0']['target'] === entity){
                  entity_entities['player-0']['target'] = false;
              }
              if(entity_entities['player-1']['target'] === entity){
                  entity_entities['player-1']['target'] = false;
              }

              entity_remove({
                'entities': [
                  entity,
                ],
              });

              audio_start({
                'id': 'boop',
              });

          }else{
              let bounce_x = 1;
              let bounce_y = 1;

              // Loop through obstacles to find collisions.
              entity_group_modify({
                'groups': [
                  'obstacle',
                ],
                'todo': function(obstacle){
                    // X collisions.
                    if(entity_entities[entity]['x'] >= entity_entities[obstacle]['x']
                      && entity_entities[entity]['x'] <= entity_entities[obstacle]['x'] + entity_entities[obstacle]['width']){
                        if(entity_entities[entity]['y-speed'] > 0){
                            if(entity_entities[entity]['y'] > entity_entities[obstacle]['y'] - 2
                              && entity_entities[entity]['y'] < entity_entities[obstacle]['y']){
                                bounce_y = -core_storage_data['obstacle-multiplier-y'];
                            }

                        }else if(entity_entities[entity]['y'] > entity_entities[obstacle]['y'] + entity_entities[obstacle]['height']
                          && entity_entities[entity]['y'] < entity_entities[obstacle]['y'] + entity_entities[obstacle]['height'] + 2){
                            bounce_y = -core_storage_data['obstacle-multiplier-y'];
                        }

                    // Y collisions.
                    }else if(entity_entities[entity]['y'] >= entity_entities[obstacle]['y']
                      && entity_entities[entity]['y'] <= entity_entities[obstacle]['y'] + entity_entities[obstacle]['height']){
                        if(entity_entities[entity]['x-speed'] > 0){
                            if(entity_entities[entity]['x'] > entity_entities[obstacle]['x'] - 2
                              && entity_entities[entity]['x'] < entity_entities[obstacle]['x']){
                                bounce_x = -core_storage_data['obstacle-multiplier-x'];
                            }

                        }else if(entity_entities[entity]['x'] > entity_entities[obstacle]['x'] + entity_entities[obstacle]['width']
                          && entity_entities[entity]['x'] < entity_entities[obstacle]['x'] + entity_entities[obstacle]['width'] + 2){
                            bounce_x = -core_storage_data['obstacle-multiplier-x'];
                        }
                    }
                },
              });

              // Check for collisions with player paddles or edges of game area.
              if(entity_entities[entity]['y'] > entity_entities['player-1']['paddle-y'] + entity_entities['player-1']['paddle-height']
                && entity_entities[entity]['y'] < entity_entities['player-0']['paddle-y']){
                  if(Math.abs(entity_entities[entity]['x']) < goal_width_half){
                      if(entity_entities[entity]['y'] > 0){
                          if(entity_entities[entity]['x'] > entity_entities['player-0']['paddle-x'] - 2
                            && entity_entities[entity]['x'] < entity_entities['player-0']['paddle-x'] + core_storage_data['paddle-width'] + 2
                            && entity_entities[entity]['y-speed'] > 0
                            && entity_entities[entity]['y'] + 2 >= entity_entities['player-0']['paddle-y']){
                              if(core_storage_data['paddle-random']){
                                  entity_entities[entity]['x-speed'] = Math.random() * (core_storage_data['particle-speed'] * 2) - core_storage_data['particle-speed'];
                              }
                              entity_entities[entity]['owner'] = 'player-0';
                              bounce_y = -1;
                          }

                      }else if(entity_entities[entity]['x'] > entity_entities['player-1']['paddle-x'] - 2
                        && entity_entities[entity]['x'] < entity_entities['player-1']['paddle-x'] + core_storage_data['paddle-width'] + 2
                        && entity_entities[entity]['y-speed'] < 0
                        && entity_entities[entity]['y'] - 2 <= entity_entities['player-1']['paddle-y'] + entity_entities['player-1']['paddle-height']){
                          if(core_storage_data['paddle-random']){
                              entity_entities[entity]['x-speed'] = Math.random() * (core_storage_data['particle-speed'] * 2) - core_storage_data['particle-speed'];
                          }
                          entity_entities[entity]['owner'] = 'player-1';
                          bounce_y = -1;
                      }

                  // Left/right wall collisions.
                  }else if(Math.abs(entity_entities[entity]['x']) > particle_x_limit){
                      bounce_x = -1;

                  // Player paddle collisions.
                  }else if((entity_entities[entity]['y-speed'] < 0 && entity_entities[entity]['y'] - 2 <= entity_entities['player-1']['paddle-y'] + entity_entities['player-1']['paddle-height'])
                    || (entity_entities[entity]['y-speed'] > 0 && entity_entities[entity]['y'] + 2 >= entity_entities['player-0']['paddle-y'])){
                      bounce_y = -1;
                  }
              }

              entity_entities[entity]['x-speed'] *= bounce_x;
              entity_entities[entity]['y-speed'] *= bounce_y;

              // Remove particles that are moving too fast.
              if(entity_entities[entity]['x-speed'] > core_storage_data['gamearea-width']
                || entity_entities[entity]['y-speed'] > core_storage_data['gamearea-height']){
                  entity_remove({
                    'entities': [
                      entity,
                    ],
                  });

                  return;
              }

              entity_entities[entity]['x'] += entity_entities[entity]['x-speed'];
              entity_entities[entity]['y'] += entity_entities[entity]['y-speed'];
          }
      },
    });

    // Calculate movement direction if player0 ai is tracking a particle.
    let paddle_position = entity_entities['player-0']['paddle-x'] + core_storage_data['paddle-width'] / 2;
    if(entity_entities['player-0']['target'] === false){
        if(paddle_position === 0){
            entity_entities['player-0']['paddle-x-move'] = 0;

        }else{
            entity_entities['player-0']['paddle-x-move'] = paddle_position < 0
              ? core_storage_data['paddle-speed']
              : -core_storage_data['paddle-speed'];
        }

    }else{
        entity_entities['player-0']['paddle-x-move'] = entity_entities[entity_entities['player-0']['target']]['x'] > paddle_position
          ? core_storage_data['paddle-speed']
          : -core_storage_data['paddle-speed'];
    }

    // Calculate movement direction if player1 ai is tracking a particle.
    paddle_position = entity_entities['player-1']['paddle-x'] + core_storage_data['paddle-width'] / 2;
    if(entity_entities['player-1']['target'] === false){
        if(paddle_position === 0){
            entity_entities['player-1']['paddle-x-move'] = 0;

        }else{
            entity_entities['player-1']['paddle-x-move'] = paddle_position < 0
              ? core_storage_data['paddle-speed']
              : -core_storage_data['paddle-speed'];
        }

    }else{
        entity_entities['player-1']['paddle-x-move'] = entity_entities[entity_entities['player-1']['target']]['x'] > paddle_position
          ? core_storage_data['paddle-speed']
          : -core_storage_data['paddle-speed'];
    }

    // Move player 1 paddle, prevent from moving past goal boundaries.
    entity_entities['player-1']['paddle-x'] += entity_entities['player-1']['paddle-x-move'];
    if(entity_entities['player-1']['paddle-x'] > paddle_x_max){
        entity_entities['player-1']['paddle-x'] = paddle_x_max;

    }else if(entity_entities['player-1']['paddle-x'] < -goal_width_half){
        entity_entities['player-1']['paddle-x'] = -goal_width_half;
    }

    // If player controlled, handle keypress movement...
    if(player_controlled){
        if(core_keys[core_storage_data['move-←']]['state']
          && entity_entities['player-0']['paddle-x'] > -goal_width_half){
            entity_entities['player-0']['paddle-x'] -= core_storage_data['paddle-speed'];

        }else if(entity_entities['player-0']['paddle-x'] < -goal_width_half){
            entity_entities['player-0']['paddle-x'] = -goal_width_half;
        }

        if(core_keys[core_storage_data['move-→']]['state']
          && entity_entities['player-0']['paddle-x'] < paddle_x_max){
            entity_entities['player-0']['paddle-x'] += core_storage_data['paddle-speed'];

        }else if(entity_entities['player-0']['paddle-x'] > paddle_x_max){
            entity_entities['player-0']['paddle-x'] = paddle_x_max;
        }

    // ...else move via AI.
    }else{
        entity_entities['player-0']['paddle-x'] += entity_entities['player-0']['paddle-x-move'];
        if(entity_entities['player-0']['paddle-x'] > paddle_x_max){
            entity_entities['player-0']['paddle-x'] = paddle_x_max;

        }else if(entity_entities['player-0']['paddle-x'] < -goal_width_half){
            entity_entities['player-0']['paddle-x'] = -goal_width_half;
        }
    }

    // End game if any player has >= score-goal score.
    if(winner === false){
        entity_group_modify({
          'groups': [
            'player',
          ],
          'todo': function(entity){
              if(entity_entities[entity]['score'] >= core_storage_data['score-goal']){
                  winner = entity;
              }
          },
        });
    }
}

function repo_escape(){
    if(!entity_entities['player-0']
      && !core_menu_open){
        core_repo_reset();
    }
}

function repo_init(){
    core_repo_init({
      'events': {
        'ai-vs-ai': {
          'onclick': function(){
              canvas_setmode({
                'mode': 0,
              });
          },
        },
        'ai-vs-player': {
          'onclick': function(){
              canvas_setmode({
                'mode': 1,
              });
          },
        },
      },
      'globals': {
        'gamearea_playerdist': 0,
        'particle_frames': 0,
        'particle_x_limit': 0,
        'player_controlled': false,
        'winner': false,
      },
      'info': '<input id=ai-vs-ai type=button value="AI vs AI"><input id=ai-vs-player type=button value="Player vs AI">',
      'menu': true,
      'reset': function(){
          canvas_setmode({
            'mode': core_mode,
          });
      },
      'storage': {
        'gamearea-height': 500,
        'gamearea-width': 1000,
        'goal-width': 180,
        'obstacle-count': 10,
        'obstacle-distance': 150,
        'obstacle-multiplier-x': 1.01,
        'obstacle-multiplier-y': 1.01,
        'obstacle-size': 65,
        'paddle-random': true,
        'paddle-speed': 2,
        'paddle-width': 70,
        'particle-color': '#dddddd',
        'particle-frames': 1,
        'particle-max': 100,
        'particle-speed': 1.5,
        'score-decrease': false,
        'score-goal': 20,
        'spawner-count': 3,
        'spawner-distance': 0,
        'spawner-mirror': true,
      },
      'storage-menu': '<table><tr><td><input id=particle-frames><td>Frames/Particle'
        + '<tr><td><input id=goal-width><td>Goal Width'
        + '<tr><td><input id=gamearea-height><td>Level Height'
        + '<tr><td><input id=gamearea-width><td>Level Width'
        + '<tr><td><input id=obstacle-multiplier-x><td>Obstacle Bounce Multiplier X'
        + '<tr><td><input id=obstacle-multiplier-y><td>Obstacle Bounce Multiplier Y'
        + '<tr><td><input id=obstacle-count><td>*2 Obstacles Count'
        + '<tr><td><input id=obstacle-distance><td>Obstacle Minimum X'
        + '<tr><td><input id=obstacle-size><td>+5&lt; Obstacle Size'
        + '<tr><td><input id=paddle-random type=checkbox><td>Paddles Reflect Randomly'
        + '<tr><td><input id=paddle-speed><td>Paddle Speed'
        + '<tr><td><input id=paddle-width><td>Paddle Width'
        + '<tr><td><input id=particle-color type=color><td>Particle Color'
        + '<tr><td><input id=particle-max><td>Particle Limit'
        + '<tr><td><input id=particle-speed><td>&gt; Particle Speed'
        + '<tr><td><input id=score-decrease type=checkbox><td>Score Decreasable'
        + '<tr><td><input id=score-goal><td>Score Goal'
        + '<tr><td><input id=spawner-count><td>*2 Spawners'
        + '<tr><td><input id=spawner-distance><td>Spawner Minimum X'
        + '<tr><td><input id=spawner-mirror type=checkbox><td>Spawner Spawns Mirrored</table>',
      'title': 'Particleball-2D.htm',
    });
    entity_set({
      'type': 'obstacle',
    });
    entity_set({
      'properties': {
        'owner': false,
      },
      'type': 'particle',
    });
    entity_set({
      'type': 'spawner',
    });
    entity_set({
      'properties': {
        'goal-x': -100,
        'paddle-height': 5,
        'paddle-x': -35,
        'paddle-x-move': 0,
        'score': 0,
        'target': false,
      },
      'type': 'player',
    });
    audio_create({
      'audios': {
        'boop': {
          'duration': .1,
        },
      },
    });
    canvas_init();
}
