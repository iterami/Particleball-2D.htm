'use strict';

function create_obstacle(id, obstacle_x, obstacle_y){
    const obstacle_height = core_random_integer(core_storage_data.obstacle_size) + 5;
    const obstacle_width = core_random_integer(core_storage_data.obstacle_size) + 5;

    entity_create({
      'id': 'obstacle_a' + id,
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
      'id': 'obstacle_b' + id,
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

function repo_drawlogic(){
    canvas.save();
    canvas.translate(
      canvas_properties.width_half,
      canvas_properties.height_half
    );

    canvas_setproperties({
      'fillStyle': '#000',
    });
    canvas.fillRect(
      -core_storage_data.gamearea_width / 2,
      -core_storage_data.gamearea_height / 2,
      core_storage_data.gamearea_width,
      core_storage_data.gamearea_height
    );
    canvas.fillRect(
      -core_storage_data.goal_width / 2,
      -core_storage_data.gamearea_height / 2 - 20,
      core_storage_data.goal_width,
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
            entity.x,
            entity.y,
            entity.width,
            entity.height
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
            entity.x - 4,
            entity.y - 4,
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
            'fillStyle': entity.owner === false
              ? core_storage_data.particle_color
              : entity_entities[entity.owner].color,
          });
          canvas.fillRect(
            Math.round(entity.x) - 2,
            Math.round(entity.y) - 2,
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
            'fillStyle': entity.color,
          });

          canvas.fillRect(
            entity.paddle_x,
            entity.paddle_y,
            core_storage_data.paddle_width,
            entity.paddle_height
          );

          canvas.fillRect(
            -core_storage_data.goal_width / 2 - 20,
            entity.goal_y,
            core_storage_data.goal_width + 40,
            20
          );

          canvas_setproperties({
            'fillStyle': '#fff',
          });
          canvas.fillText(
            entity.score + '/' + core_storage_data.score_goal + (entity.id === winner ? ' WINNER': ''),
            entity.paddle_x,
            entity.paddle_y + (entity.id === 'player_0' ? 60 : -35)
          );
      },
    });

    canvas.restore();
}

function repo_escape(){
    if(!entity_entities.player_0
      && !core_menu_open){
        reset(0);
    }
}

function repo_init(){
    core_repo_init({
      'beforeunload': {
        'todo': function(event){
            if(particle_x_limit > 0){
                core_escape(true);
                event.preventDefault();
            }
        },
      },
      'events': {
        'ai_vs_ai': {
          'onclick': function(){
              reset(0);
          },
        },
        'ai_vs_player': {
          'onclick': function(){
              reset(1);
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
      'info': '<button id=ai_vs_ai type=button>AI vs AI</button><button id=ai_vs_player type=button>Player vs AI</button>',
      'menu': true,
      'pointerbinds': {},
      'storage': {
        'gamearea_height': 500,
        'gamearea_width': 1000,
        'goal_width': 180,
        'obstacle_count': 10,
        'obstacle_distance': 150,
        'obstacle_multiplier_x': 1.01,
        'obstacle_multiplier_y': 1.01,
        'obstacle_size': 65,
        'paddle_random': true,
        'paddle_speed': 2,
        'paddle_width': 70,
        'particle_color': '#dddddd',
        'particle_frames': 1,
        'particle_max': 100,
        'particle_speed': 1.5,
        'score_decrease': false,
        'score_goal': 20,
        'spawner_count': 3,
        'spawner_distance': 0,
        'spawner_mirror': true,
      },
      'storage_controls': true,
      'storage_menu': '<table><tr><td><input class=mini id=particle_frames min=1 step=1 type=number><td>Frames/Particle'
        + '<tr><td><input class=mini id=goal_width min=1 step=any type=number><td>Goal Width'
        + '<tr><td><input class=mini id=gamearea_height min=1 step=any type=number><td>Level Height'
        + '<tr><td><input class=mini id=gamearea_width min=1 step=any type=number><td>Level Width'
        + '<tr><td><input class=mini id=obstacle_multiplier_x step=any type=number><td>Obstacle Bounce Multiplier X'
        + '<tr><td><input class=mini id=obstacle_multiplier_y step=any type=number><td>Obstacle Bounce Multiplier Y'
        + '<tr><td><input class=mini id=obstacle_count min=0 step=1 type=number><td>*2 Obstacles Count'
        + '<tr><td><input class=mini id=obstacle_distance min=1 step=any type=number><td>Obstacle Minimum X'
        + '<tr><td><input class=mini id=obstacle_size step=any type=number><td>+5&lt; Obstacle Size'
        + '<tr><td><input id=paddle_random type=checkbox><td>Paddles Reflect Randomly'
        + '<tr><td><input class=mini id=paddle_speed step=any type=number><td>Paddle Speed'
        + '<tr><td><input class=mini id=paddle_width min=1 step=any type=number><td>Paddle Width'
        + '<tr><td><input id=particle_color type=color><td>Particle Color'
        + '<tr><td><input class=mini id=particle_max min=1 step=1 type=number><td>Particle Limit'
        + '<tr><td><input class=mini id=particle_speed step=any type=number><td>&gt; Particle Speed'
        + '<tr><td><input id=score_decrease type=checkbox><td>Score Decreasable'
        + '<tr><td><input class=mini id=score_goal min=1 step=1 type=number><td>Score Goal'
        + '<tr><td><input class=mini id=spawner_count min=1 step=1 type=number><td>*2 Spawners'
        + '<tr><td><input class=mini id=spawner_distance step=any type=number><td>Spawner Minimum X'
        + '<tr><td><input id=spawner_mirror type=checkbox><td>Spawner Spawns Mirrored</table>',
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
        'goal_x': -100,
        'paddle_height': 5,
        'paddle_x': -35,
        'paddle_x_move': 0,
        'score': 0,
        'target': false,
      },
      'type': 'player',
    });
    canvas_init({
      'cursor': 'pointer',
    });
}

function repo_load(id){
    canvas_properties.clearColor = '#3c3c3c';
    particle_frames = Math.floor(core_storage_data.particle_frames);
    player_controlled = id === 1;

    const gamearea_height_half = core_storage_data.gamearea_height / 2;
    const gamearea_width_half = core_storage_data.gamearea_width / 2;
    particle_x_limit = gamearea_width_half - 2;

    entity_create({
      'id': 'player_0',
      'properties': {
        'color': '#206620',
        'goal_y': gamearea_height_half + 10,
        'paddle_y': gamearea_height_half,
      },
      'types': [
        'player',
      ],
    });
    entity_create({
      'id': 'player_1',
      'properties': {
        'color': '#663366',
        'goal_y': -gamearea_height_half - 30,
        'paddle_y': -gamearea_height_half - 5,
      },
      'types': [
        'player',
      ],
    });

    gamearea_playerdist = Math.abs(entity_entities.player_1.paddle_y) + entity_entities.player_0.paddle_y + 5;

    core_storage_data.spawner_count = Math.floor(Math.max(
      core_storage_data.spawner_count,
      1
    ));
    core_storage_data.spawner_distance = Math.min(
      core_storage_data.spawner_distance,
      core_storage_data.gamearea_width / 2 - 5
    );

    let loop_counter = core_storage_data.spawner_count - 1;
    do{
        const spawner_x = core_random_integer(gamearea_width_half * 2) - gamearea_width_half;
        const spawner_y = core_random_integer((gamearea_playerdist - 25) / 4);
        if(Math.abs(spawner_x) < core_storage_data.spawner_distance){
            spawner_x = core_storage_data.spawner_distance * (spawner_x > 0
              ? 1
              : -1);
        }

        entity_create({
          'id': 'spawner_a' + loop_counter,
          'properties': {
            'x': spawner_x,
            'y': spawner_y,
          },
          'types': [
            'spawner',
          ],
        });
        entity_create({
          'id': 'spawner_b' + loop_counter,
          'properties': {
            'x': -spawner_x,
            'y': -spawner_y,
          },
          'types': [
            'spawner',
          ],
        });
    }while(loop_counter--);

    if(core_storage_data.obstacle_count > 0){
        let loop_counter = Math.floor(core_storage_data.obstacle_count) - 1;
        do{
            let obstacle_x = core_random_integer(gamearea_width_half * 2) - gamearea_width_half;
            if(Math.abs(obstacle_x) < core_storage_data.obstacle_distance){
                obstacle_x += core_storage_data.obstacle_distance * (obstacle_x > 0
                  ? 1
                  : -1);
            }

            create_obstacle(
              loop_counter,
              obstacle_x,
              core_random_integer((gamearea_playerdist - 25) / 2)
            );
        }while(loop_counter--);
    }
}

function repo_logic(){
    if(entity_info.spawner.count === 0){
        return;
    }

    if(particle_frames >= core_storage_data.particle_frames){
        if(entity_info.particle.count < core_storage_data.particle_max){
            const random_spawner = core_random_key(entity_groups.spawner);
            const x_speed = Math.random() * (core_storage_data.particle_speed * 2) - core_storage_data.particle_speed;
            const y_speed = Math.random() * (core_storage_data.particle_speed * 2) - core_storage_data.particle_speed;

            entity_create({
              'properties': {
                'x': entity_entities[random_spawner].x,
                'x_speed': x_speed,
                'y': entity_entities[random_spawner].y,
                'y_speed': y_speed,
              },
              'types': [
                'particle',
              ],
            });

            if(core_storage_data.spawner_mirror){
                let id = 'spawner_';
                id += random_spawner[8] === 'a'
                  ? 'b'
                  : 'a';
                id += random_spawner[9];

                entity_create({
                  'properties': {
                    'x': entity_entities[id].x,
                    'x_speed': -x_speed,
                    'y': entity_entities[id].y,
                    'y_speed': -y_speed,
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

    const goal_width_half = core_storage_data.goal_width / 2;
    const paddle_x_max = goal_width_half - core_storage_data.paddle_width;

    const player_0 = entity_entities.player_0;
    const player_1 = entity_entities.player_1;
    player_0.target = false;
    player_1.target = false;

    entity_group_modify({
      'groups': [
        'particle',
      ],
      'todo': function(entity){
          if(Math.abs(entity.x) < goal_width_half){
              if(entity.y_speed > 0){
                  if((player_0.target === false || entity.y > entity_entities[player_0.target].y)
                    && entity.y < player_0.paddle_y){
                      player_0.target = entity.id;
                  }

              }else if((player_1.target === false || entity.y < entity_entities[player_1.target].y)
                && entity.y > player_1.paddle_y){
                  player_1.target = entity.id;
              }
          }

          if(entity.y + 2 > player_0.goal_y
            || entity.y - 2 < player_1.goal_y + 20){
              let temp_player = 0;
              if(entity.y + 2 > player_0.goal_y){
                  temp_player = 1;
              }

              if(core_storage_data.score_decrease
                && entity_entities['player_' + (1 - temp_player)].score > 0){
                  entity_entities['player_' + (1 - temp_player)].score -= 1;
              }

              if(entity.owner === 'player_' + temp_player){
                  entity_entities['player_' + temp_player].score += 1;
              }

              if(player_0.target === entity.id){
                  player_0.target = false;
              }
              if(player_1.target === entity.id){
                  player_1.target = false;
              }

              entity_remove({
                'entities': [
                  entity.id,
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
                    if(entity.x >= obstacle.x
                      && entity.x <= obstacle.x + obstacle.width){
                        if(entity.y_speed > 0){
                            if(entity.y > obstacle.y - 2
                              && entity.y < obstacle.y){
                                bounce_y = -core_storage_data.obstacle_multiplier_y;
                            }

                        }else if(entity.y > obstacle.y + obstacle.height
                          && entity.y < obstacle.y + obstacle.height + 2){
                            bounce_y = -core_storage_data.obstacle_multiplier_y;
                        }

                    }else if(entity.y >= obstacle.y
                      && entity.y <= obstacle.y + obstacle.height){
                        if(entity.x_speed > 0){
                            if(entity.x > obstacle.x - 2
                              && entity.x < obstacle.x){
                                bounce_x = -core_storage_data.obstacle_multiplier_x;
                            }

                        }else if(entity.x > obstacle.x + obstacle.width
                          && entity.x < obstacle.x + obstacle.width + 2){
                            bounce_x = -core_storage_data.obstacle_multiplier_x;
                        }
                    }
                },
              });

              if(entity.y > player_1.paddle_y + player_1.paddle_height
                && entity.y < player_0.paddle_y){
                  if(Math.abs(entity.x) < goal_width_half){
                      if(entity.y > 0){
                          if(entity.x > player_0.paddle_x - 2
                            && entity.x < player_0.paddle_x + core_storage_data.paddle_width + 2
                            && entity.y_speed > 0
                            && entity.y + 2 >= player_0.paddle_y){
                              if(core_storage_data.paddle_random){
                                  entity.x_speed = Math.random() * (core_storage_data.particle_speed * 2) - core_storage_data.particle_speed;
                              }
                              entity.owner = 'player_0';
                              bounce_y = -1;
                          }

                      }else if(entity.x > player_1.paddle_x - 2
                        && entity.x < player_1.paddle_x + core_storage_data.paddle_width + 2
                        && entity.y_speed < 0
                        && entity.y - 2 <= player_1.paddle_y + player_1.paddle_height){
                          if(core_storage_data.paddle_random){
                              entity.x_speed = Math.random() * (core_storage_data.particle_speed * 2) - core_storage_data.particle_speed;
                          }
                          entity.owner = 'player_1';
                          bounce_y = -1;
                      }

                  }else if(Math.abs(entity.x) > particle_x_limit){
                      bounce_x = -1;

                  }else if((entity.y_speed < 0 && entity.y - 2 <= player_1.paddle_y + player_1.paddle_height)
                    || (entity.y_speed > 0 && entity.y + 2 >= player_0.paddle_y)){
                      bounce_y = -1;
                  }
              }

              entity.x_speed *= bounce_x;
              entity.y_speed *= bounce_y;

              if(entity.x_speed > core_storage_data.gamearea_width
                || entity.y_speed > core_storage_data.gamearea_height){
                  entity_remove({
                    'entities': [
                      entity.id,
                    ],
                  });

                  return;
              }

              entity.x += entity.x_speed;
              entity.y += entity.y_speed;
          }
      },
    });

    let paddle_position = player_1.paddle_x + core_storage_data.paddle_width / 2;
    if(player_1.target === false){
        if(paddle_position === 0){
            player_1.paddle_x_move = 0;

        }else{
            player_1.paddle_x_move = paddle_position < 0
              ? core_storage_data.paddle_speed
              : -core_storage_data.paddle_speed;
        }

    }else{
        player_1.paddle_x_move = entity_entities[player_1.target].x > paddle_position
          ? core_storage_data.paddle_speed
          : -core_storage_data.paddle_speed;
    }

    paddle_position = player_0.paddle_x + core_storage_data.paddle_width / 2;
    if(player_0.target === false){
        if(paddle_position === 0){
            player_0.paddle_x_move = 0;

        }else{
            player_0.paddle_x_move = paddle_position < 0
              ? core_storage_data.paddle_speed
              : -core_storage_data.paddle_speed;
        }

    }else{
        player_0.paddle_x_move = entity_entities[player_0.target].x > paddle_position
          ? core_storage_data.paddle_speed
          : -core_storage_data.paddle_speed;
    }

    player_1.paddle_x += player_1.paddle_x_move;
    if(player_1.paddle_x > paddle_x_max){
        player_1.paddle_x = paddle_x_max;

    }else if(player_1.paddle_x < -goal_width_half){
        player_1.paddle_x = -goal_width_half;
    }

    if(player_controlled){
        let move_left = core_keys[core_storage_data.move_left].state;
        let move_right = core_keys[core_storage_data.move_right].state;
        if(core_pointer.down_0){
            if(core_pointer.x - canvas_properties.width_half > paddle_position){
                move_right = true;

            }else{
                move_left = true;
            }
        }

        if(move_left
          && player_0.paddle_x > -goal_width_half){
            player_0.paddle_x -= core_storage_data.paddle_speed;

        }else if(player_0.paddle_x < -goal_width_half){
            player_0.paddle_x = -goal_width_half;
        }

        if(move_right
          && player_0.paddle_x < paddle_x_max){
            player_0.paddle_x += core_storage_data.paddle_speed;

        }else if(player_0.paddle_x > paddle_x_max){
            player_0.paddle_x = paddle_x_max;
        }

    }else{
        player_0.paddle_x += player_0.paddle_x_move;
        if(player_0.paddle_x > paddle_x_max){
            player_0.paddle_x = paddle_x_max;

        }else if(player_0.paddle_x < -goal_width_half){
            player_0.paddle_x = -goal_width_half;
        }
    }

    if(winner === false){
        entity_group_modify({
          'groups': [
            'player',
          ],
          'todo': function(entity){
              if(entity.score >= core_storage_data.score_goal){
                  winner = entity.id;
              }
          },
        });
    }
}

function reset(mode){
    if(particle_x_limit > 0
      && !globalThis.confirm('Start new game?')){
        return;
    }
    canvas_setmode(mode);
}
