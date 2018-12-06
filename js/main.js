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
      -90,
      -core_storage_data['gamearea-height'] / 2 - 20,
      180,
      gamearea_playerdist + 40
    );

    // Draw obstacles.
    canvas_setproperties({
      'properties': {
        'fillStyle': '#3c3c3c',
      },
    });
    core_group_modify({
      'groups': [
        'obstacle',
      ],
      'todo': function(entity){
          canvas_buffer.fillRect(
            core_entities[entity]['x'],
            core_entities[entity]['y'],
            core_entities[entity]['width'],
            core_entities[entity]['height']
          );
      },
    });

    // Draw spawners.
    canvas_setproperties({
      'properties': {
        'fillStyle': '#476291',
      },
    });
    core_group_modify({
      'groups': [
        'spawner',
      ],
      'todo': function(entity){
          canvas_buffer.fillRect(
            core_entities[entity]['x'] - 4,
            core_entities[entity]['y'] - 4,
            8,
            8
          );
      },
    });

    // Draw particles.
    core_group_modify({
      'groups': [
        'particle',
      ],
      'todo': function(entity){
          canvas_setproperties({
            'properties': {
              'fillStyle': core_entities[entity]['owner'] === false
                ? core_storage_data['particle-color']
                : core_entities[core_entities[entity]['owner']]['color'],
            },
          });
          canvas_buffer.fillRect(
            Math.round(core_entities[entity]['x']) - 2,
            Math.round(core_entities[entity]['y']) - 2,
            4,
            4
          );
      },
    });

    core_group_modify({
      'groups': [
        'player',
      ],
      'todo': function(entity){
          // Set color to player color.
          canvas_setproperties({
            'properties': {
              'fillStyle': core_entities[entity]['color'],
            },
          });

          // Draw paddle.
          canvas_buffer.fillRect(
            core_entities[entity]['paddle-x'],
            core_entities[entity]['paddle-y'],
            core_storage_data['paddle-width'],
            core_entities[entity]['paddle-height']
          );

          // Draw goal.
          canvas_buffer.fillRect(
            core_entities[entity]['goal-x'],
            core_entities[entity]['goal-y'],
            core_entities[entity]['goal-width'],
            core_entities[entity]['goal-height']
          );

          // Draw score.
          canvas_setproperties({
            'properties': {
              'fillStyle': '#fff',
            },
          });
          canvas_buffer.fillText(
            core_entities[entity]['score'] + '/' + core_storage_data['score-goal'] + (entity === winner ? ' WINNER': ''),
            core_entities[entity]['paddle-x'],
            core_entities[entity]['paddle-y'] + (entity === 'player-0' ? 60 : -35)
          );
      },
    });

    canvas_buffer.restore();
}

function logic(){
    if(core_entity_info['spawner']['count'] === 0){
        return;
    }

    // If the current number of particles
    //   is less than max, add new particle.
    if(core_entity_info['particle']['count'] < core_storage_data['particle-max']){
        let random_spawner = core_random_key({
          'object': core_groups['spawner'],
        });
        let x_speed = Math.random() * (core_storage_data['particle-speed'] * 2) - core_storage_data['particle-speed'];
        let y_speed = Math.random() * (core_storage_data['particle-speed'] * 2) - core_storage_data['particle-speed'];

        core_entity_create({
          'properties': {
            'x': core_entities[random_spawner]['x'],
            'x-speed': x_speed,
            'y': core_entities[random_spawner]['y'],
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

            core_entity_create({
              'properties': {
                'x': core_entities[id]['x'],
                'x-speed': -x_speed,
                'y': core_entities[id]['y'],
                'y-speed': -y_speed,
              },
              'types': [
                'particle',
              ],
            });
        }
    }

    // Reset movements for recalculation.
    core_entities['player-0']['target'] = false;
    core_entities['player-1']['target'] = false;

    core_group_modify({
      'groups': [
        'particle',
      ],
      'todo': function(entity){
          // If particle is within 90 pixels of center of goal.
          if(Math.abs(core_entities[entity]['x']) < 90){
              // If particle is moving downwards...
              if(core_entities[entity]['y-speed'] > 0){
                  // Link player 0 AI to track this particle if it is closest.
                  if((core_entities['player-0']['target'] === false || core_entities[entity]['y'] > core_entities[core_entities['player-0']['target']]['y'])
                    && core_entities[entity]['y'] < core_entities['player-0']['paddle-y']){
                      core_entities['player-0']['target'] = entity;
                  }

              // ...else link player 1 AI to track this particle if it is closest.
              }else if((core_entities['player-1']['target'] === false || core_entities[entity]['y'] < core_entities[core_entities['player-1']['target']]['y'])
                && core_entities[entity]['y'] > core_entities['player-1']['paddle-y']){
                  core_entities['player-1']['target'] = entity;
              }
          }

          // If particle has collided with a goal.
          if(core_entities[entity]['y'] + 2 > core_entities['player-0']['goal-y']
            || core_entities[entity]['y'] - 2 < core_entities['player-1']['goal-y'] + core_entities['player-1']['goal-height']){
              // Determine which player scored a goal.
              let temp_player = 0;
              if(core_entities[entity]['y'] + 2 > core_entities['player-0']['goal-y']){
                  temp_player = 1;
              }

              // If score can decrease and score is greater than 0, decrease the other players score by 1.
              if(core_storage_data['score-decrease']
                && core_entities['player-' + (1 - temp_player)]['score'] > 0){
                  core_entities['player-' + (1 - temp_player)]['score'] -= 1;
              }

              // Increase the scoring players score by 1.
              if(core_entities[entity]['owner'] === 'player-' + temp_player){
                  core_entities['player-' + temp_player]['score'] += 1;
              }

              if(core_entities['player-0']['target'] === entity){
                  core_entities['player-0']['target'] = false;
              }
              if(core_entities['player-1']['target'] === entity){
                  core_entities['player-1']['target'] = false;
              }

              core_entity_remove({
                'entities': [
                  entity,
                ],
              });

              core_audio_start({
                'id': 'boop',
              });

          }else{
              let bounce_x = 1;
              let bounce_y = 1;

              // Loop through obstacles to find collisions.
              core_group_modify({
                'groups': [
                  'obstacle',
                ],
                'todo': function(obstacle){
                    // X collisions.
                    if(core_entities[entity]['x'] >= core_entities[obstacle]['x']
                      && core_entities[entity]['x'] <= core_entities[obstacle]['x'] + core_entities[obstacle]['width']){
                        if(core_entities[entity]['y-speed'] > 0){
                            if(core_entities[entity]['y'] > core_entities[obstacle]['y'] - 2
                              && core_entities[entity]['y'] < core_entities[obstacle]['y']){
                                bounce_y = -core_storage_data['obstacle-multiplier-y'];
                            }

                        }else if(core_entities[entity]['y'] > core_entities[obstacle]['y'] + core_entities[obstacle]['height']
                          && core_entities[entity]['y'] < core_entities[obstacle]['y'] + core_entities[obstacle]['height'] + 2){
                            bounce_y = -core_storage_data['obstacle-multiplier-y'];
                        }

                    // Y collisions.
                    }else if(core_entities[entity]['y'] >= core_entities[obstacle]['y']
                      && core_entities[entity]['y'] <= core_entities[obstacle]['y'] + core_entities[obstacle]['height']){
                        if(core_entities[entity]['x-speed'] > 0){
                            if(core_entities[entity]['x'] > core_entities[obstacle]['x'] - 2
                              && core_entities[entity]['x'] < core_entities[obstacle]['x']){
                                bounce_x = -core_storage_data['obstacle-multiplier-x'];
                            }

                        }else if(core_entities[entity]['x'] > core_entities[obstacle]['x'] + core_entities[obstacle]['width']
                          && core_entities[entity]['x'] < core_entities[obstacle]['x'] + core_entities[obstacle]['width'] + 2){
                            bounce_x = -core_storage_data['obstacle-multiplier-x'];
                        }
                    }
                },
              });

              // Check for collisions with player paddles or edges of game area.
              if(core_entities[entity]['y'] > core_entities['player-1']['paddle-y'] + core_entities['player-1']['paddle-height']
                && core_entities[entity]['y'] < core_entities['player-0']['paddle-y']){
                  if(Math.abs(core_entities[entity]['x']) < 88){
                      if(core_entities[entity]['y'] > 0){
                          if(core_entities[entity]['x'] > core_entities['player-0']['paddle-x'] - 2
                            && core_entities[entity]['x'] < core_entities['player-0']['paddle-x'] + core_storage_data['paddle-width'] + 2
                            && core_entities[entity]['y-speed'] > 0
                            && core_entities[entity]['y'] + 2 >= core_entities['player-0']['paddle-y']){
                              if(core_storage_data['paddle-random']){
                                  core_entities[entity]['x-speed'] = Math.random() * (core_storage_data['particle-speed'] * 2) - core_storage_data['particle-speed'];
                              }
                              core_entities[entity]['owner'] = 'player-0';
                              bounce_y = -1;
                          }

                      }else if(core_entities[entity]['x'] > core_entities['player-1']['paddle-x'] - 2
                        && core_entities[entity]['x'] < core_entities['player-1']['paddle-x'] + core_storage_data['paddle-width'] + 2
                        && core_entities[entity]['y-speed'] < 0
                        && core_entities[entity]['y'] - 2 <= core_entities['player-1']['paddle-y'] + core_entities['player-1']['paddle-height']){
                          if(core_storage_data['paddle-random']){
                              core_entities[entity]['x-speed'] = Math.random() * (core_storage_data['particle-speed'] * 2) - core_storage_data['particle-speed'];
                          }
                          core_entities[entity]['owner'] = 'player-1';
                          bounce_y = -1;
                      }

                  // Left/right wall collisions.
                  }else if(Math.abs(core_entities[entity]['x']) > particle_x_limit){
                      bounce_x = -1;

                  // Player paddle collisions.
                  }else if((core_entities[entity]['y-speed'] < 0 && core_entities[entity]['y'] - 2 <= core_entities['player-1']['paddle-y'] + core_entities['player-1']['paddle-height'])
                    || (core_entities[entity]['y-speed'] > 0 && core_entities[entity]['y'] + 2 >= core_entities['player-0']['paddle-y'])){
                      bounce_y = -1;
                  }
              }

              core_entities[entity]['x-speed'] *= bounce_x;
              core_entities[entity]['y-speed'] *= bounce_y;

              // Remove particles that are moving too fast.
              if(core_entities[entity]['x-speed'] > core_storage_data['gamearea-width']
                || core_entities[entity]['y-speed'] > core_storage_data['gamearea-height']){
                  core_entity_remove({
                    'entities': [
                      entity,
                    ],
                  });

                  return;
              }

              core_entities[entity]['x'] += core_entities[entity]['x-speed'];
              core_entities[entity]['y'] += core_entities[entity]['y-speed'];
          }
      },
    });

    // Calculate movement direction if player0 ai is tracking a particle.
    let paddle_position = core_entities['player-0']['paddle-x'] + core_storage_data['paddle-width'] / 2;
    if(core_entities['player-0']['target'] === false){
        if(paddle_position === 0){
            core_entities['player-0']['paddle-x-move'] = 0;

        }else{
            core_entities['player-0']['paddle-x-move'] = paddle_position < 0
              ? core_storage_data['paddle-speed']
              : -core_storage_data['paddle-speed'];
        }

    }else{
        core_entities['player-0']['paddle-x-move'] = core_entities[core_entities['player-0']['target']]['x'] > paddle_position
          ? core_storage_data['paddle-speed']
          : -core_storage_data['paddle-speed'];
    }

    // Calculate movement direction if player1 ai is tracking a particle.
    paddle_position = core_entities['player-1']['paddle-x'] + core_storage_data['paddle-width'] / 2;
    if(core_entities['player-1']['target'] === false){
        if(paddle_position === 0){
            core_entities['player-1']['paddle-x-move'] = 0;

        }else{
            core_entities['player-1']['paddle-x-move'] = paddle_position < 0
              ? core_storage_data['paddle-speed']
              : -core_storage_data['paddle-speed'];
        }

    }else{
        core_entities['player-1']['paddle-x-move'] = core_entities[core_entities['player-1']['target']]['x'] > paddle_position
          ? core_storage_data['paddle-speed']
          : -core_storage_data['paddle-speed'];
    }

    // Move player 1 paddle, prevent from moving past goal boundaries.
    core_entities['player-1']['paddle-x'] += core_entities['player-1']['paddle-x-move'];
    if(core_entities['player-1']['paddle-x'] > 20){
        core_entities['player-1']['paddle-x'] = 20;

    }else if(core_entities['player-1']['paddle-x'] < -90){
        core_entities['player-1']['paddle-x'] = -90;
    }

    // If player controlled, handle keypress movement...
    if(player_controlled){
        if(core_keys[core_storage_data['move-←']]['state']
          && core_entities['player-0']['paddle-x'] > -90){
            core_entities['player-0']['paddle-x'] -= core_storage_data['paddle-speed'];

        }else if(core_entities['player-0']['paddle-x'] < -90){
            core_entities['player-0']['paddle-x'] = -90;
        }

        if(core_keys[core_storage_data['move-→']]['state']
          && core_entities['player-0']['paddle-x'] < 20){
            core_entities['player-0']['paddle-x'] += core_storage_data['paddle-speed'];

        }else if(core_entities['player-0']['paddle-x'] > 20){
            core_entities['player-0']['paddle-x'] = 20;
        }

    // ...else move via AI.
    }else{
        core_entities['player-0']['paddle-x'] += core_entities['player-0']['paddle-x-move'];
        if(core_entities['player-0']['paddle-x'] > 20){
            core_entities['player-0']['paddle-x'] = 20;

        }else if(core_entities['player-0']['paddle-x'] < -90){
            core_entities['player-0']['paddle-x'] = -90;
        }
    }

    // End game if any player has >= score-goal score.
    if(winner === false){
        core_group_modify({
          'groups': [
            'player',
          ],
          'todo': function(entity){
              if(core_entities[entity]['score'] >= core_storage_data['score-goal']){
                  winner = entity;
              }
          },
        });
    }
}

function repo_init(){
    core_repo_init({
      'audios': {
        'boop': {
          'duration': .1,
        },
      },
      'entities': {
        'obstacle': {},
        'particle': {
          'properties': {
            'owner': false,
          },
        },
        'player': {
          'properties': {
            'goal-height': 20,
            'goal-width': 200,
            'goal-x': -100,
            'paddle-height': 5,
            'paddle-x': -35,
            'paddle-x-move': 0,
            'score': 0,
            'target': false,
          },
        },
        'spawner': {},
      },
      'events': {
        'ai-vs-ai': {
          'onclick': function(){
              canvas_setmode({
                'newgame': true,
              });
          },
        },
        'ai-vs-player': {
          'onclick': function(){
              canvas_setmode({
                'mode': 1,
                'newgame': true,
              });
          },
        },
      },
      'globals': {
        'gamearea_playerdist': 0,
        'particle_x_limit': 0,
        'player_controlled': false,
        'winner': false,
      },
      'info': '<input id=ai-vs-ai type=button value="AI vs AI"><input id=ai-vs-player type=button value="Player vs AI">',
      'keybinds': {
        72: {
          'todo': function(){
            canvas_setmode({
              'mode': core_mode,
            });
          },
        },
      },
      'menu': true,
      'storage': {
        'gamearea-height': 500,
        'gamearea-width': 1000,
        'obstacle-count': 10,
        'obstacle-distance': 150,
        'obstacle-multiplier-x': 1.01,
        'obstacle-multiplier-y': 1.01,
        'obstacle-size': 65,
        'paddle-random': true,
        'paddle-speed': 2,
        'paddle-width': 70,
        'particle-color': '#dddddd',
        'particle-max': 100,
        'particle-speed': 1.5,
        'score-decrease': false,
        'score-goal': 20,
        'spawner-count': 3,
        'spawner-distance': 0,
        'spawner-mirror': true,
      },
      'storage-menu': '<table><tr><td><input id=gamearea-height><td>Level Height'
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
    canvas_init();
}
