'use strict';

function create_obstacle(id, obstacle_x, obstacle_y){
    const obstacle_height = core_random_integer({
      'max': core_storage_data['obstacle-size'],
    }) + 5;
    const obstacle_width = core_random_integer({
      'max': core_storage_data['obstacle-size'],
    }) + 5;

    entity_create({
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
    entity_create({
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
    particle_frames = core_storage_data['particle-frames'];
    player_controlled = id === 1;

    const gamearea_height_half = core_storage_data['gamearea-height'] / 2;
    const gamearea_width_half = core_storage_data['gamearea-width'] / 2;
    particle_x_limit = gamearea_width_half - 2;

    entity_create({
      'id': 'player-0',
      'properties': {
        'color': '#206620',
        'goal-y': gamearea_height_half + 10,
        'paddle-y': gamearea_height_half,
      },
      'types': [
        'player',
      ],
    });
    entity_create({
      'id': 'player-1',
      'properties': {
        'color': '#663366',
        'goal-y': -gamearea_height_half - 30,
        'paddle-y': -gamearea_height_half - 5,
      },
      'types': [
        'player',
      ],
    });

    gamearea_playerdist = Math.abs(entity_entities['player-1']['paddle-y']) + entity_entities['player-0']['paddle-y'] + 5;

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
        const spawner_x = core_random_integer({
          'max': gamearea_width_half * 2,
        }) - gamearea_width_half;
        const spawner_y = core_random_integer({
          'max': (gamearea_playerdist - 25) / 4,
        });
        if(Math.abs(spawner_x) < core_storage_data['spawner-distance']){
            spawner_x = core_storage_data['spawner-distance'] * (spawner_x > 0
              ? 1
              : -1);
        }

        entity_create({
          'id': 'spawner-a' + loop_counter,
          'properties': {
            'x': spawner_x,
            'y': spawner_y,
          },
          'types': [
            'spawner',
          ],
        });
        entity_create({
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

function repo_drawlogic(){
    canvas.save();
    canvas.translate(
      canvas_properties['width-half'],
      canvas_properties['height-half']
    );

    canvas_setproperties({
      'fillStyle': '#000',
    });
    canvas.fillRect(
      -core_storage_data['gamearea-width'] / 2,
      -core_storage_data['gamearea-height'] / 2,
      core_storage_data['gamearea-width'],
      core_storage_data['gamearea-height']
    );
    canvas.fillRect(
      -core_storage_data['goal-width'] / 2,
      -core_storage_data['gamearea-height'] / 2 - 20,
      core_storage_data['goal-width'],
      gamearea_playerdist + 40
    );

    canvas_setproperties({
      'fillStyle': '#3c3c3c',
    });
    entity_group_modify({
      'groups': [
        'obstacle',
      ],
      'todo': function(entity){
          canvas.fillRect(
            entity_entities[entity]['x'],
            entity_entities[entity]['y'],
            entity_entities[entity]['width'],
            entity_entities[entity]['height']
          );
      },
    });

    canvas_setproperties({
      'fillStyle': '#476291',
    });
    entity_group_modify({
      'groups': [
        'spawner',
      ],
      'todo': function(entity){
          canvas.fillRect(
            entity_entities[entity]['x'] - 4,
            entity_entities[entity]['y'] - 4,
            8,
            8
          );
      },
    });

    entity_group_modify({
      'groups': [
        'particle',
      ],
      'todo': function(entity){
          canvas_setproperties({
            'fillStyle': entity_entities[entity]['owner'] === false
              ? core_storage_data['particle-color']
              : entity_entities[entity_entities[entity]['owner']]['color'],
          });
          canvas.fillRect(
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
          canvas_setproperties({
            'fillStyle': entity_entities[entity]['color'],
          });

          canvas.fillRect(
            entity_entities[entity]['paddle-x'],
            entity_entities[entity]['paddle-y'],
            core_storage_data['paddle-width'],
            entity_entities[entity]['paddle-height']
          );

          canvas.fillRect(
            -core_storage_data['goal-width'] / 2 - 20,
            entity_entities[entity]['goal-y'],
            core_storage_data['goal-width'] + 40,
            20
          );

          canvas_setproperties({
            'fillStyle': '#fff',
          });
          canvas.fillText(
            entity_entities[entity]['score'] + '/' + core_storage_data['score-goal'] + (entity === winner ? ' WINNER': ''),
            entity_entities[entity]['paddle-x'],
            entity_entities[entity]['paddle-y'] + (entity === 'player-0' ? 60 : -35)
          );
      },
    });

    canvas.restore();
}

function repo_logic(){
    if(entity_info['spawner']['count'] === 0){
        return;
    }

    if(particle_frames >= core_storage_data['particle-frames']){
        if(entity_info['particle']['count'] < core_storage_data['particle-max']){
            const random_spawner = core_random_key(entity_groups['spawner']);
            const x_speed = Math.random() * (core_storage_data['particle-speed'] * 2) - core_storage_data['particle-speed'];
            const y_speed = Math.random() * (core_storage_data['particle-speed'] * 2) - core_storage_data['particle-speed'];

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

    const goal_width_half = core_storage_data['goal-width'] / 2;
    const paddle_x_max = goal_width_half - core_storage_data['paddle-width'];

    entity_entities['player-0']['target'] = false;
    entity_entities['player-1']['target'] = false;

    entity_group_modify({
      'groups': [
        'particle',
      ],
      'todo': function(entity){
          if(Math.abs(entity_entities[entity]['x']) < goal_width_half){
              if(entity_entities[entity]['y-speed'] > 0){
                  if((entity_entities['player-0']['target'] === false || entity_entities[entity]['y'] > entity_entities[entity_entities['player-0']['target']]['y'])
                    && entity_entities[entity]['y'] < entity_entities['player-0']['paddle-y']){
                      entity_entities['player-0']['target'] = entity;
                  }

              }else if((entity_entities['player-1']['target'] === false || entity_entities[entity]['y'] < entity_entities[entity_entities['player-1']['target']]['y'])
                && entity_entities[entity]['y'] > entity_entities['player-1']['paddle-y']){
                  entity_entities['player-1']['target'] = entity;
              }
          }

          if(entity_entities[entity]['y'] + 2 > entity_entities['player-0']['goal-y']
            || entity_entities[entity]['y'] - 2 < entity_entities['player-1']['goal-y'] + 20){
              let temp_player = 0;
              if(entity_entities[entity]['y'] + 2 > entity_entities['player-0']['goal-y']){
                  temp_player = 1;
              }

              if(core_storage_data['score-decrease']
                && entity_entities['player-' + (1 - temp_player)]['score'] > 0){
                  entity_entities['player-' + (1 - temp_player)]['score'] -= 1;
              }

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

              audio_start('boop');

          }else{
              let bounce_x = 1;
              let bounce_y = 1;

              entity_group_modify({
                'groups': [
                  'obstacle',
                ],
                'todo': function(obstacle){
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

                  }else if(Math.abs(entity_entities[entity]['x']) > particle_x_limit){
                      bounce_x = -1;

                  }else if((entity_entities[entity]['y-speed'] < 0 && entity_entities[entity]['y'] - 2 <= entity_entities['player-1']['paddle-y'] + entity_entities['player-1']['paddle-height'])
                    || (entity_entities[entity]['y-speed'] > 0 && entity_entities[entity]['y'] + 2 >= entity_entities['player-0']['paddle-y'])){
                      bounce_y = -1;
                  }
              }

              entity_entities[entity]['x-speed'] *= bounce_x;
              entity_entities[entity]['y-speed'] *= bounce_y;

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

    entity_entities['player-1']['paddle-x'] += entity_entities['player-1']['paddle-x-move'];
    if(entity_entities['player-1']['paddle-x'] > paddle_x_max){
        entity_entities['player-1']['paddle-x'] = paddle_x_max;

    }else if(entity_entities['player-1']['paddle-x'] < -goal_width_half){
        entity_entities['player-1']['paddle-x'] = -goal_width_half;
    }

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

    }else{
        entity_entities['player-0']['paddle-x'] += entity_entities['player-0']['paddle-x-move'];
        if(entity_entities['player-0']['paddle-x'] > paddle_x_max){
            entity_entities['player-0']['paddle-x'] = paddle_x_max;

        }else if(entity_entities['player-0']['paddle-x'] < -goal_width_half){
            entity_entities['player-0']['paddle-x'] = -goal_width_half;
        }
    }

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
      'info': '<button id=ai-vs-ai type=button>AI vs AI</button><button id=ai-vs-player type=button>Player vs AI</button>',
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
      'storage-menu': '<table><tr><td><input class=mini id=particle-frames min=1 step=any type=number><td>Frames/Particle'
        + '<tr><td><input class=mini id=goal-width min=1 step=any type=number><td>Goal Width'
        + '<tr><td><input class=mini id=gamearea-height min=1 step=any type=number><td>Level Height'
        + '<tr><td><input class=mini id=gamearea-width min=1 step=any type=number><td>Level Width'
        + '<tr><td><input class=mini id=obstacle-multiplier-x step=any type=number><td>Obstacle Bounce Multiplier X'
        + '<tr><td><input class=mini id=obstacle-multiplier-y step=any type=number><td>Obstacle Bounce Multiplier Y'
        + '<tr><td><input class=mini id=obstacle-count min=0 step=any type=number><td>*2 Obstacles Count'
        + '<tr><td><input class=mini id=obstacle-distance min=1 step=any type=number><td>Obstacle Minimum X'
        + '<tr><td><input class=mini id=obstacle-size step=any type=number><td>+5&lt; Obstacle Size'
        + '<tr><td><input id=paddle-random type=checkbox><td>Paddles Reflect Randomly'
        + '<tr><td><input class=mini id=paddle-speed step=any type=number><td>Paddle Speed'
        + '<tr><td><input class=mini id=paddle-width min=1 step=any type=number><td>Paddle Width'
        + '<tr><td><input id=particle-color type=color><td>Particle Color'
        + '<tr><td><input class=mini id=particle-max min=1 step=any type=number><td>Particle Limit'
        + '<tr><td><input class=mini id=particle-speed step=any type=number><td>&gt; Particle Speed'
        + '<tr><td><input id=score-decrease type=checkbox><td>Score Decreasable'
        + '<tr><td><input class=mini id=score-goal min=1 step=any type=number><td>Score Goal'
        + '<tr><td><input class=mini id=spawner-count min=1 step=any type=number><td>*2 Spawners'
        + '<tr><td><input class=mini id=spawner-distance step=any type=number><td>Spawner Minimum X'
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
    canvas_init();
}
